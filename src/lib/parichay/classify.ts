// Parichay Pass 1 — classify a book using Claude with few-shot examples from inventory

import Anthropic from "@anthropic-ai/sdk";
import type { ClassifiedBook, BookContext } from "./types";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}

const REGISTERS = ["empirical", "systems", "humanist", "philosophical", "contemplative", "analytical"] as const;
const DENSITIES = ["accessible", "substantive", "dense"] as const;
const FORMS = ["argument", "narrative", "portrait", "manual", "meditation", "reference", "anthology", "journal", "essays"] as const;

/** Pick the 6 most similar inventory books as few-shot examples */
function selectExamples(
  title: string,
  author: string,
  inventory: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const queryTokens = new Set(
    `${title} ${author}`.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean),
  );

  const scored = inventory.map((book) => {
    const bookText = `${book.title} ${book.author} ${book.topic} ${(book.subtopics as string[] | undefined)?.join(" ") ?? ""}`.toLowerCase();
    const bookTokens = new Set(bookText.replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
    const overlap = [...queryTokens].filter((t) => bookTokens.has(t)).length;
    const score = overlap / Math.max(queryTokens.size, 1);
    return { book, score };
  });

  // Sort by similarity descending, take top 6
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((s) => s.book);
}

function buildClassifyPrompt(
  context: BookContext,
  examples: Array<Record<string, unknown>>,
): string {
  const examplesText = examples
    .map(
      (b) => `Book: "${b.title}" by ${b.author}
category: ${b.category}
categories: ${JSON.stringify(b.categories)}
topic: ${b.topic}
subject: ${b.subject}
subtopics: ${JSON.stringify(b.subtopics)}
register: ${b.register}
density: ${b.density}
form: ${b.form}
lineage: ${b.lineage ?? "null"}
author_origin: ${b.author_origin}
author_tradition: ${b.author_tradition}`,
    )
    .join("\n\n");

  const contextParts: string[] = [];
  if (context.description) contextParts.push(`Description: ${context.description}`);
  if (context.wikipediaSummary) contextParts.push(`Wikipedia: ${context.wikipediaSummary}`);
  if (context.tableOfContents?.length)
    contextParts.push(`Table of contents: ${context.tableOfContents.join(", ")}`);
  if (context.wikipediaSeeAlso?.length)
    contextParts.push(`Wikipedia "See also": ${context.wikipediaSeeAlso.join(", ")}`);

  return `You are classifying books for a personal intellectual library. Your job is to assign classification fields consistently with the existing library's established vocabulary and patterns.

EXISTING LIBRARY EXAMPLES (use these to calibrate your choices):
${examplesText}

VOCABULARY CONSTRAINTS (only use these exact values):
- register: ${REGISTERS.join(" | ")}
- density: ${DENSITIES.join(" | ")}
- form: ${FORMS.join(" | ")}
- category: use the same category names visible in the examples above
- A book can belong to multiple categories — list all that apply in "categories"

BOOK TO CLASSIFY:
Title: "${context.title}"
Author: ${context.author}
${context.year ? `Year: ${context.year}` : ""}
${contextParts.join("\n")}

Return ONLY a JSON object with these exact fields. No explanation, no markdown:
{
  "category": "primary domain",
  "categories": ["domain1", "domain2"],
  "topic": "precise one-line description of what this book is specifically about",
  "subject": "slug-form-topic",
  "subtopics": ["secondary angle 1", "secondary angle 2"],
  "register": "one of the register values",
  "density": "one of the density values",
  "form": "one of the form values",
  "lineage": "whose ideas this most directly descends from, or null",
  "author_origin": "country",
  "author_tradition": "intellectual tradition of the author"
}`;
}

/** Classify one book — Pass 1 */
export async function classifyBook(
  context: BookContext,
  inventory: Array<Record<string, unknown>>,
): Promise<ClassifiedBook> {
  const examples = selectExamples(context.title, context.author, inventory);

  const prompt = buildClassifyPrompt(context, examples);

  const response = await getClient().messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as ClassifiedBook;
    // Validate required fields are present
    if (!parsed.category || !parsed.register || !parsed.density || !parsed.form) {
      throw new Error("Missing required classification fields");
    }
    return parsed;
  } catch (err) {
    throw new Error(`Classification parse failed for "${context.title}": ${err}\nRaw: ${text}`);
  }
}
