"use client";
import { useState } from "react";
import Image from "next/image";
import clustersData from "@/data/clusters.json";
import inventoryData from "@/data/inventory.json";

type Book = { title: string; author: string; category: string; coverUrl?: string; status?: string };
type CuratedCluster = { id: string; name: string; description: string; color: string; books: string[] };

const allBooks: Book[] = (inventoryData as { books: Book[] }).books;
const clusters = clustersData as CuratedCluster[];

function resolveBooks(cluster: CuratedCluster): Book[] {
  return cluster.books.map(t => allBooks.find(b => b.title === t)).filter(Boolean) as Book[];
}

function Cover({ book, size = 80 }: { book: Book; size?: number }) {
  return book.coverUrl ? (
    <Image src={book.coverUrl} alt={book.title} width={size} height={size * 1.4}
      style={{ width: size, height: size * 1.4, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
      unoptimized />
  ) : (
    <div style={{ width: size, height: size * 1.4, background: "#eee", borderRadius: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 8, color: "#bbb", textAlign: "center", padding: 2 }}>{book.title.slice(0, 20)}</span>
    </div>
  );
}

/* ── Design 1: Horizontal scroll rows ─────────────────────────── */
function Design1() {
  return (
    <div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontWeight: 400, marginBottom: 32, color: "#111" }}>
        Layout 1 — Horizontal Rows
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {clusters.map(cluster => {
          const books = resolveBooks(cluster);
          return (
            <div key={cluster.id}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12, borderBottom: `2px solid ${cluster.color}`, paddingBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: cluster.color, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", color: "#111" }}>{cluster.name}</span>
                <span style={{ fontSize: "0.75rem", color: "#aaa" }}>{books.length} books</span>
                <span style={{ fontSize: "0.75rem", color: "#aaa", marginLeft: "auto" }}>{cluster.description}</span>
              </div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
                {books.map((book, i) => (
                  <div key={i} style={{ flexShrink: 0, width: 72 }}>
                    <Cover book={book} size={72} />
                    <p style={{ fontSize: "0.6rem", color: "#555", margin: "4px 0 0", lineHeight: 1.2 }}>{book.title}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Design 2: Overview grid → drill down ──────────────────────── */
function Design2() {
  const [active, setActive] = useState<string | null>(null);
  const activeCluster = clusters.find(c => c.id === active);
  const activeBooks = activeCluster ? resolveBooks(activeCluster) : [];

  if (active && activeCluster) {
    return (
      <div>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontWeight: 400, marginBottom: 32, color: "#111" }}>
          Layout 2 — Grid Overview → Drill Down
        </h2>
        <button onClick={() => setActive(null)} style={{ fontSize: "0.8rem", color: "#555", background: "none", border: "none", cursor: "pointer", marginBottom: 24, padding: 0 }}>
          ← All clusters
        </button>
        <div style={{ borderBottom: `2px solid ${activeCluster.color}`, paddingBottom: 12, marginBottom: 24 }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontWeight: 400, margin: 0 }}>{activeCluster.name}</h3>
          <p style={{ fontSize: "0.85rem", color: "#666", margin: "4px 0 0" }}>{activeCluster.description}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 16 }}>
          {activeBooks.map((book, i) => (
            <div key={i}>
              <Cover book={book} size={90} />
              <p style={{ fontSize: "0.65rem", color: "#444", margin: "5px 0 0", lineHeight: 1.2 }}>{book.title}</p>
              <p style={{ fontSize: "0.6rem", color: "#888", margin: "2px 0 0" }}>{book.author}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontWeight: 400, marginBottom: 32, color: "#111" }}>
        Layout 2 — Grid Overview → Drill Down
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {clusters.map(cluster => {
          const books = resolveBooks(cluster);
          const previews = books.filter(b => b.coverUrl).slice(0, 4);
          return (
            <div key={cluster.id} onClick={() => setActive(cluster.id)} style={{
              border: "1px solid #e5e5e5", borderTop: `3px solid ${cluster.color}`,
              borderRadius: 4, padding: 16, cursor: "pointer",
              transition: "box-shadow 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
            >
              <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                {previews.map((b, i) => <Cover key={i} book={b} size={44} />)}
                {previews.length === 0 && <div style={{ height: 62, display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: "0.7rem", color: "#bbb" }}>No covers</span>
                </div>}
              </div>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "1rem", color: "#111", margin: "0 0 4px" }}>{cluster.name}</p>
              <p style={{ fontSize: "0.72rem", color: "#888", margin: "0 0 8px", lineHeight: 1.4 }}>{cluster.description}</p>
              <p style={{ fontSize: "0.7rem", color: cluster.color, margin: 0 }}>{books.length} books →</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Design 3: Accordion ───────────────────────────────────────── */
function Design3() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontWeight: 400, marginBottom: 32, color: "#111" }}>
        Layout 3 — Accordion
      </h2>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {clusters.map(cluster => {
          const books = resolveBooks(cluster);
          const isOpen = open === cluster.id;
          return (
            <div key={cluster.id} style={{ borderTop: "1px solid #eee" }}>
              <div onClick={() => setOpen(isOpen ? null : cluster.id)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 0", cursor: "pointer",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: cluster.color, flexShrink: 0 }} />
                <span style={{ fontFamily: "Georgia, serif", fontSize: "1.05rem", color: "#111", flex: 1 }}>{cluster.name}</span>
                <span style={{ fontSize: "0.75rem", color: "#aaa" }}>{books.length} books</span>
                <span style={{ fontSize: "0.9rem", color: "#bbb", marginLeft: 8 }}>{isOpen ? "−" : "+"}</span>
              </div>
              {isOpen && (
                <div style={{ paddingBottom: 24 }}>
                  <p style={{ fontSize: "0.82rem", color: "#777", marginBottom: 16, paddingLeft: 22 }}>{cluster.description}</p>
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, paddingLeft: 22 }}>
                    {books.map((book, i) => (
                      <div key={i} style={{ flexShrink: 0, width: 80 }}>
                        <Cover book={book} size={80} />
                        <p style={{ fontSize: "0.6rem", color: "#444", margin: "4px 0 0", lineHeight: 1.2 }}>{book.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div style={{ borderTop: "1px solid #eee" }} />
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */
export default function ClusterCompare() {
  const [active, setActive] = useState<1 | 2 | 3>(1);

  return (
    <main style={{ minHeight: "100vh", fontFamily: "var(--font-dm), sans-serif", color: "#111" }}>
      <div style={{ position: "sticky", top: 40, zIndex: 50, background: "#fff", borderBottom: "1px solid #eee", padding: "12px 48px", display: "flex", gap: 24 }}>
        {([1, 2, 3] as const).map(n => (
          <button key={n} onClick={() => setActive(n)} style={{
            fontSize: "0.85rem", fontFamily: "var(--font-dm), sans-serif",
            background: active === n ? "#111" : "transparent",
            color: active === n ? "#fff" : "#555",
            border: active === n ? "1px solid #111" : "1px solid #ddd",
            padding: "6px 18px", borderRadius: 2, cursor: "pointer",
          }}>
            Layout {n}
          </button>
        ))}
      </div>
      <div style={{ padding: "40px 48px", maxWidth: 1100 }}>
        {active === 1 && <Design1 />}
        {active === 2 && <Design2 />}
        {active === 3 && <Design3 />}
      </div>
    </main>
  );
}
