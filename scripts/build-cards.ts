#!/usr/bin/env tsx
/**
 * build-cards.ts — the app feed (derived view, sibling to Pradarshan).
 *
 * Turns the book-keyed engine output (ideas.json + inventory.json) into a FLAT,
 * self-contained, addressable feed a learning app can pull from directly: one
 * array of cards, each carrying everything it needs to render and be scheduled.
 *
 * This is a DERIVED VIEW — never hand-edit the output. Author the units in
 * Parichay; re-run this to repackage.  npm run cards  (add to package.json)
 *
 * Writes:  src/libraries/bk/cards.json   (canonical, this repo)
 *
 * ── Card identity (the one-way door) ──────────────────────────────────────────
 * A learning app keeps per-user state (seen / SRS schedule / favorites) keyed to
 * each card's `id`. That state is only as stable as the id. We produce a
 * globally-unique, deterministic, book-scoped id: `<bookId>::<titleSlug>`, with a
 * deterministic suffix on within-book collisions. It is stable as long as (book,
 * title) are stable — a strict improvement over today's globally-colliding,
 * ordinal-based ids.  TRUE stability across re-churn requires Parichay to PERSIST
 * an id when it first mints a unit; when it does, this generator should prefer that
 * persisted id over the derived one. `contentHash` lets the app detect when a
 * card's text changed (re-surface it) without changing its identity.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(__dirname, "..");
const LIB = join(ROOT, "src/libraries/bk");
const read = (f: string) => JSON.parse(readFileSync(join(LIB, f), "utf8"));

const inventory: any[] = read("inventory.json");
const ideas: Record<string, { units?: any[] }> = read("ideas.json");

const slug = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";

const shortHash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 8);

// ── inventory lookup: title → book record (exact → case-insensitive → punctuation-insensitive) ──
// The last tier recovers variant titles that differ only by hyphens/apostrophes
// (e.g. "The Wabi Sabi Way" vs "The Wabi-Sabi Way").
const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const byTitle = new Map<string, any>();
const byTitleLower = new Map<string, any>();
const byTitleNorm = new Map<string, any>();
for (const b of inventory) {
  if (b.title) {
    byTitle.set(b.title, b);
    byTitleLower.set(b.title.toLowerCase(), b);
    byTitleNorm.set(norm(b.title), b);
  }
}
const lookupBook = (title: string) =>
  byTitle.get(title) ??
  byTitleLower.get((title || "").toLowerCase()) ??
  byTitleNorm.get(norm(title)) ??
  null;

// ── build cards ──
const cards: any[] = [];
const usedIds = new Set<string>();
let authorMisses = 0;

for (const [bookTitle, entry] of Object.entries(ideas)) {
  const book = lookupBook(bookTitle);
  if (!book?.author) authorMisses++;
  const bookId = slug(bookTitle);

  for (const u of entry.units ?? []) {
    // deterministic, globally-unique, book-scoped id
    let id = `${bookId}::${slug(u.title)}`;
    if (usedIds.has(id)) {
      // within-book title collision → deterministic suffix from body
      id = `${id}-${shortHash(u.body ?? "")}`;
      let n = 2;
      while (usedIds.has(id)) id = `${bookId}::${slug(u.title)}-${n++}`;
    }
    usedIds.add(id);

    cards.push({
      id,
      type: u.type ?? "other",
      title: u.title ?? "",
      body: u.body ?? "",
      prompt: null, // reserved — a future Parichay enrichment pass fills the recall/question side
      tags: u.tags ?? [],
      source: {
        bookId,
        book: book?.title ?? bookTitle,
        author: book?.author ?? null,
        category: book?.category ?? null,
        year: typeof book?.year === "number" ? book.year : null,
      },
      contentHash: shortHash(`${u.title ?? ""}\n${u.body ?? ""}`),
    });
  }
}

// ── type + tag rollups (handy for the app's filter UI; cheap to include) ──
const byType: Record<string, number> = {};
for (const c of cards) byType[c.type] = (byType[c.type] ?? 0) + 1;

const feed = {
  version: 1,
  generatedAt: new Date().toISOString(),
  count: cards.length,
  meta: {
    books: new Set(cards.map((c) => c.source.bookId)).size,
    byType: Object.fromEntries(Object.entries(byType).sort((a, b) => b[1] - a[1])),
    schema:
      "id · type · title · body · prompt(reserved) · tags · source{bookId,book,author,category,year} · contentHash",
  },
  cards,
};

writeFileSync(join(LIB, "cards.json"), JSON.stringify(feed, null, 2));

// ── report ──
console.log(`✓ cards.json — ${cards.length} cards from ${feed.meta.books} books`);
console.log(`  types: ${JSON.stringify(feed.meta.byType)}`);
console.log(`  author attribution: ${cards.length - cards.filter((c) => !c.source.author).length}/${cards.length} baked (${authorMisses} books missing author)`);
console.log(`  id uniqueness: ${usedIds.size === cards.length ? "OK — all unique" : "COLLISION"}`);
console.log(`\n── sample of 10 cards ──`);
for (let i = 0; i < cards.length; i += Math.floor(cards.length / 10)) {
  const c = cards[i];
  const author = c.source.author ? ` · ${c.source.author}` : "";
  console.log(`\n[${c.type}] ${c.title}`);
  console.log(`  id: ${c.id}`);
  console.log(`  ${c.body}`);
  console.log(`  tags: ${c.tags.join(", ")}`);
  console.log(`  — ${c.source.book}${author}${c.source.year ? ` (${c.source.year})` : ""}`);
}
