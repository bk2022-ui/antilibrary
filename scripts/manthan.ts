#!/usr/bin/env tsx
/**
 * Manthan — Churn agent CLI
 *
 * Usage:
 *   npx tsx scripts/manthan.ts
 *   npx tsx scripts/manthan.ts --library src/libraries/bk
 *   npx tsx scripts/manthan.ts --lenses depth,register,era
 *   npx tsx scripts/manthan.ts --skip-probe
 *   npx tsx scripts/manthan.ts --seeds 5
 *
 * Reads:  inventory.json + ideas.json (from Parichay)
 * Writes: manthan-analysis.json
 *
 * The priming log inside manthan-analysis.json is preserved across runs.
 * Add priming signals manually or via the priming interface (future).
 */

import path from "path";
import fs from "fs";
import { runManthan } from "../src/lib/manthan/index";

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
const skipProbe = args.includes("--skip-probe");
const seeds = parseInt(getArg("--seeds") ?? "3", 10);

const lensArg = getArg("--lenses");
const lenses = lensArg
  ? (lensArg.split(",") as Array<"depth" | "register" | "era" | "tradition" | "tension_pairs" | "founding_figures" | "hidden_collections">)
  : undefined;

async function main() {
  await runManthan({
    inventoryPath: path.join(libraryDir, "inventory.json"),
    ideasPath: path.join(libraryDir, "ideas.json"),
    outputPath: path.join(libraryDir, "manthan-analysis.json"),
    probeSeeds: seeds,
    lenses,
    skipProbe,
  });
}

main().catch((err) => {
  console.error("Manthan failed:", err);
  process.exit(1);
});
