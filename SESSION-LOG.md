# Antilibrary — Session Log

Newest session first. Update this at the end of every working session before closing.

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
