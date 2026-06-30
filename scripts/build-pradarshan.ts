#!/usr/bin/env tsx
/**
 * build-pradarshan.ts — emits the public Pradarshan data (Step 5).
 *
 * Resolves the curator's pull (pradarshan-config.json) against the engine's
 * outputs into the data the public /antilibrary tab renders.
 *
 * Writes a LIGHT main bundle (loads with the page) + HEAVY idea chunks
 * (lazy-loaded only when a drill-down is opened):
 *   src/libraries/bk/pradarshan.json            (canonical main bundle, this repo)
 *   ../bk-site/src/data/pradarshan.json         (main bundle the page imports)
 *   ../bk-site/public/antilibrary/ideas-<type>.json   (the 3,498 ideas, split by type)
 *
 * Re-run after re-curating the config:  npm run pradarshan
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(__dirname, "..");
const LIB = join(ROOT, "src/libraries/bk");
const read = (f: string) => JSON.parse(readFileSync(join(LIB, f), "utf8"));

const inventory: any[] = read("inventory.json");
const ideas: Record<string, { units?: any[] }> = read("ideas.json");
const manthan: any = read("manthan-analysis.json");
const analysis: any = read("analysis.json");
const clusters: any[] = read("clusters.json");
const config: any = read("pradarshan-config.json");

const unitCount = (title = ""): number => {
  const e = ideas[title];
  return e && Array.isArray(e.units) ? e.units.length : 0;
};

// ── findings (all 91, flat with lens) ──
const findings = manthan.lensResults.flatMap((l: any) =>
  l.findings.map((f: any) => ({
    lens: l.lens, type: f.type, name: f.name, description: f.description,
    strength: f.strength, books: f.books ?? [], evidence: f.evidence,
  })),
);
const strong = findings.filter((f: any) => f.strength === "strong");

// ── atomic ideas: count by type (for stats) + split into chunks (for lazy load) ──
const ideaChunks: Record<string, any[]> = {};
for (const [title, e] of Object.entries(ideas))
  for (const u of e.units ?? []) {
    const t = u.type ?? "other";
    (ideaChunks[t] ??= []).push({ id: u.id, title: u.title, body: u.body, tags: u.tags, book: u.sourceBook ?? title });
  }
const ideaTypes: Record<string, number> = {};
for (const [t, arr] of Object.entries(ideaChunks)) ideaTypes[t] = arr.length;
const atomicUnits = Object.values(ideaTypes).reduce((a, b) => a + b, 0);

// ── stats ──
const read_ = inventory.filter((b) => b.status && b.status !== "antilibrary").length;
const registers: Record<string, number> = {};
for (const b of inventory) if (b.register) registers[b.register] = (registers[b.register] ?? 0) + 1;
const registersSorted = Object.fromEntries(Object.entries(registers).sort((a, b) => b[1] - a[1]));
const decades: Record<string, number> = {};
for (const b of inventory)
  if (typeof b.year === "number") { const d = Math.floor(b.year / 10) * 10; decades[d] = (decades[d] ?? 0) + 1; }
const decadesSorted = Object.fromEntries(Object.entries(decades).sort((a, b) => Number(a[0]) - Number(b[0])));

const stats = {
  books: inventory.length, atomicUnits, findings: findings.length, strongFindings: strong.length,
  read: read_, unread: inventory.length - read_, registers: registersSorted, decades: decadesSorted,
  ideaTypes: Object.fromEntries(Object.entries(ideaTypes).sort((a, b) => b[1] - a[1])),
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
for (const l of manthan.lensResults) for (const f of l.findings) byKey.set(`${l.lens}::${f.name}`, f);
const curated = (config.selections as any[])
  .map((s) => {
    const f = byKey.get(`${s.lens}::${s.name}`);
    if (!f) { console.warn(`⚠ selection not found: [${s.lens}] ${s.name}`); return null; }
    return { lens: s.lens, type: f.type, name: f.name, headline: s.headline, description: f.description, strength: f.strength, books: f.books ?? [], evidence: f.evidence };
  })
  .filter(Boolean);

const bundle = {
  tagline: config.tagline, intro: config.intro, updated: config.updated,
  stats, curated, featuredBooks: config.featuredBooks ?? [],
  findings,
  clusters,                      // 8 curated clusters (id, name, description, color, books)
  threads: analysis.threads ?? [],
  patterns: analysis.patterns ?? [],
  catalog,
};

// ── write main bundle ──
const main = JSON.stringify(bundle);
writeFileSync(join(LIB, "pradarshan.json"), JSON.stringify(bundle, null, 2));
console.log(`main bundle: ${(main.length / 1024).toFixed(0)} KB raw — ${stats.books} books, ${findings.length} findings, ${clusters.length} clusters, ${bundle.threads.length} threads, ${bundle.patterns.length} patterns.`);

const bkData = resolve(ROOT, "../bk-site/src/data");
const bkPublic = resolve(ROOT, "../bk-site/public/antilibrary");
if (existsSync(bkData)) {
  writeFileSync(join(bkData, "pradarshan.json"), main);
  mkdirSync(bkPublic, { recursive: true });
  for (const [t, arr] of Object.entries(ideaChunks)) {
    const out = join(bkPublic, `ideas-${t}.json`);
    writeFileSync(out, JSON.stringify(arr));
    console.log(`  ideas-${t}.json — ${arr.length} ideas (${(JSON.stringify(arr).length / 1024).toFixed(0)} KB)`);
  }
  console.log(`Synced → bk-site (main bundle + ${Object.keys(ideaChunks).length} idea chunks)`);
} else {
  console.log("bk-site not found alongside this repo — wrote canonical bundle only.");
}
