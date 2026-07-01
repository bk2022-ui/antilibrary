# Antilibrary Engine — Product Specification

---

## What it is

The Antilibrary Engine takes any book inventory and surfaces its intellectual structure — threads, clusters, patterns, and a reveal of what the collection says about how the person thinks. Then it puts that structure in front of the world.

Five steps. Five agents. Each named in English and Hindi. The Hindi names are not translations — they carry their own meaning, rooted in Sanskrit, that deepens what the English word points at.

---

## What it is not

- It is not a reading list generator (that is the Curator — a separate product)
- It is not a catalogue or search tool (that is the Library App)
- It is not a recommendation engine
- It does not tell you what to read next — that is Khoj (Gaps), which is human-driven, not engine-driven

---

## The five steps

| # | English | Hindi | What it does |
|---|---|---|---|
| 1 | **Collect** | **Sangrah** | Parse raw input → structured, enriched inventory |
| 2 | **Classify** | **Parichay** | Dimension every book; decompose into atomic ideas |
| 3 | **Churn** | **Manthan** | Run lenses across the inventory; surface threads, clusters, patterns |
| 4 | **Curate** | **Darpan** | The mirror — the curator knows everything (numbers + meaning), then pulls forward |
| 5 | **Visualize** | **Pradarshan** | Show the curated pull to the world |

**The engine vs. the views.** Steps 1–3 (Sangrah, Parichay, Manthan) are the **engine** — they produce data. Step 4 (Darpan) is the **mirror** — an internal-facing view where the curator sees themselves. Step 5 (Pradarshan) is the **window** — the external-facing view shown to the world.

**Step 4 — Curate / Darpan (दर्पण), the mirror.** Darpan means *mirror* — you only see yourself in it. It is internal-facing: the curator's complete self-knowledge, across two layers:
- **Lekha-Jokha (लेखा-जोखा)** — *the numbers.* Accounting / stock-taking. Non-negotiable, objective statistics: book counts, atomic units, distributions, enrichment coverage, pipeline state, trends over time. Pure derived stats.
- **Darshan (दर्शन)** — *the meaning.* Seeing, for yourself. The interpretive layer: Manthan's findings understood — the portrait, threads, tensions, the reveal.

**Curation is the pull.** Knowing everything in Darpan, the curator selects a subset and pulls it forward to Pradarshan. Curate is not a separate verb — it *is* Darpan plus the act of pulling. The curator knows all that is there, then knows what to pull.

**The etymology of Steps 4 and 5:** Darpan (दर्पण) is the mirror — you see yourself; Darshan (दर्शन) within it means to *see for yourself* (the interpretive half), Lekha-Jokha (लेखा-जोखा) is the stock-taking (the statistical half). Pradarshan (प्रदर्शन) means to show to others — pra (forth) + darshan. You cannot show to others without first seeing yourself in the mirror. The progression: count yourself → understand yourself → show yourself.

**Naming convention:** every step carries its name in English and Hindi. If a third language becomes relevant for a specific library, it slots in as a third column. English for clarity, Hindi for identity.

**Gaps / Khoj** sits outside the five steps — the forward-looking loop that feeds back into Sangrah. Reactive gaps can be engine-surfaced; proactive gaps require human intention.

**Threads / Sutra** and **Clusters / Samuha** are the two output forms that Manthan produces — they are not separate steps, they are what the churn crystallizes into.

---

## Agent architecture

Each step is an agent with a defined trigger, input, and output. They run sequentially but independently — a book can be in Parichay while the next book is entering Sangrah.

| Agent | Trigger | Input | Output |
|---|---|---|---|
| Sangrah | New file uploaded | CSV / images / JSON / chat | `inventory.json` (raw + enriched) |
| Parichay | Per new book in inventory | `inventory.json` entry | `inventory.json` (classified) + `ideas.json` |
| Manthan | N new books classified (batch threshold) | Full classified inventory | `analysis.json` |
| Darshan | Human decision | `analysis.json` + human editorial intent | Curation config for Pradarshan |

**Why Manthan runs on a threshold, not per book:** Manthan is a collection-level operation. It needs enough new material to find patterns that weren't visible before. Running it on every new book is expensive and produces noise. A threshold of 10–20 new classified books is a reasonable default.

**Darshan is the only agent that cannot run autonomously.** It requires human intent — what to show, to whom, in what order. It can be assisted by the engine (surfacing options, flagging candidates) but the decision is always human.

**Taal (ताल) — the cadence layer.** The Trigger column above is a layer in its own right, and its name is **Taal** — *rhythm.* It governs *when* each agent fires: nightly, per-book, on a batch threshold, on-render, on-call. Taal is the timing counterpart to **Parakh** (the assay layer): Parakh governs whether output is sound, Taal governs the beat at which each agent runs. The two are the engine's cross-cutting layers — quality and cadence — beside the five steps. Taal is currently *descriptive* (the cadences are fixed per agent); a real scheduler/orchestrator would make it concrete. Named on the public engine demo alongside Parakh.

---

## Quality gate: confidence and canonicalization

Two issues that must be resolved in Sangrah before Parichay runs:

### Confidence
Some entries arrive with uncertain data — spine photographs that couldn't be read clearly, author names that couldn't be matched, years that are estimates. These are flagged with `"confidence": "low"` in inventory.json and held back from Parichay until a human confirms or corrects them. Low-confidence entries are visible in the UI as a review queue.

### Canonicalization: multiple editions
Three copies of Lucretius, two translations of Aesop, a Kindle and a physical edition of the same book — these are not duplicates. Each is a distinct entry. The rule:

- Same text, different edition → sibling entries, not merged. Each carries its own `form`, `year` (of this edition), and physical/digital note.
- Same edition, accidentally entered twice → deduplicate, keep one, log the merge.
- Siblings are linked by a `canonical_id` field pointing to the original text's first entry.

The arrangement of editions is itself data. Do not flatten it.

---

## Parakh — the assay layer (agents checking agents)

**Parakh (परख)** is the quality layer that assays the output of the engine steps. It is
**not a sixth step** — the five step names are locked. It is cross-cutting infrastructure
and the concrete realisation of the public demo's *"Agents Checking Agents."*

*Parakh* is the assayer's word — to test whether something is genuine and sound. It is a
**family** of sibling checkers, one or more per step, named `parakh-<step>-<lens>`
(e.g. `parakh-sangrah-structure`). Every checker emits the same report shape and rides
the same rail:

> **detect (read-only) → human review → apply (accepted fixes only)**

Detection and application are separate. A checker mutates nothing; it writes proposals
and flags to `parakh-report.json`. A separate apply step commits only what a human
accepts. "Auto-fix" is a later, per-check graduation (flip the approval default), not a
rewrite. Findings are either **proposals** (deterministic `before → after`, accept/reject)
or **flags** (need eyes, no safe auto-fix).

**Sangrah has three checkers** (the three leaks in its output, in build order):

| Checker | Lens | Ground truth | State |
|---|---|---|---|
| `parakh-sangrah-structure` | ISBN checksums, dups, missing fields, year sanity, enrichment triage | the data | ✅ built |
| `parakh-sangrah-recall` | the ~25% ingestion miss (2nd vision pass) | the source photos | planned |
| `parakh-sangrah-plausibility` | wrong-book enrichment; fix by re-lookup, never invented metadata | world-knowledge | planned |

Full design, the report schema, the phased roadmap, the silent-drop/match-provenance
dependency, and the mapping to the demo's five QA cards: **`docs/PARAKH-DESIGN-REFERENCE.md`.**

---

## Step 1 — Collect / Sangrah

### Accepted input formats
- JSON (native — `inventory.json`)
- CSV (Goodreads export, Storygraph, custom)
- Conversation (person describes their library verbally)
- Photographs (shelf images — agent reads spines, builds inventory)

### What Sangrah produces per book
- `title`, `author`, `year` — parsed from input
- `status` — read / antilibrary / to-buy / misplaced
- `coverUrl` — fetched from Open Library Cover API or Google Books
- `isbn`, `description` — fetched from Google Books API
- `confidence` — high / low (low triggers review queue)
- `canonical_id` — links sibling editions to the same source text

### What Sangrah does not do
- It does not classify. No categories, no register, no density assigned here.
- It does not judge. Every book that can be parsed enters the inventory. Curation happens in Darshan, not Sangrah.

---

## Step 2 — Classify / Parichay

Parichay does two things — classify, then decompose. Nothing else. It does not connect ideas across books, form abstractions, or identify tensions. That is Manthan's job.

### Enrichment (before either pass)

Before classifying or decomposing, Parichay fetches three sources to give Claude enough material to work with:

1. **Description** — from Google Books / Open Library (passed through from Sangrah staging)
2. **Table of contents** — from Google Books API when available (chapter titles are the book's own decomposition — richer than any blurb)
3. **Wikipedia summary** — Wikipedia REST API, free, strong coverage for notable books

All three are fed to Claude for both passes. If Wikipedia is unavailable, the entry is flagged `needsReview: true`.

### Pass 1 — Classify the book

Assign every taxonomy field. The book as a whole object.

**Multi-taxonomy:** a book belongs to multiple categories simultaneously. `category` = primary domain, `categories` = every domain touched. No forced exclusivity. "Leading: Lessons from Alex Ferguson" is Business AND Sports — both are true.

**Few-shot consistency:** each classification call selects 6 most-similar books from the existing inventory as examples, so the vocabulary (register, form, density) stays calibrated to established patterns — not generic AI patterns.

| Field | Values | Notes |
|---|---|---|
| `category` | primary domain string | Main subject area — e.g. "Business" |
| `categories` | array of strings | All domains touched — e.g. ["Business", "Sports"] |
| `topic` | precise string | What this book is specifically about — not "leadership" but "long-tenure management and institutional culture-building" |
| `subject` | slug | e.g. "leadership-management" |
| `subtopics` | array of strings | Secondary angles |
| `register` | empirical / systems / humanist / philosophical / contemplative / analytical | Position on empirical–spiritual axis |
| `density` | accessible / substantive / dense | How demanding the book is to read |
| `form` | argument / narrative / portrait / manual / meditation / reference / anthology / journal / essays | What kind of object it is |
| `lineage` | founder name or null | Whose ideas this book most directly descends from |
| `author_origin` | country string | Where the author is from |
| `author_tradition` | free string | Intellectual lineage of the author |

### Pass 2 — Decompose into atomic units

Break the book into 3–7 atomic, transferable units. Stored in `ideas.json`.

**Unit count by form:**
- manual / reference → 3 (tools, not arguments)
- narrative / portrait / anthology / journal → 4
- essays → 5
- argument / meditation → 6

**What a unit is:**
- A transferable idea that can be lifted from the source book and placed next to ideas from completely different books
- Stated as the exact mechanism, no decoration. Not "this book argues leadership is hard" but "culture is transmitted through visible standards, not stated values — what the leader tolerates defines the culture more than what they say"
- 2–3 sentences maximum
- Typed: concept / framework / story / claim / lens
- Tagged with honest, specific labels

**What a unit is not:**
- An abstraction to a universal principle — just state what the idea is
- A comparison to another book
- A connection, tension, or resonance with other works — those are Manthan's output

**Schema:**
```typescript
interface AtomicUnit {
  id: string           // slug: "culture-through-visible-standards-1"
  type: "concept" | "framework" | "story" | "claim" | "lens"
  title: string        // 5–8 word name
  body: string         // 2–3 sentences — exact mechanism
  tags: string[]       // honest labels — not the book title or author name
  sourceBook: string   // title of the book
}
```

Units are stored in `ideas.json` as `{ "Book Title": [ AtomicUnit, ... ] }`. Parichay merges new entries with any existing `ideas.json`; it does not overwrite.

### What Parichay does not do

- Does not connect ideas across books — no cross-references, tensions, or resonances
- Does not abstract to universal principles — units are stated at face value
- Does not filter books — every entry that passes Sangrah gets classified. Curation is Darshan's job.
- Does not modify `inventory.json` directly — writes `parichay-staging.json` for human review first

---

## Step 3 — Churn / Manthan

### How to work with Manthan

Manthan has two modes of use: **running it** and **talking to it**. They are different things.

**Running it** means triggering the agent — it sweeps the inventory with its lenses, runs the random probe, and produces candidate groupings. You do this when enough new books have been classified (10–20 is a reasonable threshold). You do not need to run it every session.

**Talking to it** means priming — reacting to what it surfaces, correcting it, directing it toward something you suspect is there. This is a conversation, not a form. Every signal you give is recorded in `priming_log` inside `analysis.json`. The log is the audit trail of how your understanding of your own library evolved over time.

**Before each Manthan session**, the agent reads the existing `priming_log` and briefs you: what groupings were found last time, what you accepted, what you rejected, what you said was wrong. You start each session knowing where you left off — you do not need to remember.

**To update Manthan's structure** (add a lens, change the probe algorithm, change the output schema) — that is a design decision. Update `docs/ANTILIBRARY-ENGINE-SPEC.md` and `SESSION-LOG.md`. The spec is the single source of truth for how Manthan works; the priming log is the source of truth for what it found.

**The two things you never need to do:**
- Re-explain your library to Manthan — it reads `inventory.json`, `ideas.json`, and the priming log
- Re-run all seven lenses when you only want to update one finding — each lens is independent and can be re-run selectively

### The three stages

**Stage 1 — Systematic sweep**
Run all seven lenses across the full inventory and `ideas.json`. The four distribution lenses run on metadata alone (fast). The three relational lenses run on atomic units and `seeAlso` data. Together they map the obvious peaks.

**Stage 2 — Random probe**
Select edge books — books not yet in any grouping, or books at the boundary of known groups — as seeds. Find what else in the library resonates with them at the atomic unit level. This finds the peaks the systematic lenses miss. The random element is essential: without it, Manthan converges on the same peaks every time.

**Stage 3 — Human priming loop**
Surface one candidate grouping at a time. The human reacts. The engine adjusts and surfaces the next. The loop continues until the human stops or is satisfied. Every priming signal is dated and recorded.

### The seven lenses

**Distribution lenses** — run on metadata alone, no atomic units needed:

**1. Depth** — what are the intellectual strata? Identify: primary texts, serious scholarship, substantive synthesis, popular nonfiction. Look for depth in unexpected areas and surprising shallowness in expected ones.

**2. Register** — where on the empirical → contemplative axis does the collection concentrate? Where is it thin? The shape of the distribution is itself revealing.

**3. Era** — which decades dominate? What does that reveal about when this person's thinking was formed?

**4. Tradition** — which author traditions are well-represented? Which are entirely absent? Absence is as revealing as presence.

**Relational lenses** — require atomic units and `seeAlso` from `ideas.json`:

**5. Tension pairs** — which books argue directly against each other? Found by atomic unit tag overlap combined with opposing claim types. These pairs are the most productive analytical nodes — they are where the library holds a live debate.

**6. Founding figures** — whose ideas does this library orbit? Found by `lineage` field convergence across books and cross-referencing `seeAlso` links. Many books descending from the same ancestor reveal a center of intellectual gravity the owner may not have consciously assembled.

**7. Hidden collections** — what unexpected depth emerges in an area that didn't announce itself? Found by clustering `seeAlso` links across books — when many books point to the same concept or figure outside the library, that's a hidden collection waiting to be named.

### The random probe

Systematic lenses find the obvious peaks. The random probe finds the hidden ones.

**Algorithm:**
1. Select a book from the inventory — weighted toward books not yet in any thread or cluster, or books at the edge of known groups
2. Run either:
   - **Shallow probe** — use the book's existing dimensions (register, lineage, subtopics, tradition). Find what else in the inventory shares these coordinates. Surface the candidate grouping.
   - **Deep probe** — extract a key argument from the book's Lego blocks. Use that as the seed. Find what else resonates with this specific idea, regardless of metadata.
3. Present the surfaced grouping as a candidate thread or cluster
4. Invite human priming response

The random element is essential. It prevents the engine from converging on the same peaks every time.

**Theoretical basis:** Algorithms to Live By (Christian & Griffiths) — explore/exploit tradeoff. Scott Page (The Model Thinker) — cognitive diversity produces better outcomes than deeper search from the same vantage point.

### The priming interface

Manthan without human priming produces shallow results. Priming is not optional — it is the mechanism by which the hidden collection surfaces.

**Priming inputs:**
- A statement ("I think I have a lot of books on creativity")
- A reaction ("that thread feels wrong")
- A correction ("Mukherjee doesn't belong there — his books argue nothing about India")
- A question ("what do I have on cities?")

Every priming signal is recorded in `priming_log` within `analysis.json` with a date and session note. The log is the audit trail of how the analysis evolved.

**The priming interface is a dialogue, not a form.** The engine surfaces a candidate; the human responds; the engine adjusts and surfaces another. The loop runs until the human is satisfied or stops.

---

## Step 4 — Curate / Darpan (दर्पण), the mirror

Darpan means *mirror*. You only see yourself in it. It is the **internal-facing** view — the curator's complete self-knowledge of the library, assembled from everything the engine (Sangrah → Parichay → Manthan) produced. Nothing here is shown to the world yet; this is the curator beholding the whole, privately.

Curation is not a separate act bolted onto the end. **Curate = Darpan.** The curator knows everything that is there — the numbers *and* the meaning — and from that complete knowledge knows what to pull forward. The pull is the bridge to Pradarshan.

Darpan has two layers.

### Layer 1 — Lekha-Jokha (लेखा-जोखा) — the numbers

Lekha-Jokha means *accounting / stock-taking*. The objective, statistical layer. Non-negotiable: it is always present, always current, never interpreted. It is the operator's instrument panel.

**What it shows:**
- **Inventory** — total books; by status (read / antilibrary / to-buy / misplaced); register, form, density, category distributions
- **Atomic units** — total, average per book, by type
- **Enrichment coverage** — % with cover, year, Wikipedia, seeAlso (the data-quality picture)
- **Manthan** — findings by type and lens, strength distribution, probe candidates
- **Pipeline state** — what sits in staging awaiting review; last-run dates; estimated ingestion miss rate
- **Trend over time** — how all of the above move run to run (the ledger)

**House method:** Lekha-Jokha is a *derived view*. A stats generator reads the canonical JSON and emits `darpan-stats.json` (current snapshot) + `darpan-history.json` (the appending ledger). Authored source, derived index — never a new source of truth.

### Layer 2 — Darshan (दर्शन) — the meaning

Darshan means *to see — for yourself*. The interpretive layer. Where Lekha-Jokha counts, Darshan understands: it presents Manthan's findings as a coherent portrait the curator can behold and react to. This is also where **priming** happens — the curator sees a finding, responds, and the understanding sharpens.

**What Darshan does:**
- Presents the full output of Manthan — threads, clusters, patterns, tensions, the reveal — for the curator to understand
- Holds the portrait: the spine of the story, the founding figures, the live debates, the absences
- Surfaces findings for priming; records signals to `priming_log`
- Flags what is private vs. potentially public (some understanding is too personal to show)

**What Darpan does not do:**
- It does not modify the underlying data. `inventory.json` and `manthan-analysis.json` remain unchanged.
- It does not generate new analysis. That is Manthan's job.
- It does not show anything to the world. That is Pradarshan.

### The pull — Darpan → Pradarshan

Curation completes when the curator, knowing everything in the mirror, selects a subset to show. The selection is recorded as a config that Pradarshan reads and renders. This pull is the only bridge from internal to external.

**Output:** `darpan-stats.json` + `darpan-history.json` (Lekha-Jokha), and a selection config (the pull) for Pradarshan.

**Trigger:** Lekha-Jokha regenerates automatically after any engine run. Darshan and the pull are human — the curator's, always.

---

## Step 5 — Visualize / Pradarshan

Pradarshan (प्रदर्शन) means to show to others — pra (forth) + darshan (seeing). Darpan was the private mirror; Pradarshan is the public window. What the curator beheld in the mirror and chose to pull forward now goes in front of the world.

This is the web layer — the pages, views, and interactions that a visitor experiences. It reads from `inventory.json`, `manthan-analysis.json`, and the selection config the curator pulled from Darpan. It renders what was pulled, in the order chosen, at the depth chosen.

**What Pradarshan does:**
- Renders the constellation view — books as stars, threads as constellations
- Renders the piles view — books grouped by cluster, density, or register
- Renders the reveal — founding figures, core tension, hidden collection
- Renders the thread detail — the question, the books, the internal disagreement
- Provides the priming interface — the dialogue surface for human feedback into Manthan

**What Pradarshan does not do:**
- It does not compute. All computation happens in steps 1–4.
- It does not store. All data lives in the JSON files. Pradarshan reads, never writes.
- It does not decide what to show. That is Darshan's job.

**Pradarshan is a client.** It reads the outputs of the four preceding steps and displays them. Any visualization layer — web, mobile, print — that reads the same data files is a valid Pradarshan implementation.

**Trigger:** deployment. Pradarshan is always live; it reflects whatever Darshan has most recently configured.

---

## Gaps / Khoj — the acquisition loop

Gaps sit outside the five steps. They are the forward-looking signal that feeds back into Sangrah.

**Two kinds of gaps:**

**Reactive** — surfaced by Manthan:
- A thread with a missing anchor
- A cluster that keeps pulling toward a book not yet owned
- A tradition entirely absent from the collection
- A thread where all books come from the same side of the argument

**Proactive** — require human intention:
- Given these threads and clusters, what would this person inevitably have missed?
- What is the book that would most disturb the existing structure?
- What conversation could this library not yet have?

Gaps are stored separately from `analysis.json`. They are a conversation, not a dataset. The right interface for Khoj is dialogue.

Two people with identical libraries have different gaps because they are headed somewhere different.

---

## Outputs

### `inventory.json` — the living record

One entry per book. Produced by Sangrah, enriched by Parichay. Never restructured — only extended.

### `ideas.json` — the atomic layer

One entry per book. Produced by Parichay. Format: `{ "Title": [ { "title": "", "gloss": "" } ] }`.

### `analysis.json` — the structured analysis

Produced by Manthan, shaped by priming.

```json
{
  "system": "Antilibrary Engine",
  "version": "string",
  "description": "string",
  "threads": [
    {
      "id": "snake_case_id",
      "name": "Human-readable name",
      "question": "The tension-carrying question at the thread's center",
      "color": "#hexcolor",
      "anchor": "Title of the anchor book",
      "tension": "The internal disagreement — what makes this a debate not a consensus",
      "books": ["title strings matching inventory.json"]
    }
  ],
  "clusters": [
    {
      "id": "snake_case_id",
      "name": "Human-readable name",
      "gravity": "What holds these books together",
      "books": ["title strings"],
      "may_become_thread": true
    }
  ],
  "patterns": [
    {
      "id": "snake_case_id",
      "name": "Pattern name",
      "definition": "Precise one-sentence definition",
      "books": ["title strings"],
      "adversary_pattern": "id of the pattern this one argues against, or null"
    }
  ],
  "reveal": {
    "founding_figures": [
      {
        "name": "string",
        "presence": "How this figure's ideas manifest across the collection"
      }
    ],
    "core_tension": "The central unresolved argument the library holds",
    "hidden_collection": "The unexpected depth that didn't announce itself",
    "era_concentration": "string",
    "register_distribution": {},
    "density_distribution": {},
    "tension_pairs": [
      {
        "book_a": "title",
        "book_b": "title",
        "tension": "The argument between them"
      }
    ],
    "discipline_noted": "Decisions made during priming — connections rejected, threads refined"
  },
  "priming_log": [
    {
      "date": "YYYY-MM-DD",
      "session": "Session description",
      "note": "What happened — what the human corrected, added, or confirmed"
    }
  ]
}
```

---

## Relationship to other products

```
Raw input (CSV / images / chat)
    ↓ Sangrah          ─┐
inventory.json          │
    ↓ Parichay          │  THE ENGINE (produces data)
inventory.json + ideas  │
    ↓ Manthan          ─┘
manthan-analysis.json
    ↓
DARPAN — the mirror (internal, for the curator)  ─┐
  · Lekha-Jokha → darpan-stats.json + history      │  knows everything:
  · Darshan     → portrait, priming                │  numbers + meaning
    ↓ the pull (curator selects a subset)         ─┘
selection config
    ↓
PRADARSHAN — the window (external, for the world)
    ↓ gaps identified
Khoj → feeds back into Sangrah (new acquisitions)
```

---

## Build sequence

| Step | Status | What |
|---|---|---|
| 1. `inventory.json` dimensioned | ✅ Done | 703 books, all fields populated |
| 2. `analysis.json` populated | ✅ Done | 17 threads, 5 clusters, 23 patterns — produced manually |
| 3. `LIBRARY-SYSTEM.md` written | ✅ Done | Method documentation |
| 4. Antilibrary extracted as standalone | ✅ Done | Own repo, own domain |
| 5. Repo reorganized + spec finalized | ✅ Done | `libraries/bk/` data layer, five steps locked, naming fixed |
| 6. Build Sangrah agent | ✅ Done | Parse photos → enrich → quality gate → `sangrah-staging.json` |
| 7. Build Parichay agent | ✅ Done | Enrich (ToC + Wikipedia) → classify → decompose → `parichay-staging.json` + `ideas.json` |
| 8. Build Manthan agent | ✅ Done | 7 lenses + random probe → `manthan-analysis.json`. Ran live on 732 books. Priming interface still pending. |
| 9. Build Darpan — Lekha-Jokha | ⬅ Next | Stats generator → `darpan-stats.json` + `darpan-history.json` + internal dashboard. The non-negotiable numbers. |
| 10. Build Darpan — Darshan | Pending | Interpretive layer — portrait + priming over Manthan findings. |
| 11. Build the pull + Pradarshan | Pending | Selection config (curator pulls a subset) → public visualization. Piles, constellation, reveal. |
| 12. Khoj / Gaps interface | Pending | Dialogue-based acquisition loop feeding back into Sangrah |

---

## Design principles

- **No acronyms.** Names are direct English + direct Hindi.
- **Schema over code.** The analytical output is data, not logic. Any visualization layer can read it.
- **Confidence is explicit.** Low-confidence entries are never silently promoted. They surface for human review.
- **Editions are distinct.** Multiple copies of the same text are siblings, not duplicates. The arrangement is data.
- **Priming is first-class.** The engine without human priming produces shallow results. The priming interface is not optional.
- **Gaps are human.** Khoj cannot be automated. Do not attempt to generate gaps from inventory analysis alone.
- **Books are multi-node.** A book belongs to multiple threads, clusters, and patterns simultaneously. No forced exclusivity.
- **The random probe is essential.** Systematic search finds obvious peaks. The Adirondacks terrain requires random jumps.
- **Darpan is the mirror; Pradarshan is the window.** Darpan is internal — the curator sees themselves (Lekha-Jokha's numbers + Darshan's meaning). Pradarshan is external — a curated subset pulled forward. Mirror before window.
- **Curate = Darpan.** Curation is not a separate step. The curator knows everything in the mirror, then pulls what they want to show. Knowing precedes pulling.
- **Lekha-Jokha is non-negotiable and derived.** The numbers are always present, always current, never interpreted — and always a derived view of the canonical JSON, never a new source of truth.
- **Pradarshan is a client.** It reads, never writes. Any rendering layer that reads the same data files is a valid Pradarshan.
