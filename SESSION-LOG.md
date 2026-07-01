# Antilibrary — Session Log

Newest session first. Update this at the end of every working session before closing.

---

## 2026-07-01 — Parakh, the assay layer (Sangrah QC agent) — Phase 0–1 built + designed

- **Started a quality-check layer for the engine.** It is **not a sixth step** (the five names stay locked) — it is cross-cutting infrastructure that assays each step's output, and the concrete realisation of the public demo's *"Agents Checking Agents."*
- **Named it Parakh (परख)** — the assayer's word (to test genuineness/quality). It is a **family**: checkers named `parakh-<step>-<lens>` (dropped a `qc-` prefix — Parakh already means QC; one vocabulary). Family-of-siblings model: each checker independently runnable, but they share one `parakh-report.json` and one umbrella runner (`npm run parakh <step>`).
- **The load-bearing architecture — the propose → review → apply rail.** Every checker is a read-only **detector** (mutates nothing); a separate **apply** step commits only human-accepted fixes. So "auto-fix later" is just flipping the approval default, not a rewrite. Findings are **proposals** (deterministic before→after) or **flags** (need eyes, no safe auto-fix). Decision this session: **human-checks-first** for Layer C until we trust it; auto-fix is a per-check graduation (Phase 6).
- **Sangrah gets three checkers** (three distinct leaks, different ground truth): `structure` (deterministic records — built), `recall` (the ~25% vision miss — planned Phase 4), `plausibility` (wrong-book enrichment — planned Phase 5).
- **Built Phase 0–1: `parakh-sangrah-structure`.** `src/lib/sangrah/parakh/{types,isbn,structure,report}.ts` + `scripts/parakh.ts` + `npm run parakh`. Five deterministic checks: ISBN checksums, cross-inventory duplicates, missing fields, year sanity, enrichment-failure triage. Read-only; writes `src/libraries/bk/parakh-report.json`.
- **First run finding (important):** the on-disk `sangrah-staging.json` is **stale** — already merged into inventory — so the dup check lit up on nearly everything (verified 3 against real inventory: correct, not false positives). The checker works; the dataset is a poor test. **Proposal path is unexercised** (0 proposals — every enriched entry had valid ISBNs/years). Next step needs a **synthetic fixture** to prove proposals before building apply.
- **Deferred with reason:** the borderline-match / silent-drop audit needs match provenance Sangrah currently discards → moved to **Phase 3** (with the `match.ts` hardening), keeping Phase 1 truly read-only.

### Framework state
- Parakh added as a documented cross-cutting layer. Five step names unchanged. New naming rule: `parakh-<step>-<lens>`.
- Docs: **`docs/PARAKH-DESIGN-REFERENCE.md`** (new, full design) · Parakh section in `docs/ANTILIBRARY-ENGINE-SPEC.md` · Parakh scope in `docs/AGENT-SCOPES.md`.
- Public `bk-site/public/engine-demo.html`: "Agents Checking Agents" — the single *Ingestion Recall* card broken into the three Parakh-sangrah cards (option A, with honest built/planned state), diagram diamond relabeled **Parakh · Sangrah**, dead `antilibrary.bharatkhandelwal.com` link fixed → `/antilibrary`. **Pushed** (Vercel).

### Decisions
- Parakh = family, not one agent. Slug `parakh-<step>-<lens>`, no `qc-`. Human-review-first, auto-fix as a later per-check graduation. `match.ts` silent-drop fix is evidence-first (Phase 3), not a blind behavior change now.
- Public demo: **show the asymmetry** (Sangrah has 3 checkers, other steps 1) — the other QC agents aren't investigated yet and may also split; the thinking will evolve in view.

### Where next starts
- Build the **synthetic staging fixture** (bad-checksum ISBN, derivable isbn13, future year, fresh dup, clean entry) to exercise proposals → then **`parakh-apply`** (Phase 2). Roadmap + current state at the bottom of `docs/PARAKH-DESIGN-REFERENCE.md`.

---

## 2026-07-01 — iPhone app → TestFlight (shipped to device, around the work MDM)

- **Got the app onto the real phone via TestFlight.** Bharat's primary iPhone is a **work phone with MDM** that blocks the free personal-team "direct install → Trust developer" path (hits "Unable to Verify App / Untrusted Developer"). The clean route — same as the Dōjō app — is **TestFlight** (an App-Store app the MDM permits). Saved as memory: [[apple-developer-and-ios-testing]]. **Do not** re-attempt direct install on that phone, and **do not** ask whether he has a developer account — he does (paid, enrolled).
- **The path, end to end:** Xcode → set Team → destination **Any iOS Device** → **Product → Archive** → Organizer → **Distribute App → Upload** → App Store Connect → **TestFlight**.
- **Blockers hit + fixed (record for next time):**
  1. **App icon was a placeholder** → App Store Connect rejects builds with no 1024 icon. Generated a real 1024 (no-alpha) icon headless via **CoreGraphics** (AppKit crashes without a window server) — a shelf of ink spines + one gray leaning "unread" book. `Antilibrary/Assets.xcassets/AppIcon.appiconset/`.
  2. **Bundle ID not registered** → the archive signed against the **XC Wildcard (`*`)** profile, so `com.bharatkhandelwal.antilibrary` never became an explicit App ID; the App Store Connect "New App" Bundle ID dropdown was empty. Fix: register it explicitly in **Certificates, Identifiers & Profiles → Identifiers**.
  3. **Encryption compliance** prompt on the build → answer **"None of the algorithms mentioned above."**
- **State: CONFIRMED WORKING on Bharat's phone via TestFlight.** Build **1.0 (1)**, internal group **"Me"**, App Store Connect app id **6786375925**, name "Antilibrary". The card renders and the app runs on-device.
- **Update loop going forward:** `npm run cards` → copy `cards.json` into `antilibrary-ios/Antilibrary/` → bump build number → Archive → Upload. New build just appears in TestFlight.
- **External distribution submitted.** To share with ~50 people, created an **external TestFlight group ("a-lib-testers")**, added build 1.0(1), no sign-in required, and **submitted for Beta App Review** (first external submission ≈ a few hrs–1 day). Once approved: enable the group's **Public Link** and send that one URL to the 50 people (they install via the TestFlight app — no sign-in, nothing to set up). Privacy policy ready at `antilibrary-ios/PRIVACY.md` if Apple asks (app collects no data). App Store is the wrong tool — no way to password-gate a public listing; TestFlight-external-by-link IS the private channel.
- **Where next starts:** wait on Apple approval → enable public link → share. Then live with the daily nudge for ~a week; then decide the **widget** (ambient glance) vs. the **`prompt` enrichment** (quiz/recall) based on whether the habit earns its place.

---

## 2026-07-01 — iPhone app v1 (daily nudge) — the first consumer of the feed

- **Picked the frontend.** Split "the frontend" into two decisions: interaction model (platform-independent) + platform. Pradarshan already owns web/public; so the new surface is a **personal iPhone app** (just Bharat, not ship-ready). That framing collapses the cost — no backend, no App Store, no accounts. Chosen interaction: **daily nudge** (card-of-the-day + local notification), not just flip-through.
- **Built it — a new sibling repo `~/coding/antilibrary-ios`** (NOT inside this repo). SwiftUI, a **thin reader over `cards.json`** (bundled snapshot, fully offline). Screens: one card (type · serif title · body · attribution · tags), **Today** (deterministic card-of-the-day) + **Shuffle**. **Daily local notification** teasing today's idea by title — on-device, no server, no paid account (rolling ~60-day window, rescheduled on launch).
- **`prompt` carried but unused** (`null` in the feed) — the reserved hook for a future quiz/spaced-repetition mode once the Parichay enrichment lands.
- **Project mechanics:** hand-wrote a **file-system-synchronized Xcode project** (no XcodeGen/Tuist locally, no Homebrew). **Verified end-to-end**: `xcodebuild` BUILD SUCCEEDED, then installed + launched in the iOS Simulator (Xcode 26.6 / Swift 6.3) and screenshotted the card rendering + the nudge-permission prompt firing. Committed (`ed21b10`).
- **Not built (in the ios repo's README "Next"):** home-screen **widget** (needs a WidgetKit extension target, a few clicks in Xcode); quiz/SRS (needs `prompt`); filter-by-type/tag, favorites.
- **Data-refresh loop:** re-run `npm run cards` → copy `cards.json` into `antilibrary-ios/Antilibrary/` → rebuild. Bundled-not-fetched is deliberate for v1.
- **Where next starts:** run it on the physical phone (set Team + unique bundle id in Xcode), live with the daily nudge, then decide widget vs. `prompt` enrichment.

---

## 2026-07-01 — The app feed (`cards.json`): atomic units shaped for a future learning app

- **The ask:** for an outward-facing product, shape the Parichay atomic units so a future Apple app can *pull from one place* and make "a little learning opportunity" (daily card / spaced-repetition), without building the app yet.
- **Key realization:** the units are already ~card-shaped — `body` runs 211–532 chars (median **317**), with a `title` hook, a `type`, and tags. Parichay needs no new output; the app needs a **packaging step** — a **derived view**, sibling to Pradarshan, not a new authoring surface.
- **Built `scripts/build-cards.ts` (`npm run cards`)** → `src/libraries/bk/cards.json`: a flat array of **3,498 self-contained cards**, each `{ id, type, title, body, prompt(reserved), tags, source{bookId,book,author,category,year}, contentHash }`. All IDs unique, **3,498/3,498 authors baked**.
- **Three one-way-door decisions resolved in the build:**
  1. **Stable, unique IDs** — `<bookId>::<titleSlug>` (globally unique, deterministic). Killed the 15 old cross-corpus ID collisions. Caveat in the file header: truly re-churn-stable IDs need **Parichay to persist an id** when it first mints a unit; schema is ready to prefer a persisted id.
  2. **Attribution baked in** at build time (join to inventory: exact → case-insensitive → punctuation-insensitive fallback, which recovered the last 2 variant-title misses — *The Wabi-Sabi Way*, *The Gulistan of Sadi*).
  3. **Flat + self-contained** feed; the app never does the messy title join.
- **`contentHash`** included so the app can detect when a card's text changed (re-surface) without losing identity.
- **Deliberately deferred:** the **`prompt`** (recall/question) field is reserved `null` — that's a real Parichay *enrichment* pass, the thing that turns passive reading into active learning. Not built.
- **Open forks (no action now):** JSON-fetch vs. bundled **SQLite** as the app's ultimate pull target (recommendation: keep JSON canonical, derive SQLite later); and whether Parichay should persist IDs.
- **Did not touch** the test bed (`src/libraries/tim-boyle/`, uncommitted `src/lib/**`).
- **Where next starts:** decide the `prompt` enrichment (and, if pursued, have Parichay persist stable IDs) whenever the app work begins.

---

## 2026-06-30 — Pradarshan made explorable (the /antilibrary tab as a digestion tool)

- **Reframed the page's purpose:** the `/antilibrary` tab isn't just a public display — it's where Bharat *sees and digests* all the engine's output to figure out future design. So it had to expose everything, clickable.
- **Data architecture (light + lazy):** expanded `build-pradarshan.ts` to emit a **light main bundle** (~62 KB gz: stats incl. idea-type counts, curated spines, all 91 findings, 8 clusters, 17 threads, 23 patterns, 732-book catalogue) + **5 per-type idea chunks** (`public/antilibrary/ideas-<type>.json`, ~1.7 MB total) that the page **lazy-loads** only on drill-in. The 3,498 ideas are 10× the rest, so they never load until asked for.
- **Page (bk-site `src/app/antilibrary/page.tsx`):** hero + **cover strip**; sticky nav `Statistics · Spines · Clusters · Catalogue`; **clickable** big numbers; an **Analysis Index** of every unit type (5 idea types · 7 finding lenses · threads/clusters/patterns), each opening a **drill-down panel**; catalogue with the settled covergrid treatment + filter bar (search + register/category/status + sort).
- **Drill-down panels** settled, after several iterations, on **two controls**: a Search box + a "Jump to an item…" dropdown listing the actual items (browse when you don't know what to type → scroll to the pick). Dropped the attribute-facet selects.
- **Spine headlines:** added an editorial **`headline` override** in `pradarshan-config.json` so cryptic Manthan names (e.g. "The Lebanese Probability Monastery") show a clean public title; engine data untouched. 3 of 10 done.
- **Deploy lesson (important):** four commits silently failed Vercel's `next build` (a TypeScript `implicit any` that `npm run dev` tolerated) — prod was frozen on an old build. **Rule now: run `npm run build` in bk-site before every push.**
- **Full as-built design recorded** in `docs/PRADARSHAN-DESIGN-REFERENCE.md` → "AS BUILT".
- **Where next starts:** all post-launch fast-follows (finish headlines, ingestion recall, Manthan delta, the multi-agent/evaluation rebuild, the book-detail node).

---

## 2026-06-30 — Path A: engine back-half FINISHED (Darpan → the pull → Pradarshan live)

- **Pivoted from the demo back to engine development.** Chose **Path A** (finish the vertical slice; defer the multi-agent/evaluation rebuild and the quality backlog to post-launch fast-follows).
- **Darpan (Step 4) — done.** Committed the Manthan findings browser (Part 2): all ~91 findings browsable by the 7 lenses + probes, strength/evidence. Darpan now = Lekha-Jokha (numbers) + Manthan (read everything) + Darshan (meaning).
- **The pull — done.** Authored + validated `src/libraries/bk/pradarshan-config.json` (10 findings + 7 featured books, all resolve against manthan/inventory). This file is the curator's editorial control surface — edit it to change what the public window shows.
- **Pradarshan (Step 5) — SHIPPED.** Built the public **`/antilibrary` tab on bk-site** (bharatkhandelwal.com/antilibrary): Statistics + the curated "spines" + the 732-book catalogue in the settled cover treatment (−7.5° tilt, register fallbacks, grid/list). Reads `pradarshan.json`. Repointed the homepage nav from the dead `antilibrary.bharatkhandelwal.com` subdomain to the internal `/antilibrary` route.
- **Generator — `npm run pradarshan`** (`scripts/build-pradarshan.ts`): resolves the pull config → `pradarshan.json`, syncs the copy into bk-site. Loop is one command: edit config → `npm run pradarshan` → deploy.
- **Architecture clarified (locked):** the **antilibrary repo = the product** (multi-tenant eventually; runs on the `bk` library today). The **output for Bharat's library displays on bharatkhandelwal.com/antilibrary** (the bk-site repo). The product app's own `page.tsx` is the product running on his data, *not* the public destination.
- **State: the 5-step engine is end-to-end** — Collect → Classify → Churn → Darpan → pull → Pradarshan, live.
- **Next session starts:** Bharat re-curates the pull (`pradarshan-config.json`) to taste. Then the deferred fast-follows: ingestion recall (~25% miss), Manthan delta-pass, Manthan priming interface, the multi-agent/evaluation rebuild.

---

## 2026-06-30 — synopsis deck posted to the personal site; single source of truth = bk-site

- **What we did:** Wired the standalone synopsis deck (formerly `engine-demo.html` in this repo) into the personal site. The **(anti)library** tile on **bharatkhandelwal.com/products** now opens it in a new tab. Live and pushed (`bk-site` repo, `origin/main`).
- **Single copy, by decision:** Bharat wants no duplicate files. The deck is a hand-authored site asset (hardcoded stats), **not** a derived view of library data — so it has no reason to live in this repo. It now lives **only** in `bk-site/public/engine-demo.html`. The copy here was removed.
- **How it's wired:** `bk-site/src/app/products/page.tsx` — added an optional `href` per product; tiles with `href` open it via `window.open(href, "_blank")`, others keep the modal. The (anti)library product points to `/engine-demo.html`.
- **Sync note:** local `bk-site` was 6 commits behind `origin/main` (live shows the tile as "(anti)library", local said "Manthan"); fast-forwarded before editing so the change landed on the deployed version.
- **Where to iterate:** edit `bk-site/public/engine-demo.html` directly and redeploy from `bk-site`. Bharat plans to keep refining it over the next ~6–7 hours. Open item he may still want: soften the two slides that imply Pradarshan is live (deck currently presents all 5 agents as operational; Darpan is v1, Pradarshan held).

---

## 2026-06-30 — engine-demo.html built from scratch (per HANDOFF-ENGINE-DEMO.md)

- **What we did:** Full rewrite of `engine-demo.html` from the handoff spec. Standalone HTML/CSS/SVG/JS, no build step, works offline.
- **How it was built:**
  - Engine SVG (viewBox `0 0 1100 500`) is generated once in JS and mounted into both the scroll slide (`#engineScroll`) and the present slide (`#enginePres`) so the two copies can never drift. All gradients/markers/animation paths live in one top-level hidden `<svg>` defs block; both engine copies reference them by id (cross-SVG `url(#…)` + `mpath href`).
  - 7 slides, identical order in scroll + present: Title → Problem+Solution → What it finds → Engine → Quality (dark navy) → Principles (4) → Appendix.
  - Locked design constraints honored: 3 type sizes; engine palette c1–c5 reserved for agent circles only; all output-card badges monochrome (72px, Courier, #EDEEF0/#4A5568); Present button filled-blue when off / red-outlined when active.
  - Engine details: per-agent trigger badges, "completes →" cascade annotations, H markers on Curate (782,148) + Visualize (962,148), QUALITY CHECKS bar + 5 filled QA diamonds, orbiting QA dots + data particles + animated input feeds (all from the prior working version).
  - Devanagari corrected to the locked names: Curate = **Darpan · दर्पण** (the handoff's tooltip had दर्शन; CLAUDE.md locks दर्पण).
- **Verification:** JS syntax-checked (`node --check`), generated SVG validated as well-formed XML, full-page headless-Chrome screenshot (all 7 scroll slides), and present-mode screenshot of the dark Quality slide (counter, nav, dots all working). Could not use the preview MCP — port 3004 is held by the running `npm run dev` and the preview guard refuses to attach; served via a throwaway static server instead.
- **Framework state:** No change to the five steps or spec. Pure presentation-layer work.
- **Next session starts:** engine-demo.html is complete. Open it directly (`file://…/engine-demo.html`) or via the dev server. Optional follow-ups: tune mobile breakpoints live, or wire it into the Next app under `public/` if it should deploy.

---

## 2026-06-30 — engine-demo.html redesign (all decisions finalized; build pending)

- **What we did:** Full design pass on `engine-demo.html` — a standalone C-suite explainer/demo page for the Antilibrary System. Went through 5+ iterations with Bharat.
- **Key design decisions locked:**
  - SVG-based pipeline diagram (inspired by AIOS HTML pages): animated data particles, orbiting QA dots, hover tooltips on each agent
  - English names primary, Hindi in parentheses — American audience
  - Input sources shown entering Agent 1 (shelf photo, CSV/Excel, manual list, verbal)
  - Trigger badges per agent: NIGHTLY·ON CALL / PER BOOK·ON CALL / BATCH·ON CALL / HUMAN·ON CALL / ON RENDER·ON CALL
  - Cascade "completes →" annotations on connector lines
  - Human intervention markers (H circle) at Agents 4 and 5
  - QA diamonds larger, filled with agent color at low opacity
  - Present mode (slideshow toggle): filled blue when off, red-outlined when on
  - Slide order finalized: Title → Problem+Solution → **What it finds** (moved before engine — wow moment first) → Engine → Quality → Principles → Appendix
  - Pull quote on title slide: "A library that reads itself."
  - Output card badges: ALL monochrome (neutral gray #EDEEF0 / #4A5568 / Courier New) — no competition with engine color palette
  - Quality slide: dark navy #0F1A2E background + subline "Most AI systems are evaluated by the people who built them. This one evaluates itself."
  - Principles trimmed to 4 (removed "Doing is learning" — too personal for C-suite)
  - Appendix slide: "Extending the System Further" — 4-step generic pipeline (Ingest→Atomize→Realign→Show) with 6 example corpora. Main deck stays book-focused; reframe lives only in appendix
  - Writing pass: 732 anchored once on title slide only; passive constructions removed; consulting voice applied
- **Handoff file written:** `HANDOFF-ENGINE-DEMO.md` — full spec, slide order, copy, SVG coordinates, CSS design tokens, JS patterns, test checklist. Ready for fresh chat to execute the full build.
- **Framework state:** No changes to the five steps or spec. This session was pure presentation/communication layer work.
- **Decisions made:** Build in new chat (context was already long and summarized once; the spec is complete; fresh context will execute cleanly).
- **Next session starts:** Open a new chat with `HANDOFF-ENGINE-DEMO.md` as the primary brief. Build `engine-demo.html` from scratch per the spec. File is ~900–1000 lines HTML/CSS/SVG/JS, standalone (no build step).

---

## 2026-06-30 — Session close + portfolio synthesis + orientation refresh

- **Engine state:** Sangrah / Parichay / Manthan all built and run on the real library (732 books, ~3,498 atomic units). Darpan v1 (`darpan.html`). Pradarshan cover study (`covergrid.html`) settled but held.
- **Refreshed for handoff:** `HANDOFF-ENGINE-BUILD.md` rewritten to true current state (was stale at "Step 8"); regenerated `darpan.html` + `covergrid.html` from current data; updated `antilibrary-system.html` dates + catalog. All design + decisions live in: this log, `docs/ANTILIBRARY-ENGINE-SPEC.md`, `docs/AGENT-SCOPES.md`, `docs/PRADARSHAN-DESIGN-REFERENCE.md`, and the Build-log/Backlog catalog in `antilibrary-system.html`.
- **Strategic / learning work (new):** inventoried the whole `~/coding` portfolio; wrote a synthesis and a capability-arc into a new **AI-learning ledger** at `~/coding/ai-learning/` (`SYNTHESIS-the-work-and-the-journey.html`, `THE-ARC-path-traveled.html`, `LEARNING-LOG.md`). Bharat's framing (locked in memory `who-bharat-is`): profession = transformative-change consulting (A2A, AIOS); the library is where he learns → two books (4S, A2A); his signature strength = building "engines that think" (Lagom-Compositor, Napkin-Solo, Anti-Library/Manthan); visualization is an interest, not the forte; learning goal = AI-toolbox breadth anchored to engines; next missing tool = evaluation.
- **Chosen next move:** rebuild the Anti Library as a 4-agent multi-agent system (sequential → collaborative → evaluated), building evaluation in from the start.

---

## 2026-06-29 — Pradarshan cover-display study (covergrid.html)

- Built `scripts/build-covergrid.ts` → standalone `covergrid.html` (also in `public/`). Re-runnable, read-only. A Founders-Notes-style cover grid study to settle the Pradarshan tile treatment before porting to live `page.tsx`.
- **Final settled treatment (after several iterations with Bharat):**
  - Square corners everywhere (sharp-edge aesthetic — see [[sharp-edges-aesthetic]]).
  - Covers at a moderate size, ~157px cells (we went smaller → wider → 15% smaller again to land the proportion; tiles should read as book objects, not narrow columns). Generous 24px gap / whitespace.
  - Uniform −7.5° tilt on every cover (same angle for all — uniformity is what reads as clean).
  - Light gray border per card; turns blue on hover. Hover does the blue border and **nothing else**.
  - Title in **Georgia serif, weight 500, warm dark gray #3a352f** (not bold black — Bharat found bold sans too striking), up to 3 lines; author in muted sans below. Both permanent.
  - Designed colour fallback covers for the 140 missing-cover books (keyed to register colour).
- **Hover detail was tried and removed.** We experimented with a hover layer surfacing thread membership + register/year/units; Bharat decided no hover detail — keep title/author permanent underneath instead. Detail-page (click) explicitly out of scope.
- **Grid/list toggle** retained — list view columns: cover thumb, title, author, register, units (units = our analog to Founders Notes "Highlights").
- **Status: held.** Cover display paused here ("we'll see what we have to do"). Not yet ported into live `page.tsx`.

---

## 2026-06-29 — Darpan v1 built (darpan.html)

- Built `scripts/build-darpan.ts` (re-runnable generator, read-only derived view) + standalone `darpan.html` (also in `public/` for deploy at antilibrary.bharatkhandelwal.com/darpan.html). Built via a subagent; copy/design by Claude, stats computed from live JSON.
- **Lekha-Jokha** (verified): 732 books; humanist 63.9%, analytical 3 (all periodicals/doctrine); 3,498 atomic units, avg 4.79/book; covers 80.9%, years 94.1%, seeAlso 12.4%; 91 Manthan findings (strong 51); staging 12 new / 18 review.
- **Darshan** first spin: 6-beat self-portrait — Portrait → Three Founders You Didn't Choose → Unclaimed Depth → Unresolved Debates → What's Missing (with the 25%-capture honesty caveat) → The Mirror's Question (4 candidate spines, hands the choice to the curator). Each section backed by real findings from the matching lens + "Yes that's me / Not me / Add a note" reaction pills (visual, signalling dialogue not verdict).
- **Design intent — what Darshan elicits:** self-confrontation, not flattery. The anti-library mirror shows what you avoid, the tensions you hold, the founders you didn't choose. Ends on a question, not a verdict — that's the priming hook.
- Status: v1 to iterate on with Bharat. Lekha-Jokha ✅; Darshan = first spin.

---

## 2026-06-29 — Framework refinement: Step 4 Curate becomes Darpan (the mirror)

**Decision (locked):** Step 4 renamed **Curate / Darshan → Curate / Darpan (दर्पण, the mirror)**. The five-step spine stays; only Step 4 restructures.

**The new model:**
- **Engine** (produces data): Sangrah → Parichay → Manthan
- **Darpan — the mirror** (Step 4, internal-facing; you only see yourself):
  - **Lekha-Jokha (लेखा-जोखा)** — the numbers. Statistical, non-negotiable, always current. A derived view: stats generator → `darpan-stats.json` + `darpan-history.json` (the ledger) + internal dashboard.
  - **Darshan (दर्शन)** — the meaning. Interpretive portrait over Manthan findings; where priming happens.
- **Pradarshan — the window** (Step 5, external): the curator pulls a subset forward via a selection config.
- **Khoj** — forward loop (unchanged).

**Why:** Pradarshan was the only visualization, but it's external-only. We needed an internal operator view of all the statistics we generate (book counts, atomic units, coverage, pipeline state, trends) — reviewable by the owner. That view is Darpan. "Curate = Darpan": the curator knows everything in the mirror (numbers + meaning), then pulls what to show. Darshan returns to its true etymology — *seeing for yourself*, internal — as the interpretive half of the mirror.

**Progression:** count yourself (Lekha-Jokha) → understand yourself (Darshan) → show yourself (Pradarshan). Mirror before window.

**Updated:** ANTILIBRARY-ENGINE-SPEC.md (table, Step 4 section, flow, build sequence, principles), antilibrary-system.html (Step 4 card, flow, chips, catalog, naming, principles, footer), CLAUDE.md locked table. Build sequence now: 9 = Darpan/Lekha-Jokha (next), 10 = Darpan/Darshan, 11 = pull + Pradarshan, 12 = Khoj.

**Next build:** Darpan — Lekha-Jokha (the non-negotiable stats layer) first.

---

## 2026-06-29 — Incremental ingestion loop closed end-to-end

**What we did:**

### First full Sangrah run on shelf photos (the engine works)
- Fixed the last module-load Anthropic client bug (`extract.ts` — lazy `getClient()`)
- Ran Sangrah on 12 newest shelf photos → 36 spines, 6 already-in-inventory, 30 new
- High-confidence reads were coherent shelves: Japanese minimalism cluster, full USMC doctrine series (MCDP 1–6), Lee Kuan Yew
- "Needs review" queue worked as designed — mostly correct reads that enrichment couldn't verify (Magazine B issues, Chinese classics in bilingual form, Japanese-language books). Not misreads — unverifiable reads.
- Sangrah found Gulistan (Thackston translation) on its own → confirms the original miss was photo-framing, not the book.

### Closed the loop: Sangrah → Parichay → merge → Manthan
- Parichay (--include-review-queue) classified + decomposed all 30 staged books, 133 atomic units
- Merged classified entries into inventory with strict normalized-title dedup. **Inventory 708 → 732 (24 new).**
- **Key lesson:** Sangrah's fuzzy matcher gave 4 false negatives (books already in inventory flagged as new). The merge-time dedup caught them — no duplicates. **Dedup belongs at the merge gate, not trusted to Sangrah's matcher.**
- Full Manthan re-run on 732 books. The 24 new books materially reshaped the portrait:
  - NEW: "US Marine Corps Doctrine as Strategy Canon" (MCDP + Boyd + Team of Teams + On Grand Strategy)
  - NEW: "Korean Brand-Documentary Publishing (Magazine B)" micro-tradition
  - NEW: "Japan Curated Through Two Lenses" (authentic source vs Western-mediated aesthetic)
  - SELF-CORRECTED: the earlier "Absent: Middle Eastern traditions" finding narrowed to "Absent: Abrahamic theology" — the Persian + Chinese additions filled the earlier gap. Better data → better finding.

### Architecture decided: per-picture incremental flow
- Parichay = per-book, incremental (cheap). Manthan = whole-collection, cannot run "for just new books."
- Two Manthan modes: **delta pass** (where do new books fit — cheap, per batch) vs **full re-churn** (all 7 lenses, on ~10–20-book threshold or on demand).
- Loop: new photo → Sangrah (stage) → review → merge+dedup → Parichay → accumulate → threshold → Manthan.
- TODO features: build the Manthan delta pass; move dedup into a formal merge gate; better enrichment source for non-Google-Books items (Magazine B, foreign-language, classics).

**Inventory: 732 books. ideas.json: full new format. Loop: proven end-to-end.**

### ⚠ KNOWN ISSUE — Manthan full re-churn does not scale (priority)
The full re-run was slow and expensive. Running all 7 lenses across the whole library every time ~20 books are added to 700+ is wasteful, and it gets worse as the library grows to thousands. Manthan is where connections are made (its value), so we keep that — but we need a **delta method**, not whole-library recompute on every small addition.
- **Distribution lenses** (depth/register/era/tradition) are aggregate stats → update counts incrementally; only re-narrate when the distribution shifts materially.
- **Relational lenses** (tension/founding/hidden) → pre-filter candidate neighbors for each new book by tag/lineage/seeAlso overlap (cheap, no LLM), then run the LLM only on promising new-vs-existing pairs — not all pairs.
- Cache prior findings, merge deltas. Reserve full re-churn for periodic/on-demand. At scale, add an embedding index for candidate retrieval.
- Tracked as task #4.

---

## 2026-06-29 — Ingestion-quality discovery + known-gap recovery

**What we did:**

### Discovered the inventory has a systematic ~25% miss rate
- Audited one shelf photo (IMG_2911) book by book against inventory.json
- 20 readable spines → 15 in inventory, **5 missing (25%)**: Gulistan of Sadi, Graveyard of the Pacific, The Book of Elon, Little Black Stretchy Pants (Chip Wilson), Steve Kerr
- **Conclusive finding:** Gulistan is plainly visible in the photo → the original ingestion lost it *downstream of capture* (extraction or classification), not at photography
- The misses are not exotic — plain English business/sports books. Pattern: **books at the edges of stacks** (top/bottom, partially cut by frame) are where extraction fails
- The original inventory.json has **no provenance** (no sourceImages) and there's no sangrah-state/staging — it was built by a process that predates our Sangrah pipeline, so there's no trail to inspect. Empirical audit was the only way to find this.

### Built add-books — minimum-work path for KNOWN gaps
- `scripts/add-books.ts` — for books already identified by eye (title+author), skips vision entirely: enrich → classify → decompose → append. Staging preview, then --commit.
- Added all 5 found books. Inventory **703 → 708**.
- Gulistan classified as "Medieval Persian Sufi literature, origin Persia" — **directly fixes the "no Islamic/Middle Eastern tradition" absence Manthan had flagged**. Correction propagates.
- Quality note: Google Books returned no cover/year for these 5 — classification worked off title/author alone, but covers/years need backfilling.

### ⚠ KNOWN ISSUE TO ADDRESS — Ingestion quality (process + feature)
This is now a named, tracked problem with two levers, to be tackled as a **separate dedicated effort**:

1. **Quality of input (process).** Better shelf photos before any code runs. Direction to give people: face-out where possible, avoid deep stacks, **always capture the top and bottom of every stack** (that's where extraction fails). A one-page photography guide is a deliverable.
2. **Quality of first-pass reading (feature).** Multi-pass Sangrah: run each photo 2–3× and take the **union** (extraction is stochastic — a single pass misses ~25%). Plus edge-aware cropping, confidence flagging, and a human review step. Union logic to be built into Sangrah.

Both must be addressed before the inventory can be trusted as complete — and before Darshan curates a portrait from it (an absence finding is meaningless if the data is 25% lossy).

---

## 2026-06-29 — Full atomic-unit decompose + Manthan with tension pairs live

**What we did:**

### Re-decomposed the entire library into new atomic-unit format
- Built `scripts/batch-decompose.ts` — reads inventory.json directly (books already classified), runs only Pass 2 (decompose) + Wikipedia seeAlso, writes sliceable partial files
- Validated on a 10-book slice first (vertical slice): tension lens went 0 → 6 findings. Proved the path before scaling.
- Ran **6 parallel background workers** over all 703 books, ~117 each at concurrency 4, separate partial files (no write races)
- 700/703 decomposed (3 transient failures: A Beautiful Mind, Streetlights and Shadows, Working in Public)
- Merged into new-format `ideas.json`: **694 unique books, 3,336 atomic units, 88 with seeAlso**
- Old-format ideas.json backed up to `ideas-old-format.json.bak`
- Fixed lazy Anthropic client init in `decompose.ts` and `classify.ts` (same .env timing issue)

### Manthan full run on real atomic units — tension pairs unlocked
- All seven lenses fired. Tension_pairs lens went from **0 → 40 dedicated findings** (49 tension pairs total)
- Raised lens max_tokens to 16000 (tension output truncated at 8000 with 694 books of claims)
- Standout tension pairs (live debates the library holds):
  - Free will: Sapolsky's Behave vs. Sadhguru's Inner Engineering / Karma
  - Efficiency vs. friction: Toyota Production System cluster vs. Antifragile / Necessity of Friction
  - Marketing: loyalty school (Delivering Happiness) vs. Ehrenberg-Bass penetration (How Brands Grow)
  - Does experience teach? Klein's expert-intuition vs. Kahneman's Noise / Decision Traps
- Random probe surfaced 3 additional candidates

### Design reference captured for Pradarshan (Step 5)
- `docs/PRADARSHAN-DESIGN-REFERENCE.md` — Founders Notes library grid + book detail page
- Key insight: their detail page is "essence on top (AI synthesis box), evidence below (highlight cards)". Maps onto Antilibrary: essence = book's role in the library structure; evidence = its atomic units. Book as a node in the graph, not a catalogue entry.
- The tension to resolve: keep Founders Notes' cover-forward calm as the resting state; make Manthan's structure a layer you turn on.

**Build sequence state:**
- Steps 1–8 ✅ — Sangrah, Parichay, Manthan all built and run on real data
- ideas.json now full new-format with 3,336 atomic units
- Step 9: Darshan ← next (or Manthan priming interface)

---

## 2026-06-29 — Manthan agent built & first real run

**What we did:**

### Wikipedia "See also" added to Parichay enrichment
- `enrich.ts` now fetches the "See also" section links via MediaWiki action API
- Stored in `ideas.json` as `{ units, seeAlso }` per book — raw connection material for Manthan's relational lenses
- Wired into both classify and decompose prompts

### Manthan agent (built)
- `src/lib/manthan/types.ts` — InventoryBook, BookIdeas, LensResult, LensFinding, ProbeResult, PrimingSignal, ManthanAnalysis
- `src/lib/manthan/lenses.ts` — the seven lenses. Distribution (depth, register, era, tradition) on metadata; relational (tension_pairs, founding_figures, hidden_collections) on ideas.json
- `src/lib/manthan/probe.ts` — random probe: edge-book seed selection, shallow (metadata) + deep (atomic-unit-tag) probes
- `src/lib/manthan/index.ts` — three-stage orchestrator; preserves priming log across runs; normalises old + new ideas.json formats
- `scripts/manthan.ts` — CLI: `npm run manthan` with `--lenses`, `--skip-probe`, `--seeds` flags

### First real run against bk library (703 books)
- Six of seven lenses produced findings — 53+ total
- Standout findings: "Business: 111 books, almost zero depth", the accidental Posner law library, the cybernetics graduate seminar hiding at the end, Dawkins-vs-Patanjali register poles, the 2010s publishing singularity (60% in a 15-year window), absence of feminist/African/Islamic traditions
- Output written to `manthan-analysis.json`

### Decisions / fixes
- Lazy Anthropic client init (`getClient()`) — `.env.local` loads before client constructs
- max_tokens raised to 8000 for lens calls (703-book analyses overrun 3000)
- **tension_pairs lens needs new-format atomic units** (typed claims + tags). Current ideas.json is old format ({title, gloss}), so the dedicated tension lens returns 0 until Parichay re-runs. Known, not a bug.

### Documentation
- Added "How to work with Manthan" + three-stage section to spec
- Reorganised the seven lenses into distribution vs relational

**Build sequence state:**
- Steps 1–8 ✅ (Sangrah, Parichay, Manthan all built)
- Manthan priming interface — pending (Stage 3 is designed but not yet interactive)
- Step 9: Darshan ← next

**Next session starts at:**
Step 9 — Build the Darshan layer (editorial curation config), OR build Manthan's interactive priming interface first.

---

## 2026-06-29 — Sangrah & Parichay agents built

**What we did:**

### Sangrah agent (completed)
- Fixed top-level await error in `scripts/sangrah.ts` — wrapped in `async main()`
- Added `.env.local` loader to CLI scripts (mirrors Next.js behaviour for terminal runs)
- Confirmed CLI runs correctly — usage error when `--input` missing, full pipeline when provided
- 84 HEIC photos in `library-curator/bk-library/` ready for first test run (needs `ANTHROPIC_API_KEY` in `.env.local`)

### Scope documentation
- Created `docs/AGENT-SCOPES.md` — crisp boundaries for every agent: what it is, what it is not
- Key principle established: each agent's "is not" list is as important as its "is" list

### Parichay design decisions
- **Two-pass structure locked:** Pass 1 = classify the book; Pass 2 = decompose into atomic units. Classification runs first, its output (form) governs how many atomic units to extract.
- **Multi-taxonomy:** a book belongs to multiple categories simultaneously (e.g. Business AND Sports). `category` = primary, `categories` = all that apply. No forced exclusivity.
- **Atomic unit types:** concept / framework / story / claim / lens. Each unit is transferable — can be lifted from the source book and placed next to ideas from completely different books.
- **Unit count by form:** manual/reference = 3, narrative/portrait/anthology/journal = 4, essays = 5, argument/meditation = 6.
- **No abstraction in Parichay.** Units are stated at face value — what the idea is, not what it "means at a universal level." Abstraction, connections, tensions = Manthan's job.
- **Enrichment sources:** description (from Sangrah), table of contents from Google Books (chapter titles are the book's own decomposition), Wikipedia summary. All three fed to Claude before classification and decomposition.
- **Few-shot consistency:** classification uses 6 most-similar books from inventory as examples, to keep vocabulary (register, form, density) calibrated to established patterns.

### Parichay agent (built)
- `src/lib/parichay/types.ts` — BookContext, ClassifiedBook, AtomicUnit, ParichayEntry, ParichayStaging
- `src/lib/parichay/enrich.ts` — ToC from Google Books + Wikipedia summary, fetched in parallel
- `src/lib/parichay/classify.ts` — Pass 1 via Claude with 6 few-shot inventory examples
- `src/lib/parichay/decompose.ts` — Pass 2 via Claude; unit count governed by form
- `src/lib/parichay/index.ts` — orchestrator: enrich → classify → decompose → write staging + ideas.json
- `scripts/parichay.ts` — CLI: `npm run parichay`
- TypeScript compiles clean

**Outputs:**
- `parichay-staging.json` — classified + decomposed entries for human review
- `ideas.json` — atomic units keyed by book title, merged with any existing entries

**Build sequence state:**
- Steps 1–5 (data + spec) ✅
- Step 6: Sangrah agent ✅ built (pending first real run — needs API key)
- Step 7: Parichay agent ✅ built (pending Sangrah output to process)
- Step 8: Manthan agent ← next

**Next session starts at:**
Step 8 — Build the Manthan agent (`src/lib/manthan/`)

---

## 2026-06-29 — Framework & Reorganization

**What we did:**
- Extracted antilibrary from bk-site into its own standalone repo (`bk2022-ui/antilibrary`)
- Deleted stale `bk2022-ui/library-curator` GitHub repo
- Moved `src/data/` → `src/libraries/bk/` — multi-tenancy data layer
- Moved spec docs from library-curator into `antilibrary/docs/`
- Defined the five-step framework: Collect/Sangrah, Classify/Parichay, Churn/Manthan, Curate/Darshan, Visualize/Pradarshan
- Locked naming convention: English + Hindi, every step, every time
- Renamed system-level "Manthan" → "Antilibrary Engine"; Manthan reserved for Churn step only
- Wrote full spec in `docs/ANTILIBRARY-ENGINE-SPEC.md`
- Created `antilibrary-system.html` — visual system overview at repo root

**Framework state:**
- Five steps locked: Sangrah / Parichay / Manthan / Darshan / Pradarshan
- Build sequence: steps 1–5 complete, Sangrah agent is next

**Decisions made:**
- Darshan = private seeing (curator for themselves); Pradarshan = showing to others
- Khoj / Gaps sits outside the five steps as a forward-looking loop
- Visualization is Pradarshan — a client that reads, never writes
- `libraries/bk/` is Bharat's library instance; future libraries sit alongside it

**Next session starts at:**
Step 6 — Build the Sangrah agent (`src/lib/sangrah/`)
