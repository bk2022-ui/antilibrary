// Types for the Sangrah (Collect) agent pipeline

/** Raw extraction of one spine from Claude vision */
export interface ExtractedSpine {
  title: string;
  author: string;
  confidence: "high" | "medium" | "low" | "none";
  reason?: string; // why confidence is not high
  sourceImage: string; // filename of the image it came from
}

/** Result of matching an extracted spine against the existing inventory */
export type MatchStatus =
  | "existing"      // already in inventory — skip enrichment
  | "new"           // not in inventory — proceed to enrichment
  | "possible_sibling"; // same title exists but different edition

export interface MatchedSpine extends ExtractedSpine {
  matchStatus: MatchStatus;
  matchedTitle?: string; // the title in inventory it matched against
}

/** A fully enriched, ready-to-stage inventory entry */
export interface StagingEntry {
  title: string;
  author: string;
  year?: number;
  isbn13?: string;
  isbn10?: string;
  coverUrl?: string;
  description?: string;
  status: "antilibrary"; // default for newly collected books
  confidence: "high" | "medium" | "low";
  sourceImages: string[]; // all images this book appeared in
  canonical_id?: string; // set if this is a sibling of an existing entry
  enriched: boolean; // whether Google Books lookup succeeded
  needsReview: boolean; // true if confidence < high or enrichment failed
  reviewReason?: string;
}

/** The full output of one Sangrah run */
export interface SangrahStaging {
  runDate: string;
  inputFolder: string;
  imagesProcessed: string[];
  summary: {
    extracted: number;
    existingConfirmed: number;
    newHighConfidence: number;
    needsReview: number;
    unreadable: number;
  };
  newEntries: StagingEntry[];
  reviewQueue: StagingEntry[];
  existingConfirmed: string[]; // titles already in inventory, found again
  unreadable: ExtractedSpine[]; // confidence: none
}

/** State persisted between runs for incremental processing */
export interface SangrahState {
  lastRun: string; // ISO timestamp
  processedFiles: string[]; // filenames already processed
  booksAdded: number; // cumulative total merged into inventory
  runs: Array<{
    date: string;
    filesProcessed: number;
    newBooks: number;
  }>;
}
