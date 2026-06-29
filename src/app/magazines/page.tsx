"use client";

import Link from "next/link";
import Image from "next/image";

const MAGAZINES = [
  {
    id: "works-in-progress",
    name: "Works in Progress",
    frequency: "Quarterly",
    origin: "UK",
    description: "A magazine about how progress happens — technology, science, economics, and the history of ideas. Each piece takes one concrete question seriously.",
    coverUrl: "https://assetss.worksinprogress.co/wp-content/uploads/2026/05/cover_issue_24_900w.webp",
    issue: "Issue 24",
    url: "https://worksinprogress.co",
  },
  {
    id: "nautilus",
    name: "Nautilus",
    frequency: "Quarterly",
    origin: "USA",
    description: "Science connected to culture and philosophy. Each issue explores one big idea across disciplines — physics, biology, mathematics, and the nature of mind.",
    coverUrl: "https://lede-admin.nautil.us/wp-content/uploads/sites/70/sites/3/nautilus/Cover_65.png",
    issue: "Issue 65",
    url: "https://nautil.us",
  },
  {
    id: "scientific-american",
    name: "Scientific American",
    frequency: "Monthly",
    origin: "USA",
    description: "The longest-running science magazine in the US. Research across every discipline, written for the curious non-specialist.",
    coverUrl: "https://static.scientificamerican.com/dam/asset/9b085137-ff9c-400d-aae6-a0d29c9ab0a0/sa070826Cvr.jpg",
    issue: "Vol. 335, No. 2",
    url: "https://www.scientificamerican.com",
  },
  {
    id: "monocle",
    name: "Monocle",
    frequency: "10× per year",
    origin: "UK",
    description: "Global affairs, business, culture, and design. Covers cities, foreign policy, and the things worth making and owning.",
    coverUrl: "https://monocle.com/wp-content/uploads/2026/06/COVER-195_RGB_1_web-res.jpg",
    issue: "Issue 195",
    url: "https://monocle.com",
  },
  {
    id: "kinfolk",
    name: "Kinfolk",
    frequency: "Quarterly",
    origin: "USA",
    description: "Slow living, art, food, and design. Each issue takes a single theme and explores it through photography, essays, and interviews.",
    coverUrl: null,
    issue: "Issue 60 — History Special",
    url: "https://kinfolk.com",
  },
  {
    id: "surface",
    name: "Surface",
    frequency: "10× per year",
    origin: "USA",
    description: "Architecture, interiors, fashion, and contemporary art. A document of the designed world.",
    coverUrl: null,
    issue: "2026 Annual",
    url: "https://www.surfacemag.com",
  },
];

export default function Magazines() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "var(--font-dm), sans-serif" }}>

      {/* Header */}
      <header style={{ borderBottom: "1px solid #e0ddd8", background: "#fff" }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "20px 24px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}>
          <div>
            <Link href="/" style={{ textDecoration: "none" }}>
              <h1 style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "1.8rem",
                fontWeight: 600,
                color: "#1a1a1a",
                margin: 0,
              }}>
                Bharat&apos;s (Anti)Library
              </h1>
            </Link>
            <p style={{ fontSize: "0.8rem", color: "#888", margin: "4px 0 0" }}>Magazines</p>
          </div>
          <nav style={{ display: "flex", gap: 20 }}>
            <Link href="/" style={{ fontSize: "0.85rem", color: "#555", textDecoration: "none" }}>Books</Link>
            <Link href="/researchers" style={{ fontSize: "0.85rem", color: "#555", textDecoration: "none" }}>Researchers</Link>
            <Link href="/investor-letters" style={{ fontSize: "0.85rem", color: "#555", textDecoration: "none" }}>Investor Letters</Link>
            <span style={{ fontSize: "0.85rem", color: "#1a1a1a", fontWeight: 500 }}>Magazines</span>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 32,
        }}>
          {MAGAZINES.map((mag) => (
            <a
              key={mag.id}
              href={mag.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <div style={{
                border: "1px solid #e0ddd8",
                borderRadius: 4,
                overflow: "hidden",
                transition: "box-shadow 0.15s ease",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                {/* Cover */}
                <div style={{
                  height: 240,
                  background: "#f5f3ef",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}>
                  {mag.coverUrl ? (
                    <Image
                      src={mag.coverUrl}
                      alt={`${mag.name} cover`}
                      width={160}
                      height={220}
                      style={{ objectFit: "contain", maxHeight: "100%" }}
                      unoptimized
                    />
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#aaa", letterSpacing: "0.08em" }}>
                      {mag.name}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "20px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <h2 style={{
                      fontFamily: "var(--font-cormorant), Georgia, serif",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      color: "#1a1a1a",
                      margin: 0,
                    }}>
                      {mag.name}
                    </h2>
                    <span style={{ fontSize: "0.7rem", color: "#aaa", letterSpacing: "0.06em" }}>
                      {mag.origin}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#bbb", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                    {mag.frequency} · {mag.issue}
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.6, margin: 0 }}>
                    {mag.description}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
