#!/usr/bin/env tsx
/**
 * Parichay — Classify agent CLI
 *
 * Usage:
 *   npx tsx scripts/parichay.ts
 *   npx tsx scripts/parichay.ts --library src/libraries/bk
 *   npx tsx scripts/parichay.ts --include-review-queue
 *
 * Reads:  sangrah-staging.json  (from Sangrah run)
 * Writes: parichay-staging.json (classified + decomposed)
 *         ideas.json            (atomic units, merged with existing)
 *
 * After reviewing parichay-staging.json, merge into inventory.json manually.
 */

import path from "path";
import fs from "fs";
import { runParichay } from "../src/lib/parichay/index";

// Load .env.local if present
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

function getArg(flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
}

const repoRoot = path.resolve(__dirname, "..");
const libraryDir = path.resolve(repoRoot, getArg("--library") ?? "src/libraries/bk");
const includeReviewQueue = args.includes("--include-review-queue");

async function main() {
  await runParichay({
    stagingPath: path.join(libraryDir, "sangrah-staging.json"),
    inventoryPath: path.join(libraryDir, "inventory.json"),
    outputPath: path.join(libraryDir, "parichay-staging.json"),
    ideasPath: path.join(libraryDir, "ideas.json"),
    includeReviewQueue,
  });
}

main().catch((err) => {
  console.error("Parichay failed:", err);
  process.exit(1);
});
