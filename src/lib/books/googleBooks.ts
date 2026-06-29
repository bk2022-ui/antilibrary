import type { BookMetadata } from "@/types/book";

/**
 * Look up a single book's metadata from the Google Books API.
 *
 * Google Books is free and needs no key for basic volume search (a key raises
 * the rate limit; set GOOGLE_BOOKS_API_KEY to use it). We search by the title +
 * author string Claude gives us and take the best match.
 *
 * Docs: https://developers.google.com/books/docs/v1/using
 */

const ENDPOINT = "https://www.googleapis.com/books/v1/volumes";

interface GoogleVolume {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    infoLink?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
  };
}

export async function lookupBook(query: string): Promise<BookMetadata | undefined> {
  const params = new URLSearchParams({ q: query, maxResults: "1", printType: "books" });
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (key) params.set("key", key);

  const res = await fetch(`${ENDPOINT}?${params.toString()}`);
  if (!res.ok) return undefined;

  const data = (await res.json()) as { items?: GoogleVolume[] };
  const info = data.items?.[0]?.volumeInfo;
  if (!info) return undefined;

  const ids = info.industryIdentifiers ?? [];
  const isbn13 = ids.find((i) => i.type === "ISBN_13")?.identifier;
  const isbn10 = ids.find((i) => i.type === "ISBN_10")?.identifier;
  const year = info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : undefined;
  const cover = (info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail)?.replace(
    "http://",
    "https://",
  );

  return {
    title: info.title ?? query,
    authors: info.authors ?? [],
    description: info.description,
    publishedYear: Number.isFinite(year) ? year : undefined,
    pageCount: info.pageCount,
    categories: info.categories,
    isbn13,
    isbn10,
    coverUrl: cover,
    infoUrl: info.infoLink,
  };
}

/** Enrich many picks concurrently, tolerating individual lookup failures. */
export async function lookupBooks(queries: string[]): Promise<(BookMetadata | undefined)[]> {
  return Promise.all(
    queries.map((q) => lookupBook(q).catch(() => undefined)),
  );
}
