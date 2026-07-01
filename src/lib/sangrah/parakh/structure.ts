// parakh-sangrah-structure — deterministic record integrity checks over
// Sangrah's staging output. Read-only: it produces findings, it mutates nothing.

import type { SangrahStaging, StagingEntry } from "../types";
import type { ParakhFinding, StagingLocation, Severity } from "./types";
import { isValidIsbn10, isValidIsbn13, isbn13FromIsbn10 } from "./isbn";

const CHECKER = "parakh-sangrah-structure";

/** Minimal inventory shape we rely on for the duplicate scan. */
export interface InventoryEntry {
  title: string;
  author?: string;
}

/** Normalise a title for equality comparison (mirrors dedupe.ts). */
function normTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/[^\w]/g, "")
    .trim();
}

/** Normalise an author for loose comparison. */
function normAuthor(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

const CURRENT_YEAR = new Date().getFullYear();
const EARLIEST_PLAUSIBLE_YEAR = 1400; // Gutenberg-era floor; older = almost certainly bad metadata

interface Located {
  entry: StagingEntry;
  location: StagingLocation;
  index: number;
}

function mkFinding(
  loc: Located,
  check: string,
  kind: ParakhFinding["kind"],
  severity: Severity,
  message: string,
  extra?: Partial<Pick<ParakhFinding, "field" | "before" | "after">>,
): ParakhFinding {
  return {
    id: `${check}:${loc.location}:${loc.index}`,
    checker: CHECKER,
    check,
    kind,
    severity,
    target: {
      title: loc.entry.title,
      author: loc.entry.author,
      location: loc.location,
      index: loc.index,
    },
    message,
    status: "pending",
    ...extra,
  };
}

/** ISBN checksums — flag invalid, propose derive-13-from-10 where possible. */
function checkIsbn(loc: Located): ParakhFinding[] {
  const out: ParakhFinding[] = [];
  const { entry } = loc;

  if (entry.isbn10 && !isValidIsbn10(entry.isbn10)) {
    out.push(
      mkFinding(loc, "isbn-checksum", "flag", "medium",
        `isbn10 "${entry.isbn10}" fails its checksum — likely a bad enrichment match.`,
        { field: "isbn10", before: entry.isbn10 }),
    );
  }

  if (entry.isbn13 && !isValidIsbn13(entry.isbn13)) {
    // If we have a valid isbn10, we can propose a correct isbn13 from it.
    const derived = entry.isbn10 ? isbn13FromIsbn10(entry.isbn10) : null;
    if (derived) {
      out.push(
        mkFinding(loc, "isbn-checksum", "proposal", "medium",
          `isbn13 "${entry.isbn13}" fails its checksum; derived a valid one from isbn10.`,
          { field: "isbn13", before: entry.isbn13, after: derived }),
      );
    } else {
      out.push(
        mkFinding(loc, "isbn-checksum", "flag", "medium",
          `isbn13 "${entry.isbn13}" fails its checksum and no valid isbn10 to derive from.`,
          { field: "isbn13", before: entry.isbn13 }),
      );
    }
  }

  // Have a valid isbn10 but no isbn13 at all → propose deriving it.
  if (entry.isbn10 && isValidIsbn10(entry.isbn10) && !entry.isbn13) {
    const derived = isbn13FromIsbn10(entry.isbn10);
    if (derived) {
      out.push(
        mkFinding(loc, "isbn-checksum", "proposal", "low",
          `no isbn13 present; derived one from the valid isbn10.`,
          { field: "isbn13", before: undefined, after: derived }),
      );
    }
  }

  return out;
}

/** Missing core fields — pure flags (no deterministic fix). */
function checkMissingFields(loc: Located): ParakhFinding[] {
  const out: ParakhFinding[] = [];
  const { entry } = loc;
  if (!entry.author || !entry.author.trim()) {
    out.push(mkFinding(loc, "missing-field", "flag", "medium",
      `no author on record.`, { field: "author" }));
  }
  if (entry.year === undefined || entry.year === null) {
    out.push(mkFinding(loc, "missing-field", "flag", "low",
      `no publication year on record.`, { field: "year" }));
  }
  if (!entry.isbn10 && !entry.isbn13) {
    out.push(mkFinding(loc, "missing-field", "flag", "low",
      `no ISBN of either form on record.`, { field: "isbn" }));
  }
  return out;
}

/** Year sanity — future or pre-1400 years signal bad metadata. */
function checkYear(loc: Located): ParakhFinding[] {
  const { entry } = loc;
  if (entry.year === undefined || entry.year === null) return [];
  if (entry.year > CURRENT_YEAR) {
    return [mkFinding(loc, "year-sanity", "flag", "medium",
      `year ${entry.year} is in the future — bad enrichment.`,
      { field: "year", before: entry.year })];
  }
  if (entry.year < EARLIEST_PLAUSIBLE_YEAR) {
    return [mkFinding(loc, "year-sanity", "flag", "low",
      `year ${entry.year} predates ${EARLIEST_PLAUSIBLE_YEAR} — suspect metadata.`,
      { field: "year", before: entry.year })];
  }
  return [];
}

/**
 * Enrichment-failure triage — categorise enriched:false items so the review
 * queue stops crying wolf. A confident read that simply isn't in the metadata
 * APIs (Japanese-language books, Magazine B, service manuals) is not a defect;
 * a low-confidence read that also failed to enrich is genuinely suspect.
 */
function checkEnrichmentTriage(loc: Located): ParakhFinding[] {
  const { entry } = loc;
  if (entry.enriched) return [];
  if (entry.confidence === "high") {
    return [mkFinding(loc, "enrichment-triage", "flag", "low",
      `confident read but no metadata match — likely a real book absent from the ` +
      `lookup APIs, not a defect. Verify title/author, then accept as-is.`)];
  }
  return [mkFinding(loc, "enrichment-triage", "flag", "medium",
    `${entry.confidence}-confidence read AND enrichment failed — genuinely suspect; verify against the spine.`)];
}

/**
 * Duplicate scan — a new entry whose title already exists in the 732-book
 * inventory, or collides with another staged entry the dedupe missed.
 * Inventory has no ISBN, so matching is on normalised title (+ author when both present).
 */
function checkDuplicates(
  located: Located[],
  inventory: InventoryEntry[],
): ParakhFinding[] {
  const out: ParakhFinding[] = [];

  // Index inventory by normalised title.
  const invByTitle = new Map<string, InventoryEntry[]>();
  for (const inv of inventory) {
    const k = normTitle(inv.title);
    if (!k) continue;
    (invByTitle.get(k) ?? invByTitle.set(k, []).get(k)!).push(inv);
  }

  const seenInRun = new Map<string, Located>();

  for (const loc of located) {
    const k = normTitle(loc.entry.title);
    if (!k) continue;

    // Against the existing inventory.
    const invHits = invByTitle.get(k);
    if (invHits && invHits.length > 0) {
      const authorMatch = invHits.some(
        (h) => h.author && loc.entry.author &&
          normAuthor(h.author) === normAuthor(loc.entry.author),
      );
      const severity: Severity = authorMatch ? "high" : "medium";
      const qualifier = authorMatch
        ? "same title and author"
        : "same title, author differs — could be a sibling edition";
      out.push(mkFinding(loc, "duplicate", "flag", severity,
        `"${loc.entry.title}" already in inventory (${qualifier}); Sangrah staged it as new.`));
    }

    // Against other staged entries (dedupe miss).
    const prior = seenInRun.get(k);
    if (prior) {
      out.push(mkFinding(loc, "duplicate", "flag", "medium",
        `duplicates already-staged "${prior.entry.title}" ` +
        `(${prior.location}#${prior.index}) — dedupe missed it.`));
    } else {
      seenInRun.set(k, loc);
    }
  }

  return out;
}

/** Run all structure checks over a staging file. Read-only. */
export function runStructureChecks(
  staging: SangrahStaging,
  inventory: InventoryEntry[],
): ParakhFinding[] {
  const located: Located[] = [
    ...staging.newEntries.map((entry, index) => ({ entry, location: "newEntries" as const, index })),
    ...staging.reviewQueue.map((entry, index) => ({ entry, location: "reviewQueue" as const, index })),
  ];

  const findings: ParakhFinding[] = [];
  for (const loc of located) {
    findings.push(...checkIsbn(loc));
    findings.push(...checkMissingFields(loc));
    findings.push(...checkYear(loc));
    findings.push(...checkEnrichmentTriage(loc));
  }
  findings.push(...checkDuplicates(located, inventory));

  return findings;
}
