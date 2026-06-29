import fs from "fs";
import os from "os";
import path from "path";
import type { SangrahStaging } from "./types";
import { extractFromFolder } from "./extract";
import { matchAllSpines } from "./match";
import { enrichAllSpines } from "./enrich";
import { deduplicateEntries } from "./dedupe";
import { readState, writeState, markFilesProcessed } from "./state";

export interface SangrahOptions {
  /** Folder containing shelf photos */
  inputFolder: string;
  /** Path to the library's inventory.json */
  inventoryPath: string;
  /** Path to write sangrah-staging.json */
  stagingPath: string;
  /** Path to read/write sangrah-state.json */
  statePath: string;
  /** If true, reprocess all files even if already processed */
  forceReprocess?: boolean;
}

export async function runSangrah(opts: SangrahOptions): Promise<SangrahStaging> {
  const { inputFolder, inventoryPath, stagingPath, statePath, forceReprocess } = opts;

  // 1. Load state — know what's already been processed
  const state = readState(statePath);
  const skipFiles = forceReprocess ? [] : state.processedFiles;

  console.log("\n── Sangrah / Collect ──────────────────────────────");
  if (state.lastRun) {
    console.log(`Last run: ${state.lastRun}`);
    console.log(`Previously processed: ${state.processedFiles.length} files`);
  } else {
    console.log("First run — processing all images");
  }

  // 2. Load existing inventory as a lookup table
  const inventory: Array<{ title: string; author?: string }> = [];
  if (fs.existsSync(inventoryPath)) {
    const raw = JSON.parse(fs.readFileSync(inventoryPath, "utf-8"));
    const books = Array.isArray(raw) ? raw : raw.books ?? [];
    inventory.push(...books);
    console.log(`Inventory loaded: ${inventory.length} existing books`);
  }

  // 3. Extract spines from new images
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sangrah-"));
  console.log();

  const newFiles: string[] = [];
  const spines = await extractFromFolder(
    inputFolder,
    skipFiles,
    tmpDir,
    (file) => newFiles.push(file),
  );

  // Clean up tmp dir
  fs.rmSync(tmpDir, { recursive: true, force: true });

  if (spines.length === 0 && newFiles.length === 0) {
    console.log("\nNothing new to process. Run with --force to reprocess all.");
    const empty: SangrahStaging = {
      runDate: new Date().toISOString(),
      inputFolder,
      imagesProcessed: [],
      summary: { extracted: 0, existingConfirmed: 0, newHighConfidence: 0, needsReview: 0, unreadable: 0 },
      newEntries: [],
      reviewQueue: [],
      existingConfirmed: [],
      unreadable: [],
    };
    return empty;
  }

  console.log(`\nExtracted ${spines.length} spines from ${newFiles.length} images`);

  // 4. Match against existing inventory
  const matched = matchAllSpines(spines, inventory);
  const existing = matched.filter((s) => s.matchStatus === "existing");
  const toEnrich = matched.filter(
    (s) => s.matchStatus === "new" || s.matchStatus === "possible_sibling",
  );
  const unreadable = matched.filter((s) => s.confidence === "none");

  console.log(`  Existing (already in inventory): ${existing.length}`);
  console.log(`  New / possible siblings: ${toEnrich.length}`);
  console.log(`  Unreadable: ${unreadable.length}`);

  // 5. Enrich new entries
  console.log(`\nEnriching ${toEnrich.length} new entries via Google Books...`);
  const enriched = await enrichAllSpines(toEnrich);

  // 6. Cross-image deduplication
  const deduped = deduplicateEntries(enriched);
  console.log(
    `After deduplication: ${deduped.length} unique new entries (was ${enriched.length})`,
  );

  // 7. Split into high-confidence new entries vs review queue
  const newEntries = deduped.filter((e) => !e.needsReview);
  const reviewQueue = deduped.filter((e) => e.needsReview);

  // 8. Update state
  const updatedState = markFilesProcessed(state, newFiles);
  writeState(statePath, updatedState, {
    filesProcessed: newFiles.length,
    newBooks: newEntries.length,
  });

  // 9. Build and write staging output
  const staging: SangrahStaging = {
    runDate: new Date().toISOString(),
    inputFolder,
    imagesProcessed: newFiles,
    summary: {
      extracted: spines.length,
      existingConfirmed: existing.length,
      newHighConfidence: newEntries.length,
      needsReview: reviewQueue.length,
      unreadable: unreadable.length,
    },
    newEntries,
    reviewQueue,
    existingConfirmed: existing.map((s) => s.matchedTitle ?? s.title),
    unreadable: unreadable.map((s) => ({
      title: s.title,
      author: s.author,
      confidence: s.confidence,
      reason: s.reason,
      sourceImage: s.sourceImage,
    })),
  };

  fs.writeFileSync(stagingPath, JSON.stringify(staging, null, 2));

  // 10. Print summary
  console.log("\n── Summary ────────────────────────────────────────");
  console.log(`  Spines extracted:        ${staging.summary.extracted}`);
  console.log(`  Already in inventory:    ${staging.summary.existingConfirmed}`);
  console.log(`  New (high confidence):   ${staging.summary.newHighConfidence}`);
  console.log(`  Needs review:            ${staging.summary.needsReview}`);
  console.log(`  Unreadable:              ${staging.summary.unreadable}`);
  console.log(`\n  Staging file: ${stagingPath}`);
  console.log("───────────────────────────────────────────────────\n");

  return staging;
}
