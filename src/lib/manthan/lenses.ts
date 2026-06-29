// Manthan — the seven lenses
// Distribution lenses (1-4): run on metadata only
// Relational lenses (5-7): require atomic units and seeAlso from ideas.json

import Anthropic from "@anthropic-ai/sdk";
import type { InventoryBook, BookIdeas, LensResult } from "./types";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function count<T>(arr: T[], key: (item: T) => string | undefined): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of arr) {
    const k = key(item);
    if (k) result[k] = (result[k] ?? 0) + 1;
  }
  return result;
}

function top(counts: Record<string, number>, n = 5): Array<[string, number]> {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function buildInventorySummary(books: InventoryBook[]): string {
  const total = books.length;
  const registers = count(books, (b) => b.register);
  const forms = count(books, (b) => b.form);
  const densities = count(books, (b) => b.density);
  const categories = count(books, (b) => b.category);
  const decades = count(books, (b) => b.year ? `${Math.floor(b.year / 10) * 10}s` : undefined);
  const traditions = count(books, (b) => b.author_tradition);
  const lineages = count(books, (b) => b.lineage ?? undefined);

  return `INVENTORY SUMMARY (${total} books):
Register: ${JSON.stringify(registers)}
Form: ${JSON.stringify(forms)}
Density: ${JSON.stringify(densities)}
Top categories: ${top(categories).map(([k, v]) => `${k}(${v})`).join(", ")}
Top decades: ${top(decades).map(([k, v]) => `${k}(${v})`).join(", ")}
Top traditions: ${top(traditions).map(([k, v]) => `${k}(${v})`).join(", ")}
Top lineages: ${top(lineages).map(([k, v]) => `${k}(${v})`).join(", ")}`;
}

async function runLensPrompt(systemPrompt: string, userPrompt: string): Promise<LensResult["findings"]> {
  const response = await getClient().messages.create({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`  ✗ Parse failed: ${err}\n  Raw (first 300 chars): ${text.slice(0, 300)}`);
    return [];
  }
}

const FINDING_SCHEMA = `Return a JSON array of findings. Each finding:
{
  "type": "thread | cluster | pattern | tension_pair | founding_figure | hidden_collection | observation",
  "name": "short name",
  "description": "what this reveals about the collection — specific, not generic",
  "books": ["title1", "title2"],
  "strength": "strong | moderate | weak",
  "evidence": "the specific data that supports this finding"
}`;

// ── Distribution Lenses ──────────────────────────────────────────────────────

export async function lensDepth(books: InventoryBook[]): Promise<LensResult> {
  const byDensityAndForm = books.map((b) => `${b.title} (${b.density}, ${b.form})`).join("\n");

  const findings = await runLensPrompt(
    "You are analyzing a personal library to find intellectual depth patterns. Be specific and surprising — generic observations are useless.",
    `${buildInventorySummary(books)}

ALL BOOKS with density and form:
${byDensityAndForm}

LENS: Depth — what are the intellectual strata?
Find: where is there unexpected depth (dense primary texts in an area the owner might not know they have)? Where is there surprising shallowness (a claimed interest covered only by accessible popularizations)? What does the depth distribution reveal?

${FINDING_SCHEMA}`,
  );

  return { lens: "depth", findings };
}

export async function lensRegister(books: InventoryBook[]): Promise<LensResult> {
  const byRegister = books.map((b) => `${b.title} — ${b.register} (${b.category})`).join("\n");

  const findings = await runLensPrompt(
    "You are analyzing a personal library to find register distribution patterns. Be specific and surprising.",
    `${buildInventorySummary(books)}

ALL BOOKS with register:
${byRegister}

LENS: Register — where on the empirical → contemplative axis does this collection concentrate?
Find: the dominant register, the thinest register, any surprising concentrations or absences, what the shape of the distribution reveals about how this person thinks.

${FINDING_SCHEMA}`,
  );

  return { lens: "register", findings };
}

export async function lensEra(books: InventoryBook[]): Promise<LensResult> {
  const withYear = books.filter((b) => b.year).map((b) => `${b.title} (${b.year})`).join("\n");

  const findings = await runLensPrompt(
    "You are analyzing a personal library to find era concentration patterns. Be specific and surprising.",
    `${buildInventorySummary(books)}

BOOKS with publication year:
${withYear}

LENS: Era — which decades dominate?
Find: the dominant era, notable absences, what the era concentration reveals about when this person's thinking was formed, any surprising outliers (very old or very recent books that stand alone).

${FINDING_SCHEMA}`,
  );

  return { lens: "era", findings };
}

export async function lensTradition(books: InventoryBook[]): Promise<LensResult> {
  const byTradition = books
    .filter((b) => b.author_tradition)
    .map((b) => `${b.title} — ${b.author_tradition} (${b.author_origin})`)
    .join("\n");

  const findings = await runLensPrompt(
    "You are analyzing a personal library to find author tradition patterns. Be specific and surprising.",
    `${buildInventorySummary(books)}

BOOKS with author tradition:
${byTradition}

LENS: Tradition — which author traditions are present and which are entirely absent?
Find: dominant traditions, complete absences (especially ones you'd expect given the collection's interests), any surprising cross-tradition patterns. Absence is as revealing as presence.

${FINDING_SCHEMA}`,
  );

  return { lens: "tradition", findings };
}

// ── Relational Lenses ────────────────────────────────────────────────────────

export async function lensTensionPairs(
  books: InventoryBook[],
  ideas: Record<string, BookIdeas>,
): Promise<LensResult> {
  // Build a compact view: book title → claim/lens units + tags
  const bookViews = books
    .map((b) => {
      const bookIdeas = ideas[b.title];
      if (!bookIdeas) return null;
      const claims = bookIdeas.units
        .filter((u) => u.type === "claim" || u.type === "lens")
        .map((u) => `  [${u.type}] ${u.title}: ${u.body}`)
        .join("\n");
      if (!claims) return null;
      return `"${b.title}" (${b.register}, ${b.form}):\n${claims}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const findings = await runLensPrompt(
    "You are finding books in a personal library that argue directly against each other. Look for genuine intellectual disagreement, not just different topics.",
    `${buildInventorySummary(books)}

BOOKS WITH CLAIMS AND LENSES:
${bookViews}

LENS: Tension pairs — which books argue directly against each other?
Find pairs where the claims of one book directly contradict or challenge the claims of another. These are the most productive analytical nodes — live debates the library holds. Name the specific disagreement, not just the topic.

${FINDING_SCHEMA}`,
  );

  return { lens: "tension_pairs", findings };
}

export async function lensFoundingFigures(
  books: InventoryBook[],
  ideas: Record<string, BookIdeas>,
): Promise<LensResult> {
  // Collect lineages + seeAlso cross-references
  const lineageCounts = count(books, (b) => b.lineage ?? undefined);
  const seeAlsoCounts: Record<string, number> = {};
  for (const [title, bookIdeas] of Object.entries(ideas)) {
    for (const ref of bookIdeas.seeAlso ?? []) {
      seeAlsoCounts[ref] = (seeAlsoCounts[ref] ?? 0) + 1;
    }
    void title;
  }

  const lineageSummary = top(lineageCounts, 10)
    .map(([k, v]) => `${k}: ${v} books`)
    .join("\n");

  const seeAlsoSummary = top(seeAlsoCounts, 15)
    .map(([k, v]) => `${k}: referenced by ${v} books`)
    .join("\n");

  const findings = await runLensPrompt(
    "You are finding the founding intellectual figures whose ideas a personal library orbits. Look for convergence — many books descending from the same intellectual ancestor.",
    `${buildInventorySummary(books)}

LINEAGE COUNTS (how many books descend from each figure):
${lineageSummary}

TOP SEE-ALSO CROSS-REFERENCES (what Wikipedia connects these books to):
${seeAlsoSummary}

LENS: Founding figures — whose ideas does this library orbit?
Find: the intellectual ancestors with the strongest presence (via lineage + seeAlso convergence), any surprising figures the owner may not have consciously assembled around, figures who are notably absent given the collection's interests.

${FINDING_SCHEMA}`,
  );

  return { lens: "founding_figures", findings };
}

export async function lensHiddenCollections(
  books: InventoryBook[],
  ideas: Record<string, BookIdeas>,
): Promise<LensResult> {
  // Find seeAlso references that cluster across many books but aren't well-represented in the library itself
  const seeAlsoCounts: Record<string, number> = {};
  const seeAlsoSources: Record<string, string[]> = {};

  for (const [title, bookIdeas] of Object.entries(ideas)) {
    for (const ref of bookIdeas.seeAlso ?? []) {
      seeAlsoCounts[ref] = (seeAlsoCounts[ref] ?? 0) + 1;
      seeAlsoSources[ref] = [...(seeAlsoSources[ref] ?? []), title];
    }
  }

  const topRefs = top(seeAlsoCounts, 20);
  const refSummary = topRefs
    .map(([ref, cnt]) => `"${ref}" — pointed to by: ${(seeAlsoSources[ref] ?? []).slice(0, 5).join(", ")} (${cnt} total)`)
    .join("\n");

  const findings = await runLensPrompt(
    "You are finding hidden intellectual collections in a personal library — areas of unexpected depth that didn't announce themselves through the obvious category structure.",
    `${buildInventorySummary(books)}

TOP CONCEPTS/FIGURES THAT MULTIPLE BOOKS POINT TO (via Wikipedia See Also):
${refSummary}

LENS: Hidden collections — what unexpected depth emerges in an area that didn't announce itself?
Find: concepts or figures that many books in this library point toward but which don't appear as an obvious category. These are the hidden collections — the owner has assembled depth around something without naming it. Name the collection. Identify the books that constitute it.

${FINDING_SCHEMA}`,
  );

  return { lens: "hidden_collections", findings };
}
