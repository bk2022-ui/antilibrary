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
