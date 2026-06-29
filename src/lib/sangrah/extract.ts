import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import type { ExtractedSpine } from "./types";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}

const VISION_PROMPT = `You are reading book spines on a shelf in a photograph.

For each spine you can see, return a JSON array where each element is:
{
  "title": "exact title as written on the spine",
  "author": "author name as written, or your best inference",
  "confidence": "high" | "medium" | "low" | "none",
  "reason": "one sentence — only if confidence is not high, explain why"
}

Confidence rules:
- high: title and author clearly readable, unambiguous
- medium: title clear but author uncertain, or minor spelling uncertainty
- low: partial text, angled spine, small font, or significant uncertainty
- none: spine completely unreadable — still include it with title: "unreadable"

Return ONLY the JSON array. No preamble, no explanation, no markdown fences.`;

/** Convert HEIC to JPEG using macOS sips — returns path to converted file */
function convertHeic(inputPath: string, tmpDir: string): string {
  const basename = path.basename(inputPath, path.extname(inputPath));
  const outPath = path.join(tmpDir, `${basename}.jpg`);
  execSync(`sips -s format jpeg "${inputPath}" --out "${outPath}" -Z 2048`, {
    stdio: "ignore",
  });
  return outPath;
}

/** Prepare image for Claude: convert if needed, return base64 + mediaType */
function prepareImage(
  imagePath: string,
  tmpDir: string,
): { base64: string; mediaType: "image/jpeg" | "image/png" } {
  const ext = path.extname(imagePath).toLowerCase();
  let filePath = imagePath;
  let mediaType: "image/jpeg" | "image/png" = "image/jpeg";

  if (ext === ".heic" || ext === ".heif") {
    filePath = convertHeic(imagePath, tmpDir);
    mediaType = "image/jpeg";
  } else if (ext === ".png") {
    mediaType = "image/png";
  }

  const base64 = fs.readFileSync(filePath).toString("base64");
  return { base64, mediaType };
}

/** Extract all readable spines from one image using Claude vision */
export async function extractSpinesFromImage(
  imagePath: string,
  tmpDir: string,
): Promise<ExtractedSpine[]> {
  const filename = path.basename(imagePath);
  const { base64, mediaType } = prepareImage(imagePath, tmpDir);

  const response = await getClient().messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          { type: "text", text: VISION_PROMPT },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  let parsed: Array<{
    title: string;
    author: string;
    confidence: string;
    reason?: string;
  }>;

  try {
    parsed = JSON.parse(text.trim());
  } catch {
    // If Claude returned something malformed, log and return empty
    console.warn(`  [extract] Could not parse response for ${filename}`);
    return [];
  }

  return parsed.map((item) => ({
    title: item.title ?? "unreadable",
    author: item.author ?? "",
    confidence: (["high", "medium", "low", "none"].includes(item.confidence)
      ? item.confidence
      : "low") as ExtractedSpine["confidence"],
    reason: item.reason,
    sourceImage: filename,
  }));
}

/** Extract spines from all images in a folder, skipping already-processed files */
export async function extractFromFolder(
  folderPath: string,
  skipFiles: string[],
  tmpDir: string,
  onProgress?: (file: string, count: number) => void,
): Promise<ExtractedSpine[]> {
  const supported = [".heic", ".heif", ".jpg", ".jpeg", ".png"];
  const skipSet = new Set(skipFiles.map((f) => f.toLowerCase()));

  const files = fs
    .readdirSync(folderPath)
    .filter((f) => supported.includes(path.extname(f).toLowerCase()))
    .filter((f) => !skipSet.has(f.toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.log("  No new images to process.");
    return [];
  }

  console.log(`  Processing ${files.length} new image(s)...`);
  const allSpines: ExtractedSpine[] = [];

  for (const file of files) {
    const imagePath = path.join(folderPath, file);
    console.log(`  → ${file}`);
    const spines = await extractSpinesFromImage(imagePath, tmpDir);
    allSpines.push(...spines);
    onProgress?.(file, spines.length);
  }

  return allSpines;
}
