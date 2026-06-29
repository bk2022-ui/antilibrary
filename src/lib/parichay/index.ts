import fs from "fs";
import path from "path";
import type { StagingEntry } from "@/lib/sangrah/types";
import type { ParichayEntry, ParichayStaging } from "./types";
import { enrichBookContext } from "./enrich";
import { classifyBook } from "./classify";
import { decomposeBook } from "./decompose";

export interface ParichayOptions {
  /** Path to sangrah-staging.json (input) */
  stagingPath: string;
  /** Path to inventory.json (used for few-shot examples) */
  inventoryPath: string;
  /** Path to write parichay-staging.json */
  outputPath: string;
  /** Path to write ideas.json */
  ideasPath: string;
  /** If true, process reviewQueue entries too (default: false — only newEntries) */
  includeReviewQueue?: boolean;
}

export async function runParichay(opts: ParichayOptions): Promise<ParichayStaging> {
  const { stagingPath, inventoryPath, outputPath, ideasPath, includeReviewQueue } = opts;

  console.log("\n── Parichay / Classify ────────────────────────────");

  // Load inputs
  if (!fs.existsSync(stagingPath)) {
    throw new Error(`Sangrah staging file not found: ${stagingPath}\nRun sangrah first.`);
  }

  const stagingRaw = JSON.parse(fs.readFileSync(stagingPath, "utf-8")) as {
    newEntries: StagingEntry[];
    reviewQueue: StagingEntry[];
  };

  const toProcess: StagingEntry[] = [
    ...stagingRaw.newEntries,
    ...(includeReviewQueue ? stagingRaw.reviewQueue : []),
  ];

  if (toProcess.length === 0) {
    console.log("Nothing to classify in staging file.");
    const empty: ParichayStaging = {
      runDate: new Date().toISOString(),
      summary: { input: 0, classified: 0, atomicUnitsExtracted: 0, needsReview: 0, failed: 0 },
      entries: [],
      failed: [],
    };
    return empty;
  }

  // Load existing inventory for few-shot examples
  const inventory: Array<Record<string, unknown>> = [];
  if (fs.existsSync(inventoryPath)) {
    const raw = JSON.parse(fs.readFileSync(inventoryPath, "utf-8"));
    const books = Array.isArray(raw) ? raw : raw.books ?? [];
    inventory.push(...books);
  }
  console.log(`Inventory loaded: ${inventory.length} books for few-shot reference`);
  console.log(`Books to classify: ${toProcess.length}\n`);

  const entries: ParichayEntry[] = [];
  const failed: Array<{ title: string; author: string; error: string }> = [];
  let totalUnits = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const book = toProcess[i];
    console.log(`[${i + 1}/${toProcess.length}] ${book.title} — ${book.author}`);

    try {
      // Enrichment: ToC + Wikipedia
      process.stdout.write("  → Enriching...");
      const enrichment = await enrichBookContext(book.title, book.author, book.isbn13);
      const hasWiki = !!enrichment.wikipediaSummary;
      const hasToc = !!enrichment.tableOfContents?.length;
      const hasSeeAlso = !!enrichment.wikipediaSeeAlso?.length;
      console.log(` wiki=${hasWiki} toc=${hasToc} seeAlso=${hasSeeAlso}`);

      const context = {
        title: book.title,
        author: book.author,
        year: book.year,
        description: book.description,
        ...enrichment,
      };

      // Pass 1: Classify
      process.stdout.write("  → Classifying...");
      const classification = await classifyBook(context, inventory);
      console.log(` ${classification.form} / ${classification.register} / ${classification.density}`);

      // Pass 2: Decompose
      process.stdout.write("  → Decomposing...");
      const atomicUnits = await decomposeBook(context, classification);
      console.log(` ${atomicUnits.length} units extracted`);
      totalUnits += atomicUnits.length;

      const needsReview = book.needsReview || !hasWiki;
      const reviewReasons: string[] = [];
      if (book.needsReview && book.reviewReason) reviewReasons.push(book.reviewReason);
      if (!hasWiki) reviewReasons.push("no Wikipedia entry found — decomposition based on description only");

      entries.push({
        title: book.title,
        author: book.author,
        year: book.year,
        isbn13: book.isbn13,
        isbn10: book.isbn10,
        coverUrl: book.coverUrl,
        description: book.description,
        status: book.status,
        sourceImages: book.sourceImages,
        canonical_id: book.canonical_id,
        classification,
        atomicUnits,
        wikipediaSeeAlso: enrichment.wikipediaSeeAlso,
        parichayAt: new Date().toISOString(),
        needsReview,
        reviewReason: reviewReasons.length > 0 ? reviewReasons.join("; ") : undefined,
      });

      // Small pause between books to be friendly to APIs
      if (i < toProcess.length - 1) await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ Failed: ${msg}`);
      failed.push({ title: book.title, author: book.author, error: msg });
    }
  }

  const staging: ParichayStaging = {
    runDate: new Date().toISOString(),
    summary: {
      input: toProcess.length,
      classified: entries.length,
      atomicUnitsExtracted: totalUnits,
      needsReview: entries.filter((e) => e.needsReview).length,
      failed: failed.length,
    },
    entries,
    failed,
  };

  // Write parichay-staging.json
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(staging, null, 2));

  // Write ideas.json — { "Title": { units: [...], seeAlso: [...] } }
  const ideas: Record<string, unknown> = {};
  for (const entry of entries) {
    ideas[entry.title] = {
      units: entry.atomicUnits,
      seeAlso: entry.wikipediaSeeAlso ?? [],
    };
  }

  // Merge with existing ideas.json if present
  if (fs.existsSync(ideasPath)) {
    const existing = JSON.parse(fs.readFileSync(ideasPath, "utf-8")) as Record<string, unknown[]>;
    Object.assign(existing, ideas);
    fs.writeFileSync(ideasPath, JSON.stringify(existing, null, 2));
  } else {
    fs.mkdirSync(path.dirname(ideasPath), { recursive: true });
    fs.writeFileSync(ideasPath, JSON.stringify(ideas, null, 2));
  }

  // Summary
  console.log("\n── Summary ────────────────────────────────────────");
  console.log(`  Processed:              ${staging.summary.input}`);
  console.log(`  Classified:             ${staging.summary.classified}`);
  console.log(`  Atomic units:           ${staging.summary.atomicUnitsExtracted}`);
  console.log(`  Needs review:           ${staging.summary.needsReview}`);
  console.log(`  Failed:                 ${staging.summary.failed}`);
  console.log(`\n  Staging: ${outputPath}`);
  console.log(`  Ideas:   ${ideasPath}`);
  console.log("───────────────────────────────────────────────────\n");

  return staging;
}
