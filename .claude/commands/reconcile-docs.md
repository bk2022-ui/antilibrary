# /reconcile-docs — keep the design surfaces in sync

Reconcile the Antilibrary's design documentation. The **markdown docs are the authored
source of truth**; the two HTML surfaces are **views** that must not drift from them.
Markdown wins on any conflict.

## Surfaces

**Canonical (markdown, in `~/coding/antilibrary`):**
- `CLAUDE.md`, `HANDOFF-CURRENT.md`, `SESSION-LOG.md`
- `docs/ANTILIBRARY-ENGINE-SPEC.md`, `docs/AGENT-SCOPES.md`
- `docs/PARAKH-ARCHITECTURE.md`, `docs/PARAKH-DESIGN-REFERENCE.md`, `docs/PRADARSHAN-DESIGN-REFERENCE.md`

**Views:**
- **Internal** — `antilibrary-system.html` (the design hub / dashboard), this repo.
- **Public** — `~/coding/bk-site/public/engine-demo.html` (C-suite explainer), bk-site repo.

## What to check (markdown is canonical)

1. **Parakh matrix** — `antilibrary-system.html`'s archetypes×steps table matches the matrix and per-cell statuses in `docs/PARAKH-ARCHITECTURE.md`.
2. **Five steps · names · flow** — the locked step names, the flow, and the Parakh/Taal cross-cutting layers are consistent across the engine spec, `antilibrary-system.html`, and `engine-demo.html`.
3. **Build log / Backlog** (`antilibrary-system.html`) — consistent with the latest `SESSION-LOG` state; shipped items moved out of Backlog.
4. **Design-docs index** (`antilibrary-system.html`) — lists every `docs/*.md` + top-level design `.md`; no missing entries, no dead links, purposes still accurate.
5. **Status lines / dates** — subtitle + footer dates current; any "all N steps" / count claims accurate.
6. **Public engine-demo** — no claim that contradicts current reality (stale counts, dead links like the retired `antilibrary.bharatkhandelwal.com` subdomain, superseded naming).

## What to do

- **Internal `antilibrary-system.html`** — fix drift to match the canonical markdown. Update the **"Last reconciled"** stamp in the footer. Commit to the antilibrary repo. Stage **only** the reconcile changes — **never** the `src/libraries/tim-boyle/` test bed or the uncommitted `src/lib/**` edits.
- **Public `engine-demo.html` (bk-site)** — outward-facing: **report proposed changes, do not push without a human.** If told to proceed, run `npm run build` in bk-site before pushing (Vercel is stricter than dev).
- **Never duplicate markdown prose into the HTML** — summarize and link. The HTML carries structure + status + links; the depth stays in markdown.

## Report

Summarize: what was in sync, what drifted, what you fixed (internal), and any public-facing proposals awaiting review.
