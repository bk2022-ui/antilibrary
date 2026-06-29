"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import inventoryData from "@/libraries/bk/inventory.json";
import analysisData from "@/libraries/bk/analysis.json";
import subjectsData from "@/libraries/bk/subjects.json";
import clustersData from "@/libraries/bk/clusters.json";

// ── Types ─────────────────────────────────────────────────────
type Book = {
  title: string;
  author: string;
  category: string;
  categories: string[];
  subject?: string;
  year?: number;
  status?: string;
  register?: string;
  density?: string;
  form?: string;
  lineage?: string | null;
  author_origin?: string;
  author_tradition?: string;
  topic?: string;
  subtopics?: string[];
  coverUrl?: string;
};

type Thread = {
  id: string;
  name: string;
  question: string;
  tension?: string;
  anchor?: string;
  color: string;
  books: string[];
};

type Cluster = {
  id: string;
  name: string;
  books: string[];
};

type CuratedCluster = {
  id: string;
  name: string;
  description: string;
  color: string;
  books: string[];
};

type Analysis = {
  threads: Thread[];
  clusters: Cluster[];
};

// ── Data ──────────────────────────────────────────────────────
const books = (inventoryData as { books: Book[] }).books;
const analysis = analysisData as Analysis;
const threads: Thread[] = analysis.threads;
const clusters: Cluster[] = analysis.clusters;
const subjects = subjectsData as { id: string; name: string }[];
const curatedClusters = clustersData as CuratedCluster[];

// Pre-compute thread membership per book title
const threadsByBook = new Map<string, Thread[]>();
for (const thread of threads) {
  for (const title of thread.books) {
    const existing = threadsByBook.get(title) ?? [];
    existing.push(thread);
    threadsByBook.set(title, existing);
  }
}

// Pre-compute cluster membership per book title
const clustersByBook = new Map<string, Cluster[]>();
for (const cluster of clusters) {
  for (const title of cluster.books) {
    const existing = clustersByBook.get(title) ?? [];
    existing.push(cluster);
    clustersByBook.set(title, existing);
  }
}

// ── Constants ─────────────────────────────────────────────────
const REGISTER_COLORS: Record<string, string> = {
  empirical: "#3A6B8A",
  systems: "#2E7D6B",
  humanist: "#8A7A3A",
  philosophical: "#6B4E8A",
  contemplative: "#8A5A3A",
};

const DENSITY_LABELS: Record<string, string> = {
  accessible: "Accessible",
  substantive: "Substantive",
  dense: "Dense",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  read: { label: "Read", color: "#2e7d50" },
  antilibrary: { label: "Antilibrary", color: "#8a7020" },
  "to-buy": { label: "To buy", color: "#888" },
  misplaced: { label: "Misplaced", color: "#a0522d" },
};

const SORT_OPTIONS = [
  { key: "random", label: "Discovery" },
  { key: "title", label: "Title A–Z" },
  { key: "author", label: "Author A–Z" },
  { key: "year-asc", label: "Year (oldest)" },
  { key: "year-desc", label: "Year (newest)" },
  { key: "register", label: "Register" },
  { key: "density", label: "Density" },
];

const REGISTER_ORDER = ["empirical", "systems", "humanist", "philosophical", "contemplative"];
const DENSITY_ORDER = ["accessible", "substantive", "dense"];

// ── FilterSelect ──────────────────────────────────────────────
function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          background: "#fff",
          border: "1px solid #ccc",
          color: value ? "#1a1a1a" : "#888",
          fontFamily: "system-ui, sans-serif",
          fontSize: "0.8rem",
          padding: "6px 28px 6px 10px",
          cursor: "pointer",
          borderRadius: 4,
          outline: "none",
          minWidth: 100,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "#999",
          fontSize: "0.65rem",
        }}
      >
        ▾
      </span>
    </div>
  );
}

// ── ActiveChip ────────────────────────────────────────────────
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "#eeecea",
        border: "1px solid #d8d5d0",
        borderRadius: 3,
        padding: "3px 8px",
        fontSize: "0.75rem",
        color: "#333",
      }}
    >
      {label}
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          color: "#999",
          cursor: "pointer",
          padding: 0,
          fontSize: "0.85rem",
          lineHeight: 1,
          marginLeft: 2,
        }}
      >
        ×
      </button>
    </span>
  );
}

// ── BookCard ──────────────────────────────────────────────────
function BookCard({ book, showCovers }: { book: Book; showCovers: boolean }) {
  const [hovered, setHovered] = useState(false);
  const bookThreads = threadsByBook.get(book.title) ?? [];
  const primaryThread = bookThreads[0];
  const topBarColor = primaryThread?.color ?? "#e0ddd8";
  const statusConf = book.status ? STATUS_CONFIG[book.status] : null;
  const coverUrl = book.coverUrl ? book.coverUrl.replace("-M.jpg", "-L.jpg") : "";

  if (showCovers) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          flexDirection: "column",
          cursor: "default",
          transform: hovered ? "translateY(-3px)" : "none",
          transition: "transform 0.15s",
        }}
      >
        {/* Cover */}
        <div
          style={{
            width: "100%",
            aspectRatio: "2/3",
            background: "#e8e4de",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: hovered
              ? "0 8px 24px rgba(0,0,0,0.18)"
              : "0 2px 8px rgba(0,0,0,0.10)",
            transition: "box-shadow 0.15s",
            position: "relative",
          }}
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 10px",
                background: `linear-gradient(160deg, #f0ede8 0%, #e4e0d8 100%)`,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 3,
                  background: topBarColor,
                  borderRadius: 2,
                  marginBottom: 10,
                }}
              />
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#444",
                  textAlign: "center",
                  lineHeight: 1.35,
                  margin: 0,
                }}
              >
                {book.title}
              </p>
              <p style={{ fontSize: "0.65rem", color: "#888", marginTop: 6, textAlign: "center" }}>
                {book.author}
              </p>
            </div>
          )}
          {/* Thread color bar at bottom of cover */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              background: topBarColor,
            }}
          />
        </div>

        {/* Info below cover */}
        <div style={{ padding: "8px 2px 0" }}>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.88rem",
              fontWeight: 600,
              color: "#1a1a1a",
              margin: "0 0 2px",
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {book.title}
          </p>
          <p style={{ fontSize: "0.72rem", color: "#777", margin: 0, lineHeight: 1.2 }}>
            {book.author}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 5 }}>
            <div style={{ display: "flex", gap: 3 }}>
              {bookThreads.slice(0, 4).map((t) => (
                <span
                  key={t.id}
                  title={t.name}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: t.color,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
            {statusConf && (
              <span style={{ fontSize: "0.6rem", color: statusConf.color, fontWeight: 500 }}>
                {statusConf.label}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: "1px solid #e0ddd8",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        minHeight: 148,
        overflow: "hidden",
        boxShadow: hovered ? "0 2px 12px rgba(0,0,0,0.08)" : "none",
        transition: "box-shadow 0.15s",
        cursor: "default",
      }}
    >
      {/* Top color bar */}
      <div style={{ height: 4, background: topBarColor, flexShrink: 0 }} />

      {/* Card body */}
      <div style={{ padding: "10px 12px 10px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Register + density */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          {book.register && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: REGISTER_COLORS[book.register] ?? "#ccc",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "0.65rem",
                  color: REGISTER_COLORS[book.register] ?? "#888",
                  textTransform: "capitalize",
                  fontWeight: 500,
                }}
              >
                {book.register}
              </span>
            </span>
          )}
          {book.density && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: "0.62rem",
                color: "#aaa",
                background: "#f4f2ef",
                borderRadius: 2,
                padding: "1px 5px",
              }}
            >
              {DENSITY_LABELS[book.density] ?? book.density}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "0.95rem",
            fontWeight: 600,
            lineHeight: 1.3,
            color: "#1a1a1a",
            margin: "0 0 4px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {book.title}
        </h3>

        {/* Author + year */}
        <p style={{ fontSize: "0.78rem", color: "#555", margin: 0 }}>
          {book.author}
          {book.year ? <span style={{ color: "#aaa", marginLeft: 5 }}>· {book.year}</span> : null}
        </p>

        {/* Bottom row */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {bookThreads.slice(0, 4).map((t) => (
              <span
                key={t.id}
                title={t.name}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: t.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          {statusConf && (
            <span style={{ fontSize: "0.65rem", color: statusConf.color, fontWeight: 500 }}>
              {statusConf.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ClustersAccordion ─────────────────────────────────────────
function ClustersAccordion({ books, showCovers }: { books: Book[]; showCovers: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const shuffledClusters = useMemo(() => {
    const arr = [...curatedClusters];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  function toggle(id: string) {
    const opening = openId !== id;
    setOpenId(opening ? id : null);
    if (opening) {
      setTimeout(() => {
        const el = rowRefs.current[id];
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 130;
        window.scrollTo({ top, behavior: "smooth" });
      }, 20);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {shuffledClusters.map((cluster) => {
        const clusterBooks = cluster.books
          .map((title) => books.find((b) => b.title === title))
          .filter(Boolean) as Book[];
        const isOpen = openId === cluster.id;

        return (
          <div key={cluster.id} ref={(el) => { rowRefs.current[cluster.id] = el; }} style={{ borderTop: "1px solid #e0ddd8" }}>
            {/* Header row — click to toggle */}
            <div
              onClick={() => toggle(cluster.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "18px 0",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <span style={{ fontSize: "1rem", color: "#555", fontWeight: 700, lineHeight: 1, flexShrink: 0, width: 14, textAlign: "center" }}>
                {isOpen ? "−" : "+"}
              </span>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: cluster.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  color: "#1a1a1a",
                }}
              >
                {cluster.name}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
                ({clusterBooks.length})
              </span>
            </div>

            {/* Expanded content */}
            {isOpen && (
              <div style={{ paddingBottom: 32 }}>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#777",
                    marginBottom: 20,
                    paddingLeft: 23,
                  }}
                >
                  {cluster.description}
                </p>
                {showCovers ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      overflowX: "auto",
                      paddingBottom: 8,
                      paddingLeft: 23,
                    }}
                  >
                    {clusterBooks.map((book, i) => (
                      <div key={i} style={{ flexShrink: 0, width: 100 }}>
                        <BookCard book={book} showCovers={true} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: 12,
                      paddingLeft: 23,
                    }}
                  >
                    {clusterBooks.map((book, i) => (
                      <BookCard key={i} book={book} showCovers={false} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ borderTop: "1px solid #e0ddd8" }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function AntiLibrary() {
  const [search, setSearch] = useState("");
  const [spineFilter, setSpineFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [registerFilter, setRegisterFilter] = useState("");
  const [densityFilter, setDensityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [sortKey, setSortKey] = useState("random");
  const [showCovers, setShowCovers] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "spine" | "clusters">("grid");
  const [selectedSpine, setSelectedSpine] = useState("");

  // Shuffled order — interleaved by subject, computed once per session
  const discoveryOrder = useMemo(() => {
    // Group by subject, then interleave so different topics mix
    const bySubject = new Map<string, Book[]>();
    for (const b of books) {
      const key = b.subject ?? b.category ?? "other";
      if (!bySubject.has(key)) bySubject.set(key, []);
      bySubject.get(key)!.push(b);
    }
    // Shuffle within each group
    for (const group of bySubject.values()) {
      for (let i = group.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [group[i], group[j]] = [group[j], group[i]];
      }
    }
    // Interleave groups round-robin
    const groups = [...bySubject.values()];
    const result: Book[] = [];
    const maxLen = Math.max(...groups.map((g) => g.length));
    for (let i = 0; i < maxLen; i++) {
      for (const g of groups) {
        if (g[i]) result.push(g[i]);
      }
    }
    return result;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Books in selected spine (thread)
  const spineBookSet = useMemo(() => {
    if (!spineFilter) return null;
    const thread = threads.find((t) => t.id === spineFilter);
    return thread ? new Set(thread.books) : null;
  }, [spineFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return books.filter((b) => {
      if (q && !b.title.toLowerCase().includes(q) && !b.author.toLowerCase().includes(q)) return false;
      if (spineBookSet && !spineBookSet.has(b.title)) return false;
      if (categoryFilter && b.category !== categoryFilter) return false;
      if (subjectFilter && b.subject !== subjectFilter) return false;
      if (registerFilter && b.register !== registerFilter) return false;
      if (densityFilter && b.density !== densityFilter) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (formFilter && b.form !== formFilter) return false;
      return true;
    });
  }, [search, spineBookSet, categoryFilter, subjectFilter, registerFilter, densityFilter, statusFilter, formFilter]);

  const sorted = useMemo(() => {
    const tiebreak = (a: Book, b: Book) => a.title.localeCompare(b.title);
    if (sortKey === "random") {
      return filtered.slice().sort(
        (a, b) => discoveryOrder.indexOf(a) - discoveryOrder.indexOf(b)
      );
    }
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "title":
          return tiebreak(a, b);
        case "author":
          return a.author.localeCompare(b.author) || tiebreak(a, b);
        case "year-asc":
          return ((a.year ?? 9999) - (b.year ?? 9999)) || tiebreak(a, b);
        case "year-desc":
          return ((b.year ?? 0) - (a.year ?? 0)) || tiebreak(a, b);
        case "register":
          return (REGISTER_ORDER.indexOf(a.register ?? "") - REGISTER_ORDER.indexOf(b.register ?? "")) || tiebreak(a, b);
        case "density":
          return (DENSITY_ORDER.indexOf(a.density ?? "") - DENSITY_ORDER.indexOf(b.density ?? "")) || tiebreak(a, b);
        default:
          return tiebreak(a, b);
      }
    });
  }, [filtered, sortKey]);

  // Active filters list (for chips)
  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (spineFilter) {
    const t = threads.find((x) => x.id === spineFilter);
    if (t) activeFilters.push({ label: `Spine: ${t.name}`, onRemove: () => setSpineFilter("") });
  }
  if (categoryFilter) {
    activeFilters.push({ label: `Category: ${categoryFilter}`, onRemove: () => setCategoryFilter("") });
  }
  if (subjectFilter) {
    activeFilters.push({ label: `Subject: ${subjectFilter}`, onRemove: () => setSubjectFilter("") });
  }
  if (registerFilter) activeFilters.push({ label: `Register: ${registerFilter}`, onRemove: () => setRegisterFilter("") });
  if (densityFilter) activeFilters.push({ label: `Density: ${densityFilter}`, onRemove: () => setDensityFilter("") });
  if (statusFilter) activeFilters.push({ label: `Status: ${statusFilter}`, onRemove: () => setStatusFilter("") });
  if (formFilter) activeFilters.push({ label: `Form: ${formFilter}`, onRemove: () => setFormFilter("") });

  const hasActiveFilters = activeFilters.length > 0 || search !== "";

  function resetAll() {
    setSearch("");
    setSpineFilter("");
    setCategoryFilter("");
    setSubjectFilter("");
    setRegisterFilter("");
    setDensityFilter("");
    setStatusFilter("");
    setFormFilter("");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f6f2",
        color: "#1a1a1a",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e0ddd8",
          padding: "18px 24px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px 24px",
          }}
        >
          {/* Title + subtitle */}
          <div>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                fontWeight: 600,
                color: "#1a1a1a",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Bharat's (anti)library
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#888" }}>
              {books.length} books · {threads.length} spines
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#666", fontStyle: "italic" }}>
              A concept Nassim Taleb named after observing Umberto Eco's 30,000-book library, in which there were many books that had not been read and would never be read.
            </p>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Link
              href="/visualizations"
              style={{ fontSize: "0.85rem", color: "#555", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1a1a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
            >
              Visualization Experiments
            </Link>
            <Link
              href="/researchers"
              style={{ fontSize: "0.85rem", color: "#555", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1a1a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
            >
              Researchers
            </Link>
            <Link
              href="/investor-letters"
              style={{ fontSize: "0.85rem", color: "#555", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1a1a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
            >
              Investor Letters
            </Link>
            <Link
              href="/magazines"
              style={{ fontSize: "0.85rem", color: "#555", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1a1a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
            >
              Magazines
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Sticky filter bar ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "#fff",
          borderBottom: "1px solid #e0ddd8",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        {/* Filter controls */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "10px 24px",
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or author…"
            style={{
              flex: "1 1 200px",
              minWidth: 160,
              background: "#fff",
              border: "1px solid #ccc",
              color: "#1a1a1a",
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.82rem",
              padding: "6px 10px",
              outline: "none",
              borderRadius: 4,
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#888")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#ccc")}
          />

          <FilterSelect
            value={spineFilter}
            onChange={setSpineFilter}
            placeholder="Spine"
            options={threads.map((t) => ({ value: t.id, label: t.name }))}
          />

          <FilterSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Category"
            options={["Architecture","Biography","Business","Classics","Design","Economics","Fiction","Graphic Novel","Health","History","Journals","Philosophy","Politics","Psychology","Science","Self-Help","Spirituality","Sports","Technology"].map((s) => ({ value: s, label: s }))}
          />

          <FilterSelect
            value={subjectFilter}
            onChange={setSubjectFilter}
            placeholder="Subject"
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
          />

          <FilterSelect
            value={registerFilter}
            onChange={setRegisterFilter}
            placeholder="Register"
            options={[
              { value: "empirical", label: "Empirical" },
              { value: "systems", label: "Systems" },
              { value: "humanist", label: "Humanist" },
              { value: "philosophical", label: "Philosophical" },
              { value: "contemplative", label: "Contemplative" },
            ]}
          />

          <FilterSelect
            value={densityFilter}
            onChange={setDensityFilter}
            placeholder="Density"
            options={[
              { value: "accessible", label: "Accessible" },
              { value: "substantive", label: "Substantive" },
              { value: "dense", label: "Dense" },
            ]}
          />

          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status"
            options={[
              { value: "read", label: "Read" },
              { value: "antilibrary", label: "Antilibrary" },
              { value: "to-buy", label: "To Buy" },
              { value: "misplaced", label: "Misplaced" },
            ]}
          />

          <FilterSelect
            value={formFilter}
            onChange={setFormFilter}
            placeholder="Form"
            options={[
              { value: "argument", label: "Argument" },
              { value: "narrative", label: "Narrative" },
              { value: "portrait", label: "Portrait" },
              { value: "manual", label: "Manual" },
              { value: "meditation", label: "Meditation" },
              { value: "reference", label: "Reference" },
              { value: "anthology", label: "Anthology" },
            ]}
          />

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {viewMode === "grid" && (
              <FilterSelect
                value={sortKey}
                onChange={setSortKey}
                placeholder="Sort"
                options={SORT_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
              />
            )}
            <button
              onClick={() => setShowCovers((v) => !v)}
              style={{
                background: showCovers ? "#1a1a1a" : "#fff",
                color: showCovers ? "#fff" : "#555",
                border: "1px solid #d8d5d0",
                borderRadius: 4,
                padding: "5px 12px",
                fontSize: "0.78rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              Book Covers
            </button>
            <button
              onClick={() => setViewMode((v) => v === "spine" ? "grid" : "spine")}
              style={{
                background: viewMode === "spine" ? "#1a1a1a" : "#fff",
                color: viewMode === "spine" ? "#fff" : "#555",
                border: "1px solid #d8d5d0",
                borderRadius: 4,
                padding: "5px 12px",
                fontSize: "0.78rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              By Spine
            </button>
            <button
              onClick={() => setViewMode((v) => v === "clusters" ? "grid" : "clusters")}
              style={{
                background: viewMode === "clusters" ? "#1a1a1a" : "#fff",
                color: viewMode === "clusters" ? "#fff" : "#555",
                border: "1px solid #d8d5d0",
                borderRadius: 4,
                padding: "5px 12px",
                fontSize: "0.78rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              Clusters
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "0 24px 10px",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {search && (
              <ActiveChip label={`"${search}"`} onRemove={() => setSearch("")} />
            )}
            {activeFilters.map((f) => (
              <ActiveChip key={f.label} label={f.label} onRemove={f.onRemove} />
            ))}
            <button
              onClick={resetAll}
              style={{
                background: "none",
                border: "none",
                color: "#888",
                fontSize: "0.75rem",
                cursor: "pointer",
                padding: "3px 6px",
                textDecoration: "underline",
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Main ── */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px 80px" }}>

        {/* Results count */}
        <p style={{ fontSize: "0.78rem", color: "#888", margin: "0 0 14px" }}>
          {sorted.length !== books.length
            ? `Showing ${sorted.length} of ${books.length} books`
            : `${books.length} books`}
        </p>

        {/* Featured cover strip — first 8 from discovery order, only in default view */}
        {viewMode === "grid" && !hasActiveFilters && !search && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 16, marginBottom: 24 }}>
            {discoveryOrder.filter(b => b.coverUrl).slice(0, 8).map((book, i) => (
              <BookCard key={`featured-${i}`} book={book} showCovers={true} />
            ))}
          </div>
        )}

        {/* ── Clusters view ── */}
        {viewMode === "clusters" ? (
          <ClustersAccordion books={books} showCovers={showCovers} />
        ) : /* ── Spine view ── */
        viewMode === "spine" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {/* Spine selector */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={selectedSpine}
                onChange={(e) => setSelectedSpine(e.target.value)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "1rem",
                  color: selectedSpine ? "#1a1a1a" : "#888",
                  padding: "7px 36px 7px 14px",
                  cursor: "pointer",
                  outline: "none",
                  minWidth: 260,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                }}
              >
                <option value="">All spines</option>
                {threads.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {selectedSpine && (
                <button
                  onClick={() => setSelectedSpine("")}
                  style={{ background: "none", border: "none", color: "#aaa", fontSize: "0.8rem", cursor: "pointer" }}
                >
                  Show all
                </button>
              )}
            </div>

            {threads.filter((t) => !selectedSpine || t.id === selectedSpine).map((thread) => {
              const threadBooks = thread.books
                .map((title) => books.find((b) => b.title === title))
                .filter(Boolean) as Book[];
              if (threadBooks.length === 0) return null;
              return (
                <div key={thread.id}>
                  {/* Spine header */}
                  <div style={{ marginBottom: 20, borderBottom: `2px solid ${thread.color}`, paddingBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: thread.color,
                          flexShrink: 0,
                          marginBottom: 2,
                        }}
                      />
                      <h2
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: "1.5rem",
                          fontWeight: 600,
                          color: "#1a1a1a",
                          margin: 0,
                        }}
                      >
                        {thread.name}
                      </h2>
                      <span style={{ fontSize: "0.75rem", color: "#888" }}>
                        {threadBooks.length} books
                      </span>
                    </div>
                    <p
                      style={{
                        margin: "6px 0 0 22px",
                        fontSize: "0.9rem",
                        color: "#555",
                        fontStyle: "italic",
                      }}
                    >
                      {thread.question}
                    </p>
                    {thread.tension && (
                      <p style={{ margin: "4px 0 0 22px", fontSize: "0.78rem", color: "#999" }}>
                        {thread.tension}
                      </p>
                    )}
                  </div>

                  {/* Books row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: showCovers
                        ? "repeat(auto-fill, minmax(120px, 1fr))"
                        : "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: showCovers ? 16 : 12,
                    }}
                  >
                    {threadBooks.map((book, i) => (
                      <BookCard key={`${book.title}-${i}`} book={book} showCovers={showCovers} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : sorted.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaa", fontSize: "0.9rem", padding: "60px 0" }}>
            No books match these filters.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: showCovers ? "repeat(auto-fill, minmax(148px, 1fr))" : "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            {sorted.map((book, i) => (
              <BookCard key={`${book.title}-${i}`} book={book} showCovers={showCovers} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
