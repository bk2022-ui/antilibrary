// Parakh — the assay layer of the Antilibrary Engine.
//
// Parakh is a *family* of checker/auditor agents, one per engine step.
// Each concrete checker is named parakh-<target>-<lens>, e.g.
//   parakh-sangrah-structure     — deterministic record integrity (this file's world)
//   parakh-sangrah-recall        — vision re-check for missed spines (later)
//   parakh-sangrah-plausibility  — record coherence via world-knowledge (later)
//
// All checkers emit the SAME report shape and ride the same
// propose → review → apply rail. They differ only in HOW they detect.

/** How loud a finding is. */
export type Severity = "high" | "medium" | "low";

/**
 * A finding is either:
 *  - a **proposal**: a deterministic fix with a clear before → after that a
 *    human accepts or rejects, or
 *  - a **flag**: something that needs human eyes but has no safe auto-fix.
 * Keeping these distinct stops the agent from dressing a flag up as a fix.
 */
export type FindingKind = "proposal" | "flag";

/** Review decision. Defaults to "pending" — nothing is applied until a human moves it. */
export type FindingStatus = "pending" | "accepted" | "rejected";

/** Which bucket of the staging file an entry lives in. */
export type StagingLocation = "newEntries" | "reviewQueue";

export interface FindingTarget {
  title: string;
  author?: string;
  location: StagingLocation;
  /** Index within that bucket in sangrah-staging.json. */
  index: number;
}

export interface ParakhFinding {
  /** Stable id: `${check}:${location}:${index}` — lets apply re-locate the entry. */
  id: string;
  /** The checker that raised it, e.g. "parakh-sangrah-structure". */
  checker: string;
  /** The specific check, e.g. "isbn-checksum". */
  check: string;
  kind: FindingKind;
  severity: Severity;
  target: FindingTarget;
  /** Human-readable: what is wrong and why. */
  message: string;
  /** The field a proposal would change (proposals only). */
  field?: string;
  /** Current value (proposals only). */
  before?: unknown;
  /** Proposed value (proposals only). */
  after?: unknown;
  /** Review decision. Human edits this; apply reads it. */
  status: FindingStatus;
}

export interface ParakhReport {
  runDate: string;
  /** The checker(s) that ran, e.g. "parakh-sangrah-structure". */
  checker: string;
  /** The engine step under assay, e.g. "sangrah". */
  target: string;
  stagingPath: string;
  summary: {
    total: number;
    proposals: number;
    flags: number;
    bySeverity: Record<Severity, number>;
    byCheck: Record<string, number>;
  };
  findings: ParakhFinding[];
}
