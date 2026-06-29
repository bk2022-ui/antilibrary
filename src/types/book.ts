/**
 * A book in a curated library. We let Claude propose the picks, then enrich
 * each one with real metadata from an open book-data source (Google Books /
 * Open Library) so titles, covers, and ISBNs are accurate.
 */

export interface BookSuggestion {
  /** Why Claude chose this book for this specific reader. */
  rationale: string;
  /** Optional grouping, e.g. "Foundations", "For your craft", "Evenings". */
  shelf?: string;
}

export interface BookMetadata {
  title: string;
  authors: string[];
  description?: string;
  publishedYear?: number;
  pageCount?: number;
  categories?: string[];
  isbn13?: string;
  isbn10?: string;
  coverUrl?: string;
  /** Outbound links — we don't sell books, we point to where to get them. */
  infoUrl?: string;
}

/** A fully-resolved pick: Claude's reasoning + real-world metadata. */
export interface CuratedBook extends BookSuggestion {
  query: string; // what we searched the data source for (title + author)
  metadata?: BookMetadata; // undefined if no confident match was found
}
