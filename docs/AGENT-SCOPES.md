# Agent Scopes — What Each Agent Is and Is Not

Crisp boundaries. Read this before building any agent.

---

## Sangrah / Collect — Step 1

**Job:** Turn raw input (shelf photos, CSV, JSON) into a structured, enriched inventory entry.

**Is:**
- Identity resolution — title, author, year, ISBN from whatever the input gives
- Enrichment — cover URL, description from Google Books / Open Library
- Deduplication — collapse same book from multiple photos; detect existing inventory entries
- Quality flagging — mark low-confidence entries for human review before anything downstream runs
- State tracking — know which files have already been processed; skip them on re-runs

**Is not:**
- Classification — no categories, register, density, or form assigned here
- Decomposition — no atomic units extracted here
- Judgement — every parseable book enters. Curation is Darshan's job, not Sangrah's
- Analysis — no patterns, connections, or threads

**Output:** `sangrah-staging.json` → human reviews → merged into `inventory.json`

---

## Parichay / Classify — Step 2

**Job:** Take an inventory entry (title, author, description, ToC) and fully classify it, then decompose it into atomic units.

### Pass 1 — Classify the book

Assign every taxonomy field. The book as a whole object.

| Field | What |
|---|---|
| `category` | Primary domain (e.g. Business) |
| `categories` | All domains the book touches (e.g. [Business, Sports]) |
| `topic` | Precise description of what it is specifically about |
| `subject` | Slug |
| `subtopics` | Secondary angles |
| `register` | empirical / systems / humanist / philosophical / contemplative / analytical |
| `density` | accessible / substantive / dense |
| `form` | argument / narrative / portrait / manual / meditation / reference / anthology / journal / essays |
| `lineage` | Whose ideas this book most directly descends from |
| `author_origin` | Country |
| `author_tradition` | Intellectual lineage of the author |

Classification uses few-shot examples drawn from the existing inventory — the 5–8 most similar books already classified — to stay consistent with established patterns.

### Pass 2 — Decompose into atomic units

Break the book into 3–7 atomic, transferable units. Stored in `ideas.json`.

**How many:**
- Manual / reference → 3 units
- Narrative / portrait → 4 units
- Argument / meditation → 5–7 units

**What a unit is:**
```typescript
interface AtomicUnit {
  id: string        // slug: "succession-without-disruption"
  type: "concept" | "framework" | "story" | "claim" | "lens"
  title: string     // short name
  body: string      // 2-3 sentences — the exact mechanism, no decoration
  tags: string[]    // honest labels — what this unit is about
  sourceBook: string
}
```

**What units are:** raw material. Faithful extractions from the book's argument, structure, or narrative.

**What units are not:** abstractions, comparisons, tensions, or connections to other books. Those are Manthan's job.

### Enrichment (feeds both passes)

Before classifying or decomposing, Parichay fetches:
1. Description — from Google Books / Open Library (already in staging)
2. Table of contents — from Google Books API if present (chapter titles are the book's own decomposition)
3. Wikipedia summary — free API, good coverage for notable books

The richer the input to Claude, the more faithful the classification and decomposition.

**Is:**
- Classification of the book across all taxonomy dimensions
- Decomposition into atomic, typed, tagged units
- Enrichment fetch (ToC, Wikipedia) to improve quality
- Consistent with existing vocabulary — uses few-shot examples from inventory

**Is not:**
- Connection-forming — no cross-book links, tensions, or resonances identified here
- Abstraction — no "this idea at the universal level is X" — just what the idea is
- Analysis — no patterns, threads, or clusters
- Curation — all books that pass Sangrah get classified. Parichay does not filter

**Output:** `parichay-staging.json` → human reviews → merged into `inventory.json` + `ideas.json`

---

## What comes after

| Agent | Job in one line |
|---|---|
| Manthan / Churn | Connect the atomic units across books; surface threads, clusters, patterns |
| Darshan / Curate | Human editorial decision — what to show, what to hold back |
| Pradarshan / Visualize | Render what Darshan selected, for the world |
