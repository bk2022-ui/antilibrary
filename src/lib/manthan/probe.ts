// Manthan — the random probe
// Selects edge books as seeds and finds groupings the systematic lenses miss

import Anthropic from "@anthropic-ai/sdk";
import type { InventoryBook, BookIdeas, ProbeResult, LensFinding } from "./types";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}

const client = new Anthropic();

/**
 * Select seed books for the random probe.
 * Preference: books not yet in any named grouping, or books at the boundary of multiple clusters.
 * Falls back to random selection weighted toward less-common categories.
 */
function selectSeeds(
  books: InventoryBook[],
  alreadyGrouped: Set<string>,
  count = 3,
): InventoryBook[] {
  // Prefer books not yet in any grouping
  const ungrouped = books.filter((b) => !alreadyGrouped.has(b.title));
  const pool = ungrouped.length >= count ? ungrouped : books;

  // Weight toward less-common categories — edge books live at the margins
  const catCounts: Record<string, number> = {};
  for (const b of books) {
    if (b.category) catCounts[b.category] = (catCounts[b.category] ?? 0) + 1;
  }

  const weighted = pool.map((b) => ({
    book: b,
    weight: 1 / (catCounts[b.category ?? ""] ?? 1),
  }));

  // Weighted shuffle — pick without replacement
  const seeds: InventoryBook[] = [];
  const remaining = [...weighted];

  while (seeds.length < Math.min(count, remaining.length)) {
    const total = remaining.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < remaining.length; i++) {
      r -= remaining[i].weight;
      if (r <= 0) {
        seeds.push(remaining[i].book);
        remaining.splice(i, 1);
        break;
      }
    }
  }

  return seeds;
}

async function runShallowProbe(
  seed: InventoryBook,
  books: InventoryBook[],
): Promise<LensFinding | null> {
  const seedDesc = `"${seed.title}" by ${seed.author} — ${seed.register}, ${seed.form}, ${seed.density}
  Topic: ${seed.topic}
  Subtopics: ${(seed.subtopics ?? []).join(", ")}
  Lineage: ${seed.lineage ?? "none"}
  Tradition: ${seed.author_tradition}`;

  const candidates = books
    .filter((b) => b.title !== seed.title)
    .map((b) => `"${b.title}" — ${b.register}, ${b.form}, topic: ${b.topic}, lineage: ${b.lineage ?? "-"}`)
    .join("\n");

  const response = await getClient().messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `You are running a "random probe" on a personal library. A seed book has been selected — find what else in the library shares its intellectual coordinates.

SEED BOOK:
${seedDesc}

ALL OTHER BOOKS:
${candidates}

Find 3–6 books that share the seed book's intellectual territory — same register, lineage tradition, or subtopic angle. If you find a grouping, name it and describe what holds it together. If there is no genuine grouping, return null.

Return either a JSON object or null:
{
  "type": "cluster",
  "name": "short name for this grouping",
  "description": "what holds these books together — be specific",
  "books": ["${seed.title}", "title2", ...],
  "strength": "strong | moderate | weak",
  "evidence": "what specifically connects them"
}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  if (cleaned === "null" || cleaned === "") return null;

  try {
    return JSON.parse(cleaned) as LensFinding;
  } catch {
    return null;
  }
}

async function runDeepProbe(
  seed: InventoryBook,
  books: InventoryBook[],
  ideas: Record<string, BookIdeas>,
): Promise<LensFinding | null> {
  const seedIdeas = ideas[seed.title];
  if (!seedIdeas || seedIdeas.units.length === 0) return null;

  // Pick the most distinctive unit from the seed — prefer claims and frameworks
  const anchor = seedIdeas.units.find((u) => u.type === "claim" || u.type === "framework")
    ?? seedIdeas.units[0];

  // Find books whose atomic unit tags overlap with the anchor's tags
  const anchorTags = new Set(anchor.tags);
  const candidates = books
    .filter((b) => b.title !== seed.title)
    .map((b) => {
      const bookIdeas = ideas[b.title];
      if (!bookIdeas) return null;
      const overlap = bookIdeas.units.flatMap((u) => u.tags).filter((t) => anchorTags.has(t));
      if (overlap.length === 0) return null;
      const matchingUnits = bookIdeas.units
        .filter((u) => u.tags.some((t) => anchorTags.has(t)))
        .map((u) => `  [${u.type}] ${u.title}: ${u.body}`)
        .join("\n");
      return `"${b.title}" (shared tags: ${overlap.join(", ")}):\n${matchingUnits}`;
    })
    .filter(Boolean);

  if (candidates.length < 2) return null;

  const response = await getClient().messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `You are running a deep random probe on a personal library. You have a seed idea and books that share its conceptual tags — find whether these books form a genuine intellectual grouping at the idea level.

SEED IDEA (from "${seed.title}"):
[${anchor.type}] ${anchor.title}: ${anchor.body}
Tags: ${anchor.tags.join(", ")}

BOOKS WITH OVERLAPPING IDEAS:
${candidates.join("\n\n")}

Do these books form a genuine grouping around the seed idea? Name it if so. Be specific — what is the shared intellectual territory?

Return either a JSON object or null:
{
  "type": "thread",
  "name": "short name",
  "description": "the shared intellectual territory — specific, not generic",
  "books": ["${seed.title}", ...],
  "strength": "strong | moderate | weak",
  "evidence": "the specific ideas that connect them"
}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  if (cleaned === "null" || cleaned === "") return null;

  try {
    return JSON.parse(cleaned) as LensFinding;
  } catch {
    return null;
  }
}

/** Run the random probe — selects edge seeds, alternates shallow and deep */
export async function runRandomProbe(
  books: InventoryBook[],
  ideas: Record<string, BookIdeas>,
  alreadyGrouped: Set<string>,
  seedCount = 3,
): Promise<ProbeResult[]> {
  const seeds = selectSeeds(books, alreadyGrouped, seedCount);
  const results: ProbeResult[] = [];

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    // Alternate: even index → shallow, odd index → deep
    const probeType = i % 2 === 0 ? "shallow" : "deep";

    console.log(`  Probe ${i + 1}/${seeds.length}: ${probeType} — seed: "${seed.title}"`);

    const candidate = probeType === "shallow"
      ? await runShallowProbe(seed, books)
      : await runDeepProbe(seed, books, ideas);

    if (candidate) {
      results.push({ seedBook: seed.title, probeType, candidate });
    }
  }

  return results;
}
