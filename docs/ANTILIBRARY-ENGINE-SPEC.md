# Antilibrary Engine — Product Specification

---

## What it is

Manthan is an analytical engine that takes any book inventory and surfaces its intellectual structure — threads, clusters, patterns, and a reveal of what the collection says about how the person thinks.

It is named after Samudra Manthan — the Hindu myth of churning the cosmic ocean until treasures rise to the surface. The method works the same way: multiple lenses, diverse starting points, random probes, human priming. Not a single-peak climb (Mount Fuji) but an Adirondacks search — many peaks of unknown relative height, requiring random jumps to find terrain that systematic search misses.

---

## What it is not

- It is not a reading list generator (that is the Curator — a separate product)
- It is not a catalogue or search tool (that is the Library App)
- It is not a recommendation engine
- It does not tell you what to read next — that is Khoj (Gaps), which is human-driven, not engine-driven

---

## The four steps

| # | English | Hindi | What it does |
|---|---|---|---|
| 1 | **Collect** | **Sangrah** | Parse raw input → structured inventory → enriched with covers and metadata |
| 2 | **Classify** | **Parichay** | Dimension every book across multiple axes; decompose into atomic ideas |
| 3 | **Churn** | **Manthan** | Run lenses across the classified inventory; surface threads, clusters, patterns |
| 4 | **Curate** | **Darshan** | Decide what the library shows the world — the editorial layer before visualization |

**Naming convention:** every module carries its name in English and Hindi. If a third language becomes relevant for a specific library, it slots in as a third column.

**Visualization** is not a step — it is the output of Darshan, rendered.

**Gaps / Khoj** sits outside the four steps — the forward-looking loop that feeds back into Sangrah. Reactive gaps can be engine-surfaced; proactive gaps require human intention.

Threads (Sutra) and Clusters (Samuha) are the two output forms that Manthan produces — they are not separate steps, they are what the churn crystallizes into.

---

## Agent architecture

Each step is an agent with a defined trigger, input, and output. They run sequentially but independently — a book can be in Parichay while the next book is entering Sangrah.

| Agent | Trigger | Input | Output |
|---|---|---|---|
| Sangrah | New file uploaded | CSV / images / JSON / chat | `inventory.json` (raw + enriched) |
| Parichay | Per new book in inventory | `inventory.json` entry | `inventory.json` (classified) + `ideas.json` |
| Manthan | N new books classified (batch threshold) | Full classified inventory | `analysis.json` |
| Darshan | Human decision | `analysis.json` + human editorial intent | Curated data structure for visualization |

**Why Manthan runs on a threshold, not per book:** Manthan is a collection-level operation. It needs enough new material to find patterns that weren't visible before. Running it on every new book is expensive and produces noise. A threshold of 10–20 new classified books is a reasonable default.

**Darshan is the only agent that cannot run autonomously.** It requires human intent — what to show, to whom, in what order. It can be assisted by the engine (surfacing options, flagging candidates) but the decision is always human.

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

### Classification schema

Every book receives these dimensions during Parichay:

| Field | Values | Notes |
|---|---|---|
| `year` | integer | Year of original composition |
| `author_origin` | country string | Where the author is from |
| `author_tradition` | free string | Intellectual lineage of the author |
| `register` | empirical / systems / humanist / philosophical / contemplative | Position on empirical–spiritual axis |
| `density` | accessible / substantive / dense | How demanding the book is to read |
| `form` | argument / narrative / portrait / manual / meditation / reference / anthology | What kind of object it is |
| `lineage` | founder name or null | Whose ideas this book most directly descends from |
| `category` | primary domain string | Main subject area (BISAC-aligned) |
| `categories` | array of strings | All domains touched |
| `topic` | precise string | Specific argument — not "science" but "Epicurean atomism and ancient natural philosophy" |
| `subtopics` | array of strings | Secondary concerns |

### Lego blocks — atomic ideas

Every book is decomposed into 3–7 atomic, transferable ideas during Parichay. These are stored in `ideas.json`.

**How many:**
- Manual / reference → 3 blocks (tools, not arguments)
- Narrative / portrait → 4 blocks
- Argument / meditation → 5–7 blocks (the denser the argument, the more blocks)

**What a block is:**
- A transferable unit — it can be lifted from its source book and placed next to ideas from completely different books
- Exact mechanism, no decoration. Not "this book argues that thinking is hard" but "System 1 processes are fast, automatic, and error-prone in predictable ways under cognitive load"
- 1–2 sentences maximum

**What blocks are for:** they are the seed material for Manthan's deep probe — finding resonance between books at the idea level, not the metadata level.

Blocks are stored in `ideas.json` as `{ "Book Title": [ { "title": "Short name", "gloss": "1-2 sentence mechanism" } ] }`.

---

## Step 3 — Churn / Manthan

### The seven lenses

The Churn module runs multiple lenses across the classified inventory. Each lens is a different question asked of the same dataset:

**Depth lens** — what are the intellectual strata? Identify: primary texts, serious scholarship, substantive synthesis, popular nonfiction. Look for depth in unexpected areas.

**Tension pairs** — which books argue directly against each other? These pairs are the most productive analytical nodes. Surface the disagreements the collection holds.

**Founding figures** — whose ideas does this library orbit? Look for lineage convergence: many books descending from the same ancestor reveal a center of intellectual gravity.

**Register distribution** — where on the empirical–spiritual axis does the collection concentrate? Where is it thin? The shape of the distribution is itself revealing.

**Era concentration** — which decades dominate? What does that reveal about when this person's thinking was formed?

**Hidden collections** — what unexpected depth emerges in an area that didn't announce itself? The hidden collection is often the most personally significant.

**Tradition mapping** — which author traditions are well-represented? Which are absent? Absence is as revealing as presence.

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

## Step 4 — Curate / Darshan

Darshan is the editorial layer. Manthan produces everything that could be shown. Darshan decides what is shown, to whom, and in what order.

A museum director does not hang every work in the collection. Darshan is that decision.

**What Darshan does:**
- Selects which threads and clusters to surface in the UI
- Decides the narrative order (what the visitor sees first)
- Flags what is private vs. public (some threads may be too personal to show)
- Shapes the reveal — how much is visible at once vs. progressively disclosed

**What Darshan does not do:**
- It does not modify the underlying data. `inventory.json` and `analysis.json` remain unchanged.
- It does not generate new analysis. That is Manthan's job.

**Output:** a curation layer — a lightweight config or set of flags — that the visualization reads. The visualization itself is a separate rendering concern.

---

## Gaps / Khoj — the acquisition loop

Gaps sit outside the four steps. They are the forward-looking signal that feeds back into Sangrah.

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
    ↓ Sangrah
inventory.json (enriched)
    ↓ Parichay
inventory.json (classified) + ideas.json
    ↓ Manthan
analysis.json
    ↓ Darshan
Visualization layer (reads inventory + analysis + curation config)
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
| 5. Repo reorganized | ✅ Done | `libraries/bk/` data layer, `docs/` spec folder |
| 6. Build Sangrah agent | ⬅ Next | Parse → enrich → quality gate → `inventory.json` |
| 7. Build Parichay agent | Pending | Classify → Lego blocks → `ideas.json` |
| 8. Build Manthan agent | Pending | 7 lenses + random probe + priming interface → `analysis.json` |
| 9. Build Darshan layer | Pending | Editorial config for visualization |
| 10. Visualization layer | Pending | Piles view, constellation improvements |
| 11. Khoj / Gaps interface | Pending | Dialogue-based acquisition loop |

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
- **Darshan is editorial, not generative.** It shapes what Manthan produced. It does not produce new analysis.
