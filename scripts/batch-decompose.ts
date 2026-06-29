#!/usr/bin/env tsx
/**
 * batch-decompose — regenerate ideas.json in the new atomic-unit format
 *
 * The 703 inventory books are already classified. This re-runs ONLY Pass 2
 * (decompose into typed + tagged atomic units) plus the Wikipedia seeAlso fetch,
 * writing the new-format ideas.json ({ units, seeAlso }) that the Manthan
 * tension_pairs / founding_figures / hidden_collections lenses need.
 *
 * Usage:
 *   npx tsx scripts/batch-decompose.ts --start 0 --end 10 --out ideas-part-0.json
 *   npx tsx scripts/batch-decompose.ts --start 0 --end 703 --out ideas.json --concurrency 6
 *
 * Slicing lets multiple processes/agents each own a range, writing to separate
 * partial files that are merged afterward.
 */

import path from "path";
import fs from "fs";
import { enrichBookContext } from "../src/lib/parichay/enrich";
import { decomposeBook } from "../src/lib/parichay/decompose";
import type { ClassifiedBook } from "../src/lib/parichay/types";

// Load .env.local
const envLocal = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envLocal)) {
  for (const line of fs.readFileSync(envLocal, "utf-8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length && !key.startsWith("#")) {
      process.env[key.trim()] ??= rest.join("=").trim();
    }
  }
}

const args = process.argv.slice(2);
function getArg(flag: string, def?: string): string | undefined {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
}

const repoRoot = path.resolve(__dirname, "..");
const libraryDir = path.resolve(repoRoot, getArg("--library", "src/libraries/bk")!);
const start = parseInt(getArg("--start", "0")!, 10);
const endArg = getArg("--end");
const concurrency = parseInt(getArg("--concurrency", "5")!, 10);
const outName = getArg("--out", "ideas-new.json")!;

interface InventoryBook extends Record<string, unknown> {
  title: string;
  author: string;
  year?: number;
  description?: string;
}

function toClassification(b: InventoryBook): ClassifiedBook {
  return {
    category: (b.category as string) ?? "",
    categories: (b.categories as string[]) ?? [],
    topic: (b.topic as string) ?? "",
    subject: (b.subject as string) ?? "",
    subtopics: (b.subtopics as string[]) ?? [],
    register: (b.register as ClassifiedBook["register"]) ?? "humanist",
    density: (b.density as ClassifiedBook["density"]) ?? "accessible",
    form: (b.form as ClassifiedBook["form"]) ?? "argument",
    lineage: (b.lineage as string | null) ?? null,
    author_origin: (b.author_origin as string) ?? "",
    author_tradition: (b.author_tradition as string) ?? "",
  };
}

async function main() {
  const inventoryPath = path.join(libraryDir, "inventory.json");
  const raw = JSON.parse(fs.readFileSync(inventoryPath, "utf-8"));
  const allBooks: InventoryBook[] = Array.isArray(raw) ? raw : raw.books ?? [];

  const end = endArg ? parseInt(endArg, 10) : allBooks.length;
  const slice = allBooks.slice(start, end);

  console.log(`batch-decompose: books ${start}–${end} of ${allBooks.length} (${slice.length} in slice)`);
  console.log(`Concurrency: ${concurrency}  →  ${outName}\n`);

  const result: Record<string, { units: unknown[]; seeAlso: string[] }> = {};
  const failed: string[] = [];
  let done = 0;
  let i = 0;

  async function worker(workerId: number) {
    while (i < slice.length) {
      const idx = i++;
      const book = slice[idx];
      try {
        const enrichment = await enrichBookContext(
          book.title,
          book.author,
          book.isbn13 as string | undefined,
        );
        const context = {
          title: book.title,
          author: book.author,
          year: book.year,
          description: book.description,
          ...enrichment,
        };
        const classification = toClassification(book);
        const units = await decomposeBook(context, classification);
        result[book.title] = {
          units,
          seeAlso: enrichment.wikipediaSeeAlso ?? [],
        };
        done++;
        console.log(`  [${done}/${slice.length}] w${workerId} ✓ ${book.title} — ${units.length} units, ${(enrichment.wikipediaSeeAlso ?? []).length} seeAlso`);
      } catch (err) {
        failed.push(book.title);
        const msg = err instanceof Error ? err.message.slice(0, 80) : String(err);
        console.log(`  [${done}/${slice.length}] w${workerId} ✗ ${book.title} — ${msg}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, slice.length) }, (_, w) => worker(w)),
  );

  const outPath = path.join(libraryDir, outName);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log(`\nDone. ${done} decomposed, ${failed.length} failed.`);
  if (failed.length) console.log(`Failed: ${failed.join(", ")}`);
  console.log(`Written: ${outPath}`);
}

main().catch((err) => {
  console.error("batch-decompose failed:", err);
  process.exit(1);
});
