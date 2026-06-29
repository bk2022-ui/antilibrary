import { NextResponse } from "next/server";
import { curateLibrary } from "@/lib/curation/curate";
import type { ReaderProfile } from "@/types/profile";

/**
 * POST /api/curate
 * Body: a ReaderProfile. Returns a curated, metadata-enriched library.
 *
 * Runs server-side so the Anthropic API key never reaches the browser.
 */
export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key." },
      { status: 500 },
    );
  }

  let profile: ReaderProfile;
  try {
    profile = (await request.json()) as ReaderProfile;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const saidSomething =
    profile.hope ||
    profile.placement ||
    profile.look ||
    profile.feel ||
    profile.likes?.length ||
    profile.reads?.length ||
    profile.lifestyle ||
    profile.profession;

  if (!saidSomething) {
    return NextResponse.json(
      { error: "Tell us at least one thing — anything — and we'll take it from there." },
      { status: 400 },
    );
  }

  try {
    const library = await curateLibrary(profile);
    return NextResponse.json({ library });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Curation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
