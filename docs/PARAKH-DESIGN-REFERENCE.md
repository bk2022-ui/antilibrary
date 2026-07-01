# Parakh — Design Reference

**परख — the assay layer of the Antilibrary Engine.** Captured 2026-07-01 during the
build of the first checker. This is the detailed design record for the quality-check
agents. It is the source of truth for *what Parakh is and how it is built*; the engine
spec (`ANTILIBRARY-ENGINE-SPEC.md`) carries the one-paragraph placement, and
`AGENT-SCOPES.md` carries the is/is-not boundaries.

> **For the QC architecture across all five steps** — the archetypes, the steps ×
> archetypes matrix, every step's checkers and power-engine splits, the reusable grounding
> assay, and the build prioritization — see **`docs/PARAKH-ARCHITECTURE.md`** (the living
> map + decision log). *This* doc is the deep dive on the mechanics, using Sangrah as the
> worked example.

---

## What Parakh is

**Parakh is not a sixth step. It is a cross-cutting layer.** The five step names are
locked (Sangrah · Parichay · Manthan · Darpan · Pradarshan). Parakh is the quality
infrastructure that assays the *output* of those steps. It has a **sibling cross-cutting
layer, Taal (ताल) — *rhythm*** — the trigger/cadence layer (when each agent fires:
nightly, per-book, batch, on-render, on-call). Parakh governs whether output is *sound*;
Taal governs *when* each agent runs. Both are named on the public engine demo; Taal is
recorded in `ANTILIBRARY-ENGINE-SPEC.md`.

*Parakh* (परख) is the assayer's word — to test whether something is genuine and of
good quality, the way you assay gold. That is exactly the job: take an engine step's
output and judge whether each record is sound. It sits beside the family (Sangrah,
Manthan, Darpan — all two-beat Sanskrit-rooted words) and reads, to a Hindi speaker,
as *the quality test*.

**Parakh is a family, not a single agent.** The checker pattern generalises across the
whole engine — Parichay will want a checker (did classification split ideas cleanly?),
Manthan will want one (are these findings real or hallucinated?). So Parakh = "the
assay layer of the Antilibrary Engine," and each concrete checker names its target.

### This is the realisation of "Agents Checking Agents"

The public engine demo (`bk-site/public/engine-demo.html`, at
bharatkhandelwal.com/engine-demo.html) already carries the vision under the slide
**"Agents Checking Agents"** — *"Most AI systems are evaluated by the people who built
them. This one evaluates itself."* Parakh is that slide made real. The demo names five
QA agents (one per step): Ingestion Recall, Classification Consistency, Finding
Validity, Portrait Grounding, Staleness Detection. Parakh is the engineering name and
structure for that layer. See **"Mapping to the public vision"** below — the mapping is
not one-to-one, and that gap is deliberate.

---

## Naming convention

```
parakh-<target-step>-<lens>
```

- **`parakh`** — the family / the umbrella command.
- **`<target-step>`** — the engine step under assay (`sangrah`, later `parichay`, `manthan`, `darpan`).
- **`<lens>`** — *how* it checks (`structure`, `recall`, `plausibility`, …).

We deliberately **dropped a `qc-` prefix.** Parakh already *means* quality-check;
`qc-parakh-…` would double-label, and it would split the naming into two vocabularies
(an English abbreviation bolted onto a Sanskrit family). The project convention is
Sanskrit-as-command (`npm run sangrah`), so `parakh-sangrah-structure` is coherent with
it and reads as "the assay of Sangrah's structure." The `<lens>` segment earns its
place only because a step can have more than one checker — and Sangrah has three.

**Model:** a family of sibling checkers that **share one report rail and one umbrella
runner.** Each is independently runnable and graduates to auto-fix on its own track
record, but `npm run parakh sangrah` runs all the built ones for that step and writes
one `parakh-report.json`. This gives the family model *and* a simple operator surface.

---

## The core architecture — the propose → review → apply rail

Every checker, regardless of how it detects problems, emits the **same report shape**
and rides the **same rail**:

```
detect (read-only)  →  human review  →  apply (accepted fixes only)
```

This is the load-bearing decision. It means:

1. **Detection and application are separate.** A checker is a *read-only auditor*: it
   reads a step's output, finds problems, writes proposals to `parakh-report.json`, and
   **mutates nothing.** A separate apply step reads the human's decisions and commits
   only the accepted fixes.
2. **Human-in-the-loop first; auto-fix is a later graduation, not a rewrite.** Because
   approval is just a `status` field defaulting to `pending`, "auto-fix" is flipping the
   default to `accepted` (or an `--auto` flag) — the supervised and autonomous versions
   are the *same detector* with a different approval default. See Phase 6.
3. **Every fix is auditable and reversible.** The corrected data lands in staging (it is
   a real fix, not a flag), but the report + an apply history record every change. This
   is the house rule — one source of truth, derived views, nothing silently mutated —
   applied to the fixer itself. A silent auto-fixer is how these agents earn distrust.

### Two kinds of findings — proposals vs flags

A finding is one of two things, and they must stay distinct so the agent never dresses
a flag up as a fix:

| Kind | Meaning | Human action |
|---|---|---|
| **proposal** | a deterministic fix with a clear `before → after` | accept / reject |
| **flag** | needs human eyes, but no *safe* auto-fix exists | act on it yourself, or ignore |

`author field empty`, a borderline match, an impossible year with no re-derivation — those
are flags. `strip an invalid ISBN`, `derive isbn13 from a valid isbn10`, `merge an exact
cross-inventory dup` — those are proposals.

### The report schema

Emitted to `parakh-report.json` (one per target step). Defined in
`src/lib/sangrah/parakh/types.ts`:

```ts
ParakhFinding {
  id        // `${check}:${location}:${index}` — lets apply re-locate the entry
  checker   // "parakh-sangrah-structure"
  check     // "isbn-checksum" | "duplicate" | "missing-field" | "year-sanity" | "enrichment-triage"
  kind      // "proposal" | "flag"
  severity  // "high" | "medium" | "low"
  target    // { title, author, location: newEntries|reviewQueue, index }
  message   // human-readable: what is wrong and why
  field?    // the field a proposal would change
  before?   // current value  (proposals)
  after?    // proposed value  (proposals)
  status    // "pending" | "accepted" | "rejected"  — human edits; apply reads
}
ParakhReport { runDate, checker, target, stagingPath, summary{…}, findings[] }
```

---

## The three Sangrah checkers (the lenses)

The three leaks in Sangrah's output are not equally important, and they need different
ground truth, cost, and cadence. They are three sibling checkers, not one agent with
hidden layers.

### `parakh-sangrah-structure` — deterministic record integrity  ✅ BUILT (Phase 0–1)

**Ground truth:** the data itself. **Cost:** deterministic, no API, no LLM.
**Detects:**
- **ISBN validity** — ISBN-10/13 checksums; propose derive-13-from-10, or flag/strip invalid.
- **Duplicates** — a new entry whose title already exists in the 732-book inventory, or a
  within-run collision the dedupe missed. (Inventory has no ISBN, so matching is on
  normalised title + author.)
- **Missing fields** — empty author / year / ISBN.
- **Year sanity** — future years, or pre-1400 (bad metadata).
- **Enrichment-failure triage** — categorise the `enriched:false` items so the review
  queue stops crying wolf: a *confident* read that simply isn't in the lookup APIs
  (Japanese-language books, Magazine B, service manuals) is not a defect; a
  *low-confidence* read that also failed to enrich is genuinely suspect.

Files: `src/lib/sangrah/parakh/{types,isbn,structure,report}.ts`, `scripts/parakh.ts`.
Run: `npm run parakh sangrah`.

### `parakh-sangrah-recall` — vision re-check for missed spines  ⬜ PLANNED (Phase 4)

**Ground truth:** the source photos. **Cost:** one extra vision call per image — the
most expensive, highest value. **Detects:** the ~25% ingestion miss. A second vision
pass per image (completeness-focused prompt), diffed against what extraction produced;
recovered spines are routed back through enrich/match/dedupe and proposed as `added`
records; wrong reads are proposed as corrections. This is the demo's "Ingestion Recall"
made real. You cannot catch a missed spine by looking at the output rows — only the
image knows.

### `parakh-sangrah-plausibility` — record coherence  ⬜ PLANNED (Phase 5)

**Ground truth:** LLM world-knowledge + a re-lookup. **Cost:** cheap, batched text.
**Detects:** enrichment returning the *wrong* book — title/author/year/ISBN that don't
cohere. **Guardrail on its fix:** when it detects a wrong book it must fix by
*re-lookup with a corrected query* — **never** by letting the model invent an ISBN or
year. Model-invented metadata is worse than a flagged gap. The data suggests this is
the smallest of the three leaks, which is why it is sequenced last.

---

## Run order vs build order

**They are not the same, and that is intentional.**

- **Run order** (data dependency): `extract → [recall: recover misses] → match/enrich/dedupe → [plausibility] → [structure] → staging + report`. Recall runs early because recovered spines must re-enter the pipeline; structure runs last because it validates the final set.
- **Build order** (cheapest-and-safest first): **structure → recall → plausibility.**
  Structure is deterministic, closes integrity holes, and gives us the validation
  harness that recall's and plausibility's fixes must pass through. Recall is the
  headline value (the known 25%). Plausibility is real but the smallest leak.

---

## Known dependency: the silent-drop bug and match provenance

Sangrah's matcher (`src/lib/sangrah/match.ts`) uses a 0.75 token-overlap threshold. A
genuinely-*new* book that scores ≥0.75 against some inventory title is marked `existing`
and **vanishes from both `newEntries` and `reviewQueue`** — it is never in the output at
all. No checker over the *output* can catch that, because the book was never there.

The fix has two parts, and both are deferred to **Phase 3** (grouped with the matcher
work), because the audit needs data Sangrah currently discards:

- Staging keeps `existingConfirmed` as a bare `string[]` of titles. The per-spine
  **match score** and the extracted-vs-matched pair are not persisted, so Parakh cannot
  audit "was this `existing` classification actually borderline?" without Sangrah
  emitting match provenance.
- The hardening: route borderline matches (≈0.55–0.85, or title-match/author-mismatch)
  to review instead of silently absorbing them — a one-way-door engine change, to be
  made *after* the structure checker has shown the borderline cases on real data.

So even the scary code-fix starts life as a flag: Parakh will first *report* what the
hardened matcher would have caught, before we touch the matcher.

---

## The phased roadmap

| Phase | Ships | Mutates data? | Human-gated? | State |
|---|---|---|---|---|
| **0 — Contract** | Report schema + types, `parakh` command, terminal summary | no | — | ✅ done |
| **1 — `parakh-sangrah-structure`** | The five deterministic checks, read-only | no | you review | ✅ done |
| **2 — `parakh-apply`** | Applies *accepted* proposals to staging + history ledger | yes | yes | ⬜ next |
| **3 — match.ts hardening** | Persist match provenance; reroute borderline → review; the silent-drop fix | engine behavior | evidence-based | ⬜ |
| **4 — `parakh-sangrah-recall`** | Vision re-check; the 25% miss; recovered spines → `added` | via report | yes | ⬜ |
| **5 — `parakh-sangrah-plausibility`** | Record coherence; wrong-book → constrained re-lookup | via report | yes | ⬜ |
| **6 — Auto-fix graduation** | Per-*check-type* auto-accept, granular (deterministic ISBN-strip first; vision-recovered spines gated longest) | yes | trust-tiered | ⬜ |

**"Auto-fix later" is granular, not a switch.** Each check earns autonomy on its own
track record — the safe deterministic ones graduate first; vision-recovery stays
supervised until it is proven.

---

## Mapping to the public vision ("Agents Checking Agents")

The public demo shows **one** QA card per step. Parakh's structure is finer: Sangrah
alone has **three** checkers. The mapping:

| Demo QA card | Parakh checker | Note |
|---|---|---|
| Ingestion Recall | `parakh-sangrah-recall` | direct match — the 25% miss |
| *(none yet)* | `parakh-sangrah-structure` | not in the public vision — the built one |
| *(none yet)* | `parakh-sangrah-plausibility` | not in the public vision |
| Classification Consistency | `parakh-parichay-*` (future) | — |
| Finding Validity | `parakh-manthan-*` (future) | — |
| Portrait Grounding | `parakh-darpan-*` (future) | — |
| Staleness Detection | cross-cutting (delta-churn) | spans steps |

**Open design question (Step 2):** how to reconcile the public demo's one-card-per-step
picture with Parakh's family-per-step reality. Options: (A) replace the single
"Ingestion Recall" card with the three Sangrah cards — honest but asymmetric; (B)
reframe the section around **Parakh — the assay layer**, name the family, and show
Sangrah's three as the built exemplar; (C) light touch — introduce the name "Parakh"
and note the three lenses. Leaning (B). To be decided before editing the public file.

---

## Current state (2026-07-01)

- **Phases 0–1 built** — `parakh-sangrah-structure` runs read-only via `npm run parakh sangrah`.
- **First run was on stale staging** — the `sangrah-staging.json` on disk was already
  merged into inventory, so the duplicate check lit up on nearly everything (correct
  behavior, misleading dataset). Verified three dups against real inventory: not false
  positives. In the real workflow Parakh runs on *fresh* staging *before* merge.
- **Proposal path unexercised** — every finding on the stale data came out a flag; the
  ISBN/year *proposal* machinery is built but untested on real data.
- **Next:** build a small synthetic staging fixture (one bad-checksum ISBN, one
  derivable isbn13-from-isbn10, one future year, one genuine fresh dup, one clean entry)
  to exercise the proposal path — it doubles as the regression test for Phase 2 apply —
  then build `parakh-apply`.
