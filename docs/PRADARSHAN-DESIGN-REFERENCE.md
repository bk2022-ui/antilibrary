# Pradarshan — Design Reference

Visual references and principles for Step 5 (Visualize / Pradarshan). Captured during the build, revisited when we actually design the public-facing layer.

---

## Reference 1 — Founders Notes Library (foundersnotes.com/library)

Captured 2026-06-29 from a screenshot. The library + book detail pages are behind a login, so this is from observation, not a crawl. Worth re-photographing the **book detail page** when we get to Pradarshan — Bharat specifically liked the detail given to each book.

### What works — the design moves to steal

**1. The chrome recedes, the covers carry everything.**
Black narrow sidebar, white content canvas. Maximum contrast between navigation and content makes the books feel like work hung on a gallery wall. The chrome is deliberately quiet so the covers dominate.

**2. Covers are the hero, rendered with depth.**
Real, full-color book covers with a subtle drop shadow and a slight page-curl on the top-right corner — lifting them off the flat page into light 3D. This single move lets everything else stay minimal: the covers do the visual work.

**3. Typography is disciplined — two levels, no more.**
- Serif **only** for the wordmark (identity).
- Sans-serif everywhere else: **bold title**, **muted-gray author** beneath each cover.
- Two lines per card, clear hierarchy, zero clutter.

**4. Color is almost absent.**
Black, white, gray — plus exactly one accent (a blue selection border). Restraint *is* the aesthetic. The covers supply all the color the page needs.

**5. Controls stay out of the way.**
Sort, grid/list toggle, search — top-right, small, monochrome. Active tab marked by a simple underline. Nothing competes with the grid.

**6. Generous whitespace.**
5-column grid, ample gaps between cards. Nothing crowded. Breathing room reads as quality.

### The tension to resolve for the Antilibrary

Founders Notes is a **flat catalogue** — a clean grid of books, nothing more. The Antilibrary's whole point is **structure**: threads, clusters, tension pairs, the reveal. So the challenge is:

> Keep this clarity and cover-forward calm, while layering in the intellectual structure Manthan surfaces.

The flat grid is the *resting state* — beautiful, browsable. The structure (constellation, piles, threads) is what you reveal on top of it. Don't let the analysis clutter the calm; let it be a layer the visitor chooses to turn on.

### The detail page — captured 2026-06-29 (foundersnotes.com/bookreview/3644)

The book detail page ("Book Review") is **two layers: essence on top, evidence below.**

**1. The synthesis box (the essence).**
Directly under the title sits a single distilled idea in a **purple-accented rounded box** with a sparkle icon — a one-paragraph AI distillation of what the book is fundamentally about. Visually set apart so the eye lands on it first. *Essence before evidence.*

**2. The highlights (the evidence).**
Under a "Book Highlights" header, each highlight is a **rounded white card** containing:
- The quoted passage in large, comfortable reading type (generous line height)
- **Provenance** — "(Page 13)" in muted gray
- A **NOTE** section for the reader's own annotation
- A **chevron to collapse** — managing density so the page never overwhelms

Same chrome as the grid: black sidebar, white canvas, monochrome + one accent (here purple, for the AI synthesis).

### How the detail page maps to the Antilibrary

The Founders Notes structure maps almost perfectly onto what Parichay already produces:

| Founders Notes | Antilibrary equivalent |
|---|---|
| Purple synthesis box (essence) | The book's **role in the library** — its threads/clusters, register, why it's here |
| Highlight cards (evidence) | The book's **atomic units** (Parichay) — each unit a card: type, title, body, tags |
| Page provenance "(Page 13)" | Source provenance |
| Personal NOTE field | Your own **priming note** on that book |
| Collapsible chevron | Same — manage density across many units |

**The key reframe:** our detail page is not a catalogue entry. It is **the book as a node in the intellectual graph** — essence at top (where it sits in the library's structure, from Manthan), atomic units as cards below (the transferable ideas, from Parichay). Founders Notes shows a book in isolation; the Antilibrary shows a book *in relation*.

---

## Principles carried into Pradarshan (draft)

- **Covers carry the color; the chrome stays monochrome.**
- **Two typographic levels per card — title + author. No more.**
- **The flat grid is the calm resting state; structure is a layer you turn on.**
- **One accent color, used only for state (selection, active thread).**
- **Whitespace is a feature, not waste.**

---

## AS BUILT — the Pradarshan page (2026-06-30)

This is the **canonical record of the implemented design** and the base for future work. Pradarshan shipped as the public window for Bharat's library.

### Where it lives (the two-repo split — important)
- **`antilibrary` repo = the product** (the engine + the standalone product UI). Multi-tenant in intent; today it runs on the one library, `src/libraries/bk/`.
- **The public display of *Bharat's* library = the `/antilibrary` tab on bharatkhandelwal.com** — i.e. the **`bk-site` repo**, route `src/app/antilibrary/page.tsx`. The homepage nav links to it internally. (`antilibrary.bharatkhandelwal.com` does **not** exist — don't link there.)

### Data flow (one source of truth → derived view)
```
engine outputs (antilibrary repo)         the pull (editorial)        derived data            the view
inventory.json / ideas.json        →   pradarshan-config.json   →   build-pradarshan.ts  →   bk-site /antilibrary
manthan-analysis.json / analysis.json    (curator selections +       (npm run pradarshan)     (page.tsx renders it)
clusters.json                             optional headlines)
```
- **`pradarshan-config.json`** is the curator's control surface: the ordered list of findings to feature (`selections`), `featuredBooks`, `tagline`/`intro`, and an optional **`headline`** per selection that overrides Manthan's poetic finding name on the public spine (engine data untouched).
- **`scripts/build-pradarshan.ts` (`npm run pradarshan`)** resolves the config against the engine outputs and writes:
  - a **light main bundle** `pradarshan.json` (~62 KB gzipped) — stats (incl. idea-type counts), the curated spines, **all** 91 findings, 8 clusters, 17 threads, 23 patterns, and the 732-book catalogue. Loads with the page.
  - **heavy per-type idea chunks** `public/antilibrary/ideas-<type>.json` (concept/claim/framework/lens/story; ~1.7 MB total) — the 3,498 atomic ideas, **lazy-loaded** only when a drill-down opens.
- Both the main bundle (→ `bk-site/src/data/`) and the chunks (→ `bk-site/public/antilibrary/`) are synced into bk-site by the generator.

### Page structure
1. **Hero** — tagline + intro + a **cover strip** (row of real covers, visual hook).
2. **Sticky nav** — `Statistics · Spines · Clusters · Catalogue`.
3. **Statistics** — four **clickable** big numbers (732 books · 3,498 ideas · 91 findings · 51 strong) + the register distribution bar, then the **Analysis Index**: every unit type the engine creates, each clickable — the **5 idea types**, the **7 finding lenses**, and **threads / clusters / patterns**.
4. **Spines** — the curated findings (the pull), shown as `headline ?? finding-name`.
5. **Clusters** — the 8 curated collections; click one → its member books.
6. **Catalogue** — the 732-book grid in the **settled covergrid treatment** (−7.5° uniform tilt, soft shadow, register-colored fallback covers, Georgia titles), with a **filter bar**: search (title/author) + Register / Category / Status dropdowns + Sort, and a live result count. Grid/list toggle.

### Interactions
- Clicking a **stat** or an **analysis-index row** opens a right-side **drill-down panel** (overlay, Escape closes).
- Every panel has exactly **two controls**: a **Search…** box (matches title + body) and a **"Jump to an item…" dropdown** that lists the actual items so you can browse when you don't know what to type, and scrolls straight to the one you pick.
- **Idea** panels lazy-fetch their per-type chunk on open. Findings/cluster/book panels read from the main bundle.

### Operating loop
`edit pradarshan-config.json` → `npm run pradarshan` → commit/push (antilibrary: config + bundle; bk-site: bundle + chunks + any page change).

> **Deploy rule (learned the hard way):** bk-site is on Vercel, which runs `next build` — stricter than `npm run dev`. **Always run `npm run build` in bk-site before pushing.** A green dev server is not a deployable commit; four panel-dropdown commits silently failed to deploy because of a TypeScript `implicit any` that dev tolerated.

### Future-design notes (where this goes next)
- **Headlines in Bharat's voice** — only 3 of 10 spines have editorial `headline` overrides; finish the set.
- **Book detail node** — the Founders-Notes "essence on top, evidence below" detail page (above) is still unbuilt: a book as a node in the graph (its threads/clusters as essence, its Parichay atomic units as evidence cards). The drill-down panel pattern is the foundation for it.
- **Per-cluster covers, more catalogue facets (decade/form/density), search inside panel bodies** — incremental.
- The deferred engine fast-follows (ingestion recall, Manthan delta-pass, the multi-agent + evaluation rebuild) are tracked in `antilibrary-system.html` Backlog.
