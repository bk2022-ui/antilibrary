#!/usr/bin/env tsx
/**
 * build-pradarshan.ts — emits the public Pradarshan bundle (Step 5).
 *
 * Resolves the curator's pull (pradarshan-config.json) against the engine's
 * outputs (inventory / manthan-analysis / ideas) into a single bundle the
 * public /antilibrary tab renders: statistics + curated findings + catalogue.
 *
 * Writes:
 *   src/libraries/bk/pradarshan.json      (canonical derived view, in this repo)
 *   ../bk-site/src/data/pradarshan.json   (the view's consumer, if present)
 *
 * Re-run after re-curating the config:  npm run pradarshan
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(__dirname, "..");
const LIB = join(ROOT, "src/libraries/bk");
const read = (f: string) => JSON.parse(readFileSync(join(LIB, f), "utf8"));

const inventory: any[] = read("inventory.json");
const ideas: Record<string, { units?: unknown[] }> = read("ideas.json");
const manthan: any = read("manthan-analysis.json");
const config: any = read("pradarshan-config.json");

const unitCount = (title = ""): number => {
  const e = ideas[title];
  return e && Array.isArray(e.units) ? e.units.length : 0;
};

// ── statistics ──
const findings: any[] = manthan.lensResults.flatMap((l: any) => l.findings);
const strong = findings.filter((f) => f.strength === "strong");
const atomicUnits = Object.values(ideas).reduce(
  (n, e) => n + (Array.isArray(e.units) ? e.units.length : 0),
  0,
);
const read_ = inventory.filter((b) => b.status && b.status !== "antilibrary").length;

const registers: Record<string, number> = {};
for (const b of inventory) if (b.register) registers[b.register] = (registers[b.register] ?? 0) + 1;
const registersSorted = Object.fromEntries(
  Object.entries(registers).sort((a, b) => b[1] - a[1]),
);

const decades: Record<string, number> = {};
for (const b of inventory)
  if (typeof b.year === "number") {
    const d = Math.floor(b.year / 10) * 10;
    decades[d] = (decades[d] ?? 0) + 1;
  }
const decadesSorted = Object.fromEntries(
  Object.entries(decades).sort((a, b) => Number(a[0]) - Number(b[0])),
);

const stats = {
  books: inventory.length,
  atomicUnits,
  findings: findings.length,
  strongFindings: strong.length,
  read: read_,
  unread: inventory.length - read_,
  registers: registersSorted,
  decades: decadesSorted,
};

// ── catalogue ──
const FIELDS = ["title", "author", "coverUrl", "year", "register", "category", "status", "density", "form"];
const catalog = inventory.map((b) => {
  const o: Record<string, unknown> = {};
  for (const k of FIELDS) o[k] = b[k];
  o.units = unitCount(b.title);
  return o;
});

// ── curated pull ──
const byKey = new Map<string, any>();
for (const l of manthan.lensResults)
  for (const f of l.findings) byKey.set(`${l.lens}::${f.name}`, f);

const curated = (config.selections as any[])
  .map((s) => {
    const f = byKey.get(`${s.lens}::${s.name}`);
    if (!f) {
      console.warn(`⚠ selection not found: [${s.lens}] ${s.name}`);
      return null;
    }
    return { lens: s.lens, type: f.type, name: f.name, description: f.description, strength: f.strength, books: f.books ?? [], evidence: f.evidence };
  })
  .filter(Boolean);

const bundle = {
  tagline: config.tagline,
  intro: config.intro,
  updated: config.updated,
  stats,
  curated,
  featuredBooks: config.featuredBooks ?? [],
  catalog,
};

// ── write ──
writeFileSync(join(LIB, "pradarshan.json"), JSON.stringify(bundle, null, 2));
console.log(`Wrote src/libraries/bk/pradarshan.json — ${stats.books} books, ${curated.length} curated, ${stats.findings} findings.`);

const bkSite = resolve(ROOT, "../bk-site/src/data/pradarshan.json");
if (existsSync(resolve(ROOT, "../bk-site/src/data"))) {
  writeFileSync(bkSite, JSON.stringify(bundle));
  console.log(`Synced → ${bkSite}`);
} else {
  console.log("bk-site not found alongside this repo — skipped sync (commit src/libraries/bk/pradarshan.json and copy it across).");
}
