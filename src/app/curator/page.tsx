"use client";

import { useState } from "react";
import type { ReaderProfile } from "@/types/profile";
import type { CuratedBook } from "@/types/book";

/** Tap-to-pick options. The icon stands in for a future photograph. */
type Choice = { value: string; icon: string; label: string; sub: string };

const PLACEMENT: Choice[] = [
  { value: "The living room, where guests will see it", icon: "🛋️", label: "The living room", sub: "where guests will see it" },
  { value: "A home office, behind me on every call", icon: "💼", label: "A home office", sub: "behind me on calls" },
  { value: "Behind my Zoom background, on display to the world", icon: "🎥", label: "Behind my Zoom", sub: "the backdrop I show the world" },
  { value: "By the bed, for the last hour of the day", icon: "🛏️", label: "By the bed", sub: "the last hour of the day" },
  { value: "A pub-style corner with drinks and armchairs", icon: "🍺", label: "A pub corner", sub: "drinks and good company" },
  { value: "Wherever it fits around the home", icon: "🏡", label: "Wherever it fits", sub: "tucked into the home" },
];

const LOOK: Choice[] = [
  { value: "Lived-in and a little wild — different sizes, well-loved, stacked", icon: "📚", label: "Lived-in & wild", sub: "well-loved, stacked, mixed sizes" },
  { value: "Immaculately organized — neat rows, everything in its place", icon: "✨", label: "Immaculate", sub: "neat rows, all in order" },
  { value: "Arranged by color — a rainbow on the wall", icon: "🎨", label: "By color", sub: "a rainbow on the wall" },
  { value: "Floor to ceiling — a wall of books, pure abundance", icon: "🧱", label: "Floor to ceiling", sub: "a wall of abundance" },
  { value: "A few perfect shelves — small, considered, nothing wasted", icon: "🍃", label: "A few perfect shelves", sub: "small and considered" },
];

const FEEL: Choice[] = [
  { value: "A cozy sanctuary — warm, quiet, an escape", icon: "🕯️", label: "A cozy sanctuary", sub: "warm, quiet, an escape" },
  { value: "An intellectual showcase — ideas on display", icon: "🎓", label: "Intellectual showcase", sub: "ideas on display" },
  { value: "Fun and surprising — full of conversation starters", icon: "🎉", label: "Fun & surprising", sub: "conversation starters" },
  { value: "Calm and minimal — uncluttered and serene", icon: "🤍", label: "Calm & minimal", sub: "uncluttered, serene" },
];

const BUDGET: Choice[] = [
  { value: "Thrifty — secondhand finds and paperbacks", icon: "🪙", label: "Thrifty", sub: "secondhand, paperbacks" },
  { value: "A sensible mix — mostly value, the odd splurge", icon: "⚖️", label: "A sensible mix", sub: "value, the odd splurge" },
  { value: "Treat myself — lovely editions", icon: "🎁", label: "Treat myself", sub: "lovely editions" },
  { value: "Sky's the limit — beautiful and collectible", icon: "💎", label: "Sky's the limit", sub: "beautiful, collectible" },
];

const SPACE: Choice[] = [
  { value: "shelf", icon: "📖", label: "A single shelf", sub: "a handful of books" },
  { value: "bookcase", icon: "🗄️", label: "A bookcase", sub: "a few dozen" },
  { value: "wall", icon: "🧱", label: "A whole wall", sub: "a hundred or more" },
  { value: "room", icon: "🚪", label: "A dedicated room", sub: "a real library" },
];

/** Accepts commas, semicolons, newlines, bullets, or " - " dashes. */
function splitList(value: string): string[] {
  return value
    .split(/[,;\n•]|\s-\s/g)
    .map((s) => s.replace(/^[-*•\s]+/, "").trim())
    .filter(Boolean);
}

export default function Home() {
  const [text, setText] = useState({
    hope: "",
    likes: "",
    reads: "",
    location: "",
    lifestyle: "",
    profession: "",
  });
  const [pick, setPick] = useState({
    placement: "",
    look: "",
    feel: "",
    budget: "",
    space: "",
  });

  const [library, setLibrary] = useState<CuratedBook[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setText_(field: keyof typeof text, value: string) {
    setText((t) => ({ ...t, [field]: value }));
  }
  function toggle(field: keyof typeof pick, value: string) {
    setPick((p) => ({ ...p, [field]: p[field] === value ? "" : value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLibrary(null);

    const profile: ReaderProfile = {
      hope: text.hope || undefined,
      placement: pick.placement || undefined,
      look: pick.look || undefined,
      feel: pick.feel || undefined,
      budget: pick.budget || undefined,
      space: (pick.space || undefined) as ReaderProfile["space"],
      likes: splitList(text.likes),
      reads: splitList(text.reads),
      location: text.location || undefined,
      lifestyle: text.lifestyle || undefined,
      profession: text.profession || undefined,
    };

    try {
      const res = await fetch("/api/curate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setLibrary(data.library as CuratedBook[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#f5efe2] text-stone-800">
      <main className="mx-auto max-w-xl px-6 py-14">
        <header className="text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-800/70">A library, made for you</p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-stone-900">Let&apos;s build your library</h1>
          <p className="mx-auto mt-4 max-w-md text-stone-600">
            Tell us as much or as little as you like — there are no wrong answers and nothing is required.
            We&apos;ll take whatever you give us and curate real books around it.
          </p>
        </header>

        <form onSubmit={onSubmit} className="mt-12 space-y-12">
          <Question label="What are you hoping this library gives you?" hint="A feeling, a goal, an idea — in your own words.">
            <textarea
              className="input"
              rows={2}
              placeholder="e.g. A corner that makes me want to read again"
              value={text.hope}
              onChange={(e) => setText_("hope", e.target.value)}
            />
          </Question>

          <Question label="Where will your library live?">
            <Cards options={PLACEMENT} selected={pick.placement} onPick={(v) => toggle("placement", v)} />
          </Question>

          <Question label="How should it look?">
            <Cards options={LOOK} selected={pick.look} onPick={(v) => toggle("look", v)} />
          </Question>

          <Question label="And how should it feel?">
            <Cards options={FEEL} selected={pick.feel} onPick={(v) => toggle("feel", v)} />
          </Question>

          <Question label="How much do you want to spend?">
            <Cards options={BUDGET} selected={pick.budget} onPick={(v) => toggle("budget", v)} />
          </Question>

          <Question label="How much room are we working with?">
            <Cards options={SPACE} selected={pick.space} onPick={(v) => toggle("space", v)} />
          </Question>

          <Question label="What do you love?" hint="Topics, people, obsessions — however you like to list them.">
            <input
              className="input"
              placeholder="design, architecture, planting trees, learning"
              value={text.likes}
              onChange={(e) => setText_("likes", e.target.value)}
            />
          </Question>

          <Question label="Any books or authors you already treasure?">
            <input
              className="input"
              placeholder="Robert Caro, Sapiens, anything by Le Guin"
              value={text.reads}
              onChange={(e) => setText_("reads", e.target.value)}
            />
          </Question>

          <Question label="Where in the world are you?" hint="Optional — helps us lean into what's near you.">
            <input
              className="input"
              placeholder="Mumbai · London · a small town in Vermont"
              value={text.location}
              onChange={(e) => setText_("location", e.target.value)}
            />
          </Question>

          <Question label="A little about your days?" hint="However you spend your time — work, family, evenings.">
            <textarea
              className="input"
              rows={2}
              placeholder="Busy weeks, quiet Sundays, always a tea in hand"
              value={text.lifestyle}
              onChange={(e) => setText_("lifestyle", e.target.value)}
            />
          </Question>

          <Question label="And what do you do?" hint="We ask this last on purpose — it matters less than you'd think.">
            <input
              className="input"
              placeholder="Management consultant"
              value={text.profession}
              onChange={(e) => setText_("profession", e.target.value)}
            />
          </Question>

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-amber-900 px-8 py-3.5 font-medium text-amber-50 shadow-sm transition hover:bg-amber-950 disabled:opacity-50"
            >
              {loading ? "Curating your shelves…" : "Curate my library"}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-700">{error}</p>
        )}

        {library && <Results library={library} />}
      </main>
    </div>
  );
}

function Question({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl text-stone-900">{label}</h2>
      {hint && <p className="mt-1 text-sm text-stone-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Cards({
  options,
  selected,
  onPick,
}: {
  options: Choice[];
  selected: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {options.map((o) => {
        const active = selected === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onPick(o.value)}
            className={`rounded-2xl border p-4 text-left transition ${
              active
                ? "border-amber-600 bg-amber-50 ring-1 ring-amber-500"
                : "border-stone-200 bg-white/70 hover:border-amber-300 hover:bg-white"
            }`}
          >
            <span className="text-2xl">{o.icon}</span>
            <span className="mt-2 block font-medium text-stone-800">{o.label}</span>
            <span className="mt-0.5 block text-xs text-stone-500">{o.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

function Results({ library }: { library: CuratedBook[] }) {
  const shelves = new Map<string, CuratedBook[]>();
  for (const book of library) {
    const key = book.shelf ?? "Recommended";
    if (!shelves.has(key)) shelves.set(key, []);
    shelves.get(key)!.push(book);
  }

  return (
    <section className="mt-14">
      <h2 className="text-center font-serif text-3xl text-stone-900">Your library</h2>
      {[...shelves.entries()].map(([shelf, books]) => (
        <div key={shelf} className="mt-8">
          <h3 className="font-serif text-xl text-amber-900">{shelf}</h3>
          <ul className="mt-4 space-y-5">
            {books.map((book, i) => (
              <li key={i} className="flex gap-4">
                {book.metadata?.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.metadata.coverUrl}
                    alt=""
                    className="h-24 w-16 flex-none rounded object-cover shadow"
                  />
                ) : (
                  <div className="flex h-24 w-16 flex-none items-center justify-center rounded bg-stone-200 text-stone-400">
                    📕
                  </div>
                )}
                <div>
                  <p className="font-medium text-stone-900">
                    {book.metadata?.title ?? book.query}
                    {book.metadata?.authors?.length ? (
                      <span className="font-normal text-stone-500"> — {book.metadata.authors.join(", ")}</span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">{book.rationale}</p>
                  {book.metadata?.infoUrl && (
                    <a
                      href={book.metadata.infoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-sm text-amber-800 hover:underline"
                    >
                      Find this book →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
