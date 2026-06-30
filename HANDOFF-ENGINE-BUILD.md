# Handoff — Antilibrary Engine Build

This file captures where we are in the Antilibrary Engine build as of 2026-06-30. Read this to pick up exactly where we left off. For full detail: `SESSION-LOG.md` (chronological), `docs/ANTILIBRARY-ENGINE-SPEC.md` (the spec), and the **Build log + Backlog catalog** at the bottom of `antilibrary-system.html`.

---

## Where we are (2026-06-30)

**The engine is built and has run end-to-end on the real library.** Inventory: **732 books, ~3,500 atomic units.**

| Step | Agent | State |
|---|---|---|
| 1 Collect | **Sangrah** | ✅ Built + ran live. Reads shelf photos → spines → enrich → dedup → `sangrah-staging.json`. CLI `npm run sangrah -- --input <folder>`. |
| 2 Classify | **Parichay** | ✅ Built + ran live. Classify + decompose; ToC/Wikipedia/See-also enrichment → `parichay-staging.json` + `ideas.json`. CLI `npm run parichay`. |
| 3 Churn | **Manthan** | ✅ Built + ran live. 7 lenses + random probe → `manthan-analysis.json` (~91 findings). CLI `npm run manthan`. |
| 4 Curate | **Darpan** (the mirror) | ◧ v1 built — `darpan.html` (Lekha-Jokha stats + Darshan self-portrait) via `scripts/build-darpan.ts`. Interpretive layer iterating. |
| 5 Visualize | **Pradarshan** | Cover-display study `covergrid.html` (via `scripts/build-covergrid.ts`) — treatment settled, **held**, not yet ported to live `page.tsx`. |

**Requires `ANTHROPIC_API_KEY` in `.env.local`** (gitignored) to run any agent.

### What to pick up next (any of these — see backlog for priority)
- **Multi-agent rebuild of the engine** — Bharat's chosen next move: an agent per part (Sangrah/Parichay/Manthan/...), run sequentially → collaboratively → evaluated. This is the learning vehicle *and* an architecture upgrade.
- **Build evaluation in** — the one missing discipline (how do we know outputs are right? ~25% ingestion miss, false absence findings). Pair it with the multi-agent rebuild.
- **Ingestion quality** (HIGH) — input-photo guide + multi-pass Sangrah union to drive down the ~25% miss.
- **Manthan delta-pass** (HIGH) — full re-churn doesn't scale; compute only the change.
- **Port cover treatment** into live `page.tsx`; deepen Darpan/Darshan.

### Strategic context (new this session)
The portfolio was inventoried and a synthesis written. See `~/coding/ai-learning/` — `SYNTHESIS-the-work-and-the-journey.html`, `THE-ARC-path-traveled.html`, `LEARNING-LOG.md`. Short version: the Anti Library is one of Bharat's "engines that think" (his signature strength); it feeds his learning and two books (4S, A2A). Visualization is an interest, not the forte.

---

## What happened in this session

### Repo reorganization
- Deleted `bk2022-ui/library-curator` from GitHub (stale pre-extraction snapshot)
- Moved `src/data/` → `src/libraries/bk/` — data is now a named library instance; future libraries sit alongside `bk/` with the same structure
- Updated all `@/data/` imports to `@/libraries/bk/` across 5 app pages
- Moved spec/design docs from `library-curator/` into `antilibrary/docs/`
- Moved session handoffs (`HANDOFF.md`, `START-HERE.md`, `AGENTS.md`) to `antilibrary/` root

### Framework decisions made today
1. **Five steps** — Collect / Classify / Churn / Curate / Visualize (Pradarshan added as the fifth; replaces old six-module structure)
2. **Darshan = Curate (Step 4)** — private seeing; the editorial curation layer. Darshan is for yourself.
3. **Pradarshan = Visualize (Step 5)** — showing to others (pra + darshan = "showing forth"). The public-facing UI output.
4. **Naming convention locked** — every module carries English + Hindi. English for clarity, Hindi for identity.
5. **Multi-tenancy design** — `src/libraries/bk/` is your library instance. A friend's library would be `src/libraries/friend-name/`. The engine is indifferent to whose library it processes.
6. **Five agents, each with a cadence** — Sangrah (on file upload), Parichay (per book), Manthan (batch threshold), Darshan (human-triggered), Pradarshan (renders the site).

### What was added to the spec
- Agent architecture table with triggers, inputs, outputs
- Quality gate: confidence flagging + canonicalization rules for multiple editions
- Sangrah: defined what it produces and what it does not do
- Parichay: Lego blocks formalized (3–7 per book by form type)
- Darshan: defined as editorial layer, not generative
- Build sequence updated

---

## The five steps

| # | English | Hindi | Devanagari | Agent trigger | Output |
|---|---|---|---|---|---|
| 1 | **Collect** | **Sangrah** | संग्रह | New file uploaded | `inventory.json` (raw + enriched) |
| 2 | **Classify** | **Parichay** | परिचय | Per new book | `inventory.json` (classified) + `ideas.json` |
| 3 | **Churn** | **Manthan** | मंथन | N new books classified | `analysis.json` |
| 4 | **Curate** | **Darshan** | दर्शन | Human decision | Curation config for visualization |
| 5 | **Visualize** | **Pradarshan** | प्रदर्शन | After Darshan | Rendered antilibrary site |

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
    ANTILIBRARY-ENGINE-SPEC.md   ← Full engine specification (source of truth)
    LIBRARY-SYSTEM.md ← Method documentation
    ANTILIBRARY-PRODUCT.md
    ANTILIBRARY-MAP.html
    VIZ-MYCELIUM.html
    VIZ-UNDERGROUND.html
  HANDOFF-LIBRARY-CHAT.md   ← Prior session handoff (extraction)
  HANDOFF-ENGINE-BUILD.md  ← This file
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
- `docs/ANTILIBRARY-ENGINE-SPEC.md` — full spec, especially "Step 1 — Collect / Sangrah" and "Quality gate" sections
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
