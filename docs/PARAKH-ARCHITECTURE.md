# Parakh Architecture — the QC layer across the whole engine

**Living document.** This is the canonical map of Parakh across all five steps: the
archetypes, the matrix, the per-step checkers, the power-engine splits, and the
prioritization. It records *where we are* and is updated as decisions land. The
**Decision Log** at the bottom is append-only.

- **Mechanics** (the propose → review → apply rail, the report schema, the naming rule):
  `PARAKH-DESIGN-REFERENCE.md`.
- **Placement in the engine** (one paragraph): the *Parakh — the assay layer* section of
  `ANTILIBRARY-ENGINE-SPEC.md`.
- **This doc**: the architecture — what checkers exist across the engine, why, and in what order.

Status legend: ✅ built · ◐ planned (roadmapped) · ○ designed, not scheduled · ★ critical · — not needed.

---

## 1. The core idea — Parakh is a matrix, not a list

Splitting Sangrah into `structure / recall / plausibility` did not produce three
Sangrah-specific checks. It produced three **QC archetypes** that recur at every step.
Parakh is therefore **archetypes × steps** — one pattern, applied where the risk lives.

### The archetypes

| Archetype | The question it asks | Cost | LLM? |
|---|---|---|---|
| **Structure** | Is the output well-formed? (schema, refs, ranges, controlled vocab, unique IDs) | cheap | no |
| **Recall / coverage** | Did we capture *everything* we should have from the source? | med | needs source |
| **Fidelity / grounding** | Is each produced item *true to its source* — not invented, not reversed? | high | yes |
| **Consistency / drift** | Is it consistent *across the corpus* and over time? | med | embeddings + LLM |
| **Staleness** | Did an upstream change invalidate it? | cheap | no |
| **Leakage** | Did anything private cross into the public layer? | cheap | rules |

The first three are the spine (they are literally the Sangrah three). The last three are
cross-cutting.

### Two laws that decide where QC matters

**Law 1 — the risk profile shifts down the pipeline.** Early steps (Sangrah,
Parichay-classify) are about *data correctness* → **structure / recall** dominate. The
generative steps (Parichay-**decompose**, Manthan, Darshan) invent claims from thin or no
source → **fidelity / grounding** dominates. The public edge (Pradarshan) is about the
*privacy membrane* → **leakage**. Do not spread QC evenly; weight it where the failure lives.

**Law 2 — errors compound, so grounding must be caught at birth.** A hallucinated atomic
unit → a false Manthan finding → a false portrait assertion → a public falsehood on the
site. The same error grows more expensive and less visible each step it travels. The
grounding check belongs at the step that *creates* the claim, never at the window. This is
the core justification for the propose → review → apply rail at every generative step.

---

## 2. The matrix — steps × archetypes

Each cell names the checker (`parakh-<step>-<lens>`) and its status. `★` marks the
grounding spine — the checks that stop hallucination from compounding.

| Step | Structure | Recall / coverage | Fidelity / grounding | Consistency | Staleness | Leakage |
|---|---|---|---|---|---|---|
| **Sangrah** (collect) | `structure` ✅ | `recall` ◐ | `plausibility` ◐ | — | — | — |
| **Parichay** (classify) | `structure` ○ | `coverage` ○ (low) | ★ `fidelity` ○ | `consistency` ○ | — | — |
| **Manthan** (churn) | `structure` ○ | `coverage` ○ | ★ `validity` ○ | `novelty` ○ | `staleness` ○ →delta | — |
| **Darpan** (curate) | `stats` + `pull` ○ | — | ★ `grounding` ○ | — | — | `private-flag` ○ |
| **Pradarshan** (visualize) | `integrity` ○ | `fidelity-to-pull` ○ | — | — | — | ★ `leakage` ○ |

Notes on fuzzy cells: Sangrah's `plausibility` *is* the fidelity archetype (is this the
right book?). Pradarshan's `fidelity-to-pull` is a match/coverage check (does the bundle
equal the pull?), not grounding. Darpan's structure splits across two deterministic checks
(stats recomputation + pull-reference integrity). The framework bends at the edges; it
still earns its keep as a map.

---

## 3. Per step — power engine + checkers

### Sangrah / Collect — the reference implementation
Power engine: extract → enrich → match → dedupe (four sub-components, already split in code).
Checkers (see `PARAKH-DESIGN-REFERENCE.md` for the full build):
- `parakh-sangrah-structure` ✅ — ISBN checksums, dups, missing fields, year sanity, enrichment triage.
- `parakh-sangrah-recall` ◐ — 2nd vision pass; the ~25% ingestion miss.
- `parakh-sangrah-plausibility` ◐ — wrong-book enrichment; fix by re-lookup, never invented metadata.

### Parichay / Classify
**Power split (recommended):** Parichay bundles two engines with *different risk profiles* —
**Classify** (taxonomy — factual, drift-prone) and **Decompose** (atomic units — generative,
hallucination-prone). Make the split explicit; their QC differs.
- `parakh-parichay-structure` ○ — vocab validity (register/form/density ∈ allowed set),
  `category ∈ categories`, unit-count-in-range-for-form, slug uniqueness, subject-slug consistency.
- `parakh-parichay-consistency` ○ — the demo's *Classification Consistency*: same concept
  typed the same way across similar books; register/form calibrated to neighbours (drift).
- **★ `parakh-parichay-fidelity`** ○ — are the atomic units actually supported by the book,
  or invented from a thin blurb/ToC? **The first place hallucination enters the pipeline.**
- (`coverage` ○ low — did we get the *key* ideas? Units are "raw material"; some miss is tolerable.)

### Manthan / Churn
**Power split (needed — HIGH backlog):** **distribution lenses** (metadata recount —
deterministic, delta-cheap) vs **relational lenses** (LLM over atomic units — expensive,
need pre-filtered neighbour pairs). This split *is* the delta-pass; full re-churn does not scale.
- **★ `parakh-manthan-validity`** ○ — the demo's *Finding Validity*: for each finding, do the
  cited books actually support it — present, not reversed? **The most publicly visible failure.**
- `parakh-manthan-structure` ○ — findings reference real book IDs, strengths in range, no
  orphan refs in clusters/threads, lens tags valid.
- `parakh-manthan-novelty` ○ — findings distinct, not restating one another (dedup).
- `parakh-manthan-staleness` ○ — after new books, which findings' evidence changed → mark
  stale → fire the delta-pass. (Really a **Taal** trigger in a checker's coat.)

### Darpan / Curate
Power engine: two components — **Lekha-Jokha** (deterministic stats) + **Darshan** (LLM
interpretive portrait). The pull is human. QC here is more advisory (Darshan is human-gated).
- **★ `parakh-darpan-grounding`** ○ — the demo's *Portrait Grounding*, **the last gate before
  public**: every Darshan assertion traces to a specific Manthan finding; no citation = flagged
  before it can be pulled.
- `parakh-darpan-stats` ○ — recompute Lekha-Jokha from canonical data and diff (verify the
  derived view is honest).
- `parakh-darpan-pull` ○ — the pull references only real findings/books; headline overrides
  map to real findings.

### Pradarshan / Visualize
Power engine: build + render (a generator + a client; reads, never computes).
- **★ `parakh-pradarshan-leakage`** ○ — does the public bundle expose anything *not* pulled —
  held-back/private items, unpublished ideas? The private → public membrane; the one genuinely
  new concern at this step.
- `parakh-pradarshan-fidelity-to-pull` ○ — the bundle equals the pull config (nothing shown
  that wasn't selected; nothing selected that's missing).
- `parakh-pradarshan-integrity` ○ — all refs resolve, covers load, build is green (the deploy
  rule, formalized).

---

## 4. The reusable grounding assay

The three ★ generative-step checkers — **Parichay-fidelity, Manthan-validity,
Darpan-grounding** — are *the same check*: **"does claim X trace to evidence Y?"** They differ
only in binding:

| Checker | Claim (X) | Evidence (Y) |
|---|---|---|
| `parakh-parichay-fidelity` | an atomic unit | the book (ToC / description / Wikipedia) |
| `parakh-manthan-validity` | a finding | the cited books' units |
| `parakh-darpan-grounding` | a portrait assertion | a Manthan finding |

Build **one grounding assay**, parameterized per step — not three bespoke agents. This is the
single highest-leverage piece of the whole QC layer.

---

## 5. Power engines (non-QC) — splits & gaps

Parakh checks the work; these *do* the work. Gaps surfaced by this evaluation:
1. **Manthan delta-pass** ◐ — the distribution/relational split. Overdue (HIGH backlog); full re-churn doesn't scale.
2. **Merge / promote engine** ○ — staging → canonical inventory is currently manual. `parakh-apply` (Phase 2) is its seed; name the gate explicitly.
3. **Parichay classify / decompose** ○ — declare as two engines (cheap conceptual split, big QC clarity).
4. **Khoj / Gaps** — already the acquisition loop outside the five steps; correctly located, not yet built.

---

## 6. Cross-cutting layers (beside the five steps)

- **Parakh (परख)** — quality / assay. *Is the output sound?* (this doc).
- **Taal (ताल)** — cadence / trigger. *When does each agent run?* Staleness/delta triggers live here.
- **The merge gate** — the staging → canonical membrane, formalized by `parakh-apply`.
- **The leakage membrane** — the private (Darpan) → public (Pradarshan) one-way boundary, guarded by `parakh-pradarshan-leakage`.

---

## 7. Prioritization — what to build, what to defer

**The matrix has ~16 cells. Do not build the cathedral.** (Standing risk: beautiful structure
ahead of validated substance.) The build that matters is small:

- **Tier 1 — the grounding spine.** Sangrah-`recall` (Phase 4) + the *one reusable grounding
  assay* applied at Parichay-decompose, Manthan, Darpan. **This is the real work.**
- **Tier 2 — the deterministic validators.** One pattern (the Sangrah `structure` checker we
  already wrote), cloned across every step. Near-free, high safety-per-dollar.
- **Tier 3 — the leakage membrane** at Pradarshan, before anything sensitive is ever pulled public.
- **Defer** everything interpretive (consistency/drift, novelty, representativeness) until the spine is proven.

Roughly **five real things**, not sixteen. The **Manthan delta-pass** is the one overdue
power-engine split to sequence alongside.

**Open sequencing decision (pending):** after Sangrah's Phase 2 (`parakh-apply`), go **wide**
(clone deterministic `structure` checkers across all steps — broad cheap safety) or **deep**
(build the reusable grounding assay, prove it on Parichay-decompose — the highest hallucination
risk)? Current lean: **deep** — grounding is where the real failures are and the harder thing
to get right; prove it early. Not yet decided.

---

## 8. Current state (2026-07-01)

- **Built:** `parakh-sangrah-structure` (Phase 0–1). Everything else in the matrix is designed, not built.
- **Next concrete step:** Sangrah Phase 2 — synthetic fixture → `parakh-apply`.
- **Then:** the wide-vs-deep decision above sets the direction across the other four steps.

---

## 9. Decision Log (append-only)

- **2026-07-01** — Parakh named (परख, the assay); a **family** of checkers `parakh-<step>-<lens>`, no `qc-` prefix.
- **2026-07-01** — The **propose → review → apply rail**; read-only detectors; human-review-first; auto-fix as a later per-check graduation.
- **2026-07-01** — Sangrah splits into **three** checkers (structure/recall/plausibility). Public demo shows the asymmetry honestly (option A).
- **2026-07-01** — Trigger/cadence layer named **Taal (ताल)**; the timing counterpart to Parakh.
- **2026-07-01** — **Reframed Parakh as archetypes × steps** (this document). Identified the reusable grounding assay and the prioritization tiers. Wide-vs-deep sequencing left open.
