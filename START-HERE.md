# Start Here — Manthan Engine Build

Read this first. Then read MANTHAN-SPEC.md. Then start building.

---

## Where we are

**Project:** Manthan Library System — an analytical engine that takes any book inventory and surfaces its intellectual structure (threads, clusters, patterns, the reveal).

**Repo:** `/Users/bharatkhandelwal/coding/library-curator/` — a Next.js 15 app (App Router, Tailwind v4). The library lives at `/antilibrary/` routes.

**Build sequence status:**
- ✅ Step 1: inventory.json — 703 books, fully dimensioned
- ✅ Step 2: analysis.json — 17 threads, 5 clusters, 23 patterns (produced manually through conversation)
- ✅ Step 3: LIBRARY-SYSTEM.md — method documentation
- ✅ Step 4: Separation — done (single repo, clean module boundaries, canonical route `/antilibrary/`)
- ▶ **Step 5: Build the Manthan Engine** ← START HERE
- ⏳ Step 6: Visualization — piles view, constellation improvements
- ⏳ Step 7: Curator integration

---

## What to build in Step 5

The Manthan Engine automates what was done manually in conversation: take `inventory.json`, churn through it, produce/update `analysis.json`.

Three things to build:

**1. Churn module** (`src/lib/manthan/churn.ts`)
Runs 7 lenses across the classified inventory:
- Depth — intellectual strata (dense/substantive/accessible distribution)
- Tension pairs — books that argue against each other (use lineage + subtopics to find candidates)
- Founding figures — lineage field convergence (who appears most as ancestor?)
- Register distribution — count by register field
- Era concentration — decade clustering by year field
- Hidden collections — areas where density is unexpectedly high
- Tradition mapping — author_tradition field clustering

Output: structured findings that feed into threads, clusters, and the reveal section of analysis.json

**2. Random probe** (`src/lib/manthan/probe.ts`)
Adirondacks search — finds hidden peaks systematic search misses:
- Select a book weighted toward: books not in any thread or cluster, or books at edges of known groups
- Shallow probe: find books sharing register + lineage + subtopic coordinates
- Deep probe: use LLM to extract a key concept, find resonant books across inventory
- Return a candidate grouping with a suggested thread/cluster name

**3. Priming interface** (`src/app/antilibrary/manthan/page.tsx`)
A simple UI where:
- Engine surfaces candidate groupings
- Person confirms, rejects, or refines
- Decisions are recorded in priming_log in analysis.json
- Thread membership can be adjusted

---

## Key files

```
src/data/inventory.json        ← 703 books, canonical — do not restructure schema
src/data/analysis.json         ← current analytical output — engine will update this
src/data/clusters.json         ← 8 clusters (separate from analysis.json clusters)
src/lib/curation/curate.ts     ← the Curator engine (separate product — read for pattern)
src/app/antilibrary/           ← all library pages
MANTHAN-SPEC.md                ← full spec including output schema
LIBRARY-SYSTEM.md              ← method documentation with worked example
```

---

## Key decisions already made — do not relitigate

- **One repo** — no separate repos for engine, library app, curator
- **Canonical route** — `/antilibrary/` not `/my-library/`
- **analysis.json schema** — defined in MANTHAN-SPEC.md, do not restructure
- **Six module names** — Collect/Sangrah, Classify/Parichay, Churn/Manthan, Threads/Sutra, Clusters/Samuha, Gaps/Khoj
- **Gaps (Khoj) are human-driven** — do not auto-generate gaps from inventory analysis
- **Books are multi-node** — a book belongs to multiple threads/clusters/patterns simultaneously, no forced exclusivity

---

## One open question to answer before building the priming interface

Should Khoj (Gaps) — the `status: "to-buy"` books in inventory.json — be surfaced as a view in the antilibrary? A "books I want to acquire" section? This affects both the Library App UI and the Curator integration. Decide with Bharat before building Step 6.

---

## Context on what Manthan is

A library is a self-portrait. Manthan reads it. The method is an Adirondacks search — not a Mount Fuji climb. Many peaks of unknown height. Systematic lenses find the obvious ones. Random probes and human priming find the hidden ones. The hidden Yoga/Vedanta library sitting inside what appeared to be a rationalist collection — that was found by Manthan.

The full thinking behind the method is in LIBRARY-SYSTEM.md. Worth reading before building.
