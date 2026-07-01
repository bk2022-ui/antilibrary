# HANDOFF — START HERE (current, updated 2026-07-01)

This is the **latest, canonical** orientation file. Read this first. The older
`HANDOFF.md`, `START-HERE.md`, `HANDOFF-LIBRARY-CHAT.md`, and
`HANDOFF-ENGINE-DEMO.md` are **historical** — ignore unless you need backstory.
For deeper detail see the **Docs** list at the bottom.

---

## TL;DR — where we are

The 5-step **Antilibrary Engine is built and running end-to-end** on the real
library (**732 books · 3,498 atomic ideas · 91 findings**). The public window
(**Pradarshan**) is **live and explorable** at **bharatkhandelwal.com/antilibrary**.
The vertical slice is complete. Remaining work is post-launch refinement plus a
bigger multi-agent / evaluation rebuild (all optional, see "What's next").

---

## ⚠️ Two repos — read this or you WILL get confused

| Repo | Local path | GitHub | What it is |
|---|---|---|---|
| **antilibrary** | `~/coding/antilibrary` | `bk2022-ui/antilibrary` | **THE PRODUCT** — the engine, the data, the generators. Multi-tenant in intent; runs on `src/libraries/bk/` today. |
| **bk-site** | `~/coding/bk-site` | `bk2022-ui/bk-site` | **THE PERSONAL SITE** — bharatkhandelwal.com. The **public display of Bharat's library lives here** at `/antilibrary`. On Vercel. |

- The public window is **bk-site `src/app/antilibrary/page.tsx`** (→ bharatkhandelwal.com/antilibrary), linked from the site's homepage nav.
- The antilibrary app's own `src/app/page.tsx` is the **product** UI running on bk data — **not** the public destination.
- `antilibrary.bharatkhandelwal.com` **does not exist** — never link there.
- `src/libraries/tim-boyle/` and any uncommitted edits under `src/lib/**` are **Bharat's own test bed** (running the engine on a second dataset). **Leave them alone.**

---

## The engine — all 5 steps ✅ (antilibrary repo)

| # | Agent | Run it | Output |
|---|---|---|---|
| 1 Collect | **Sangrah** | `npm run sangrah -- --input <folder>` | `inventory.json` |
| 2 Classify | **Parichay** | `npm run parichay` | `ideas.json` (3,498 atomic units) |
| 3 Churn | **Manthan** | `npm run manthan` | `manthan-analysis.json` (91 findings, 7 lenses) |
| 4 Curate | **Darpan** (the mirror) | `npx tsx scripts/build-darpan.ts` | `darpan.html` — Lekha-Jokha + Manthan browser + Darshan |
| 5 Visualize | **Pradarshan** (the window) | `npm run pradarshan` | the bundle the public page reads (see below) |

Agents 1–3 need `ANTHROPIC_API_KEY` in `.env.local` (gitignored). Steps 4–5 are pure renderers over existing JSON (no API).

---

## Pradarshan — the public window (the main recent work)

**Data flow (one source of truth → derived view):**
```
engine outputs (antilibrary)      the pull (editorial)        generator                 the view (bk-site)
inventory / ideas / manthan  →  pradarshan-config.json  →  build-pradarshan.ts   →   /antilibrary page.tsx
analysis / clusters              (selections + optional      (npm run pradarshan)      renders the bundle
                                  headline overrides)
```
- **`src/libraries/bk/pradarshan-config.json`** = the curator's control surface: ordered `selections` (which findings to feature), `featuredBooks`, `tagline`/`intro`, and an optional **`headline`** per selection that overrides Manthan's poetic finding-name on the public spine (engine data untouched; 3 of 10 done).
- **`npm run pradarshan`** (`scripts/build-pradarshan.ts`) resolves the config and writes: a **light main bundle** `pradarshan.json` (~62 KB gz — stats, spines, all 91 findings, clusters/threads/patterns, 732-book catalogue) **+ lazy per-type idea chunks** (`bk-site/public/antilibrary/ideas-<type>.json`; the 3,498 ideas, fetched only on drill-in). It syncs both into bk-site.
- **The page** = hero + cover strip; nav `Statistics · Spines · Clusters · Catalogue`; **clickable** big numbers; an **analysis index** (5 idea types · 7 lenses · threads/clusters/patterns) where each opens a **drill-down panel** (Search box + "Jump to an item…" dropdown); catalogue in the settled covergrid treatment with a filter bar.

**Full as-built design:** `docs/PRADARSHAN-DESIGN-REFERENCE.md` → the **"AS BUILT"** section.

**Operating loop:** edit `pradarshan-config.json` → `npm run pradarshan` → commit/push (antilibrary: config + bundle; bk-site: bundle + chunks + any page change).

---

## ⚠️ Deploy rule (learned the hard way)

bk-site deploys on Vercel, which runs `next build` — **stricter** than `npm run dev`.
**Always run `npm run build` in bk-site before pushing.** A green dev server is NOT
a deployable commit (four commits silently failed to deploy on a TS `implicit any`
that dev tolerated, freezing prod on an old build).

---

## Also built recently (context)

The **synopsis deck** (`engine-demo.html`) — a standalone C-suite explainer of the
system — lives **in bk-site** at `public/engine-demo.html`, opened by the
"(anti)library" tile on **bharatkhandelwal.com/products**. Single source of truth =
bk-site; iterate it there.

---

## What's next (all optional / post-launch)

- **Finish spine `headline` overrides** in Bharat's voice (`pradarshan-config.json`).
- **Ingestion recall** (~25% miss) and **Manthan delta-pass** (full re-churn doesn't scale) — HIGH in the backlog.
- **Multi-agent rebuild + build evaluation in** — the bigger architecture track; Bharat's chosen long move.
- **Book-detail node** in Pradarshan (Founders-Notes "essence on top, evidence below") — the drill-down panel is the foundation.
- Full priorities: the **Backlog** table at the bottom of `antilibrary-system.html`.

---

## Docs (source of truth)

- **`SESSION-LOG.md`** — chronological log (newest first). Update before closing any session.
- **`antilibrary-system.html`** — visual system overview + the maintained **Build log / Backlog** catalog.
- **`docs/PRADARSHAN-DESIGN-REFERENCE.md`** — the Pradarshan design (incl. "AS BUILT").
- **`docs/ANTILIBRARY-ENGINE-SPEC.md`** — the engine spec (source of truth for the five steps).
- **`CLAUDE.md`** — operating rules (locked step names; the before-you-close checklist).
- `HANDOFF-ENGINE-BUILD.md` — engine build state (also current).

---

## Before you close a session

Per `CLAUDE.md`: update `SESSION-LOG.md` (new entry at top) **and** the Build-log /
Backlog in `antilibrary-system.html`, then commit. And if you touched bk-site, run
`npm run build` before pushing.
