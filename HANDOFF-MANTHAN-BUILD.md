# Handoff — Manthan Engine Build

This file captures where we are in the Manthan Engine build as of 2026-06-29. Read this to pick up exactly where we left off.

---

## Where we are

Steps 1–5 of the build sequence are complete. We are about to start **Step 6: Build the Sangrah agent**.

Nothing has been built yet. The spec is complete and locked. The repo is clean and organized.

---

## What happened in this session

### Repo reorganization
- Deleted `bk2022-ui/library-curator` from GitHub (stale pre-extraction snapshot)
- Moved `src/data/` → `src/libraries/bk/` — data is now a named library instance; future libraries sit alongside `bk/` with the same structure
- Updated all `@/data/` imports to `@/libraries/bk/` across 5 app pages
- Moved spec/design docs from `library-curator/` into `antilibrary/docs/`
- Moved session handoffs (`HANDOFF.md`, `START-HERE.md`, `AGENTS.md`) to `antilibrary/` root

### Framework decisions made today
1. **Four steps, not six modules** — Collect / Classify / Churn / Curate (replacing the old six-module structure)
2. **Darshan is the fourth step** — the editorial layer between analysis and visualization. Visualization is the output of Darshan, not a step itself.
3. **Naming convention locked** — every module carries English + Hindi. English for clarity, Hindi for identity. Third language slots in as a third column if needed.
4. **Multi-tenancy design** — `src/libraries/bk/` is your library instance. A friend's library would be `src/libraries/friend-name/`. The engine is indifferent to whose library it processes.
5. **Four agents, each with a cadence** — Sangrah (on file upload), Parichay (per book), Manthan (batch threshold), Darshan (human-triggered).

### What was added to the spec
- Agent architecture table with triggers, inputs, outputs
- Quality gate: confidence flagging + canonicalization rules for multiple editions
- Sangrah: defined what it produces and what it does not do
- Parichay: Lego blocks formalized (3–7 per book by form type)
- Darshan: defined as editorial layer, not generative
- Build sequence updated

---

## The four steps

| # | English | Hindi | Agent trigger | Output |
|---|---|---|---|---|
| 1 | **Collect** | **Sangrah** | New file uploaded | `inventory.json` (raw + enriched) |
| 2 | **Classify** | **Parichay** | Per new book | `inventory.json` (classified) + `ideas.json` |
| 3 | **Churn** | **Manthan** | N new books classified | `analysis.json` |
| 4 | **Curate** | **Darshan** | Human decision | Curation config for visualization |

---

## Repo state

| Repo | Local path | GitHub | What |
|---|---|---|---|
| Personal site | `/Users/bharatkhandelwal/coding/library-curator/` | `bk2022-ui/bk-site` | Personal site only |
| Antilibrary | `/Users/bharatkhandelwal/coding/antilibrary/` | `bk2022-ui/antilibrary` | The product — engine + UI |

### Key files in antilibrary
```
antilibrary/
  src/
    app/              ← UI pages (constellation, curator, stars, etc.)
    lib/
      books/          ← Google Books + Open Library API clients
      curation/       ← Curator engine (existing)
    libraries/
      bk/             ← YOUR library data
        inventory.json    ← 703 books, fully dimensioned
        analysis.json     ← 17 threads, 5 clusters, 23 patterns (manual)
        clusters.json     ← 8 curated clusters
        ideas.json        ← Lego blocks (most books done)
        researchers.json
        subjects.json
        synthesis.json
  docs/
    MANTHAN-SPEC.md   ← Full engine specification (source of truth)
    LIBRARY-SYSTEM.md ← Method documentation
    MANTHAN-PRODUCT.md
    MANTHAN-MAP.html
    VIZ-MYCELIUM.html
    VIZ-UNDERGROUND.html
  HANDOFF-LIBRARY-CHAT.md   ← Prior session handoff (extraction)
  HANDOFF-MANTHAN-BUILD.md  ← This file
```

### No Manthan engine code exists yet
`src/lib/` has only `books/` and `curation/`. The Manthan engine (`src/lib/manthan/`) does not exist yet. We are building it from scratch starting with Sangrah.

---

## What to build next — Sangrah agent

The Sangrah agent takes raw input and produces a structured, enriched inventory entry.

### What it does
1. **Parse** — accept CSV, JSON, or image input; extract title, author, year, status
2. **Deduplicate** — check if book already exists in inventory; flag if so
3. **Canonicalize** — link sibling editions via `canonical_id`; multiple editions of the same text are siblings, not duplicates
4. **Enrich** — fetch cover URL, ISBN, description from Google Books API / Open Library
5. **Confidence flag** — mark entries as `confidence: high` or `low`; low-confidence entries enter a review queue before Parichay runs

### Quality gate
Low-confidence entries (unreadable spine, unmatched author, uncertain year) are held back from Parichay. They surface in the UI as a review queue for human confirmation.

### Files to read before building
- `docs/MANTHAN-SPEC.md` — full spec, especially "Step 1 — Collect / Sangrah" and "Quality gate" sections
- `src/libraries/bk/inventory.json` — the target schema (what a fully populated entry looks like)
- `src/lib/books/googleBooks.ts` — existing Google Books client (reuse this)
- `src/lib/books/openLibrary.ts` — existing Open Library client (reuse this)

### Where to build it
`src/lib/sangrah/` — new folder, does not exist yet.

---

## Open questions (do not decide without Bharat)

1. **Batch size for Manthan trigger** — how many newly classified books should trigger a Manthan run? Suggested default: 10–20. Bharat to decide.
2. **Khoj / Gaps interface** — should the `to-buy` backlog (6 books currently) be surfaced as a view in the antilibrary UI? Deferred — decide before building Step 10 (visualization).
3. **Darshan config format** — what does the curation layer look like as a data structure? Not yet defined. Decide when we reach Step 9.

---

## Dev server
```bash
cd /Users/bharatkhandelwal/coding/antilibrary
npm run dev
# → http://localhost:3004
```

Build passes clean as of this session.
