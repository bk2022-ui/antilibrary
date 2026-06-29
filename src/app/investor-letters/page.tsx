"use client";

import { useState } from "react";
import Link from "next/link";

type LetterCollection = {
  id: string;
  name: string;
  fund: string;
  years: string;
  description: string;
  notes: string[];
  color: string;
  photoUrl?: string;
};

const collections: LetterCollection[] = [
  {
    id: "buffett",
    name: "Warren Buffett",
    fund: "Berkshire Hathaway",
    years: "1965 – present",
    description: "The longest-running shareholder letter in investing history. Buffett writes directly to his partners as co-owners, without lawyers softening the language. The result is six decades of compounding thinking on business quality, valuation, management character, and the nature of risk.",
    notes: [
      "The 1977–2023 letters are available as a bound compilation",
      "Each letter opens with the per-share book value change — the only number Buffett thinks matters",
      "The 1989 letter on the institutional imperative is among the best pieces of business writing ever published",
    ],
    color: "#8B4513",
    photoUrl: "",
  },
  {
    id: "bezos",
    name: "Jeff Bezos",
    fund: "Amazon",
    years: "1997 – 2020",
    description: "Twenty-three letters written to Amazon shareholders during the most extraordinary value-creation run in corporate history. Bezos used the annual letter as a design document — each one sharpens a single idea: Day One thinking, the customer obsession doctrine, regret minimization, the distinction between good and bad process.",
    notes: [
      "The 1997 letter — 'It's always Day One' — was attached to every subsequent letter as an anchor",
      "Published as 'Invent and Wander' (2020) with commentary by Walter Isaacson",
      "The 2016 letter on high-velocity decision-making is required reading for any operator",
    ],
    color: "#1a4a6b",
    photoUrl: "",
  },
  {
    id: "sleep",
    name: "Nicholas Sleep",
    fund: "Nomad Investment Partnership",
    years: "2001 – 2014",
    description: "Thirteen years of letters from one of the great unknown investors of his generation. Sleep ran Nomad with Qais Zakaria out of London, returned ~921% net over the life of the fund, and wrote letters of a quality that belongs in the tradition of long-form intellectual correspondence more than quarterly reporting. The Costco and Amazon analyses are canonical.",
    notes: [
      "Nomad was wound down voluntarily in 2014 — Sleep retired to focus on other work",
      "The letters circulate privately; bound compilations are rare and sought after",
      "His concept of 'scale economics shared' — companies that pass scale advantages to customers — influenced a generation of quality investors",
    ],
    color: "#2d4a3e",
    photoUrl: "",
  },
];

function LetterCard({ collection, expanded, onToggle }: {
  collection: LetterCollection;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Cover */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onToggle}
        style={{
          width: "100%",
          aspectRatio: "2/3",
          borderRadius: 4,
          overflow: "hidden",
          cursor: "pointer",
          boxShadow: hovered
            ? "0 12px 32px rgba(0,0,0,0.22)"
            : "0 4px 14px rgba(0,0,0,0.13)",
          transform: hovered ? "translateY(-4px)" : "none",
          transition: "box-shadow 0.2s, transform 0.2s",
          position: "relative",
        }}
      >
        {collection.photoUrl ? (
          <img
            src={collection.photoUrl}
            alt={collection.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: collection.color,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "28px 20px 24px",
            }}
          >
            {/* Top: fund name */}
            <div>
              <p
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  margin: "0 0 8px",
                }}
              >
                {collection.fund}
              </p>
              <div
                style={{
                  width: 28,
                  height: 2,
                  background: "rgba(255,255,255,0.4)",
                  marginBottom: 14,
                }}
              />
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "1.4rem",
                  fontWeight: 600,
                  color: "#fff",
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                {collection.name}
              </p>
            </div>

            {/* Middle: decorative */}
            <div
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "3.5rem",
                color: "rgba(255,255,255,0.06)",
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              Letters
            </div>

            {/* Bottom: years */}
            <p
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.5)",
                margin: 0,
                letterSpacing: "0.06em",
              }}
            >
              {collection.years}
            </p>
          </div>
        )}
      </div>

      {/* Info below card */}
      <div style={{ padding: "10px 2px 0" }}>
        <p
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#1a1a1a",
            margin: "0 0 2px",
          }}
        >
          {collection.name}
        </p>
        <p style={{ fontSize: "0.72rem", color: "#888", margin: "0 0 6px" }}>
          {collection.fund} · {collection.years}
        </p>

        {/* Expand/collapse */}
        <button
          onClick={onToggle}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: "0.72rem",
            color: collection.color,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          {expanded ? "Hide notes ↑" : "Read notes ↓"}
        </button>
      </div>

      {/* Expanded notes */}
      {expanded && (
        <div
          style={{
            marginTop: 12,
            padding: "14px 16px",
            background: "#fff",
            border: "1px solid #e0ddd8",
            borderRadius: 4,
            borderTop: `3px solid ${collection.color}`,
          }}
        >
          <p style={{ fontSize: "0.83rem", color: "#444", lineHeight: 1.65, margin: "0 0 12px" }}>
            {collection.description}
          </p>
          <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
            {collection.notes.map((note, i) => (
              <li key={i} style={{ fontSize: "0.78rem", color: "#666", lineHeight: 1.6, marginBottom: 4 }}>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function InvestorLettersPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f6f2", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #e0ddd8", background: "#fff" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "20px 24px",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <div>
            <Link href="/" style={{ textDecoration: "none" }}>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "1.8rem",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  margin: 0,
                }}
              >
                Bharat's (Anti)Library
              </h1>
            </Link>
            <p style={{ fontSize: "0.8rem", color: "#888", margin: "4px 0 0" }}>
              Investor Letters
            </p>
          </div>
          <nav style={{ display: "flex", gap: 20 }}>
            <Link href="/" style={{ fontSize: "0.85rem", color: "#555", textDecoration: "none" }}>
              Books
            </Link>
            <Link href="/researchers" style={{ fontSize: "0.85rem", color: "#555", textDecoration: "none" }}>
              Researchers
            </Link>
            <span style={{ fontSize: "0.85rem", color: "#1a1a1a", fontWeight: 500 }}>
              Investor Letters
            </span>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 280px))",
            gap: 32,
            alignItems: "start",
          }}
        >
          {collections.map((c) => (
            <LetterCard
              key={c.id}
              collection={c}
              expanded={expanded === c.id}
              onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
