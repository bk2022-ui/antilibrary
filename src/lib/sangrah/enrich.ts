import { lookupBook as googleLookup } from "@/lib/books/googleBooks";
import { lookupBook as openLibraryLookup } from "@/lib/books/openLibrary";
import type { MatchedSpine, StagingEntry } from "./types";

/** Enrich a matched spine with metadata from Google Books, fallback to Open Library */
export async function enrichSpine(spine: MatchedSpine): Promise<StagingEntry> {
  const query = `${spine.title} ${spine.author}`.trim();
  let metadata = await googleLookup(query);

  // Fall back to Open Library if Google Books returned nothing
  if (!metadata) {
    try {
      metadata = await openLibraryLookup(query);
    } catch {
      // Open Library is best-effort
    }
  }

  const needsReview =
    spine.confidence !== "high" ||
    !metadata ||
    spine.matchStatus === "possible_sibling";

  const reviewReasons: string[] = [];
  if (spine.confidence !== "high" && spine.reason) reviewReasons.push(spine.reason);
  if (!metadata) reviewReasons.push("enrichment lookup returned no results");
  if (spine.matchStatus === "possible_sibling")
    reviewReasons.push("possible sibling of existing entry — verify edition");

  return {
    title: metadata?.title ?? spine.title,
    author: metadata?.authors?.[0] ?? spine.author,
    year: metadata?.publishedYear,
    isbn13: metadata?.isbn13,
    isbn10: metadata?.isbn10,
    coverUrl: metadata?.coverUrl,
    description: metadata?.description,
    status: "antilibrary",
    confidence: spine.confidence === "none" ? "low" : spine.confidence,
    sourceImages: [spine.sourceImage],
    canonical_id: spine.matchStatus === "possible_sibling" ? spine.matchedTitle : undefined,
    enriched: !!metadata,
    needsReview,
    reviewReason: reviewReasons.length > 0 ? reviewReasons.join("; ") : undefined,
  };
}

/** Enrich all new spines with rate-limited concurrency */
export async function enrichAllSpines(
  spines: MatchedSpine[],
  concurrency = 4,
): Promise<StagingEntry[]> {
  const results: StagingEntry[] = [];
  let i = 0;

  async function worker() {
    while (i < spines.length) {
      const spine = spines[i++];
      results.push(await enrichSpine(spine));
      // Small delay to stay friendly to APIs
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, spines.length) }, worker),
  );

  return results;
}
