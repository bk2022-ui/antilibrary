import type { BookMetadata } from "@/types/book";

/**
 * Look up book metadata from Open Library — free, open, and no API key needed.
 *
 * We search by the title + author string Claude gives us and take the best
 * match, then build a cover URL and an outbound link to the work's page.
 *
 * Docs: https://openlibrary.org/dev/docs/api/search
 */

const ENDPOINT = "https://openlibrary.org/search.json";
const FIELDS = "title,author_name,first_publish_year,cover_i,isbn,key";

// Open Library asks API users to identify themselves via User-Agent.
const HEADERS = { "User-Agent": "LibraryCurator/0.1 (book metadata lookup)" };

interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
  key?: string; // e.g. "/works/OL93641W"
}

export async function lookupBook(query: string): Promise<BookMetadata | undefined> {
  const params = new URLSearchParams({ q: query, limit: "1", fields: FIELDS });
  const res = await fetch(`${ENDPOINT}?${params.toString()}`, { headers: HEADERS });
  // Throw on transient failures (e.g. 429) so callers can retry; a genuine
  // "no match" returns undefined and is not worth retrying.
  if (!res.ok) throw new Error(`Open Library ${res.status}`);

  const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
  const doc = data.docs?.[0];
  if (!doc) return undefined;

  const isbns = doc.isbn ?? [];
  const isbn13 = isbns.find((i) => i.length === 13);
  const isbn10 = isbns.find((i) => i.length === 10);

  return {
    title: doc.title ?? query,
    authors: doc.author_name ?? [],
    publishedYear: doc.first_publish_year,
    isbn13,
    isbn10,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : undefined,
    infoUrl: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function lookupWithRetry(query: string, attempts = 3): Promise<BookMetadata | undefined> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await lookupBook(query);
    } catch {
      if (i < attempts - 1) await sleep(400 * (i + 1)); // back off on throttling
    }
  }
  return undefined;
}

/**
 * Enrich many picks with limited concurrency so we stay friendly to Open
 * Library and avoid the throttling we hit when firing everything at once.
 */
export async function lookupBooks(queries: string[]): Promise<(BookMetadata | undefined)[]> {
  const CONCURRENCY = 4;
  const out = new Array<BookMetadata | undefined>(queries.length);
  let next = 0;

  async function worker() {
    while (next < queries.length) {
      const i = next++;
      out[i] = await lookupWithRetry(queries[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queries.length) }, worker));
  return out;
}
