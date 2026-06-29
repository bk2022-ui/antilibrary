import type { StagingEntry } from "./types";

/**
 * Cross-image deduplication.
 *
 * The same book can appear in multiple shelf photos (overlap between shots,
 * same shelf photographed from different angles). Collapse duplicates into
 * one entry, merging their sourceImages arrays and taking the highest
 * confidence reading.
 */

function normTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/[^\w]/g, "")
    .trim();
}

const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 };

export function deduplicateEntries(entries: StagingEntry[]): StagingEntry[] {
  const seen = new Map<string, StagingEntry>();

  for (const entry of entries) {
    const key = normTitle(entry.title);
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, { ...entry });
    } else {
      // Keep the higher-confidence version, merge sourceImages
      const existingRank = CONFIDENCE_RANK[existing.confidence] ?? 0;
      const entryRank = CONFIDENCE_RANK[entry.confidence] ?? 0;
      const winner = entryRank > existingRank ? entry : existing;

      seen.set(key, {
        ...winner,
        sourceImages: [
          ...new Set([...existing.sourceImages, ...entry.sourceImages]),
        ],
        // If either reading needs review, the merged entry does too
        needsReview: existing.needsReview || entry.needsReview,
        reviewReason: [existing.reviewReason, entry.reviewReason]
          .filter(Boolean)
          .join("; ") || undefined,
      });
    }
  }

  return [...seen.values()];
}
