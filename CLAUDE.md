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
- **The product catalog at the bottom** (two tables: "Build log" + "Backlog"). This is the single maintained source of truth for what has shipped and what is queued. When anything ships, move it from Backlog to Build log (newest first). When a new issue or feature is found, add it to Backlog with a priority chip (HIGH / MED / LOW / NEXT). Do not let issues live only in SESSION-LOG or the internal task list — they must surface here so the user can see them.

The HTML is hand-maintained — edit it surgically, don't regenerate from scratch.

Then commit both files with the session changes.

---

## The five steps — locked

| # | English | Hindi | Devanagari |
|---|---|---|---|
| 1 | Collect | Sangrah | संग्रह |
| 2 | Classify | Parichay | परिचय |
| 3 | Churn | Manthan | मंथन |
| 4 | Curate | **Darpan** | दर्पण |
| 5 | Visualize | Pradarshan | प्रदर्शन |

**Step 4 — Curate / Darpan (the mirror), updated 2026-06-29.** Darpan is the internal-facing mirror — the curator's complete self-knowledge — with two layers:
- **Lekha-Jokha (लेखा-जोखा)** — the numbers. Statistical, non-negotiable, a derived view (`darpan-stats.json` + history).
- **Darshan (दर्शन)** — the meaning. Interpretive portrait + priming over Manthan findings.

**Curate = Darpan.** The curator knows everything in the mirror, then pulls a subset forward to Pradarshan (the window, external). Darshan is no longer the name of Step 4 — it is the interpretive layer *inside* Darpan.

**Do not rename these.** Do not introduce Saar, do not revert to old six-module structure. Engine = Sangrah/Parichay/Manthan; mirror = Darpan; window = Pradarshan.

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
