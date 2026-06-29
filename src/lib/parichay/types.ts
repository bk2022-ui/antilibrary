// Types for the Parichay (Classify) agent pipeline

/** Enriched context fetched before classification */
export interface BookContext {
  title: string;
  author: string;
  year?: number;
  description?: string;
  tableOfContents?: string[];  // chapter titles from Google Books, if available
  wikipediaSummary?: string;   // Wikipedia extract, if available
  wikipediaSeeAlso?: string[]; // "See also" article titles — raw connection material for Manthan
}

/** Full classification of a book — Pass 1 output */
export interface ClassifiedBook {
  category: string;
  categories: string[];
  topic: string;
  subject: string;
  subtopics: string[];
  register: "empirical" | "systems" | "humanist" | "philosophical" | "contemplative" | "analytical";
  density: "accessible" | "substantive" | "dense";
  form: "argument" | "narrative" | "portrait" | "manual" | "meditation" | "reference" | "anthology" | "journal" | "essays";
  lineage: string | null;
  author_origin: string;
  author_tradition: string;
}

/** One atomic unit extracted from a book — Pass 2 output */
export interface AtomicUnit {
  id: string;           // slug: "succession-without-disruption"
  type: "concept" | "framework" | "story" | "claim" | "lens";
  title: string;        // short name
  body: string;         // 2-3 sentences — exact mechanism, no decoration
  tags: string[];       // honest labels describing what this unit is about
  sourceBook: string;   // title of the book it came from
}

/** Full Parichay output for one book */
export interface ParichayEntry {
  // Identity (passed through from Sangrah staging)
  title: string;
  author: string;
  year?: number;
  isbn13?: string;
  isbn10?: string;
  coverUrl?: string;
  description?: string;
  status: string;
  sourceImages?: string[];
  canonical_id?: string;

  // Pass 1 — classification
  classification: ClassifiedBook;

  // Pass 2 — decomposition
  atomicUnits: AtomicUnit[];

  // Wikipedia connection material (stored for Manthan)
  wikipediaSeeAlso?: string[];

  // Meta
  parichayAt: string; // ISO timestamp
  needsReview: boolean;
  reviewReason?: string;
}

/** Full output of one Parichay run */
export interface ParichayStaging {
  runDate: string;
  summary: {
    input: number;
    classified: number;
    atomicUnitsExtracted: number;
    needsReview: number;
    failed: number;
  };
  entries: ParichayEntry[];
  failed: Array<{ title: string; author: string; error: string }>;
}
