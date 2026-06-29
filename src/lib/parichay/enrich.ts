// Parichay enrichment — fetch ToC, Wikipedia summary, and Wikipedia "See also" links

export interface EnrichmentResult {
  tableOfContents?: string[];
  wikipediaSummary?: string;
  wikipediaSeeAlso?: string[]; // titles of related Wikipedia articles from "See also" section
}

/** Fetch table of contents from Google Books using ISBN or title search */
async function fetchTableOfContents(
  title: string,
  author: string,
  isbn13?: string,
): Promise<string[] | undefined> {
  try {
    const key = process.env.GOOGLE_BOOKS_API_KEY;
    const query = isbn13 ? `isbn:${isbn13}` : `intitle:${title} inauthor:${author}`;
    const params = new URLSearchParams({ q: query, maxResults: "1", printType: "books" });
    if (key) params.set("key", key);

    const searchRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
    );
    if (!searchRes.ok) return undefined;

    const searchData = (await searchRes.json()) as { items?: Array<{ id: string }> };
    const volumeId = searchData.items?.[0]?.id;
    if (!volumeId) return undefined;

    // Fetch full volume for tableOfContents field
    const volParams = new URLSearchParams({ projection: "full" });
    if (key) volParams.set("key", key);
    const volRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes/${volumeId}?${volParams.toString()}`,
    );
    if (!volRes.ok) return undefined;

    const volData = (await volRes.json()) as {
      volumeInfo?: { tableOfContents?: Array<{ title: string }> };
    };
    const toc = volData.volumeInfo?.tableOfContents;
    if (!toc || toc.length === 0) return undefined;

    return toc.map((c) => c.title).filter(Boolean);
  } catch {
    return undefined;
  }
}

/**
 * Resolve the Wikipedia page title that actually exists for a book.
 * Returns the canonical slug, or undefined if none found.
 */
async function resolveWikipediaSlug(
  title: string,
  author: string,
): Promise<string | undefined> {
  const candidates = [
    `${title} (book)`,
    title,
    `${title} by ${author}`,
  ];

  for (const candidate of candidates) {
    const slug = encodeURIComponent(candidate.replace(/ /g, "_"));
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`,
      { headers: { "User-Agent": "AntilibraryEngine/1.0 (bk2022@gmail.com)" } },
    );
    if (!res.ok) continue;

    const data = (await res.json()) as { type?: string; title?: string; extract?: string };
    if (data.type === "disambiguation" || !data.extract) continue;

    return data.title; // canonical title Wikipedia resolved to
  }

  return undefined;
}

/** Fetch Wikipedia summary for a book */
async function fetchWikipediaSummary(
  title: string,
  author: string,
): Promise<string | undefined> {
  try {
    const slug = await resolveWikipediaSlug(title, author);
    if (!slug) return undefined;

    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
      { headers: { "User-Agent": "AntilibraryEngine/1.0 (bk2022@gmail.com)" } },
    );
    if (!res.ok) return undefined;

    const data = (await res.json()) as { extract?: string };
    return data.extract;
  } catch {
    return undefined;
  }
}

/**
 * Fetch the "See also" section links from a Wikipedia article.
 * Uses the MediaWiki action API to locate the section, then extract its links.
 * Returns titles of related Wikipedia articles — raw material for Manthan's connection lenses.
 */
async function fetchWikipediaSeeAlso(
  title: string,
  author: string,
): Promise<string[] | undefined> {
  try {
    const slug = await resolveWikipediaSlug(title, author);
    if (!slug) return undefined;

    const baseParams = {
      action: "parse",
      page: slug,
      format: "json",
      origin: "*",
    };

    // Step 1: get section list to find "See also" index
    const sectionsRes = await fetch(
      `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ ...baseParams, prop: "sections" }).toString()}`,
      { headers: { "User-Agent": "AntilibraryEngine/1.0 (bk2022@gmail.com)" } },
    );
    if (!sectionsRes.ok) return undefined;

    const sectionsData = (await sectionsRes.json()) as {
      parse?: { sections?: Array<{ index: string; line: string }> };
    };

    const sections = sectionsData.parse?.sections ?? [];
    const seeAlso = sections.find(
      (s) => s.line.toLowerCase().replace(/\s/g, "") === "seealso",
    );
    if (!seeAlso) return undefined;

    // Step 2: get links within that section
    const linksRes = await fetch(
      `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ ...baseParams, prop: "links", section: seeAlso.index, pllimit: "50" }).toString()}`,
      { headers: { "User-Agent": "AntilibraryEngine/1.0 (bk2022@gmail.com)" } },
    );
    if (!linksRes.ok) return undefined;

    const linksData = (await linksRes.json()) as {
      parse?: { links?: Array<{ ns: number; "*": string }> };
    };

    // ns: 0 = main article namespace — filter out categories, files, etc.
    const links = (linksData.parse?.links ?? [])
      .filter((l) => l.ns === 0)
      .map((l) => l["*"])
      .filter(Boolean);

    return links.length > 0 ? links : undefined;
  } catch {
    return undefined;
  }
}

/** Fetch all enrichment for one book — ToC, Wikipedia summary, and See Also — in parallel */
export async function enrichBookContext(
  title: string,
  author: string,
  isbn13?: string,
): Promise<EnrichmentResult> {
  const [tableOfContents, wikipediaSummary, wikipediaSeeAlso] = await Promise.all([
    fetchTableOfContents(title, author, isbn13),
    fetchWikipediaSummary(title, author),
    fetchWikipediaSeeAlso(title, author),
  ]);

  return { tableOfContents, wikipediaSummary, wikipediaSeeAlso };
}
