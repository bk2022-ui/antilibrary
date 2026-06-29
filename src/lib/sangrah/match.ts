import type { ExtractedSpine, MatchedSpine, MatchStatus } from "./types";

/** Minimal inventory entry shape for matching */
interface InventoryEntry {
  title: string;
  author?: string;
}

/**
 * Normalise a string for fuzzy comparison:
 * lowercase, strip punctuation and articles, collapse whitespace.
 */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Simple character-overlap similarity — fast, no dependencies */
function similarity(a: string, b: string): number {
  const na = normalise(a);
  const nb = normalise(b);
  if (na === nb) return 1;
  if (!na || !nb) return 0;

  // Token overlap: what fraction of a's words appear in b?
  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const overlap = [...wordsA].filter((w) => wordsB.has(w)).length;
  return overlap / Math.max(wordsA.size, wordsB.size);
}

const MATCH_THRESHOLD = 0.75; // ≥75% token overlap → consider a match

/**
 * Match one extracted spine against the inventory.
 * Returns the match status and the matched title if found.
 */
export function matchSpine(
  spine: ExtractedSpine,
  inventory: InventoryEntry[],
): { status: MatchStatus; matchedTitle?: string } {
  if (spine.confidence === "none") {
    return { status: "new" }; // unreadable — goes to review queue regardless
  }

  let bestScore = 0;
  let bestTitle: string | undefined;

  for (const entry of inventory) {
    const score = similarity(spine.title, entry.title);
    if (score > bestScore) {
      bestScore = score;
      bestTitle = entry.title;
    }
  }

  if (bestScore >= MATCH_THRESHOLD) {
    // Check if it's a likely sibling (same title, different author or edition)
    const matchedEntry = inventory.find((e) => e.title === bestTitle);
    if (
      matchedEntry?.author &&
      spine.author &&
      similarity(spine.author, matchedEntry.author) < 0.5
    ) {
      return { status: "possible_sibling", matchedTitle: bestTitle };
    }
    return { status: "existing", matchedTitle: bestTitle };
  }

  return { status: "new" };
}

/** Match all extracted spines against the inventory */
export function matchAllSpines(
  spines: ExtractedSpine[],
  inventory: InventoryEntry[],
): MatchedSpine[] {
  return spines.map((spine) => {
    const { status, matchedTitle } = matchSpine(spine, inventory);
    return { ...spine, matchStatus: status, matchedTitle };
  });
}
