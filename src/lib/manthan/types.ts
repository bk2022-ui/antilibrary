// Types for the Manthan (Churn) agent

/** One inventory book — only the fields Manthan needs */
export interface InventoryBook {
  title: string;
  author: string;
  year?: number;
  category?: string;
  categories?: string[];
  topic?: string;
  subject?: string;
  subtopics?: string[];
  register?: string;
  density?: string;
  form?: string;
  lineage?: string | null;
  author_origin?: string;
  author_tradition?: string;
  status?: string;
}

/** Atomic unit from ideas.json */
export interface AtomicUnit {
  id: string;
  type: string;
  title: string;
  body: string;
  tags: string[];
  sourceBook: string;
}

/** Full ideas.json entry for one book */
export interface BookIdeas {
  units: AtomicUnit[];
  seeAlso: string[];
}

/** Output of one lens */
export interface LensResult {
  lens: string;
  findings: LensFinding[];
}

export interface LensFinding {
  type: "thread" | "cluster" | "pattern" | "tension_pair" | "founding_figure" | "hidden_collection" | "observation";
  name: string;
  description: string;
  books: string[]; // titles
  strength: "strong" | "moderate" | "weak";
  evidence: string; // what in the data supports this
}

/** Output of the random probe */
export interface ProbeResult {
  seedBook: string;
  probeType: "shallow" | "deep";
  candidate: LensFinding;
}

/** One priming exchange */
export interface PrimingSignal {
  date: string;
  signal: string;        // what the human said
  type: "confirm" | "reject" | "correct" | "direct" | "question";
  affectedFinding?: string; // name of the finding it refers to
  note: string;          // what changed as a result
}

/** Full Manthan run output */
export interface ManthanAnalysis {
  runDate: string;
  inventorySize: number;
  booksWithIdeas: number;
  lensResults: LensResult[];
  probeResults: ProbeResult[];
  primingLog: PrimingSignal[];
  summary: {
    threadsFound: number;
    tensionPairsFound: number;
    foundingFiguresFound: number;
    hiddenCollectionsFound: number;
    probeCandidates: number;
  };
}
