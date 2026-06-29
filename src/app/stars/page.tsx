"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import inventoryData from "@/data/inventory.json";
import analysisData from "@/data/analysis.json";

/* ── Types ─────────────────────────────────────────────────────── */
type Book = {
  title: string; author: string; category: string;
  categories?: string[]; format?: string; year?: number;
  author_origin?: string; topic?: string; subtopics?: string[];
  author_tradition?: string; confidence?: string; notes?: string;
  register?: string; density?: string; form?: string; lineage?: string | null;
  status?: string;
};

type AnalysisThread = {
  id: string; name: string; question: string; color: string;
  anchor: string; tension: string; books: string[];
};

type AnalysisCluster = {
  id: string; name: string; gravity: string; books: string[];
};

type Analysis = {
  threads: AnalysisThread[];
  clusters: AnalysisCluster[];
};

const inventory = inventoryData as { books: Book[] };
const analysis = analysisData as Analysis;

/* ── Canvas ─────────────────────────────────────────────────────── */
const W = 3200, H = 1600;
const PX = 120, PY = 120;

/* ── Register x-axis mapping ─────────────────────────────────────── */
const REGISTER_X: Record<string, number> = {
  empirical:      0.05,
  systems:        0.20,
  humanist:       0.50,
  philosophical:  0.75,
  contemplative:  0.95,
};

const REGISTER_LABELS = [
  { label: "EMPIRICAL",     pos: 0.05 },
  { label: "SYSTEMS",       pos: 0.20 },
  { label: "HUMANIST",      pos: 0.50 },
  { label: "PHILOSOPHICAL", pos: 0.75 },
  { label: "CONTEMPLATIVE", pos: 0.95 },
];

/* ── Category color palette (from existing constellation) ─────────── */
const COLOR: Record<string, string> = {
  Business:       "#5aaa7a",
  Fiction:        "#d06070",
  Science:        "#6a90e0",
  Philosophy:     "#e07050",
  Psychology:     "#c09060",
  History:        "#5080c8",
  Economics:      "#4aaa75",
  "Self-Help":    "#aa8060",
  Design:         "#c06070",
  Biography:      "#9a7aaa",
  Technology:     "#6a70c8",
  Politics:       "#c85050",
  Journals:       "#7aaa7a",
  Spirituality:   "#c0a060",
  Health:         "#5aaa9a",
  Sports:         "#8aaa50",
  Sociology:      "#9a8068",
  "Graphic Novel":"#8a6aaa",
};

/* ── Seeded random ──────────────────────────────────────────────── */
function seededRand(n: number) {
  const x = Math.sin(n + 1) * 10000;
  return x - Math.floor(x);
}
function hashStr(s: string) {
  let h = 0;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/* ── Build thread lookup maps ────────────────────────────────────── */
const THREAD_BY_TITLE: Map<string, AnalysisThread[]> = new Map();
for (const thread of analysis.threads) {
  for (const title of thread.books) {
    const existing = THREAD_BY_TITLE.get(title) ?? [];
    existing.push(thread);
    THREAD_BY_TITLE.set(title, existing);
  }
}

const ANCHOR_TITLES = new Set(analysis.threads.map(t => t.anchor));

/* ── Node computation ────────────────────────────────────────────── */
type Node = {
  book: Book;
  x: number; y: number;
  color: string;
  radius: number;
  opacity: number;
  seminalWeight: number;
  threads: AnalysisThread[];
};

function buildNodes(books: Book[]): Node[] {
  const active = W - PX * 2;
  const activeH = H - PY * 2;

  return books.map(b => {
    const seed = hashStr(b.title);
    const threads = THREAD_BY_TITLE.get(b.title) ?? [];
    const threadCount = threads.length;

    // X axis — register with jitter
    const regX = REGISTER_X[b.register ?? "humanist"] ?? 0.5;
    const jitterX = (seededRand(seed + 7) - 0.5) * 0.12; // ±0.06
    const xFrac = Math.max(0.01, Math.min(0.99, regX + jitterX));
    const x = PX + xFrac * active;

    // Y axis — centrality (thread count) with band jitter
    let yBandMin: number, yBandMax: number;
    if (threadCount === 0) {
      yBandMin = 0.85; yBandMax = 0.95;
    } else if (threadCount === 1) {
      yBandMin = 0.55; yBandMax = 0.75;
    } else if (threadCount === 2) {
      yBandMin = 0.35; yBandMax = 0.55;
    } else {
      yBandMin = 0.05; yBandMax = 0.35;
    }
    const jitterY = (seededRand(seed + 13) - 0.5) * 0.16; // ±0.08
    const yFrac = Math.max(0.01, Math.min(0.99, yBandMin + seededRand(seed + 5) * (yBandMax - yBandMin) + jitterY));
    const y = PY + yFrac * activeH;

    // Seminal weight
    let w = 0.2;
    if (b.density === "dense") w += 0.3;
    else if (b.density === "substantive") w += 0.15;
    if (threadCount >= 3) w += 0.25;
    else if (threadCount === 2) w += 0.15;
    if (ANCHOR_TITLES.has(b.title)) w += 0.15;
    const seminalWeight = Math.min(1, w);

    const radius = 2 + seminalWeight * 6;
    const opacity = 0.35 + seminalWeight * 0.65;

    // Color: use first thread color if in any thread, else category color
    const color = threads.length > 0
      ? threads[0].color
      : (COLOR[b.category] ?? "#9a8a70");

    return { book: b, x, y, color, radius, opacity, seminalWeight, threads };
  });
}

/* ── Cluster region computation ──────────────────────────────────── */
const CLUSTER_IDS = [
  "city_as_living_system",
  "conditions_of_creativity",
  "model_thinking",
  "aesop_collection",
  "lucretius_editions",
];

const CLUSTER_COLORS: Record<string, string> = {
  city_as_living_system:    "#5080c8",
  conditions_of_creativity: "#7A4A8A",
  model_thinking:           "#3A7A8A",
  aesop_collection:         "#8A7A3A",
  lucretius_editions:       "#C45C3A",
};

/* ── Page ────────────────────────────────────────────────────────── */
export default function StarsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  /* Transform state */
  const [transform, setTransform] = useState({ s: 1, tx: 0, ty: 0 });
  const tRef = useRef({ s: 1, tx: 0, ty: 0 });
  const applyT = useCallback((s: number, tx: number, ty: number) => {
    s = Math.max(0.05, Math.min(16, s));
    tRef.current = { s, tx, ty };
    setTransform({ s, tx, ty });
  }, []);

  const [hovered, setHovered]       = useState<number | null>(null);
  const [selected, setSelected]     = useState<number | null>(null);
  const [showSpines, setShowSpines] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const [highlightThread, setHighlightThread] = useState<string | null>(null);
  const [loaded, setLoaded]         = useState(false);

  /* Drag */
  const dragging  = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });
  const pinchDist = useRef<number | null>(null);

  /* Build nodes */
  const nodes = useMemo(() => buildNodes(inventory.books), []);

  /* Thread arcs */
  const threadArcs = useMemo(() => {
    const byTitle = new Map(nodes.map(n => [n.book.title, n]));
    return analysis.threads.map(thread => {
      const pts = thread.books
        .map(t => byTitle.get(t))
        .filter((n): n is Node => n != null)
        .sort((a, b) => a.x - b.x);
      const segs: string[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b.x - a.x;
        segs.push(`M${a.x},${a.y} C${a.x + dx * 0.42},${a.y} ${b.x - dx * 0.42},${b.y} ${b.x},${b.y}`);
      }
      return { thread, pts, segs };
    });
  }, [nodes]);

  /* Cluster regions */
  const clusterRegions = useMemo(() => {
    const byTitle = new Map(nodes.map(n => [n.book.title, n]));
    return analysis.clusters
      .filter(c => CLUSTER_IDS.includes(c.id))
      .map(c => {
        const members = c.books.map(t => byTitle.get(t)).filter((n): n is Node => n != null);
        if (members.length === 0) return null;
        const xs = members.map(n => n.x);
        const ys = members.map(n => n.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const rx = (maxX - minX) / 2 + 80;
        const ry = (maxY - minY) / 2 + 60;
        const color = CLUSTER_COLORS[c.id] ?? "#8a7a6a";
        return { cluster: c, cx, cy, rx, ry, color, count: members.length };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [nodes]);

  /* Init fit */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const usableH = height - 52;
    const s = Math.min(width / W, usableH / H) * 0.88;
    applyT(s, (width - W * s) / 2, 52 + (usableH - H * s) / 2);
    setTimeout(() => setLoaded(true), 120);
  }, [applyT]);

  /* Non-passive wheel zoom */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fn = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
      const { s, tx, ty } = tRef.current;
      const factor = e.deltaY > 0 ? 0.91 : 1.10;
      const ns = Math.max(0.05, Math.min(16, s * factor));
      applyT(ns, cx - (cx - tx) * (ns / s), cy - (cy - ty) * (ns / s));
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, [applyT]);

  /* Mouse pan */
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).hasAttribute("data-book")) return;
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, tx: tRef.current.tx, ty: tRef.current.ty };
    e.preventDefault();
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const { mx, my, tx, ty } = dragStart.current;
    applyT(tRef.current.s, tx + e.clientX - mx, ty + e.clientY - my);
  }, [applyT]);
  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  /* Touch pan + pinch zoom */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragging.current = true;
      dragStart.current = { mx: e.touches[0].clientX, my: e.touches[0].clientY, tx: tRef.current.tx, ty: tRef.current.ty };
      pinchDist.current = null;
    } else if (e.touches.length === 2) {
      dragging.current = false;
      pinchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragging.current) {
      const { mx, my, tx, ty } = dragStart.current;
      applyT(tRef.current.s, tx + e.touches[0].clientX - mx, ty + e.touches[0].clientY - my);
    } else if (e.touches.length === 2 && pinchDist.current != null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const rect = containerRef.current!.getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      const { s, tx, ty } = tRef.current;
      const ns = Math.max(0.05, Math.min(16, s * dist / pinchDist.current));
      applyT(ns, cx - (cx - tx) * (ns / s), cy - (cy - ty) * (ns / s));
      pinchDist.current = dist;
    }
  }, [applyT]);
  const onTouchEnd = useCallback(() => {
    dragging.current = false;
    pinchDist.current = null;
  }, []);

  const { s, tx, ty } = transform;
  const hNode = hovered  != null ? nodes[hovered]  : null;
  const sNode = selected != null ? nodes[selected] : null;

  /* Focus thread set — for dimming */
  const focusThreadId = highlightThread;
  const focusFromSelection = sNode
    ? new Set(sNode.threads.map(t => t.id))
    : null;

  const tipX = hNode ? hNode.x * s + tx : 0;
  const tipY = hNode ? hNode.y * s + ty : 0;

  const active = W - PX * 2;
  const activeH = H - PY * 2;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw", height: "calc(100vh - 40px)", overflow: "hidden",
        background: "#080604", position: "relative",
        fontFamily: "var(--font-dm), system-ui, sans-serif",
        cursor: dragging.current ? "grabbing" : "grab",
        touchAction: "none", userSelect: "none",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── SVG ──────────────────────────────────────────────────── */}
      <svg width="100%" height="100%" style={{ display: "block", position: "absolute", inset: 0 }}>
        <defs>
          {/* Per-color glow filters for seminal stars */}
          <filter id="starglow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="hoverglow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="nebula" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="40"/>
          </filter>
        </defs>

        <g transform={`translate(${tx},${ty}) scale(${s})`} style={{ willChange: "transform" }}>

          {/* Subtle grid lines at register boundaries */}
          {REGISTER_LABELS.map(({ pos }) => {
            const xPos = PX + pos * active;
            return (
              <line key={pos}
                x1={xPos} y1={PY} x2={xPos} y2={H - PY}
                stroke="#0f0a06" strokeWidth={1.5}
                style={{ pointerEvents: "none" }}
              />
            );
          })}

          {/* y-axis label: CENTRAL (top) / PERIPHERAL (bottom) */}
          <text
            x={PX - 22} y={PY + activeH * 0.05}
            textAnchor="middle" fill="rgba(200,168,122,0.12)"
            fontSize={8} fontFamily="var(--font-dm), system-ui"
            letterSpacing="0.14em"
            transform={`rotate(-90, ${PX - 22}, ${PY + activeH * 0.05})`}
            style={{ pointerEvents: "none" }}
          >CENTRAL</text>
          <text
            x={PX - 22} y={PY + activeH * 0.95}
            textAnchor="middle" fill="rgba(200,168,122,0.12)"
            fontSize={8} fontFamily="var(--font-dm), system-ui"
            letterSpacing="0.14em"
            transform={`rotate(-90, ${PX - 22}, ${PY + activeH * 0.95})`}
            style={{ pointerEvents: "none" }}
          >PERIPHERAL</text>

          {/* x-axis register labels */}
          {REGISTER_LABELS.map(({ label, pos }) => (
            <text key={label}
              x={PX + pos * active}
              y={H - PY + 28}
              textAnchor="middle" fill="rgba(200,168,122,0.13)"
              fontSize={8} fontFamily="var(--font-dm), system-ui"
              letterSpacing="0.16em"
              style={{ pointerEvents: "none" }}
            >{label}</text>
          ))}

          {/* Cluster nebulae */}
          {showClusters && clusterRegions.map(r => (
            <g key={r.cluster.id} style={{ pointerEvents: "none" }}>
              {/* Soft glow fill */}
              <ellipse
                cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry}
                fill={r.color} opacity={0.04}
                filter="url(#nebula)"
              />
              {/* Crisp stroke */}
              <ellipse
                cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry}
                fill={r.color} fillOpacity={0.04}
                stroke={r.color} strokeWidth={0.8}
                strokeOpacity={0.15}
                strokeDasharray="6 9"
              />
              {/* Cluster name */}
              <text
                x={r.cx} y={r.cy - r.ry - 18}
                textAnchor="middle" fill={r.color}
                fontSize={11} fontFamily="var(--font-cormorant), Georgia, serif"
                fontStyle="italic" letterSpacing="0.04em"
                opacity={0.55}
                style={{ pointerEvents: "none" }}
              >{r.cluster.name}</text>
            </g>
          ))}

          {/* Thread spine arcs */}
          {showSpines && (
            <g style={{ pointerEvents: "none", opacity: loaded ? 1 : 0, transition: "opacity 0.8s ease" }}>
              {threadArcs.map(({ thread, segs }) => {
                const isHighlighted = focusThreadId === thread.id
                  || (focusFromSelection != null && focusFromSelection.has(thread.id));
                const isDimmed = (focusThreadId != null && focusThreadId !== thread.id)
                  || (focusFromSelection != null && !focusFromSelection.has(thread.id));
                return (
                  <g key={thread.id}>
                    {segs.map((d, i) => (
                      <path key={i} d={d} fill="none"
                        stroke={thread.color}
                        strokeWidth={isHighlighted ? 2.4 : 1.2}
                        opacity={isDimmed ? 0.04 : isHighlighted ? 0.7 : 0.22}
                        strokeLinecap="round"
                        style={{ transition: "opacity 0.22s ease, stroke-width 0.2s ease" }}
                      />
                    ))}
                  </g>
                );
              })}
            </g>
          )}

          {/* Thread labels */}
          {showSpines && (
            <g style={{ pointerEvents: "none", opacity: loaded ? 1 : 0, transition: "opacity 0.8s ease" }}>
              {threadArcs.map(({ thread, pts }) => {
                if (pts.length === 0) return null;
                const isHighlighted = focusThreadId === thread.id
                  || (focusFromSelection != null && focusFromSelection.has(thread.id));
                const isDimmed = (focusThreadId != null && focusThreadId !== thread.id)
                  || (focusFromSelection != null && !focusFromSelection.has(thread.id));
                const mid = pts[Math.floor(pts.length / 2)];
                return (
                  <text key={thread.id}
                    x={mid.x} y={mid.y - 18}
                    textAnchor="middle"
                    fill={thread.color}
                    fontSize={isHighlighted ? 13 : 9.5}
                    fontFamily="var(--font-cormorant), Georgia, serif"
                    fontStyle="italic" letterSpacing="0.03em"
                    opacity={isDimmed ? 0.04 : isHighlighted ? 0.95 : 0.40}
                    style={{ transition: "opacity 0.22s ease" }}
                  >{thread.name}</text>
                );
              })}
            </g>
          )}

          {/* Stars — main layer */}
          <g style={{ opacity: loaded ? 1 : 0, transition: "opacity 1.4s ease" }}>
            {nodes.map((n, i) => {
              const isH = hovered  === i;
              const isS = selected === i;
              const bright = isH || isS;
              const isInHighlightedThread = highlightThread
                ? n.threads.some(t => t.id === highlightThread)
                : false;
              const dimByThread = highlightThread && !isInHighlightedThread;

              let finalOpacity = n.opacity;
              if (dimByThread) finalOpacity = Math.min(n.opacity * 0.12, 0.08);
              if (bright) finalOpacity = 1;

              const r = bright ? Math.max(n.radius * 1.6, 8) : n.radius;

              return (
                <g key={i}>
                  {/* Soft glow layer for high-seminal stars */}
                  {n.seminalWeight > 0.6 && !bright && (
                    <circle
                      cx={n.x} cy={n.y} r={r * 2.5}
                      fill={n.color}
                      opacity={finalOpacity * 0.18}
                      filter="url(#nebula)"
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  <circle
                    data-book="1"
                    cx={n.x} cy={n.y} r={r}
                    fill={n.color}
                    opacity={finalOpacity}
                    filter={bright ? "url(#hoverglow)" : n.seminalWeight > 0.6 ? "url(#starglow)" : undefined}
                    style={{ cursor: "pointer", transition: "r 0.12s ease, opacity 0.25s ease" }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={e => {
                      e.stopPropagation();
                      setSelected(isS ? null : i);
                      setHovered(null);
                      setHighlightThread(null);
                    }}
                  />
                </g>
              );
            })}
          </g>

        </g>
      </svg>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 52, zIndex: 40,
        background: "rgba(8,6,4,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(200,168,122,0.09)",
        display: "flex", alignItems: "center", padding: "0 20px", gap: 16,
      }}>
        <Link href="/" style={{ color: "#c8a87a", fontSize: "0.66rem", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", opacity: 0.5, flexShrink: 0 }}>
          ← Library
        </Link>
        <div style={{ width: 1, height: 16, background: "rgba(200,168,122,0.15)" }}/>
        <span style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1.12rem", color: "#c8a87a", letterSpacing: "0.06em", fontStyle: "italic" }}>
          An (Anti)Library
        </span>
        <span style={{ fontSize: "0.6rem", color: "rgba(200,168,122,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid rgba(200,168,122,0.25)", padding: "2px 8px" }}>
          Under experiment
        </span>
        <span style={{ fontSize: "0.6rem", color: "rgba(200,168,122,0.28)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {nodes.length} stars
        </span>
        <div style={{ flex: 1 }}/>
        <button
          onClick={() => setShowSpines(v => !v)}
          style={{
            background: showSpines ? "rgba(200,168,122,0.13)" : "transparent",
            border: `1px solid ${showSpines ? "rgba(200,168,122,0.44)" : "rgba(200,168,122,0.2)"}`,
            color: "#c8a87a", fontSize: "0.62rem", letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "5px 14px", cursor: "pointer",
            flexShrink: 0, transition: "all 0.15s",
          }}
        >
          {showSpines ? "Hide" : "Show"} Spines
        </button>
        <button
          onClick={() => setShowClusters(v => !v)}
          style={{
            background: showClusters ? "rgba(200,168,122,0.13)" : "transparent",
            border: `1px solid ${showClusters ? "rgba(200,168,122,0.44)" : "rgba(200,168,122,0.2)"}`,
            color: "#c8a87a", fontSize: "0.62rem", letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "5px 14px", cursor: "pointer",
            flexShrink: 0, transition: "all 0.15s",
          }}
        >
          {showClusters ? "Hide" : "Show"} Clusters
        </button>
      </header>

      {/* ── Hover tooltip ───────────────────────────────────────── */}
      {hNode && selected !== hovered && (() => {
        const vw = containerRef.current?.getBoundingClientRect().width ?? 800;
        const vh = containerRef.current?.getBoundingClientRect().height ?? 600;
        const flipX = tipX > vw * 0.62;
        const clampY = Math.max(60, Math.min(vh - 200, tipY - 48));
        return (
          <div style={{
            position: "absolute",
            left: flipX ? tipX - 258 - 12 : tipX + 14,
            top: clampY,
            width: 254,
            background: "rgba(8,6,4,0.97)",
            border: "1px solid rgba(200,168,122,0.1)",
            borderLeft: `3px solid ${hNode.color}`,
            padding: "12px 15px",
            pointerEvents: "none",
            zIndex: 50,
            boxShadow: "0 12px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(200,168,122,0.05)",
          }}>
            <p style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1.05rem", fontWeight: 600, color: "#f0e4cc", lineHeight: 1.22, marginBottom: 4 }}>
              {hNode.book.title}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#7a6050", marginBottom: 6 }}>{hNode.book.author}</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
              {hNode.book.register && (
                <span style={{ fontSize: "0.58rem", color: "#5a4838", letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid rgba(200,168,122,0.12)", padding: "2px 6px" }}>
                  {hNode.book.register}
                </span>
              )}
              {hNode.book.density && (
                <span style={{ fontSize: "0.58rem", color: "#5a4838", letterSpacing: "0.08em", border: "1px solid rgba(200,168,122,0.1)", padding: "2px 6px" }}>
                  {hNode.book.density}
                </span>
              )}
            </div>
            {hNode.threads.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                {hNode.threads.slice(0, 3).map(t => (
                  <span key={t.id} style={{ fontSize: "0.6rem", color: t.color, letterSpacing: "0.02em", opacity: 0.85 }}>
                    · {t.name}
                  </span>
                ))}
                {hNode.threads.length > 3 && (
                  <span style={{ fontSize: "0.58rem", color: "#4a3828" }}>+{hNode.threads.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Selected side panel ─────────────────────────────────── */}
      {sNode && (
        <div style={{
          position: "absolute", right: 0, top: 52, bottom: 0, width: 330,
          background: "rgba(8,6,4,0.98)",
          borderLeft: "1px solid rgba(200,168,122,0.09)",
          borderTop: `3px solid ${sNode.color}`,
          overflowY: "auto", zIndex: 45,
          padding: "22px 20px 28px 22px",
        }}>
          <button
            onClick={() => { setSelected(null); setHighlightThread(null); }}
            style={{ position: "absolute", top: 10, right: 14, background: "none", border: "none", color: "#4a3828", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}
          >✕</button>

          <p style={{ fontSize: "0.57rem", letterSpacing: "0.15em", color: sNode.color, textTransform: "uppercase", marginBottom: 10 }}>
            {sNode.book.category}
          </p>
          <h2 style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1.5rem", fontWeight: 600, color: "#f0e4cc", lineHeight: 1.2, marginBottom: 7 }}>
            {sNode.book.title}
          </h2>
          <p style={{ fontSize: "0.77rem", color: "#7a6050", marginBottom: 16, letterSpacing: "0.01em" }}>
            {sNode.book.author}
          </p>

          {/* Metadata tags */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
            {sNode.book.register && (
              <span style={{ fontSize: "0.6rem", color: "#6a5840", border: "1px solid rgba(200,168,122,0.16)", padding: "2px 8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {sNode.book.register}
              </span>
            )}
            {sNode.book.density && (
              <span style={{ fontSize: "0.6rem", color: "#6a5840", border: "1px solid rgba(200,168,122,0.14)", padding: "2px 8px" }}>
                {sNode.book.density}
              </span>
            )}
            {sNode.book.form && (
              <span style={{ fontSize: "0.6rem", color: "#6a5840", border: "1px solid rgba(200,168,122,0.14)", padding: "2px 8px" }}>
                {sNode.book.form}
              </span>
            )}
            {sNode.book.status && (
              <span style={{ fontSize: "0.6rem", color: sNode.book.status === "read" ? "#4a8a6a" : "#5a4838", border: `1px solid ${sNode.book.status === "read" ? "#4a8a6a55" : "rgba(200,168,122,0.12)"}`, padding: "2px 8px" }}>
                {sNode.book.status}
              </span>
            )}
            {sNode.book.year != null && (
              <span style={{ fontSize: "0.6rem", color: "#5a4838", border: "1px solid rgba(200,168,122,0.14)", padding: "2px 8px", letterSpacing: "0.04em" }}>
                {sNode.book.year < 0 ? `${Math.abs(sNode.book.year)} BCE` : sNode.book.year}
              </span>
            )}
          </div>

          {sNode.book.topic && (
            <p style={{ fontSize: "0.78rem", color: "#c8a87a", fontStyle: "italic", lineHeight: 1.55, marginBottom: 8 }}>
              {sNode.book.topic}
            </p>
          )}
          {sNode.book.author_tradition && (
            <p style={{ fontSize: "0.64rem", color: "#4a3828", marginBottom: 6, letterSpacing: "0.02em" }}>
              {sNode.book.author_tradition}
            </p>
          )}
          {sNode.book.lineage && (
            <p style={{ fontSize: "0.62rem", color: "#4a3828", marginBottom: 18, fontStyle: "italic" }}>
              Lineage: {sNode.book.lineage}
            </p>
          )}

          {sNode.book.categories && sNode.book.categories.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: "0.54rem", letterSpacing: "0.14em", color: "#3a2a18", textTransform: "uppercase", marginBottom: 7 }}>Categories</p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {sNode.book.categories.map(c => (
                  <span key={c} style={{ fontSize: "0.61rem", color: COLOR[c] ?? "#8a7a60", border: `1px solid ${COLOR[c] ?? "#8a7a60"}55`, padding: "2px 7px" }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Thread memberships */}
          {sNode.threads.length > 0 && (
            <div>
              <p style={{ fontSize: "0.54rem", letterSpacing: "0.14em", color: "#3a2a18", textTransform: "uppercase", marginBottom: 10 }}>
                Intellectual Threads · {sNode.threads.length}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {sNode.threads.map(t => {
                  const isHL = highlightThread === t.id;
                  return (
                    <div
                      key={t.id}
                      style={{
                        borderLeft: `2px solid ${t.color}`,
                        paddingLeft: 10, cursor: "pointer",
                        background: isHL ? `${t.color}0d` : "transparent",
                        padding: "6px 0 6px 10px",
                        transition: "background 0.15s",
                      }}
                      onClick={() => setHighlightThread(isHL ? null : t.id)}
                    >
                      <p style={{ fontSize: "0.67rem", color: t.color, letterSpacing: "0.04em", marginBottom: 3 }}>{t.name}</p>
                      <p style={{ fontSize: "0.59rem", color: "#5a4838", lineHeight: 1.45, marginBottom: 3 }}>{t.question}</p>
                      <p style={{ fontSize: "0.57rem", color: "#3a2a18", lineHeight: 1.4, fontStyle: "italic" }}>{t.tension}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sNode.threads.length === 0 && (
            <p style={{ fontSize: "0.63rem", color: "#3a2a18", fontStyle: "italic", marginTop: 8 }}>
              Not yet woven into a thread.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
