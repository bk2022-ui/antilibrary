import fs from "fs";
import type { InventoryBook, BookIdeas, ManthanAnalysis, LensFinding } from "./types";
import {
  lensDepth,
  lensRegister,
  lensEra,
  lensTradition,
  lensTensionPairs,
  lensFoundingFigures,
  lensHiddenCollections,
} from "./lenses";
import { runRandomProbe } from "./probe";

export interface ManthanOptions {
  inventoryPath: string;
  ideasPath: string;
  outputPath: string;
  /** How many random probe seeds to use (default 3) */
  probeSeeds?: number;
  /** Run only specific lenses — defaults to all seven */
  lenses?: Array<"depth" | "register" | "era" | "tradition" | "tension_pairs" | "founding_figures" | "hidden_collections">;
  /** Skip the random probe */
  skipProbe?: boolean;
}

export async function runManthan(opts: ManthanOptions): Promise<ManthanAnalysis> {
  const { inventoryPath, ideasPath, outputPath, probeSeeds = 3, skipProbe = false } = opts;
  const lensFilter = opts.lenses ?? ["depth", "register", "era", "tradition", "tension_pairs", "founding_figures", "hidden_collections"];

  console.log("\n── Manthan / Churn ────────────────────────────────");

  // Load inventory
  if (!fs.existsSync(inventoryPath)) throw new Error(`inventory.json not found: ${inventoryPath}`);
  const raw = JSON.parse(fs.readFileSync(inventoryPath, "utf-8"));
  const books: InventoryBook[] = Array.isArray(raw) ? raw : raw.books ?? [];
  console.log(`Inventory: ${books.length} books`);

  // Load ideas — normalise both old format ([{title,gloss}]) and new format ({units,seeAlso})
  const ideas: Record<string, BookIdeas> = {};
  if (fs.existsSync(ideasPath)) {
    const rawIdeas = JSON.parse(fs.readFileSync(ideasPath, "utf-8")) as Record<string, unknown>;
    for (const [title, entry] of Object.entries(rawIdeas)) {
      if (Array.isArray(entry)) {
        // Old format: [{title, gloss}] → normalise to {units, seeAlso}
        ideas[title] = {
          units: entry.map((u: { title: string; gloss: string }, i: number) => ({
            id: `${i}`,
            type: "concept" as const,
            title: u.title,
            body: u.gloss,
            tags: [],
            sourceBook: title,
          })),
          seeAlso: [],
        };
      } else if (entry && typeof entry === "object" && "units" in entry) {
        // New format
        ideas[title] = entry as BookIdeas;
      }
    }
  }
  const booksWithIdeas = Object.keys(ideas).length;
  console.log(`Ideas: ${booksWithIdeas} books with atomic units`);
  console.log(`Lenses: ${lensFilter.join(", ")}\n`);

  // Load existing analysis for priming log
  let existingPrimingLog: ManthanAnalysis["primingLog"] = [];
  if (fs.existsSync(outputPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputPath, "utf-8")) as ManthanAnalysis;
      existingPrimingLog = existing.primingLog ?? [];
      if (existingPrimingLog.length > 0) {
        console.log(`Priming log: ${existingPrimingLog.length} prior signals carried forward`);
      }
    } catch { /* fresh start */ }
  }

  // ── Stage 1: Distribution lenses ────────────────────────────────────────
  console.log("Stage 1 — Distribution lenses");
  const lensResults = [];

  if (lensFilter.includes("depth")) {
    process.stdout.write("  → Depth...");
    const r = await lensDepth(books);
    lensResults.push(r);
    console.log(` ${r.findings.length} findings`);
  }

  if (lensFilter.includes("register")) {
    process.stdout.write("  → Register...");
    const r = await lensRegister(books);
    lensResults.push(r);
    console.log(` ${r.findings.length} findings`);
  }

  if (lensFilter.includes("era")) {
    process.stdout.write("  → Era...");
    const r = await lensEra(books);
    lensResults.push(r);
    console.log(` ${r.findings.length} findings`);
  }

  if (lensFilter.includes("tradition")) {
    process.stdout.write("  → Tradition...");
    const r = await lensTradition(books);
    lensResults.push(r);
    console.log(` ${r.findings.length} findings`);
  }

  // ── Stage 2: Relational lenses ───────────────────────────────────────────
  if (booksWithIdeas > 0) {
    console.log("\nStage 2 — Relational lenses");

    if (lensFilter.includes("tension_pairs")) {
      process.stdout.write("  → Tension pairs...");
      const r = await lensTensionPairs(books, ideas);
      lensResults.push(r);
      console.log(` ${r.findings.length} findings`);
    }

    if (lensFilter.includes("founding_figures")) {
      process.stdout.write("  → Founding figures...");
      const r = await lensFoundingFigures(books, ideas);
      lensResults.push(r);
      console.log(` ${r.findings.length} findings`);
    }

    if (lensFilter.includes("hidden_collections")) {
      process.stdout.write("  → Hidden collections...");
      const r = await lensHiddenCollections(books, ideas);
      lensResults.push(r);
      console.log(` ${r.findings.length} findings`);
    }
  } else {
    console.log("\nStage 2 — Skipped (no ideas.json data yet)");
  }

  // ── Stage 3: Random probe ────────────────────────────────────────────────
  let probeResults: ManthanAnalysis["probeResults"] = [];

  if (!skipProbe) {
    console.log("\nStage 3 — Random probe");
    const alreadyGrouped = new Set(
      lensResults.flatMap((lr) => lr.findings.flatMap((f) => f.books)),
    );
    probeResults = await runRandomProbe(books, ideas, alreadyGrouped, probeSeeds);
    console.log(`  ${probeResults.length} candidates surfaced`);
  }

  // ── Build summary ────────────────────────────────────────────────────────
  const allFindings: LensFinding[] = lensResults.flatMap((lr) => lr.findings);

  const summary = {
    threadsFound: allFindings.filter((f) => f.type === "thread").length,
    tensionPairsFound: allFindings.filter((f) => f.type === "tension_pair").length,
    foundingFiguresFound: allFindings.filter((f) => f.type === "founding_figure").length,
    hiddenCollectionsFound: allFindings.filter((f) => f.type === "hidden_collection").length,
    probeCandidates: probeResults.length,
  };

  const analysis: ManthanAnalysis = {
    runDate: new Date().toISOString(),
    inventorySize: books.length,
    booksWithIdeas,
    lensResults,
    probeResults,
    primingLog: existingPrimingLog,
    summary,
  };

  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

  console.log("\n── Summary ────────────────────────────────────────");
  console.log(`  Threads:           ${summary.threadsFound}`);
  console.log(`  Tension pairs:     ${summary.tensionPairsFound}`);
  console.log(`  Founding figures:  ${summary.foundingFiguresFound}`);
  console.log(`  Hidden collections:${summary.hiddenCollectionsFound}`);
  console.log(`  Probe candidates:  ${summary.probeCandidates}`);
  console.log(`\n  Output: ${outputPath}`);
  console.log("───────────────────────────────────────────────────\n");

  return analysis;
}
