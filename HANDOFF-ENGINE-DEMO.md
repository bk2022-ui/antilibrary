# Handoff — engine-demo.html rebuild
_Written 2026-06-30. Read this before touching `engine-demo.html`._

---

## What this file is

`engine-demo.html` is a standalone HTML page (no build step, open directly in browser) that explains the Antilibrary System to a C-suite audience. It has two modes:

- **Scroll mode** — normal webpage, all 7 sections visible
- **Present mode** — full-screen slideshow, one slide at a time, keyboard navigation

The file lives at `/Users/bharatkhandelwal/coding/antilibrary/engine-demo.html`.

The current version (as of this handoff) is a working draft. The rebuild described here is a complete rewrite of the file based on decisions made in the session of 2026-06-30.

---

## What to build — complete spec

### Overall design constraints
- **Typography: 3 sizes only** — hero heading (52–68px Space Grotesk 700), section heading (34–38px Space Grotesk 700), body (15px Inter 400). No decorative size variation within sections.
- **Colors: strictly scoped** — Engine palette (c1–c5) reserved for agent circles in the SVG only. Type, badges, and UI elements use ink/dim/faint (the three grays) plus `--c1` (#2563A8) for eyebrows and the Present button only.
- **No colored badges** in output cards or anywhere outside the SVG.
- **Present button**: filled blue (`background: #2563A8; color: white`) when off / outlined with red text (`border: 1.5px solid #C25A38; color: #C25A38; background: white`) when active. Toggle on click; also toggled by Escape key.

### Color tokens
```css
--c1: #2563A8  /* Collect/Sangrah — blue */
--c2: #7A55B5  /* Classify/Parichay — violet */
--c3: #C25A38  /* Churn/Manthan — burnt orange */
--c4: #1A7E5C  /* Curate/Darpan — green */
--c5: #8A6212  /* Visualize/Pradarshan — gold */
--ink: #1A2332
--dim: #51606E
--faint: #8893A0
--line: rgba(26,35,50,0.10)
--line-soft: rgba(26,35,50,0.06)
```

### Fonts
Space Grotesk (300/400/500/600/700) + Inter (300/400/500/600) from Google Fonts.

---

## Slide order (both scroll and present match)

| # | ID | Title | Background |
|---|---|---|---|
| 1 | #home | Title | white |
| 2 | #problem | Problem + Solution | white |
| 3 | #output | What no human reader would find alone | white |
| 4 | #pipeline | The Antilibrary Engine | white |
| 5 | #quality | Agents Checking Agents | #0F1A2E (dark navy) |
| 6 | #principles | Why this architecture | #F8F9FB (off-white) |
| 7 | #appendix | Extending the System Further | #F3F4F6 (light gray) |

---

## Slide 1 — Title

**Eyebrow:** Personal Knowledge Intelligence

**H1:** The *Antilibrary* System  
(em = color var(--c1))

**Pull quote** (new, prominent): "A library that reads itself."  
Style: large italic, var(--dim), left-aligned below the H1. Not a stat — a conceptual hook. Place it between the H1 and the stats.

**Stats row** (4 items, flex, gap 32px):
- 732 · BOOKS INGESTED (color: c1)
- 3,498 · ATOMIC UNITS (color: c2)
- 91 · CROSS-LIBRARY FINDINGS (color: c3)
- 51 · STRONG-SIGNAL FINDINGS (color: c4)

Stat number: 32–42px, Space Grotesk 700, tight letter-spacing.  
Stat label: 10.5px, Space Grotesk 600, uppercase, 0.12em spacing, var(--faint).

**No other text on this slide.** Clean and confident.

---

## Slide 2 — Problem + Solution (combined)

Two-column layout. In present mode: side-by-side. In scroll mode: side-by-side (collapses to single column on mobile).

### Left column — The Problem

**Eyebrow:** The Problem

**H2:** Most knowledge becomes a catalogue. The insights never compound.

**Body (3 short paragraphs, max 120 words total):**
1. "Most knowledge-intensive people own hundreds of books. They actively use three."
2. "A library contains thousands of ideas — frameworks, stories, claims, lenses. They sit in isolation, one per spine, invisible to each other."
3. "The patterns that matter most — tensions, contradictions, hidden clusters — span across books. No reader finds them."

**Callout box** (blue left-border, light blue background):
> *"The anti-library is what you haven't read yet."* — Umberto Eco. The tragedy is that even what you *have* read mostly goes dormant. Knowledge stays locked inside individual spines instead of compounding across them.

### Right column — The Solution

**Eyebrow:** The Solution (color: var(--c1))

**H2:** The Antilibrary System does what no reader can.

**Three outcome lines** (NOT cards — just clean left-bordered lines or bullets):
- **Unlock** — Every book decomposed into its transferable ideas
- **Surface** — 7 analytical lenses scan the entire library simultaneously, finding what no single reading reveals
- **Show** — A private self-portrait of your intellectual identity, and a public window for others

**Stat callout** (bottom of right column, prominent):
> 732 books. 3,498 ideas extracted. 91 cross-library findings. In a single run.

---

## Slide 3 — What it finds (moved BEFORE engine explanation)

**Eyebrow:** Live findings

**H2:** What no human reader would find alone

**Sub:** From a single run — patterns that took seconds to surface and would take years to find manually.

### Output cards — 3 columns, consistent format

Each card: `border: 1px solid var(--line); border-radius: 12px; padding: 20px 18px; background: #FAFAFA`

**Card heading structure (2 lines):**
- Line 1: agent name in small caps (10px, Space Grotesk 700, uppercase, 0.14em spacing, var(--faint))
- Line 2: what was found (13px, Space Grotesk 600, var(--ink))

**Row format (each card has 4 rows):**
```
[BADGE]  Bold title — explanation text
```
- Badge: fixed width 72px, `background: #EDEEF0; color: #4A5568; font-family: 'Courier New'; font-size: 9.5px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; text-align: center; flex-shrink: 0; margin-top: 1px`
- All badges: SAME neutral style. No colored badges. No competition with engine colors.
- Title: 13px, Space Grotesk or Inter 600, var(--ink)
- Explanation: 12.5px, Inter 400, var(--dim)
- Row divider: 1px solid var(--line-soft)
- Row padding: 10px 0

**Card 1 — CLASSIFY AGENT / Atomic units — Antifragile (Taleb)**
| Badge | Content |
|---|---|
| concept | **Via Negativa** — improve by subtraction: remove fragilities, don't add optimizations |
| framework | **Fragile → Robust → Antifragile** — a spectrum, not a binary. Most systems plateau at robust |
| claim | **The iatrogenics trap** — interventions cause more harm than the condition they treat |
| lens | **Barbell strategy** — bimodal risk-taking; avoid the middle. Apply to career, portfolio, diet |

**Card 2 — CHURN AGENT · TENSIONS / Tension pairs across the library**
| Badge | Content |
|---|---|
| tension | **Optimization vs. Resilience** — efficient systems are brittle; 23 books on two sides of this divide |
| tension | **Scale vs. Intimacy** — 18 books: growth destroys the thing that made growth possible |
| tension | **Prediction vs. Optionality** — forecasting literature vs. real-options literature; rarely in dialogue |
| tension | **Hierarchy vs. Network** — 31 books span both; the library holds this unresolved |

**Card 3 — CHURN AGENT · CLUSTERS / Hidden collections surfaced**
| Badge | Content |
|---|---|
| cluster | **Pre-scientific management** — 9 books from Taylor to Sloan that predate modern org theory |
| cluster | **Behavioral finance origins** — 7 books laying the empirical groundwork before Kahneman |
| cluster | **Counter-narrative history** — 11 books that each revise a dominant historical claim |
| cluster | **Founder epistemology** — how 12 builders knew what they knew; implicit in biography, never made explicit |

---

## Slide 4 — The Antilibrary Engine (SVG pipeline)

**Eyebrow:** How we do it — Five-agent model

**H2:** The Antilibrary Engine

**Sub:** Hover any agent to learn what it does. Quality checks (◇) run automatically at each stage.

### SVG spec

**ViewBox:** `0 0 1100 500`  
**All SVG defs** in a top-level hidden SVG (`position:absolute; width:0; height:0`) so both the scroll and presentation SVGs can reference them without duplication.

```
<!-- Shared defs SVG (outside any section, in <body> before .page) -->
<svg style="position:absolute;width:0;height:0;overflow:hidden" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- radialGradients: g1–g5 (agent fill gradients) -->
    <!-- markers: arr (connector arrow), arr-in (input arrow) -->
    <!-- animation paths: p12, p23, p34, p45 (connector flows) -->
    <!-- animation paths: pin1, pin2, pin3, pin4 (input flows) -->
    <!-- orbit paths: o1–o5 -->
  </defs>
</svg>
```

**Agent positions:**
| Agent | cx | cy | r |
|---|---|---|---|
| 1 Collect | 210 | 190 | 66 |
| 2 Classify | 380 | 190 | 60 |
| 3 Churn | 560 | 190 | 70 |
| 4 Curate | 740 | 190 | 60 |
| 5 Visualize | 920 | 190 | 60 |

**For each agent circle, three ring layers:**
1. Outer: filled with radialGradient, `class="ag-fill"`
2. Outer stroke ring: `stroke="var(--cN)" opacity=0.32 stroke-width=2.5 class="ag-ring"`
3. Inner guide ring: `stroke="var(--cN)" opacity=0.18 stroke-width=0.75 fill="none"` at r-18
4. (Agent 3 only) Second inner ring at r-36, opacity=0.10
5. Center dot: `r=9 fill="var(--cN)" opacity=0.88`

**Agent labels (below circle):**
- Number: e.g. "01" — y=agentY-6, font-size=9, opacity=0.6, letter-spacing=1.5px
- Sub-label inside circle: e.g. "Photo → Spine" — y=agentY+9, font-size=9.5, fill=var(--dim)
- **English name (PRIMARY, LARGE):** y=278, font-size=14, font-weight=700, fill=var(--ink)
- **Hindi (secondary, small):** y=294, font-size=10, font-weight=500, fill=var(--faint), e.g. "(Sangrah · संग्रह)"
- **Trigger badge:** y=312, font-size=8.5, font-weight=600, letter-spacing=0.12em, fill=var(--faint), UPPERCASE

Trigger badge text per agent:
| Agent | Trigger text |
|---|---|
| 1 Collect | `NIGHTLY · ON CALL` |
| 2 Classify | `PER BOOK · ON CALL` |
| 3 Churn | `BATCH (20+ BOOKS) · ON CALL` |
| 4 Curate | `HUMAN DECISION · ON CALL` |
| 5 Visualize | `ON RENDER · ON CALL` |

**Human intervention markers** (Agents 4 and 5):
Small `H` circle at upper-right of each agent circle:
- Agent 4: cx=782, cy=148 — stroke color: var(--c4)
- Agent 5: cx=962, cy=148 — stroke color: var(--c5)
- Style: `r=11 fill="white" stroke-width=1.5`; text: "H", font-size=10, font-weight=700, matching stroke color

**Legend line** below SVG (not inside SVG, just HTML text):
`H = human decision point  ·  all agents accept manual triggers`
Style: 10px, Space Grotesk 600, uppercase, var(--faint)

**Input sources** (left side, same as current version):
- 4 labeled boxes: 📷 Shelf photo / 📄 CSV · Excel / ✏️ Manual list / 🎙 Verbal input
- Boxes at x=18–114, y positions: 107, 145, 183, 221
- Dashed blue lines feeding into Agent 1 with animated particles

**Connector lines between agents:**
Same as current (lines with arrow markers), PLUS cascade annotation:
- Text "completes →" at y=175, centered above each connector
- Midpoints: x=295 (1→2), x=465 (2→3), x=645 (3→4), x=825 (4→5)
- Style: font-size=7.5, fill=rgba(26,35,50,0.28), letter-spacing=0.06em

**QA layer (below agents):**

Horizontal separator bar at y=338:
- Line from x=160 to x=970, stroke=rgba(26,35,50,0.08), dashed
- Label "QUALITY CHECKS" centered, font-size=9, font-weight=700, letter-spacing=0.18em, fill=rgba(26,35,50,0.35)

QA diamonds (larger, filled):
- Center y=357 for all five
- Diamond half-size: 16px
  - Agent 1 (x=210): `points="210,341 226,357 210,373 194,357"` fill=#DCE8F7 stroke=#2563A8
  - Agent 2 (x=380): `points="380,341 396,357 380,373 364,357"` fill=#EDE8F7 stroke=#7A55B5
  - Agent 3 (x=560): `points="560,341 576,357 560,373 544,357"` fill=#F8EBE6 stroke=#C25A38
  - Agent 4 (x=740): `points="740,341 756,357 740,373 724,357"` fill=#E2F2EC stroke=#1A7E5C
  - Agent 5 (x=920): `points="920,341 936,357 920,373 904,357"` fill=#F5EED8 stroke=#8A6212
- Checkmark inside each: "✓" at y=361, font-size=11, font-weight=700, matching stroke color

QA labels (2 lines each):
- y=381 and y=393, font-size=9, font-weight=600, fill=rgba(26,35,50,0.45)
- Agent 1: "Ingestion" / "Recall"
- Agent 2: "Classification" / "Consistency"
- Agent 3: "Finding" / "Validity"
- Agent 4: "Portrait" / "Grounding"
- Agent 5: "Staleness" / "Detection"

**Orbiting QA dots + data particles:** Same as current version (animateMotion, same timing).

**Hover tooltip:** Same as current version. JS reads `data-agent` attribute, shows styled dark panel.

Tooltip data:
```js
{
  1: { title:"Collect", hindi:"Sangrah · संग्रह", body:"Reads shelf photos, CSV files, spreadsheets, or verbal input. Extracts book spines using vision AI. Enriches each title with metadata via Google Books and Open Library APIs. Deduplicates and confidence-scores every entry. Runs nightly; also available on call.", out:"Output → inventory.json · Trigger: nightly + on call" },
  2: { title:"Classify", hindi:"Parichay · परिचय", body:"Decomposes each book into 3–7 atomic units — concepts, frameworks, stories, claims, and lenses. Adds cross-book see-also links. Triggered automatically when Collect completes; also available on call.", out:"Output → ideas.json · Trigger: per new book + on call" },
  3: { title:"Churn", hindi:"Manthan · मंथन", body:"Runs 7 analytical lenses across the entire library simultaneously: depth, register, era, tradition, tension pairs, founding figures, and hidden collections. Surfaces 91 findings — patterns invisible to any single reader.", out:"Output → manthan-analysis.json · 91 findings · Trigger: batch (20+ books) + on call" },
  4: { title:"Curate", hindi:"Darpan · दर्शन", body:"The private mirror. Synthesizes Churn findings into Lekha-Jokha (collection stats) and Darshan (self-portrait of the reader's intellectual identity). Requires a human decision to run — nothing is curated automatically.", out:"Output → darpan.html (internal) · Trigger: human decision + on call" },
  5: { title:"Visualize", hindi:"Pradarshan · प्रदर्शन", body:"The public window. Renders selected Churn findings into a live antilibrary page — portrait, hidden structure, and curated collection. Reads from a pradarshan-config.json editorial pull. A human must approve the config before render.", out:"Output → antilibrary.bharatkhandelwal.com · Trigger: on render + on call" }
}
```

---

## Slide 5 — Agents Checking Agents (Quality)

**Background:** #0F1A2E (deep navy). White text throughout.

**Eyebrow:** Built-in quality (white, opacity 0.5, no c1 color — because dark bg)

**H2:** Agents Checking Agents  
(white)

**Subheading line** (prominent, italic or medium weight, below H2):
*"Most AI systems are evaluated by the people who built them. This one evaluates itself."*  
Style: 16–18px, Inter 400 italic, rgba(255,255,255,0.75), max-width 54ch, margin-bottom 28px

**5 QA cards** (same content as current, grid auto-fit min 190px):
- Card background: rgba(255,255,255,0.07)
- Card border: 1px dashed rgba(255,255,255,0.18)
- Card border-radius: 12px
- Icon: "◇" — rgba(255,255,255,0.4)
- Name: white, Space Grotesk 700, 13px
- Description: rgba(255,255,255,0.65), Inter 400, 12px

Cards:
1. **Ingestion Recall** — Compares shelf photos to inventory. Estimates missed spines (~25% miss on dense shelves). Surfaces which photos to re-shoot.
2. **Classification Consistency** — Samples atomic units across books in the same genre. Checks that identical concepts are typed identically. Flags semantic drift.
3. **Finding Validity** — For each Churn finding, verifies the cited books actually support the claim. Rejects findings where evidence is absent or reversed.
4. **Portrait Grounding** — Checks that Curate's self-portrait assertions are traceable to specific Churn findings. No citation = flagged before publication.
5. **Staleness Detection** — After every Collect run, marks Churn findings whose supporting books were removed or reclassified. Triggers a delta re-churn on affected lenses only.

---

## Slide 6 — Principles (4 only)

**Background:** #F8F9FB

**Eyebrow:** Design principles

**H2:** Why this architecture

**4 principle cards** (3-col grid, 4th card spans or wraps):
Each card: white bg, border-left 3px solid var(--c1), border-radius 0 12px 12px 0, padding 22px 20px

1. **The system runs itself**  
   A nightly Collect run cascades automatically through Classify. Churn fires when the batch threshold is reached. No manual steps between agents — only human decisions require a human.

2. **Nothing publishes without editorial control**  
   Visualize reads from a pradarshan-config.json editorial file. The engine proposes what to surface; a person decides. Nothing reaches the public window without explicit selection.

3. **Private depth, public curation**  
   Curate is for the owner — full depth, unfiltered, every finding. Visualize is for visitors — curated, contextual, never overwhelming. Architecturally separate; data flows in one direction.

4. **Quality is a first-class citizen**  
   Five evaluation agents run automatically after each stage. The pipeline doesn't just produce outputs — it checks them. Self-auditing is not a feature; it is part of the architecture.

---

## Slide 7 — Appendix: Extending the System Further

**Background:** #F3F4F6 (light gray, signals "different territory")

**Eyebrow:** Appendix — in var(--faint), not var(--c1)

**H2:** Extending the System Further

**Body:**
Books are the proof of concept. The underlying architecture — Ingest, Atomize, Realign, Show — is domain-agnostic. The same five agents, unchanged, apply to any knowledge corpus.

**4-step horizontal flow** (clean boxes with arrows between them):
```
[01 INGEST]  →  [02 ATOMIZE]  →  [03 REALIGN]  →  [04 SHOW]
Any format       Smallest          Cross-corpus      Private mirror
photos, CSV,     transferable      patterns,         + public window
PDFs, audio      ideas             tensions, clusters
```
Style: each step as a bordered card (border: 1px solid var(--line), border-radius: 10px, padding: 16px), arrow as plain text "→", flex layout, gap 12px.

**Example corpora grid** (6 items, 3-col grid, below the 4-step flow):
- 📚 Personal library *(current — proven on 732 books)*
- 📋 Project memos & reports
- ⚖️ Case law & legal precedent
- 🔬 Research papers & journals
- 📈 Competitive intelligence
- 🗂 Strategy & board documents

Style: each item as a simple flex row with emoji + text (13px, var(--dim)). Light card or just a clean grid.

---

## Presentation mode

### Topbar
- Brand: "Antilibrary System" (Anti in c1)
- Right: nav links (Problem, Solution, The Engine) + **Present button**

### Present button states
- **Off:** `background: #2563A8; color: white; border: none` — "▶ Present"
- **On:** `background: white; color: #C25A38; border: 1.5px solid #C25A38` — "■ Exit"

### Presentation shell
- Fixed overlay, z-index 100
- Top bar: brand left, "N / 7" counter center, "✕ Exit" button right
- Track: one `.pres-slide` visible at a time, opacity + translateX transition (.3s ease)
- Bottom nav: ← arrow, dot indicators (active dot = wider pill), → arrow
- Keyboard: ArrowLeft/ArrowRight/Space to navigate, Escape to exit

### Pres slide content
Each pres slide mirrors the scroll slide content, but:
- More whitespace (center-justified vertically in the viewport)
- Font sizes slightly larger (clamp scales up)
- The engine SVG in the pres slide references the same shared defs SVG

### Engine SVG in pres slide
Use the SAME SVG content as the scroll version. Because shared defs are in a top-level SVG (not inside any hidden section), they remain accessible regardless of which container is displayed.

### Slide backgrounds in present mode
- Slides 1–4: white
- Slide 5 (Quality): background #0F1A2E (dark-slide class)
- Slide 6: #F8F9FB
- Slide 7 (Appendix): #F3F4F6

Dark slide class for pres mode:
```css
.pres-slide.dark-slide { background: #0F1A2E; color: white; }
.pres-slide.dark-slide h2 { color: white; }
.pres-slide.dark-slide .sec-lead { color: rgba(255,255,255,0.65); }
```

---

## JS — key behaviors

```js
// Tooltip
const AGENTS = { 1: {...}, 2: {...}, 3: {...}, 4: {...}, 5: {...} }
// Attach mouseenter/mousemove/mouseleave to all .ag-group elements
// Position tooltip relative to viewport (position:fixed on tooltip div)
// Use clearTimeout/setTimeout 120ms on leave for smooth UX

// Slideshow
const TOTAL = 7
let cur = 0
// goTo(n): remove active from cur, add active to n, update dots + counter + button states
// enterPresent(): body.classList.add('presenting'), reset to slide 0
// exitPresent(): body.classList.remove('presenting')
// Present button click: toggle
// Keyboard: ArrowRight/Space → goTo(cur+1), ArrowLeft → goTo(cur-1), Escape → exitPresent()
// Dot click: goTo(i)
```

---

## Files NOT to touch during this build
- `src/libraries/bk/inventory.json`
- `src/libraries/bk/manthan-analysis.json`
- `src/libraries/bk/ideas.json`
- `darpan.html` / `scripts/build-darpan.ts`
- Any agent source code in `src/lib/`

## Only file being changed
`/Users/bharatkhandelwal/coding/antilibrary/engine-demo.html` — full rewrite.

---

## How to open and test
```
file:///Users/bharatkhandelwal/coding/antilibrary/engine-demo.html
```
No build step. Standalone HTML. Works offline.

Test checklist:
- [ ] Scroll mode: all 7 sections render correctly
- [ ] Present button turns on/off correctly (color state changes)
- [ ] All 7 pres slides navigate correctly (← → keys, dots, escape)
- [ ] SVG animations play in both scroll and present engine slides
- [ ] Hover tooltips appear on all 5 agents in both modes
- [ ] Dark quality slide renders correctly in both modes
- [ ] Output cards: all badge widths consistent (72px), rows align across 3 cards
- [ ] Mobile: single-column collapse at 760px and 540px
- [ ] Human "H" markers visible on agents 4 and 5
- [ ] Trigger badges readable below each agent name
- [ ] Cascade "completes →" annotations visible on connector lines
