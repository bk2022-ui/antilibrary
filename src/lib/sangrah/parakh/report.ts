// Assembles findings into a ParakhReport, writes parakh-report.json,
// and prints a grouped terminal summary.

import fs from "fs";
import type { ParakhFinding, ParakhReport, Severity } from "./types";

const SEVERITY_ORDER: Severity[] = ["high", "medium", "low"];

export function buildReport(
  findings: ParakhFinding[],
  opts: { checker: string; target: string; stagingPath: string },
): ParakhReport {
  const bySeverity: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  const byCheck: Record<string, number> = {};
  let proposals = 0;
  let flags = 0;

  for (const f of findings) {
    bySeverity[f.severity]++;
    byCheck[f.check] = (byCheck[f.check] ?? 0) + 1;
    if (f.kind === "proposal") proposals++;
    else flags++;
  }

  // Sort: severity desc, then by check name, then by location/index for stable review order.
  const sorted = [...findings].sort((a, b) => {
    const s = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
    if (s !== 0) return s;
    if (a.check !== b.check) return a.check.localeCompare(b.check);
    return a.id.localeCompare(b.id);
  });

  return {
    runDate: new Date().toISOString(),
    checker: opts.checker,
    target: opts.target,
    stagingPath: opts.stagingPath,
    summary: { total: findings.length, proposals, flags, bySeverity, byCheck },
    findings: sorted,
  };
}

export function writeReport(report: ParakhReport, reportPath: string): void {
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

const SEV_LABEL: Record<Severity, string> = {
  high: "HIGH",
  medium: "MED ",
  low: "LOW ",
};

/** Print a human-scannable summary grouped by severity. */
export function printSummary(report: ParakhReport, reportPath: string): void {
  const { summary, findings } = report;

  console.log("\n── Parakh / " + report.checker + " ──────────────────");
  console.log(`Assay of: ${report.target} staging (${report.stagingPath})`);
  console.log(
    `Found ${summary.total} finding(s): ` +
    `${summary.proposals} proposal(s), ${summary.flags} flag(s)`,
  );
  console.log(
    `  by severity:  ` +
    SEVERITY_ORDER.map((s) => `${s} ${summary.bySeverity[s]}`).join("   "),
  );
  console.log(
    `  by check:     ` +
    Object.entries(summary.byCheck).map(([k, v]) => `${k} ${v}`).join("   "),
  );

  for (const sev of SEVERITY_ORDER) {
    const group = findings.filter((f) => f.severity === sev);
    if (group.length === 0) continue;
    console.log(`\n  ── ${SEV_LABEL[sev]} ───────────────────────────────`);
    for (const f of group) {
      const tag = f.kind === "proposal" ? "FIX " : "FLAG";
      const loc = `${f.target.location}#${f.target.index}`;
      console.log(`  [${tag}] ${f.target.title}  (${loc})`);
      console.log(`         ${f.message}`);
      if (f.kind === "proposal") {
        console.log(`         ${f.field}: ${fmt(f.before)} → ${fmt(f.after)}`);
      }
    }
  }

  console.log(`\n  Report: ${reportPath}`);
  console.log(`  Review: set each finding's "status" to "accepted" or "rejected", then run apply (Phase 2).`);
  console.log("───────────────────────────────────────────────────\n");
}

function fmt(v: unknown): string {
  if (v === undefined) return "(none)";
  if (v === null) return "(null)";
  return String(v);
}
