# Manthan Engine — Product Specification

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

## The six modules

| # | English | Hindi | What it does |
|---|---|---|---|
| 1 | **Collect** | **Sangrah** | Build and maintain the inventory |
| 2 | **Classify** | **Parichay** | Dimension every book across multiple axes |
| 3 | **Churn** | **Manthan** | Run multiple lenses across the classified inventory |
| 4a | **Threads** | **Sutra** | Named intellectual spines with internal tension |
| 4b | **Clusters** | **Samuha** | Groupings with gravity but no defined spine |
| 5 | **Gaps** | **Khoj** | Forward-looking — human-driven, not engine-derived |

The modules are not sequential. They run concurrently and feed each other. Gaps (Khoj) is the only module that cannot be engine-generated — it requires the person's intention about where their library is going.

---

## Inputs

### Primary input: inventory
A flat list of books. Minimum fields: title, author. The engine enriches from there.

Accepted input formats:
- JSON (native — `inventory.json`)
- CSV (Goodreads export, Storygraph, custom)
- Conversation (person describes their library verbally)
- Photographs (shelf images — engine reads spines, builds inventory)

### Secondary input: priming
Human signals that guide the churn. Can be:
- A statement ("I think I have a lot of books on creativity")
- A reaction ("that thread feels wrong")
- A correction ("Mukherjee doesn't belong there")
- A question ("what do I have on cities?")

Priming is recorded in `priming_log` within `analysis.json`.

---

## Classification schema

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
| `category` | primary domain string | Main subject area |
| `categories` | array of strings | All domains touched |
| `topic` | precise string | Specific argument — not "science" but "Epicurean atomism and ancient natural philosophy" |
| `subtopics` | array of strings | Secondary concerns |
| `status` | read / antilibrary / to-buy | Ownership and reading status |

---

## The churn — Manthan lenses

The Churn module runs multiple lenses across the classified inventory. Each lens is a different question asked of the same dataset:

**Depth lens** — what are the intellectual strata? Identify: primary texts, serious scholarship, substantive synthesis, popular nonfiction. Look for depth in unexpected areas.

**Tension pairs** — which books argue directly against each other? These pairs are the most productive analytical nodes. Surface the disagreements the collection holds.

**Founding figures** — whose ideas does this library orbit? Look for lineage convergence: many books descending from the same ancestor reveal a center of intellectual gravity.

**Register distribution** — where on the empirical–spiritual axis does the collection concentrate? Where is it thin? The shape of the distribution is itself revealing.

**Era concentration** — which decades dominate? What does that reveal about when this person's thinking was formed?

**Hidden collections** — what unexpected depth emerges in an area that didn't announce itself? The hidden collection is often the most personally significant.

**Tradition mapping** — which author traditions are well-represented? Which are absent? Absence is as revealing as presence.

---

## The random probe

The Manthan engine is an Adirondacks search. Systematic lenses find the obvious peaks. The random probe finds the hidden ones.

**Algorithm:**
1. Select a book from the inventory — weighted toward books not yet in any thread or cluster, or books at the edge of known groups
2. Run either:
   - **Shallow probe** — use the book's existing dimensions (register, lineage, subtopics, tradition). Find what else in the inventory shares these coordinates. Surface the candidate grouping.
   - **Deep probe** — extract a key argument or concept from the book (using LLM knowledge). Use that as the seed. Find what else resonates with this specific idea, regardless of metadata.
3. Present the surfaced grouping as a candidate thread or cluster
4. Invite human priming response

The random element is essential. It prevents the engine from converging on the same peaks every time. Books that would never be retrieved by systematic search become seeds for new threads.

**Theoretical basis:** Algorithms to Live By (Christian & Griffiths) — explore/exploit tradeoff. When the search space has unknown terrain, random exploration outperforms optimization. Scott Page (The Model Thinker, The Difference) — cognitive diversity produces better outcomes than deeper search from the same vantage point. Each probe is a different model applied to the same inventory.

---

## Outputs

### `analysis.json` — the structured output

```json
{
  "system": "Manthan Library System",
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

## What Gaps (Khoj) is not

Gaps cannot be engine-generated. The engine can surface that a thread is missing an anchor, or that a pattern has only one example. But a genuine gap requires the person's intention — where is this library going?

Two people with identical libraries have different gaps because they are headed somewhere different.

Gaps are stored separately, not in `analysis.json`. They are a conversation, not a dataset. The right interface for Khoj is dialogue — the engine asks, the person answers, the acquisition target is recorded.

---

## Relationship to other products

```
Manthan Engine
    ↓ produces analysis.json
Library App         ← reads inventory.json + analysis.json → visualizes
    ↓ gaps identified
Curator             ← reads gap + reader profile → recommends acquisitions
    ↓ new books
Manthan Engine      ← new inventory → re-runs analysis
```

The loop is complete. Manthan analyses → Library App displays → gaps identified → Curator fills → Manthan re-analyses.

Manthan and the Curator are one platform (separable by design). The Library App is a client. The personal site embeds the Library App.

---

## Build sequence

1. **Now done:** `inventory.json` fully dimensioned (679 books, 4 new fields: register, density, form, lineage)
2. **Now done:** `analysis.json` populated (17 threads, 5 clusters, 23 patterns, full reveal)
3. **Now done:** `LIBRARY-SYSTEM.md` — method documentation
4. **Next:** Separate the engine from the library app codebase (execute in site chat)
5. **After separation:** Build the engine as standalone — the churn module, random probe, priming interface
6. **After engine:** Build the visualization layer — piles view, constellation improvements
7. **After visualization:** Build the Curator integration

---

## Design principles

- **No acronyms.** Names are direct English + direct Hindi.
- **Schema over code.** The analytical output is data (`analysis.json`), not logic. Any visualization layer can read it.
- **Priming is first-class.** The engine without human priming produces shallow results. The priming interface is not optional — it is the mechanism by which the hidden collection surfaces.
- **Gaps are human.** Khoj cannot be automated. Do not attempt to generate gaps from inventory analysis alone.
- **Books are multi-node.** A book belongs to multiple threads, multiple clusters, multiple patterns simultaneously. The schema must reflect this — no forced exclusivity.
- **The random probe is essential.** Systematic search finds obvious peaks. The Adirondacks terrain requires random jumps. Build the probe before building more lenses.
