#!/usr/bin/env tsx
/**
 * Parakh — the assay layer of the Antilibrary Engine.
 *
 * Umbrella runner. Runs the built checkers for an engine step and writes
 * one parakh-report.json. Read-only: it proposes and flags, it mutates nothing.
 * (Applying accepted fixes is Phase 2 — a separate step.)
 *
 * Usage:
 *   npx tsx scripts/parakh.ts sangrah
 *   npx tsx scripts/parakh.ts sangrah --library src/libraries/bk
 *
 * Currently built:
 *   sangrah → parakh-sangrah-structure   (deterministic record integrity)
 */

import path from "path";
import fs from "fs";
import type { SangrahStaging } from "../src/lib/sangrah/types";
import { runStructureChecks, type InventoryEntry } from "../src/lib/sangrah/parakh/structure";
import { buildReport, writeReport, printSummary } from "../src/lib/sangrah/parakh/report";

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
}

const target = args.find((a) => !a.startsWith("--"));
if (!target) {
  console.error("Error: a target step is required (currently: sangrah)");
  console.error("Example: npx tsx scripts/parakh.ts sangrah");
  process.exit(1);
}

if (target !== "sangrah") {
  console.error(`Error: no checkers built for "${target}" yet. Available: sangrah`);
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, "..");
const libraryDir = path.resolve(repoRoot, getArg("--library") ?? "src/libraries/bk");
const stagingPath = path.join(libraryDir, "sangrah-staging.json");
const inventoryPath = path.join(libraryDir, "inventory.json");
const reportPath = path.join(libraryDir, "parakh-report.json");

function loadInventory(): InventoryEntry[] {
  if (!fs.existsSync(inventoryPath)) return [];
  const raw = JSON.parse(fs.readFileSync(inventoryPath, "utf-8"));
  const books = Array.isArray(raw) ? raw : raw.books ?? [];
  return books as InventoryEntry[];
}

function main() {
  if (!fs.existsSync(stagingPath)) {
    console.error(`Error: no staging file at ${stagingPath}. Run Sangrah first.`);
    process.exit(1);
  }

  const staging: SangrahStaging = JSON.parse(fs.readFileSync(stagingPath, "utf-8"));
  const inventory = loadInventory();

  const findings = runStructureChecks(staging, inventory);
  const report = buildReport(findings, {
    checker: "parakh-sangrah-structure",
    target: "sangrah",
    stagingPath: path.relative(repoRoot, stagingPath),
  });

  writeReport(report, reportPath);
  printSummary(report, path.relative(repoRoot, reportPath));
}

main();
