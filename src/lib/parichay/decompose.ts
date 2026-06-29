// Parichay Pass 2 — decompose a book into atomic units

import Anthropic from "@anthropic-ai/sdk";
import type { AtomicUnit, BookContext, ClassifiedBook } from "./types";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}

const UNIT_COUNTS: Record<string, number> = {
  manual: 3,
  reference: 3,
  narrative: 4,
  portrait: 4,
  anthology: 4,
  journal: 4,
  argument: 6,
  meditation: 6,
  essays: 5,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function buildDecomposePrompt(
  context: BookContext,
  classification: ClassifiedBook,
  targetCount: number,
): string {
  const contextParts: string[] = [];
  if (context.description) contextParts.push(`Description: ${context.description}`);
  if (context.wikipediaSummary) contextParts.push(`Wikipedia: ${context.wikipediaSummary}`);
  if (context.tableOfContents?.length)
    contextParts.push(`Table of contents: ${context.tableOfContents.join(", ")}`);
  if (context.wikipediaSeeAlso?.length)
    contextParts.push(`Wikipedia "See also": ${context.wikipediaSeeAlso.join(", ")}`);

  return `You are decomposing a book into its atomic intellectual units — the transferable ideas, frameworks, stories, claims, and lenses it contains.

BOOK:
Title: "${context.title}"
Author: ${context.author}
Form: ${classification.form}
Topic: ${classification.topic}
${contextParts.join("\n")}

YOUR JOB:
Extract exactly ${targetCount} atomic units from this book. Each unit must be:
- A single transferable idea that can be lifted from this book and placed next to ideas from completely different books
- Stated as the exact mechanism, not a vague gesture. Not "this book argues leadership is hard" but "culture is transmitted through visible standards, not stated values — what the leader tolerates defines the culture more than what they say"
- 2–3 sentences maximum in the body
- Tagged with honest, specific labels (not the book's title or author name)

UNIT TYPES (assign the most accurate one):
- concept: a named idea or construct
- framework: a structured way of thinking or deciding
- story: a specific case, anecdote, or example that illustrates a principle
- claim: an argument the book makes — something it asserts and defends
- lens: a way of looking at something that changes what you see

DO NOT:
- Compare to other books
- Note what the book is "in dialogue with"
- Assign abstractions like "universal principle" — just state what the unit is
- Repeat the same idea in different words

Return ONLY a JSON array of exactly ${targetCount} objects. No explanation, no markdown:
[
  {
    "type": "concept | framework | story | claim | lens",
    "title": "Short name for this unit (5–8 words)",
    "body": "2–3 sentences stating the exact mechanism.",
    "tags": ["tag1", "tag2", "tag3"]
  }
]`;
}

/** Decompose one book into atomic units — Pass 2 */
export async function decomposeBook(
  context: BookContext,
  classification: ClassifiedBook,
): Promise<AtomicUnit[]> {
  const targetCount = UNIT_COUNTS[classification.form] ?? 5;

  const prompt = buildDecomposePrompt(context, classification, targetCount);

  // Retry up to 3 times — model JSON output is occasionally malformed
  // (unescaped quote or literal newline in a body string). Re-asking usually fixes it.
  let raw: Array<{ type: string; title: string; body: string; tags: string[] }> | null = null;
  let lastErr: unknown;

  for (let attempt = 0; attempt < 3 && !raw; attempt++) {
    const response = await getClient().messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract the JSON array substring — tolerates prose or fences around it
    let candidate = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const firstBracket = candidate.indexOf("[");
    const lastBracket = candidate.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      candidate = candidate.slice(firstBracket, lastBracket + 1);
    }

    try {
      const parsed = JSON.parse(candidate);
      if (!Array.isArray(parsed)) throw new Error("Expected array");
      raw = parsed;
    } catch (err) {
      lastErr = err;
    }
  }

  if (!raw) {
    throw new Error(`Decompose parse failed for "${context.title}" after 3 attempts: ${lastErr}`);
  }

  return raw.map((unit, i) => ({
    id: slugify(`${unit.title}-${i + 1}`),
    type: unit.type as AtomicUnit["type"],
    title: unit.title,
    body: unit.body,
    tags: unit.tags ?? [],
    sourceBook: context.title,
  }));
}
