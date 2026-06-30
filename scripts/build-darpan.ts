/**
 * build-darpan.ts — generator for darpan.html (Step 4: Darpan / दर्पण — the mirror).
 *
 * Reads the canonical JSON data, computes Lekha-Jokha statistics, embeds the
 * Darshan interpretive copy plus real supporting findings from manthan-analysis.json,
 * and writes a single self-contained darpan.html at the repo root.
 *
 * Derived view only — reads, never writes the source JSON. Re-runnable.
 *   npx tsx scripts/build-darpan.ts
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const DATA = join(ROOT, "src", "libraries", "bk");

function readJSON(name: string): any {
  return JSON.parse(readFileSync(join(DATA, name), "utf8"));
}
function readJSONIf(name: string): any | null {
  const p = join(DATA, name);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}

const inventory: any[] = readJSON("inventory.json");
const ideas: Record<string, any> = readJSON("ideas.json");
const manthan: any = readJSON("manthan-analysis.json");
const sangrahStaging = readJSONIf("sangrah-staging.json");
const parichayStaging = readJSONIf("parichay-staging.json");

// ---------- helpers ----------
const esc = (s: any) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function countBy<T>(arr: T[], key: (x: T) => string | null | undefined): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of arr) {
    const k = key(x);
    if (k === null || k === undefined || k === "") continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}
function sortDesc(m: Map<string, number>): [string, number][] {
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
const pct = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);

// =========================================================
// PART 1 — LEKHA-JOKHA
// =========================================================
const total = inventory.length;

const byStatus = sortDesc(countBy(inventory, (b) => b.status ?? "unknown"));
const byRegister = sortDesc(countBy(inventory, (b) => b.register));
const byForm = sortDesc(countBy(inventory, (b) => b.form));
const byDensity = sortDesc(countBy(inventory, (b) => b.density));
const byOrigin = sortDesc(countBy(inventory, (b) => b.author_origin)).slice(0, 10);

// categories — count across categories[] (fallback to category)
const catMap = new Map<string, number>();
for (const b of inventory) {
  const cats: string[] = Array.isArray(b.categories) && b.categories.length ? b.categories : b.category ? [b.category] : [];
  for (const c of cats) catMap.set(c, (catMap.get(c) ?? 0) + 1);
}
const topCategories = sortDesc(catMap).slice(0, 12);

// decades
const decadeMap = new Map<string, number>();
for (const b of inventory) {
  if (typeof b.year === "number" && b.year > 0) {
    const d = Math.floor(b.year / 10) * 10;
    const k = `${d}s`;
    decadeMap.set(k, (decadeMap.get(k) ?? 0) + 1);
  }
}
const decades = [...decadeMap.entries()].sort(
  (a, b) => parseInt(a[0]) - parseInt(b[0])
);

// atomic units
let totalUnits = 0;
const unitTypeMap = new Map<string, number>();
let entriesWithSeeAlso = 0;
const ideaKeys = Object.keys(ideas);
for (const k of ideaKeys) {
  const entry = ideas[k];
  const units: any[] = entry?.units ?? [];
  totalUnits += units.length;
  for (const u of units) unitTypeMap.set(u.type, (unitTypeMap.get(u.type) ?? 0) + 1);
  if (Array.isArray(entry?.seeAlso) && entry.seeAlso.length) entriesWithSeeAlso++;
}
const booksWithIdeas = ideaKeys.length;
const avgUnits = booksWithIdeas ? Math.round((totalUnits / booksWithIdeas) * 100) / 100 : 0;
const byUnitType = sortDesc(unitTypeMap);

// enrichment coverage
const withCover = inventory.filter((b) => b.coverUrl && String(b.coverUrl).trim()).length;
const withYear = inventory.filter((b) => typeof b.year === "number" && b.year > 0).length;

// manthan
let totalFindings = 0;
const perLens: [string, number][] = [];
const byTypeMap = new Map<string, number>();
const byStrengthMap = new Map<string, number>();
for (const l of manthan.lensResults) {
  perLens.push([l.lens, l.findings.length]);
  totalFindings += l.findings.length;
  for (const f of l.findings) {
    byTypeMap.set(f.type, (byTypeMap.get(f.type) ?? 0) + 1);
    byStrengthMap.set(f.strength ?? "unknown", (byStrengthMap.get(f.strength ?? "unknown") ?? 0) + 1);
  }
}
const byFindingType = sortDesc(byTypeMap);
// strength ordered strong/moderate/weak
const strengthOrder = ["strong", "moderate", "weak"];
const byStrength = [...byStrengthMap.entries()].sort(
  (a, b) => (strengthOrder.indexOf(a[0]) + 99 * (strengthOrder.indexOf(a[0]) < 0 ? 1 : 0)) -
    (strengthOrder.indexOf(b[0]) + 99 * (strengthOrder.indexOf(b[0]) < 0 ? 1 : 0))
);
const probeCount = Array.isArray(manthan.probeResults) ? manthan.probeResults.length : 0;
const runDate = manthan.runDate;
const runDateShort = String(runDate).slice(0, 10);

// pipeline state
function stagingCounts(s: any): { newEntries: number; reviewQueue: number } | null {
  if (!s) return null;
  const ne = Array.isArray(s.newEntries) ? s.newEntries.length : typeof s.newEntries === "number" ? s.newEntries : 0;
  const rq = Array.isArray(s.reviewQueue) ? s.reviewQueue.length : typeof s.reviewQueue === "number" ? s.reviewQueue : 0;
  return { newEntries: ne, reviewQueue: rq };
}
const sangrahState = stagingCounts(sangrahStaging);
const parichayState = stagingCounts(parichayStaging);

// =========================================================
// PART 2 — DARSHAN: pull supporting findings
// =========================================================
function lens(name: string): any[] {
  const l = manthan.lensResults.find((x: any) => x.lens === name);
  return l ? l.findings : [];
}
function trim(desc: string, max = 180): string {
  const s = String(desc).trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastDot = cut.lastIndexOf(". ");
  if (lastDot > 80) return cut.slice(0, lastDot + 1);
  return cut.replace(/\s+\S*$/, "") + "…";
}
function pick(findings: any[], n: number): { name: string; description: string }[] {
  return findings.slice(0, n).map((f) => ({ name: f.name, description: trim(f.description) }));
}

// THE PORTRAIT — register lens, humanist dominance / absent analytical
const portraitFindings = pick(
  lens("register").filter((f) =>
    /humanist|analytical|supermajority|shape|register/i.test(f.name)
  ),
  3
);

// THREE FOUNDERS — founding_figures
const foundersFindings = pick(
  lens("founding_figures").filter((f) => f.type === "founding_figure" || /two libraries/i.test(f.name)),
  4
);

// HIDDEN DEPTH — hidden_collections lens + depth-lens hidden_collection-type
const hiddenFindings = pick(
  [
    ...lens("hidden_collections").filter((f) => f.type === "hidden_collection"),
    ...lens("depth").filter((f) => f.type === "hidden_collection"),
  ],
  4
);

// DEBATES — tension_pairs lens, strength=strong preferred
const tensionPool = lens("tension_pairs");
const tensionFindings = pick(
  [...tensionPool.filter((f) => f.strength === "strong"), ...tensionPool.filter((f) => f.strength !== "strong")],
  4
);

// WHAT'S MISSING — tradition lens observations / absence-related
const missingFindings = pick(
  lens("tradition").filter(
    (f) => f.type === "observation" || /absent|missing|conspicuous/i.test(f.name)
  ),
  4
);

// =========================================================
// PART 3 — MANTHAN FINDINGS BROWSER
// =========================================================

const LENS_LABELS: Record<string, { label: string; hindi: string; desc: string }> = {
  depth:             { label: "Depth",             hindi: "गहराई",    desc: "Intellectual strata — primary texts, serious scholarship, synthesis, popular nonfiction" },
  register:          { label: "Register",          hindi: "स्वर",     desc: "Position on the empirical–contemplative axis; the shape of the collection's register" },
  era:               { label: "Era",               hindi: "युग",      desc: "Which decades dominate; what the era concentration reveals about intellectual formation" },
  tradition:         { label: "Tradition",         hindi: "परंपरा",   desc: "Author traditions represented and absent; which lineages are well-represented" },
  tension_pairs:     { label: "Tension Pairs",     hindi: "द्वंद्व",  desc: "Books that argue directly against each other — the live debates the library holds" },
  founding_figures:  { label: "Founding Figures",  hindi: "पूर्वज",   desc: "Thinkers whose ideas the library orbits; lineage convergence revealing intellectual gravity" },
  hidden_collections:{ label: "Hidden Collections",hindi: "छिपी गहराई","desc": "Unexpected depth in areas that didn't announce themselves — often the most personal" },
};

const TYPE_COLORS: Record<string, string> = {
  tension_pair:      "#7a3a2a",
  hidden_collection: "#2a4a3a",
  founding_figure:   "#2a3a5c",
  cluster:           "#4a3a2a",
  pattern:           "#3a2a4a",
  thread:            "#1a3a3a",
  observation:       "#555",
};

const STRENGTH_DOT: Record<string, string> = {
  strong:   "●",
  moderate: "◉",
  weak:     "○",
};

function findingCard(f: any): string {
  const color = TYPE_COLORS[f.type] ?? "#555";
  const dot = STRENGTH_DOT[f.strength ?? ""] ?? "";
  const books = Array.isArray(f.books) && f.books.length
    ? `<div class="mf-books">${f.books.map((b: string) => `<span class="mf-book">${esc(b)}</span>`).join("")}</div>`
    : "";
  const evidence = f.evidence
    ? `<div class="mf-evidence">${esc(String(f.evidence).slice(0, 220))}${String(f.evidence).length > 220 ? "…" : ""}</div>`
    : "";
  return `<div class="mf-card">
    <div class="mf-card-header">
      <span class="mf-type" style="color:${color};">${esc(f.type)}</span>
      ${dot ? `<span class="mf-strength" title="${esc(f.strength)}">${dot}</span>` : ""}
      <span class="mf-name">${esc(f.name)}</span>
    </div>
    <div class="mf-desc">${esc(f.description ?? "")}</div>
    ${books}
    ${evidence}
  </div>`;
}

function buildManthanSection(): string {
  const lensBlocks = manthan.lensResults.map((l: any) => {
    const meta = LENS_LABELS[l.lens] ?? { label: l.lens, hindi: "", desc: "" };
    const cards = (l.findings as any[]).map(findingCard).join("\n");
    const strongCount = (l.findings as any[]).filter((f: any) => f.strength === "strong").length;
    return `
<details class="mf-lens" open>
  <summary class="mf-lens-summary">
    <span class="mf-lens-name">${esc(meta.label)}</span>
    <span class="mf-lens-hindi">${esc(meta.hindi)}</span>
    <span class="mf-lens-count">${l.findings.length} findings · ${strongCount} strong</span>
  </summary>
  <div class="mf-lens-desc">${esc(meta.desc)}</div>
  <div class="mf-cards">${cards}</div>
</details>`;
  }).join("\n");

  const probes = Array.isArray(manthan.probeResults) ? manthan.probeResults : [];
  const probeCards = probes.length
    ? probes.map((p: any) => `
<div class="mf-card mf-probe">
  <div class="mf-card-header">
    <span class="mf-type" style="color:#3a5a2a;">probe</span>
    <span class="mf-name">${esc(p.seedBook ?? "?")} → ${esc(p.candidateName ?? "candidate")}</span>
  </div>
  <div class="mf-desc">${esc(p.description ?? p.rationale ?? "")}</div>
  ${Array.isArray(p.books) && p.books.length ? `<div class="mf-books">${p.books.map((b: string) => `<span class="mf-book">${esc(b)}</span>`).join("")}</div>` : ""}
</div>`).join("\n")
    : `<p style="font-size:13px;color:#999;font-style:italic;">No probe results in this run.</p>`;

  return `
<a id="manthan"></a>
<h2>Manthan <span class="hi">मंथन · findings</span></h2>
<div class="part-intro">All ${totalFindings} findings from the last run (${esc(runDateShort)}) — browsable by lens. Strong findings (●) are the most confident; read all before priming.</div>

${lensBlocks}

<details class="mf-lens">
  <summary class="mf-lens-summary">
    <span class="mf-lens-name">Random Probes</span>
    <span class="mf-lens-hindi">यादृच्छिक खोज</span>
    <span class="mf-lens-count">${probes.length} candidates</span>
  </summary>
  <div class="mf-lens-desc">Edge-book seeds: books not yet anchored in any thread or cluster, probed for unexpected connections.</div>
  <div class="mf-cards">${probeCards}</div>
</details>
`;
}

// =========================================================
// RENDER
// =========================================================
function barRow(label: string, n: number, total: number, max: number): string {
  const w = max === 0 ? 0 : Math.round((n / max) * 100);
  return `<div class="bar-row">
    <div class="bar-label">${esc(label)}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div>
    <div class="bar-val">${n} <span class="bar-pct">${pct(n, total)}%</span></div>
  </div>`;
}
function simpleBars(entries: [string, number][], total: number): string {
  const max = entries.reduce((m, [, n]) => Math.max(m, n), 0);
  return entries.map(([k, n]) => barRow(k, n, total, max)).join("\n");
}
function statTable(entries: [string, number][], total: number): string {
  return `<table class="lj-table"><tbody>${entries
    .map(
      ([k, n]) =>
        `<tr><td>${esc(k)}</td><td class="num">${n}</td><td class="num pct">${pct(n, total)}%</td></tr>`
    )
    .join("")}</tbody></table>`;
}
function statTableNoPct(entries: [string, number][]): string {
  return `<table class="lj-table"><tbody>${entries
    .map(([k, n]) => `<tr><td>${esc(k)}</td><td class="num">${n}</td></tr>`)
    .join("")}</tbody></table>`;
}
function bigNum(n: string | number, label: string): string {
  return `<div class="bignum"><div class="bignum-n">${n}</div><div class="bignum-l">${esc(label)}</div></div>`;
}
function evidenceCards(findings: { name: string; description: string }[]): string {
  if (!findings.length) return "";
  return `<div class="evidence">${findings
    .map(
      (f) =>
        `<div class="evidence-card"><div class="ev-name">${esc(f.name)}</div><div class="ev-desc">${esc(
          f.description
        )}</div></div>`
    )
    .join("")}</div>`;
}
function reactionRow(): string {
  return `<div class="reactions">
    <span class="pill">Yes, that's me</span>
    <span class="pill">Not me</span>
    <span class="pill pill-note">Add a note</span>
  </div>`;
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Darpan / दर्पण — the mirror</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Georgia', serif;
    background: #f8f6f2;
    color: #2a2a2a;
    padding: 48px 32px;
    max-width: 900px;
    margin: 0 auto;
    line-height: 1.7;
  }
  h1 { font-size: 28px; font-weight: normal; letter-spacing: 0.02em; margin-bottom: 6px; }
  .subtitle { font-size: 14px; color: #888; margin-bottom: 36px; font-style: italic; }
  .nav { display: flex; gap: 10px; margin-bottom: 48px; font-size: 13px; flex-wrap: wrap; }
  .nav a { color: #555; text-decoration: none; letter-spacing: 0.03em;
    border: 1px solid #d8d4ce; border-radius: 4px; padding: 7px 14px;
    background: #fff; transition: border-color 0.15s, color 0.15s; }
  .nav a:hover { color: #1a1a1a; border-color: #aaa; background: #faf8f5; }
  .nav .nav-hi { color: #bbb; font-style: italic; margin-left: 6px; }
  .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em;
    color: #aaa; margin-bottom: 20px; }
  h2 { font-size: 20px; font-weight: normal; color: #1a1a1a; margin-bottom: 4px; }
  h2 .hi { font-size: 14px; color: #bbb; font-style: italic; margin-left: 8px; }
  .part-intro { font-size: 13px; color: #999; font-style: italic; margin-bottom: 36px; }
  .part-rule { border: 0; border-top: 1px solid #e0dcd6; margin: 64px 0 40px; }

  .block { margin-bottom: 44px; }
  .block-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;
    color: #999; margin-bottom: 16px; border-bottom: 1px solid #e8e4de; padding-bottom: 8px; }

  /* bignum cards */
  .bignum-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 8px; }
  .bignum { background: #fff; border: 1px solid #e0dcd6; border-radius: 6px; padding: 18px 16px; }
  .bignum-n { font-size: 26px; color: #1a1a1a; line-height: 1.1; }
  .bignum-l { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 6px; }

  /* two-column layout for sub-stats */
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 28px 40px; }
  .col-h { font-size: 12px; color: #888; margin-bottom: 10px; letter-spacing: 0.03em; }

  /* tables */
  .lj-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .lj-table td { padding: 5px 0; border-bottom: 1px solid #efece7; color: #444; }
  .lj-table td.num { text-align: right; color: #1a1a1a; width: 56px; }
  .lj-table td.pct { color: #999; font-size: 12px; width: 56px; }

  /* bars */
  .bar-row { display: grid; grid-template-columns: 150px 1fr 90px; align-items: center;
    gap: 12px; margin-bottom: 7px; }
  .bar-label { font-size: 13px; color: #555; }
  .bar-track { background: #ece8e2; height: 9px; border-radius: 2px; overflow: hidden; }
  .bar-fill { background: #8a8276; height: 100%; }
  .bar-val { font-size: 12.5px; color: #1a1a1a; text-align: right; }
  .bar-pct { color: #aaa; font-size: 11px; }

  /* darshan */
  .darshan-section { margin-bottom: 52px; }
  .darshan-copy { font-size: 16px; color: #2a2a2a; line-height: 1.75; max-width: 760px; }
  .darshan-copy.spines { font-size: 15px; }
  .spine-list { list-style: none; margin: 14px 0 0; padding: 0; }
  .spine-list li { padding: 8px 0 8px 16px; border-left: 2px solid #e0dcd6; margin-bottom: 8px;
    font-size: 14.5px; color: #444; }
  .spine-list li strong { color: #1a1a1a; }

  .evidence { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 22px; }
  .evidence-card { background: #faf9f6; border: 1px solid #e8e4de; border-radius: 5px; padding: 12px 14px; }
  .ev-name { font-size: 12.5px; color: #555; margin-bottom: 4px; }
  .ev-desc { font-size: 12px; color: #999; line-height: 1.55; }

  .reactions { display: flex; gap: 8px; margin-top: 18px; }
  .pill { font-size: 11px; color: #aaa; border: 1px solid #e0dcd6; border-radius: 14px;
    padding: 4px 12px; letter-spacing: 0.03em; background: #faf9f6; cursor: default; }
  .pill-note { color: #bbb; border-style: dashed; }

  .footer { font-size: 11px; color: #ccc; border-top: 1px solid #e0dcd6; padding-top: 20px; margin-top: 56px; }

  /* manthan findings browser */
  .mf-lens { border-top: 1px solid #e0dcd6; padding: 0; margin-bottom: 0; }
  .mf-lens[open] { margin-bottom: 8px; }
  .mf-lens-summary {
    display: flex; align-items: baseline; gap: 12px;
    padding: 18px 0 16px; cursor: pointer; list-style: none;
    font-size: 15px; color: #1a1a1a;
  }
  .mf-lens-summary::-webkit-details-marker { display: none; }
  .mf-lens-summary::before { content: "▸"; color: #bbb; font-size: 11px; margin-right: 4px; }
  details[open] > .mf-lens-summary::before { content: "▾"; }
  .mf-lens-name { font-weight: normal; }
  .mf-lens-hindi { font-size: 13px; color: #bbb; font-style: italic; }
  .mf-lens-count { margin-left: auto; font-size: 12px; color: #aaa; }
  .mf-lens-desc { font-size: 12.5px; color: #999; font-style: italic; margin-bottom: 18px; padding-left: 18px; }
  .mf-cards { display: flex; flex-direction: column; gap: 12px; padding-left: 18px; padding-bottom: 24px; }
  .mf-card { background: #fff; border: 1px solid #e8e4de; border-radius: 5px; padding: 14px 16px; }
  .mf-probe { border-left: 3px solid #a0b89a; }
  .mf-card-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
  .mf-type { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; font-family: 'Courier New', monospace; }
  .mf-strength { font-size: 13px; color: #bbb; }
  .mf-name { font-size: 14px; color: #1a1a1a; }
  .mf-desc { font-size: 13px; color: #555; line-height: 1.65; margin-bottom: 8px; }
  .mf-books { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .mf-book { font-size: 11.5px; color: #777; background: #f5f2ed; border: 1px solid #e8e4de;
    border-radius: 3px; padding: 2px 8px; }
  .mf-evidence { font-size: 11.5px; color: #bbb; font-style: italic; margin-top: 8px;
    font-family: 'Courier New', monospace; line-height: 1.5; }

  @media (max-width: 640px) {
    .bignum-grid { grid-template-columns: 1fr 1fr; }
    .cols, .evidence { grid-template-columns: 1fr; }
    .bar-row { grid-template-columns: 110px 1fr 76px; }
  }
</style>
</head>
<body>

<h1>Darpan <span style="color:#bbb;">/ दर्पण — the mirror</span></h1>
<div class="subtitle">Internal view — for the curator only. Updated ${esc(runDateShort)}</div>

<div class="nav">
  <a href="#lekha-jokha">Lekha-Jokha<span class="nav-hi">लेखा-जोखा · the numbers</span></a>
  <a href="#manthan">Manthan<span class="nav-hi">मंथन · ${totalFindings} findings</span></a>
  <a href="#darshan">Darshan<span class="nav-hi">दर्शन · the meaning</span></a>
</div>

<!-- ════════ PART 1 — LEKHA-JOKHA ════════ -->
<a id="lekha-jokha"></a>
<h2>Lekha-Jokha <span class="hi">लेखा-जोखा</span></h2>
<div class="part-intro">The stock-taking. The numbers, as they are.</div>

<!-- INVENTORY -->
<div class="block">
  <div class="block-label">Inventory</div>
  <div class="bignum-grid">
    ${bigNum(total, "Total books")}
    ${bigNum(withYear, "With a year")}
    ${bigNum(byRegister.length, "Registers")}
    ${bigNum(topCategories.length >= 12 ? catMap.size : catMap.size, "Categories")}
  </div>
</div>

<div class="block">
  <div class="block-label">By status</div>
  ${statTable(byStatus, total)}
</div>

<div class="block">
  <div class="block-label">Register distribution</div>
  ${simpleBars(byRegister, total)}
</div>

<div class="block">
  <div class="cols">
    <div>
      <div class="block-label">Density</div>
      ${statTable(byDensity, total)}
    </div>
    <div>
      <div class="block-label">Form</div>
      ${statTableNoPct(byForm)}
    </div>
  </div>
</div>

<div class="block">
  <div class="block-label">Top 12 categories</div>
  ${simpleBars(topCategories, total)}
</div>

<div class="block">
  <div class="block-label">By decade</div>
  ${simpleBars(decades, withYear)}
</div>

<div class="block">
  <div class="block-label">Author origin — top 10</div>
  ${statTable(byOrigin, total)}
</div>

<!-- ATOMIC UNITS -->
<div class="block">
  <div class="block-label">Atomic units</div>
  <div class="bignum-grid">
    ${bigNum(totalUnits.toLocaleString(), "Total units")}
    ${bigNum(booksWithIdeas, "Books decomposed")}
    ${bigNum(avgUnits, "Avg units / book")}
    ${bigNum(byUnitType.length, "Unit types")}
  </div>
  <div style="margin-top:18px;">${statTable(byUnitType, totalUnits)}</div>
</div>

<!-- ENRICHMENT -->
<div class="block">
  <div class="block-label">Enrichment coverage</div>
  <div class="bignum-grid">
    ${bigNum(pct(withCover, total) + "%", "Have a cover")}
    ${bigNum(pct(withYear, total) + "%", "Have a year")}
    ${bigNum(pct(entriesWithSeeAlso, booksWithIdeas) + "%", "Have a seeAlso link")}
    ${bigNum(withCover, "Covers (n)")}
  </div>
</div>

<!-- MANTHAN -->
<div class="block">
  <div class="block-label">Manthan analysis</div>
  <div class="bignum-grid">
    ${bigNum(totalFindings, "Total findings")}
    ${bigNum(perLens.length, "Lenses")}
    ${bigNum(probeCount, "Probe candidates")}
    ${bigNum(esc(runDateShort), "Last run")}
  </div>
  <div class="cols" style="margin-top:22px;">
    <div>
      <div class="col-h">Findings per lens</div>
      ${statTableNoPct(perLens)}
    </div>
    <div>
      <div class="col-h">Findings by type</div>
      ${statTableNoPct(byFindingType)}
      <div class="col-h" style="margin-top:18px;">By strength</div>
      ${statTable(byStrength, totalFindings)}
    </div>
  </div>
</div>

<!-- PIPELINE -->
<div class="block">
  <div class="block-label">Pipeline state</div>
  ${
    sangrahState || parichayState
      ? `<table class="lj-table"><tbody>
      ${sangrahState ? `<tr><td>sangrah-staging — new entries</td><td class="num">${sangrahState.newEntries}</td></tr><tr><td>sangrah-staging — review queue</td><td class="num">${sangrahState.reviewQueue}</td></tr>` : ""}
      ${parichayState ? `<tr><td>parichay-staging — new entries</td><td class="num">${parichayState.newEntries}</td></tr><tr><td>parichay-staging — review queue</td><td class="num">${parichayState.reviewQueue}</td></tr>` : ""}
    </tbody></table>`
      : `<p style="font-size:13.5px;color:#999;font-style:italic;">Nothing staged.</p>`
  }
</div>

<hr class="part-rule">

<!-- ════════ PART 2 — MANTHAN FINDINGS ════════ -->
${buildManthanSection()}

<hr class="part-rule">

<!-- ════════ PART 3 — DARSHAN ════════ -->
<a id="darshan"></a>
<h2>Darshan <span class="hi">दर्शन</span></h2>
<div class="part-intro">The meaning. A first-spin reading of what the books reveal — not a verdict, an opening.</div>

<div class="darshan-section">
  <div class="section-label">The portrait</div>
  <div class="darshan-copy">This is a library that thinks through people. Across its books — cancer histories, founder memoirs, Stoic emperors, evolutionary biology — the dominant voice is humanist: an idea reaches you carried by someone who lived it. You own the formal, the abstract, the systematic — legal theory, the cybernetics canon, the Yoga Sutras in Sanskrit — but they sit in quiet pockets. What you actually read wears a human face.</div>
  ${evidenceCards(portraitFindings)}
  ${reactionRow()}
</div>

<div class="darshan-section">
  <div class="section-label">Three founders you didn't choose</div>
  <div class="darshan-copy">Your library orbits three thinkers you may never have decided to follow. Darwin. Kahneman. Patanjali. The first two say you are an evolved, biased machine. The third says you are the author of your own mind. You hold all three, unreconciled. That tension — the empirical skeptic against the contemplative seeker — is the deep structure of how you think.</div>
  ${evidenceCards(foundersFindings)}
  ${reactionRow()}
</div>

<div class="darshan-section">
  <div class="section-label">What you're deep in but never named</div>
  <div class="darshan-copy">You didn't set out to build a law library. Or a cybernetics canon. Or a military-strategy doctrine. But they're here — near-complete, serious, filed under other names. The depth you'd never claim in conversation is the depth that's most truly yours.</div>
  ${evidenceCards(hiddenFindings)}
  ${reactionRow()}
</div>

<div class="darshan-section">
  <div class="section-label">The debates you hold unresolved</div>
  <div class="darshan-copy">An antilibrary doesn't hold consensus — it holds arguments. Yours run hot. You own both sides of fights you may not know you're hosting: whether free will exists, whether efficiency or friction wins, whether experience even teaches. The shelf is a standing debate you assembled without meaning to.</div>
  ${evidenceCards(tensionFindings)}
  ${reactionRow()}
</div>

<div class="darshan-section">
  <div class="section-label">What's missing</div>
  <div class="darshan-copy">A mirror shows what isn't there too. Whole traditions are nearly absent — formal theology, the feminist philosophical canon, Continental theory. But hold this loosely: some absences are real, and some are only books we haven't photographed yet. (A recent audit found ~25% of books on a single shelf were missing from the data.) Read the gaps as questions, not verdicts.</div>
  ${evidenceCards(missingFindings)}
  ${reactionRow()}
</div>

<div class="darshan-section">
  <div class="section-label">The mirror's question</div>
  <div class="darshan-copy spines">So — which is the truest thing about you? Four candidate spines, each drawn from what the books reveal:
    <ul class="spine-list">
      <li><strong>The humanist</strong> — "I understand the world through people, not abstractions."</li>
      <li><strong>The argument</strong> — "My library holds live debates, not settled consensus."</li>
      <li><strong>The hidden architecture</strong> — "Three thinkers I never chose shape how I think."</li>
      <li><strong>The unclaimed depth</strong> — "What I'm actually deep in isn't what I'd have told you."</li>
    </ul>
    <div style="margin-top:14px;">The curator's job is to choose which one leads. That choice is what gets pulled forward to the world.</div>
  </div>
</div>

<div class="footer">
  Darpan — दर्पण — the mirror · derived view, regenerated by scripts/build-darpan.ts · ${esc(total)} books · ${esc(totalFindings)} Manthan findings · Manthan run ${esc(runDateShort)} · read-only; do not hand-edit
</div>

</body>
</html>`;

writeFileSync(join(ROOT, "darpan.html"), html, "utf8");
console.log("Wrote darpan.html");
console.log(JSON.stringify({
  total, byStatus, byRegister, byDensity, byForm: byForm.length,
  topCategories: topCategories.length, decades: decades.length,
  totalUnits, booksWithIdeas, avgUnits, byUnitType,
  withCoverPct: pct(withCover, total), withYearPct: pct(withYear, total),
  seeAlsoPct: pct(entriesWithSeeAlso, booksWithIdeas),
  totalFindings, perLens, byFindingType, byStrength, probeCount, runDateShort,
  sangrahState, parichayState,
}, null, 1));
