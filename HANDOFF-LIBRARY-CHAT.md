# Handoff — Library & Manthan Chat

This file briefs the chat that is building the Manthan Engine and developing the antilibrary as a standalone product. Read this first, then read `MANTHAN-SPEC.md` in the `bk-site` repo.

---

## What happened today (2026-06-29)

The antilibrary has been fully extracted from the personal site (`bk-site`) into its own standalone repo and product.

### Repos

| Repo | URL | What it is |
|---|---|---|
| `bk2022-ui/bk-site` | bharatkhandelwal.com | Personal/biographical site only |
| `bk2022-ui/antilibrary` | antilibrary.bharatkhandelwal.com | Standalone library product (this repo) |
| `bk2022-ui/wearenotafamily` | wearenotafamily.com | Book site — separate, unrelated |

### Local paths

| Repo | Local path |
|---|---|
| Personal site | `/Users/bharatkhandelwal/coding/library-curator/` |
| Antilibrary | `/Users/bharatkhandelwal/coding/antilibrary/` |

### What was moved

Everything library-related moved from `bk-site` into this repo:

- `src/app/` — all antilibrary pages, now at root routes (not `/antilibrary/xxx` but `/xxx`)
- `src/data/` — `inventory.json`, `analysis.json`, `clusters.json`, `ideas.json`, `researchers.json`, `subjects.json`, `synthesis.json`
- `src/lib/` — `books/googleBooks.ts`, `books/openLibrary.ts`, `curation/curate.ts`
- `src/types/` — `book.ts`, `profile.ts`
- `src/app/api/curate/route.ts` — the Curator API

### Route changes

All routes that were `/antilibrary/xxx` on the personal site are now `/xxx` in this standalone app:

| Old (on bk-site) | New (this repo) |
|---|---|
| `/antilibrary/` | `/` |
| `/antilibrary/curator/` | `/curator/` |
| `/antilibrary/constellation/` | `/constellation/` |
| `/antilibrary/stars/` | `/stars/` |
| `/antilibrary/cluster-compare/` | `/cluster-compare/` |
| `/antilibrary/investor-letters/` | `/investor-letters/` |
| `/antilibrary/magazines/` | `/magazines/` |
| `/antilibrary/researchers/` | `/researchers/` |
| `/antilibrary/mycelium/` | `/mycelium/` |
| `/antilibrary/visualizations/` | `/visualizations/` |

### Deployment

- Dev server runs on `localhost:3004` (`npm run dev`)
- GitHub: `bk2022-ui/antilibrary`
- Domain: `antilibrary.bharatkhandelwal.com` (Vercel project to be connected — not yet deployed as of this handoff)

---

## Current state of the data

- **`inventory.json`** — 703 books, fully dimensioned across: `register`, `density`, `form`, `lineage`, `status`, `year`, `author_origin`, `author_tradition`, `category`, `categories`, `topic`, `subtopics`
- **`analysis.json`** — 17 threads, 5 clusters, 23 patterns, full reveal. Produced manually through conversation. The Manthan Engine will automate this.
- **`clusters.json`** — 8 curated clusters including Systems Thinking & Cybernetics (added today)
- **`status` values in inventory**: `read`, `antilibrary`, `reading`, `misplaced`, `to-buy`
- **`to-buy` backlog**: 6 books — 5 systems/cybernetics canon texts added today + The Tragedy of the Commons

---

## Architecture decisions (settled)

1. **Antilibrary is a standalone product** — its own repo, own domain, own deployment
2. **Personal site links to antilibrary externally** — `(anti)library` nav item on bharatkhandelwal.com now opens `antilibrary.bharatkhandelwal.com`
3. **Curator lives at `/curator/`** — inside the antilibrary app, not separate
4. **`/books` stays on the personal site** — that's Bharat's writing, not his reading
5. **Module naming is fixed** — Sangrah / Parichay / Manthan / Sutra / Samuha / Khoj

---

## Build sequence (from MANTHAN-SPEC.md)

Steps 1–4 are complete.

| Step | Status | What |
|---|---|---|
| 1. Collect (Sangrah) | ✅ Done | `inventory.json` — 703 books |
| 2. Classify (Parichay) | ✅ Done | All books dimensioned |
| 3. Churn output (Manthan) | ✅ Done | `analysis.json` — manual, 17 threads / 5 clusters / 23 patterns |
| 4. Separation | ✅ Done | Antilibrary extracted as standalone |
| 5. Build the engine | ⬅ **Next** | Automate the churn — random probe, lenses, priming interface |
| 6. Visualization layer | Pending | Piles view, constellation improvements |
| 7. Curator integration | Pending | Gaps → Curator → re-analyse loop |

---

## What to build next — Step 5: Manthan Engine

The engine takes `inventory.json` and produces/updates `analysis.json` programmatically. Currently the analysis was hand-produced through conversation. The engine automates this.

### Core components to build

**Churn module** — 7 lenses run across the classified inventory:
1. Depth lens — intellectual strata (primary texts → popular nonfiction)
2. Tension pairs — books that argue directly against each other
3. Founding figures — lineage convergence (whose ideas orbit the collection)
4. Register distribution — empirical–spiritual axis shape
5. Era concentration — which decades dominate
6. Hidden collections — unexpected depth in unanticipated areas
7. Tradition mapping — which author traditions present / absent

**Random probe** — Adirondacks search:
1. Select book weighted toward unthreaded/edge books
2. Run shallow probe (metadata coordinates) or deep probe (LLM knowledge of the book's argument)
3. Surface candidate thread/cluster
4. Invite human priming response

**Priming interface** — records human corrections/confirmations into `priming_log` in `analysis.json`

### Key files to read before building

- `MANTHAN-SPEC.md` — full specification (in `bk-site` repo at `/Users/bharatkhandelwal/coding/library-curator/MANTHAN-SPEC.md`)
- `LIBRARY-SYSTEM.md` — method documentation (same location)
- `src/data/inventory.json` — the input
- `src/data/analysis.json` — the target output schema

---

## One open question

Should the `to-buy` backlog (Khoj/Gaps) be surfaced as a view in the antilibrary UI — a "books I want to acquire" section? This affects the visualization layer design. Decide before building Step 6.

---

## What not to touch

- `src/data/inventory.json` — canonical, do not restructure the schema
- `src/data/analysis.json` — do not restructure; schema is in MANTHAN-SPEC.md
- Thread/cluster/pattern definitions in `analysis.json` — treat as ground truth
