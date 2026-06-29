# Antilibrary — Claude Instructions

Read `HANDOFF-ENGINE-BUILD.md` first. Then `docs/ANTILIBRARY-ENGINE-SPEC.md`. Then start.

---

## Before you close any session

You must do both of these before the session ends:

### 1. Update SESSION-LOG.md

Add a new entry at the top (newest first) with:
- Date
- What we did (bullet points)
- Framework state (if anything changed)
- Decisions made
- Where the next session starts

### 2. Update antilibrary-system.html

If anything changed about the framework, steps, build sequence, or current state, update `antilibrary-system.html` to reflect it. Specifically:
- The subtitle date (`updated YYYY-MM-DD`)
- The build sequence step markers (✅ Done / ⬅ Next / Pending)
- Any step descriptions that changed
- The footer date

The HTML is hand-maintained — edit it surgically, don't regenerate from scratch.

Then commit both files with the session changes.

---

## The five steps — locked

| # | English | Hindi | Devanagari |
|---|---|---|---|
| 1 | Collect | Sangrah | संग्रह |
| 2 | Classify | Parichay | परिचय |
| 3 | Churn | Manthan | मंथन |
| 4 | Curate | Darshan | दर्शन |
| 5 | Visualize | Pradarshan | प्रदर्शन |

**Do not rename these.** Do not introduce Saar, do not revert to old six-module structure.

**Manthan = Churn step only.** The product is the Antilibrary. The engine is the Antilibrary Engine.

---

## Key files

```
HANDOFF-ENGINE-BUILD.md          ← full session state, read first
SESSION-LOG.md                   ← running session log, update before closing
antilibrary-system.html          ← visual system overview, update before closing
docs/ANTILIBRARY-ENGINE-SPEC.md  ← full spec, source of truth
docs/LIBRARY-SYSTEM.md           ← method documentation
src/libraries/bk/                ← Bharat's library data (inventory.json, analysis.json, etc.)
src/lib/books/                   ← existing API clients (reuse in Sangrah)
```

---

## What not to touch

- `src/libraries/bk/inventory.json` — canonical, do not restructure schema
- `src/libraries/bk/analysis.json` — do not restructure; schema is in ANTILIBRARY-ENGINE-SPEC.md
- The five-step names — locked
