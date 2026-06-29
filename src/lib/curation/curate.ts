import Anthropic from "@anthropic-ai/sdk";
import type { ReaderProfile } from "@/types/profile";
import { SPACE_TO_TARGET } from "@/types/profile";
import type { BookSuggestion, CuratedBook } from "@/types/book";
import { lookupBooks } from "@/lib/books/openLibrary";

/**
 * The heart of the app: turn a reader profile into a curated library.
 *
 * 1. Ask Claude to act as an expert librarian and propose a list of books,
 *    each with a short rationale and a suggested shelf grouping.
 * 2. Enrich every pick with real metadata (cover, ISBN, links) so the user
 *    sees accurate, real books — not hallucinated ones.
 */

const MODEL = "claude-opus-4-8";

interface ClaudePick extends BookSuggestion {
  title: string;
  author: string;
}

/** A browsable first batch. Bigger spaces grow later via "show me more". */
const MAX_PER_BATCH = 18;

function buildPrompt(profile: ReaderProfile): { system: string; user: string } {
  const ideal = profile.space ? SPACE_TO_TARGET[profile.space] : 24;
  const target = Math.min(ideal, MAX_PER_BATCH);

  const system = [
    "You are a warm, perceptive librarian who builds deeply personal home libraries.",
    "You understand that people build libraries for identity, setting, and feeling — not just subject.",
    "A library is furniture, a self-portrait, a mood, and a backdrop as much as it is reading material.",
    "So you weigh WHERE it lives and HOW it should look and feel as heavily as topics.",
    "You recommend real, verifiable books only — never invent titles or authors.",
    "You honor budget: for thrifty readers favor affordable, widely-available paperbacks and classics;",
    "for generous budgets you may suggest beautiful editions, illustrated volumes, and collectibles.",
    "You balance the reader's stated tastes with a few thoughtful stretches that broaden them.",
    "You group books into a few intuitive, well-named shelves that suit this person's life and room.",
  ].join(" ");

  const facts: string[] = [];
  if (profile.hope) facts.push(`What they hope for: ${profile.hope}`);
  if (profile.placement) facts.push(`Where the library will live: ${profile.placement}`);
  if (profile.look) facts.push(`How it should look: ${profile.look}`);
  if (profile.feel) facts.push(`How it should feel: ${profile.feel}`);
  if (profile.budget) facts.push(`Budget: ${profile.budget}`);
  if (profile.space) facts.push(`Space available: ${profile.space}`);
  if (profile.likes.length) facts.push(`Loves: ${profile.likes.join(", ")}`);
  if (profile.reads.length) facts.push(`Already treasures: ${profile.reads.join(", ")}`);
  if (profile.location) facts.push(`Lives in: ${profile.location}`);
  if (profile.lifestyle) facts.push(`Their days: ${profile.lifestyle}`);
  if (profile.profession) facts.push(`Profession: ${profile.profession}`);

  const user = [
    "Curate a home library for this person. Use everything they shared; some fields may be blank — that's fine.",
    "",
    facts.length ? facts.join("\n") : "(They shared very little — surprise and delight them with a beautiful general library.)",
    "",
    `Aim for roughly ${target} books, adjusting to fit their space and budget.`,
    "",
    "Respond with ONLY a JSON array, no prose, where each element is:",
    '{ "title": string, "author": string, "shelf": string, "rationale": string }',
    "The rationale must be one warm sentence on why THIS person will love having THIS book.",
  ].join("\n");

  return { system, user };
}

function extractJsonArray(text: string): ClaudePick[] {
  // Strip any markdown code fences the model may have added.
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("[");
  if (start === -1) throw new Error("No JSON array found in model output");

  const end = cleaned.lastIndexOf("]");
  if (end !== -1) {
    return JSON.parse(cleaned.slice(start, end + 1)) as ClaudePick[];
  }

  // Truncated reply: salvage by closing after the last complete object.
  const lastObj = cleaned.lastIndexOf("}");
  if (lastObj === -1) throw new Error("No JSON array found in model output");
  return JSON.parse(cleaned.slice(start, lastObj + 1) + "]") as ClaudePick[];
}

export async function curateLibrary(profile: ReaderProfile): Promise<CuratedBook[]> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  const { system, user } = buildPrompt(profile);

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const picks = extractJsonArray(text);

  // Enrich with real metadata from Open Library.
  const queries = picks.map((p) => `${p.title} ${p.author}`.trim());
  const metadata = await lookupBooks(queries);

  return picks.map((p, i) => ({
    query: queries[i],
    rationale: p.rationale,
    shelf: p.shelf,
    metadata: metadata[i],
  }));
}
