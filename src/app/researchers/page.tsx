"use client";

import { useState } from "react";
import Link from "next/link";
import researchersData from "@/data/researchers.json";

type Researcher = {
  id: string;
  name: string;
  dates: string;
  identity: string;
};

const researchers = researchersData as Researcher[];

export default function ResearchersPage() {
  const [search, setSearch] = useState("");

  const filtered = researchers.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.identity.toLowerCase().includes(q);
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8f6f2", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #e0ddd8", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <Link href="/" style={{ textDecoration: "none" }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.8rem", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
                Bharat's (Anti)Library
              </h1>
            </Link>
            <p style={{ fontSize: "0.8rem", color: "#888", margin: "4px 0 0" }}>
              {researchers.length} researchers
            </p>
          </div>
          <nav style={{ display: "flex", gap: 20 }}>
            <Link href="/" style={{ fontSize: "0.85rem", color: "#555", textDecoration: "none" }}>Books</Link>
            <span style={{ fontSize: "0.85rem", color: "#1a1a1a", fontWeight: 500 }}>Researchers</span>
            <Link href="/investor-letters" style={{ fontSize: "0.85rem", color: "#555", textDecoration: "none" }}>Investor Letters</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Search */}
        <div style={{ marginBottom: 28 }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search researchers…"
            style={{
              width: 320,
              border: "1px solid #d8d5d0",
              borderRadius: 4,
              padding: "7px 12px",
              fontSize: "0.85rem",
              fontFamily: "system-ui, sans-serif",
              outline: "none",
              background: "#fff",
              color: "#1a1a1a",
            }}
          />
          {search && (
            <span style={{ fontSize: "0.78rem", color: "#aaa", marginLeft: 12 }}>
              {filtered.length} of {researchers.length}
            </span>
          )}
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((r, i) => (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: "280px 1fr",
                gap: 24,
                padding: "14px 0",
                borderBottom: "1px solid #ebe8e3",
                alignItems: "baseline",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#1a1a1a",
                  }}
                >
                  {r.name}
                </span>
                {r.dates && (
                  <span style={{ fontSize: "0.75rem", color: "#aaa", marginLeft: 8 }}>
                    {r.dates}
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.85rem", color: "#555", margin: 0, lineHeight: 1.5 }}>
                {r.identity}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
