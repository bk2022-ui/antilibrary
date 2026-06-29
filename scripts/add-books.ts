#!/usr/bin/env tsx
/**
 * add-books — minimum-work path for KNOWN missing books.
 *
 * For books we've already identified by eye (title + author), skip the whole
 * vision/extraction stage and enter the pipeline at classification:
 *   enrich (Google Books) → classify (Parichay, few-shot) → decompose → append
 *
 * Appends fully-dimensioned entries to inventory.json (consistent with the
 * existing 703) and atomic units to ideas.json. Writes a staging preview first
 * so you can eyeball before it touches inventory.json.
 *
 * Usage:
 *   npx tsx scripts/add-books.ts --file books-to-add.json
 *   npx tsx scripts/add-books.ts --file books-to-add.json --commit
 *
 * books-to-add.json: [{ "title": "...", "author": "...", "status": "read" }]
 * Without --commit it only writes add-books-staging.json for review.
 */

import path from "path";
import fs from "fs";
import { lookupBook } from "../src/lib/books/googleBooks";
import { classifyBook } from "../src/lib/parichay/classify";
import { decomposeBook } from "../src/lib/parichay/decompose";

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
const commit = args.includes("--commit");
const repoRoot = path.resolve(__dirname, "..");
const libraryDir = path.resolve(repoRoot, getArg("--library", "src/libraries/bk")!);
const file = getArg("--file", path.join(libraryDir, "books-to-add.json"))!;

interface ToAdd { title: string; author: string; status?: string }

async function main() {
  const toAdd: ToAdd[] = JSON.parse(fs.readFileSync(file, "utf-8"));
  const inventoryPath = path.join(libraryDir, "inventory.json");
  const ideasPath = path.join(libraryDir, "ideas.json");

  const inventoryRaw = JSON.parse(fs.readFileSync(inventoryPath, "utf-8"));
  const inventory: Array<Record<string, unknown>> = Array.isArray(inventoryRaw)
    ? inventoryRaw : inventoryRaw.books ?? [];

  console.log(`\n── add-books ──────────────────────────────────────`);
  console.log(`Adding ${toAdd.length} known books (${commit ? "COMMIT" : "preview only"})\n`);

  const newEntries: Record<string, unknown>[] = [];
  const newIdeas: Record<string, { units: unknown[]; seeAlso: string[] }> = {};

  for (const book of toAdd) {
    console.log(`• ${book.title} — ${book.author}`);
    const meta = await lookupBook(`${book.title} ${book.author}`);
    const context = {
      title: meta?.title ?? book.title,
      author: meta?.authors?.[0] ?? book.author,
      year: meta?.publishedYear,
      description: meta?.description,
    };
    process.stdout.write("  classify…");
    const cls = await classifyBook(context, inventory);
    console.log(` ${cls.form}/${cls.register}/${cls.density}`);
    process.stdout.write("  decompose…");
    const units = await decomposeBook(context, cls);
    console.log(` ${units.length} units`);

    const entry: Record<string, unknown> = {
      title: context.title,
      author: context.author,
      ...cls,
      year: context.year,
      status: book.status ?? "antilibrary", // NEEDS HUMAN CONFIRMATION (read vs unread)
      coverUrl: meta?.coverUrl ?? "",
      isbn13: meta?.isbn13,
      confidence: "high",
      addedVia: "add-books (known-gap recovery)",
    };
    newEntries.push(entry);
    newIdeas[context.title] = { units, seeAlso: [] };
  }

  // Staging preview
  const stagingPath = path.join(libraryDir, "add-books-staging.json");
  fs.writeFileSync(stagingPath, JSON.stringify(newEntries, null, 2));
  console.log(`\nStaging written: ${stagingPath}`);

  if (!commit) {
    console.log("Preview only. Re-run with --commit to append to inventory.json + ideas.json.");
    return;
  }

  // Commit: append to inventory + ideas
  const merged = [...inventory, ...newEntries];
  fs.writeFileSync(inventoryPath, JSON.stringify(merged, null, 2));

  const ideas = JSON.parse(fs.readFileSync(ideasPath, "utf-8"));
  Object.assign(ideas, newIdeas);
  fs.writeFileSync(ideasPath, JSON.stringify(ideas, null, 2));

  console.log(`Committed. Inventory: ${inventory.length} → ${merged.length} books.`);
  console.log(`⚠ Status defaulted to "antilibrary" — confirm read/unread per book.`);
}

main().catch((err) => { console.error("add-books failed:", err); process.exit(1); });
