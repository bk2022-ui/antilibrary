# Start Here — Antilibrary Engine Build

Read this first. Then read `docs/ANTILIBRARY-ENGINE-SPEC.md`. Then start building.

---

## Where we are

**Project:** Antilibrary — a product that reads a book inventory as a mind and surfaces its intellectual structure (threads, clusters, patterns, the reveal).

**Repo:** `/Users/bharatkhandelwal/coding/antilibrary/` — Next.js 15 app (App Router, Tailwind). Data lives in `src/libraries/bk/`.

**Build sequence status:**
- ✅ Step 1–5: Complete — inventory dimensioned, analysis produced manually, repo reorganized, spec finalized
- ▶ **Step 6: Build the Sangrah agent** ← START HERE
- ⏳ Step 7: Parichay agent
- ⏳ Step 8: Manthan (Churn) agent
- ⏳ Step 9: Darshan (Curate) layer
- ⏳ Step 10: Visualization improvements
- ⏳ Step 11: Khoj / Gaps interface

---

## The four steps

| # | English | Hindi | What |
|---|---|---|---|
| 1 | **Collect** | **Sangrah** | Parse raw input → structured, enriched inventory |
| 2 | **Classify** | **Parichay** | Dimension every book; decompose into Lego blocks |
| 3 | **Churn** | **Manthan** | Run lenses + random probe → threads, clusters, analysis |
| 4 | **Curate** | **Darshan** | Editorial layer — decide what the library shows the world |

---

## What to build next — Sangrah agent

`src/lib/sangrah/` — does not exist yet. Build it.

**What it does:**
1. Parse raw input (CSV, JSON, shelf photos)
2. Deduplicate and canonicalize (link sibling editions via `canonical_id`)
3. Enrich — fetch cover URL, ISBN, description from Google Books / Open Library
4. Flag confidence — `high` or `low`; low-confidence entries enter a review queue before Parichay runs

**Reuse:**
- `src/lib/books/googleBooks.ts` — existing Google Books client
- `src/lib/books/openLibrary.ts` — existing Open Library client

---

## Key files

```
src/libraries/bk/inventory.json        ← 703 books, canonical — do not restructure schema
src/libraries/bk/analysis.json         ← current analytical output — Manthan will update this
src/libraries/bk/clusters.json         ← 8 clusters
src/lib/books/                         ← existing API clients (reuse in Sangrah)
src/lib/curation/curate.ts             ← Curator engine (read for pattern)
docs/ANTILIBRARY-ENGINE-SPEC.md        ← full spec — source of truth
docs/LIBRARY-SYSTEM.md                 ← method documentation with worked example
HANDOFF-ENGINE-BUILD.md                ← full session handoff with all decisions made
```

---

## Key decisions already made — do not relitigate

- **Four steps, not six modules** — Collect / Classify / Churn / Curate
- **Manthan = Churn agent only** — not the system name. The product is the Antilibrary.
- **Naming convention** — every module carries English + Hindi
- **`libraries/bk/`** — your library instance; future libraries sit alongside it
- **`analysis.json` schema** — defined in ANTILIBRARY-ENGINE-SPEC.md, do not restructure
- **Gaps (Khoj) are human-driven** — do not auto-generate gaps from inventory analysis
- **Books are multi-node** — a book belongs to multiple threads/clusters/patterns simultaneously

---

## Context on what the Churn step (Manthan) does

A library is a self-portrait. The Antilibrary Engine reads it. The Churn step is an Adirondacks search — not a Mount Fuji climb. Many peaks of unknown height. Systematic lenses find the obvious ones. Random probes and human priming find the hidden ones. The hidden Yoga/Vedanta library sitting inside what appeared to be a rationalist collection — that was found by the Churn.

The Churn step is named Manthan after the Hindu myth of Samudra Manthan — churning the cosmic ocean until treasures rise to the surface.

The full method is in `docs/LIBRARY-SYSTEM.md`. Worth reading before building.
