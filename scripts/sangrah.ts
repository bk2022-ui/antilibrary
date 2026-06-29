#!/usr/bin/env tsx
/**
 * Sangrah — Collect agent CLI
 *
 * Usage:
 *   npx tsx scripts/sangrah.ts --input /path/to/images
 *   npx tsx scripts/sangrah.ts --input /path/to/images --force
 *   npx tsx scripts/sangrah.ts --input /path/to/images --library src/libraries/bk
 *
 * Defaults (relative to repo root):
 *   --library  src/libraries/bk
 *   --staging  src/libraries/bk/sangrah-staging.json
 *   --state    src/libraries/bk/sangrah-state.json
 */

import path from "path";
import fs from "fs";
import { runSangrah } from "../src/lib/sangrah/index";

// Load .env.local if present (mirrors Next.js behaviour for CLI scripts)
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
const inputFolder = getArg("--input");
const force = args.includes("--force");

if (!inputFolder) {
  console.error("Error: --input <folder> is required");
  console.error("Example: npx tsx scripts/sangrah.ts --input /path/to/shelf/photos");
  process.exit(1);
}

async function main() {
  await runSangrah({
    inputFolder: path.resolve(inputFolder!),
    inventoryPath: path.join(libraryDir, "inventory.json"),
    stagingPath: path.join(libraryDir, "sangrah-staging.json"),
    statePath: path.join(libraryDir, "sangrah-state.json"),
    forceReprocess: force,
  });
}

main().catch((err) => {
  console.error("Sangrah failed:", err);
  process.exit(1);
});
