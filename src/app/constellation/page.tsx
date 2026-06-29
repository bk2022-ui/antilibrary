"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import inventoryData from "@/libraries/bk/inventory.json";

/* ── Types ─────────────────────────────────────────────────────── */
type Book = {
  title: string; author: string; category: string;
  categories?: string[]; format?: string; year?: number;
  author_origin?: string; topic?: string; subtopics?: string[];
  author_tradition?: string; confidence?: string; notes?: string;
};
const inventory = inventoryData as { books: Book[] };

/* ── Canvas ─────────────────────────────────────────────────────── */
const W = 3400, H = 1500;
const PX = 130, PY = 90;   // padding
const MIN_YEAR = -500, MAX_YEAR = 2025;

// Non-linear time axis — three zones giving the modern era proportional space:
//   -500 → 1800  : 20% of canvas  (ancient + early modern — sparse)
//   1800 → 1950  : 15% of canvas  (industrial + early 20th c — medium)
//   1950 → 2025  : 65% of canvas  (post-war to present — dense, readable)
const Z1_END = 1800, Z2_END = 1950;
const Z1_PCT = 0.20, Z2_PCT = 0.35; // cumulative canvas fractions at zone ends

/* Y register bands: 0 = top (empirical), 1 = bottom (spiritual) */
const BAND: Record<string, [number, number]> = {
  Science:        [0.02, 0.15],
  Technology:     [0.10, 0.23],
  Health:         [0.16, 0.27],
  Philosophy:     [0.22, 0.38],
  Psychology:     [0.30, 0.46],
  Economics:      [0.36, 0.51],
  History:        [0.42, 0.57],
  Biography:      [0.46, 0.61],
  Politics:       [0.50, 0.65],
  Business:       [0.54, 0.70],
  Design:         [0.59, 0.74],
  "Self-Help":    [0.63, 0.78],
  Sociology:      [0.65, 0.80],
  Journals:       [0.67, 0.82],
  Sports:         [0.69, 0.84],
  Fiction:        [0.74, 0.90],
  Spirituality:   [0.82, 0.95],
  "Graphic Novel":[0.86, 0.97],
};

/* Brightened stone palette — legible on near-black */
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

/* ── Intellectual spines — cross-domain threads ───────────────────── */
type Thread = { id: string; name: string; description: string; color: string; books: string[] };
const THREADS: Thread[] = [
  { id: "darwin_s_long_shadow", name: "Darwin's Long Shadow", color: "#4A7C59",
    description: "Evolution as the master key — not just for biology but for culture, economics, morality, and mind.",
    books: ["The Selfish Gene","The Extended Phenotype","River Out of Eden","Climbing Mount Improbable","Natural Selection and Social Theory","The Folly of Fools","Darwin's Dangerous Idea","The Red Queen","The Origins of Virtue","The Evolution of Everything","Culture and the Evolutionary Process","On the Origin of Species","Behave: The Biology of Humans at Our Best and Worst"] },
  { id: "the_judgment_machine", name: "The Judgment Machine", color: "#6B4E8A",
    description: "How humans actually decide versus how they should — assembling the canon of behavioral decision theory and its discontents.",
    books: ["Thinking, Fast and Slow","Choices, Values, and Frames","Judgment Under Uncertainty: Heuristics and Biases","Noise: A Flaw in Human Judgment","Sources of Power","Intuition at Work","Streetlights and Shadows","Simple Heuristics That Make Us Smart","Decision Traps","Winning Decisions","Thinking and Deciding","Algorithms to Live By","The Signal and the Noise"] },
  { id: "the_fat_tail_cosmos", name: "The Fat-Tail Cosmos", color: "#C45C3A",
    description: "Taleb's Incerto alongside financial collapse narratives — a fascination with uncertainty and what happens when the improbable arrives.",
    books: ["The Black Swan","Antifragile","Fooled by Randomness","Skin in the Game","Dynamic Hedging: Managing Vanilla and Exotic Options","Statistical Consequences of Fat Tails","A Random Walk Down Wall Street","When Genius Failed","Do Dice Play God?","What I Learned Losing a Million Dollars","The Signal and the Noise"] },
  { id: "how_organizations_breathe", name: "How Organizations Breathe", color: "#3A6B8A",
    description: "Edgar Schein six times over — organizations as living systems shaped by culture, sustained by inquiry, killed by the wrong defaults.",
    books: ["Humble Inquiry","Humble Leadership","Humble Consulting","Helping","Process Consultation Volume II","Organizational Culture and Leadership","DEC Is Dead, Long Live DEC","The Fearless Organization","The Fifth Discipline","Toyota Production System","The Ambiguities of Experience","No Rules Rules","Brave New Work"] },
  { id: "the_stoic_wager", name: "The Stoic Wager", color: "#8A7A3A",
    description: "Not curiosity about Stoicism as history — actively testing it as a life practice, cross-checking against Indian and Zen alternatives.",
    books: ["Meditations","Letters from a Stoic","Discourses and Selected Writings","A Guide to the Good Life","The Stoic Challenge","On Desire","A Slap in the Face","The Daily Stoic","Ego Is the Enemy","Dying Every Day: Seneca at the Court of Nero","Tao Te Ching","The Analects"] },
  { id: "contagion_and_control", name: "Contagion and Control", color: "#2E7D6B",
    description: "How societies learn — or fail — to respond to invisible threats spreading through social networks. A spine that predates COVID.",
    books: ["Inside the Outbreaks","Apollo's Arrow","The Ghost Map","Smallpox: The Death of a Disease","The Viral Storm","Mountains Beyond Mountains","Polio: An American Story","The Social Transformation of American Medicine","Change: How Behavior Spreads","Diffusion of Innovations"] },
  { id: "india_and_the_long_view", name: "India and the Long View", color: "#B5682B",
    description: "Colonial fiction, Mughal power, Spice trade violence, Vedanta, yoga — a continuous reckoning with a civilisation, not mere geography.",
    books: ["The Glass Palace","The Nutmeg's Curse","Empress: The Astonishing Reign of Nur Jahan","The Anarchy","The End of Sorrow (The Bhagavad Gita for Daily Living, Vol. 1)","The Bhagavad Gita","The Upanishads","Inner Engineering","Karma","Light on Yoga","Light on Life"] },
  { id: "civilizational_sweep", name: "The Civilizational Sweep", color: "#5A7A6A",
    description: "Books that zoom to the longest timescale — what are humans, how did we get here, and what happens next? Bronowski to Harari to Smil.",
    books: ["The Ascent of Man","The Prehistory of the Mind","Guns, Germs, and Steel","Homo Deus: A Brief History of Tomorrow","21 Lessons for the 21st Century","The Rational Optimist","The Evolution of Everything","Grand Transitions","Consilience: The Unity of Knowledge","The Demon-Haunted World"] },
  { id: "ridley_thesis", name: "The Ridley Thesis", color: "#7A9A5A",
    description: "Bottom-up evolutionary processes — not top-down design — explain sexual selection, moral virtue, innovation, and cultural progress alike.",
    books: ["The Red Queen","The Origins of Virtue","Genome","The Rational Optimist","The Evolution of Everything","How Innovation Works","Darwin's Dangerous Idea","The Selfish Gene","The Extended Phenotype"] },
  { id: "genius_and_its_conditions", name: "Genius and Its Conditions", color: "#7A4A8A",
    description: "Creative genius is not individual but ecological — hunting for the conditions that make exceptional output possible.",
    books: ["Creativity","Flow","Good Business","The Geography of Genius","Leonardo da Vinci","Genius","Creativity, Inc.","The Medici Effect","The Rise and Fall of the House of Medici","Daily Rituals","The Creative Act","Where Good Ideas Come From","Out of Our Minds"] },
  { id: "the_power_of_the_frame", name: "The Power of the Frame", color: "#A04060",
    description: "The gap between the message sent and the reality constructed in the listener's mind — from framing effects to influence science.",
    books: ["Influence: Science and Practice","The 48 Laws of Power","The Art of Seduction","The Laws of Human Nature","Never Split the Difference","Getting to Yes","The Political Mind","Resonate","slide:ology","The Pyramid Principle","Alchemy","Amusing Ourselves to Death"] },
  { id: "disruptions_anatomy", name: "Disruption's Anatomy", color: "#3A7A8A",
    description: "Not just when disruption happens but why incumbents fail to see it — Christensen alongside Taleb, Rogers, and Smil's skepticism.",
    books: ["The Innovator's Dilemma","The Innovator's Solution","Competing Against Luck","How Innovation Works","Invention and Innovation","Diffusion of Innovations","The Lean Startup","Escaping the Build Trap","Zero to One","Only the Paranoid Survive","How We Got to Now"] },
  { id: "the_mind_before_language", name: "The Mind Before Language", color: "#4A6B3A",
    description: "Octopus intelligence, Dennett's Darwin, Deutsch's physics of knowledge — a version of mind that predates Western philosophy's assumptions.",
    books: ["The Prehistory of the Mind","Other Minds","Darwin's Dangerous Idea","The Beginning of Infinity","The Fabric of Reality","Consilience: The Unity of Knowledge","Frames of Mind","The Weirdest People in the World","Mind in Motion","The Difference"] },
  { id: "body_as_practice", name: "The Body as Practice", color: "#5A8A70",
    description: "From Patanjali to Attia — the body treated not as a given but as something deliberately cultivated through asana, movement, and longevity medicine.",
    books: ["Patanjali's Yoga Sutras","Patanjali Yoga","Light on Yoga","Light on Pranayama","Light on Life","Yoga for Body, Breath, and Mind","The Heart of Yoga","The Yoga Sutras of Patanjali","Born to Run","Starting Strength: Basic Barbell Training","Exercised","TB Method","Outlive","Super Agers"] },
  { id: "zen_current", name: "The Zen Current", color: "#4A7A6A",
    description: "Buddhist and Taoist wisdom entering Western minds — presence, no-self, and the art of not-trying.",
    books: ["An Introduction to Zen Buddhism","The Zen Koan as a Means of Attaining Enlightenment","How to Walk","Who Ordered This Truckload of Dung?","If You Meet the Buddha on the Road, Kill Him","Tao Te Ching","The Analects","Trying Not to Try","Catching the Big Fish","Destructive Emotions"] },
  { id: "vedantic_root", name: "The Vedantic Root", color: "#8A5A3A",
    description: "The Indian contemplative tradition in practice — consciousness, self, and the path from body to liberation.",
    books: ["The Bhagavad Gita","The End of Sorrow (The Bhagavad Gita for Daily Living, Vol. 1)","The Upanishads","I Am That","Patanjali's Yoga Sutras","The Yoga Sutras of Patanjali","Light on Yoga","Light on Life","The Heart of Yoga","Yoga for Body, Breath, and Mind","Satipatthana Sutta Discourses","Inner Engineering","Karma","Tantra: The Art of Understanding","The Great Challenge","I Am the Gate"] },
  { id: "strategy_as_statecraft", name: "Strategy as Statecraft", color: "#6B3A3A",
    description: "Sun Tzu to Kissinger to Boyd — strategy as a single discipline moving between battlefield, boardroom, and geopolitics.",
    books: ["The Art of War","The Prince","On Grand Strategy","On China","Boyd","From Third World to First","Rise and Kill First","The Machiavellians: Defenders of Freedom","7 Powers: The Foundations of Business Strategy","The Revolt of the Public","Preventing Surprise Attacks"] },
];

/* Named intellectual clusters */
const CLUSTERS = [
  { name: "Evolution &\nBehavior",     color: "#6a90e0",
    test: (b: Book) => /evolut|selfish gene|sapolsky|trivers|dawkins|ridley|pinker|dennett|sociobiol/i.test((b.topic ?? "") + b.author + b.title) },
  { name: "Capital\nMinds",            color: "#4aaa75",
    test: (b: Book) => /value invest|buffett|munger|graham|klarman|marks|margin of safety|intelligent investor/i.test((b.topic ?? "") + b.author + b.title) },
  { name: "India\nReimagined",         color: "#e07050",
    test: (b: Book) => b.author_origin === "India" && !!(b.categories?.some(c => ["Fiction","Biography","Science"].includes(c))) },
  { name: "The Stoic\nThread",         color: "#c09060",
    test: (b: Book) => /stoic|marcus aurelius|seneca|epictetus|epicurus|confucius|sun tzu|tao te|laozi|bhagavad/i.test((b.topic ?? "") + b.author + b.title) },
  { name: "Org &\nCulture",            color: "#5aaa7a",
    test: (b: Book) => /organizat|process consult|humble|edmondson|senge|schein/i.test((b.topic ?? "") + b.author) },
  { name: "The Russian\nCanon",        color: "#d06070",
    test: (b: Book) => ["Tolstoy","Dostoevsky"].some(a => b.author.includes(a)) },
  { name: "Rome &\nAntiquity",         color: "#c85050",
    test: (b: Book) => /roman empire|late antiq|caesar|augustus|heather|goldsworthy/i.test((b.topic ?? "") + b.author + b.title) },
  { name: "Maps &\nGeopolitics",       color: "#5080c8",
    test: (b: Book) => /geopolit|cartograph|silk road|frankopan|prisoner.*geograph/i.test((b.topic ?? "") + b.author + b.title) },
  { name: "Mind &\nCognition",         color: "#c09060",
    test: (b: Book) => /cognitive bias|behavioral econ|kahneman|ariely|thinking fast|heuristic|decision.*trap/i.test((b.topic ?? "") + b.author + b.title) },
];

/* ── Geometry helpers ────────────────────────────────────────────── */
function seededRand(n: number) { const x = Math.sin(n + 1) * 10000; return x - Math.floor(x); }
function hashStr(s: string) { let h = 0; for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0; return Math.abs(h); }
function xOf(year: number) {
  const active = W - PX * 2;
  if (year <= Z1_END) {
    return PX + ((year - MIN_YEAR) / (Z1_END - MIN_YEAR)) * (active * Z1_PCT);
  } else if (year <= Z2_END) {
    return PX + active * Z1_PCT + ((year - Z1_END) / (Z2_END - Z1_END)) * (active * (Z2_PCT - Z1_PCT));
  } else {
    return PX + active * Z2_PCT + ((year - Z2_END) / (MAX_YEAR - Z2_END)) * (active * (1 - Z2_PCT));
  }
}
function yOf(cat: string, seed: number) {
  const [a, b] = BAND[cat] ?? [0.5, 0.7];
  return PY + (a + seededRand(seed) * (b - a)) * (H - PY * 2);
}

/* ── Node computation ────────────────────────────────────────────── */
type Node = { book: Book; x: number; y: number; color: string; ci: number };
function buildNodes(books: Book[]): Node[] {
  return books
    .filter(b => !b.format || b.format === "book")
    .map(b => {
      const seed = hashStr(b.title);
      const x = xOf(b.year ?? 2000) + (seededRand(seed + 3) - 0.5) * 16;
      const y = yOf(b.category, seed);
      const ci = CLUSTERS.findIndex(c => c.test(b));
      return { book: b, x, y, color: COLOR[b.category] ?? "#9a8a70", ci };
    });
}

const ERAS: { label: string; range: [number, number] }[] = [
  { label: "All Time",  range: [-500, 2025] },
  { label: "Ancient",   range: [-500, 500]  },
  { label: "500–1700",  range: [500, 1700]  },
  { label: "1700–1900", range: [1700, 1900] },
  { label: "1900–1960", range: [1900, 1960] },
  { label: "1960–2000", range: [1960, 2000] },
  { label: "2000s+",    range: [2000, 2025] },
];

const YEAR_MARKS = [-500, 0, 500, 1000, 1500, 1700, 1800, 1850, 1900, 1920, 1940, 1960, 1980, 2000, 2010, 2020];
const Y_LABELS = [
  { t: "EMPIRICAL · SCIENTIFIC",    y: 0.09 },
  { t: "PHILOSOPHICAL · RATIONAL",  y: 0.34 },
  { t: "PRACTICAL · SOCIAL",        y: 0.60 },
  { t: "CREATIVE · SPIRITUAL",      y: 0.88 },
];

/* ── Page ────────────────────────────────────────────────────────── */
export default function ConstellationPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  /* Transform state — also mirrored to refs for non-passive event handlers */
  const [transform, setTransform] = useState({ s: 1, tx: 0, ty: 0 });
  const tRef = useRef({ s: 1, tx: 0, ty: 0 });
  const applyT = useCallback((s: number, tx: number, ty: number) => {
    s = Math.max(0.07, Math.min(14, s));
    tRef.current = { s, tx, ty };
    setTransform({ s, tx, ty });
  }, []);

  const [hovered, setHovered]     = useState<number | null>(null);
  const [selected, setSelected]   = useState<number | null>(null);
  const [clusters, setClusters]   = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [era, setEra]             = useState<[number, number]>([-500, 2025]);
  const [loaded, setLoaded]       = useState(false);

  /* Drag state */
  const dragging  = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });
  const pinchDist = useRef<number | null>(null);

  const nodes = useMemo(() => buildNodes(inventory.books), []);

  /* Build thread arcs: title → node lookup, then sort by x, draw cubic bezier segments */
  const threadArcs = useMemo(() => {
    const byTitle = new Map(nodes.map(n => [n.book.title, n]));
    return THREADS.map(thread => {
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

  /* Cluster info (centroid + radius) */
  const clusterInfo = useMemo(() =>
    CLUSTERS.map((c, ci) => {
      const ms = nodes.filter(n => n.ci === ci);
      if (!ms.length) return null;
      const cx = ms.reduce((s, n) => s + n.x, 0) / ms.length;
      const cy = ms.reduce((s, n) => s + n.y, 0) / ms.length;
      const r  = ms.reduce((m, n) => Math.max(m, Math.hypot(n.x - cx, n.y - cy)), 0);
      return { ...c, cx, cy, r: r + 42, count: ms.length };
    }), [nodes]);

  /* Init: fit to viewport */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const usableH = height - 52 - 52; // minus header + era strip
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
      const ns = Math.max(0.07, Math.min(14, s * factor));
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
      const rect  = containerRef.current!.getBoundingClientRect();
      const cx    = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const cy    = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      const { s, tx, ty } = tRef.current;
      const ns = Math.max(0.07, Math.min(14, s * dist / pinchDist.current));
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

  /* Which threads does the focused book belong to? null = no focus, empty set = focus but no threads */
  const focusTitle = sNode?.book.title ?? hNode?.book.title ?? null;
  const focusThreadIds = useMemo(() => {
    if (!focusTitle) return null;
    const ids = new Set(THREADS.filter(t => t.books.includes(focusTitle)).map(t => t.id));
    return ids.size > 0 ? ids : null; // null when book is in no threads → don't dim anything
  }, [focusTitle]);

  /* Tooltip position (screen space) */
  const tipX = hNode ? hNode.x * s + tx : 0;
  const tipY = hNode ? hNode.y * s + ty : 0;

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "calc(100vh - 40px)", overflow: "hidden", background: "#070503", position: "relative", fontFamily: "var(--font-dm), system-ui, sans-serif", cursor: dragging.current ? "grabbing" : "grab", touchAction: "none", userSelect: "none" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── SVG ─────────────────────────────────────────────────── */}
      <svg width="100%" height="100%" style={{ display: "block", position: "absolute", inset: 0 }}>
        <defs>
          <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="halo" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="26"/>
          </filter>
          <filter id="ringglow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8"/>
          </filter>
        </defs>

        <g transform={`translate(${tx},${ty}) scale(${s})`} style={{ willChange: "transform" }}>

          {/* Timeline baseline */}
          <line x1={PX} y1={H - PY + 18} x2={W - PX} y2={H - PY + 18}
            stroke="rgba(200,168,122,0.1)" strokeWidth={1} style={{ pointerEvents: "none" }}/>

          {/* Y-register label bands (faint horizontal zones) */}
          {Y_LABELS.map(({ t, y }) => (
            <text key={t}
              x={PX - 16} y={PY + y * (H - PY * 2)}
              textAnchor="end" fill="rgba(200,168,122,0.14)"
              fontSize={8} fontFamily="var(--font-dm), system-ui"
              letterSpacing="0.12em" style={{ pointerEvents: "none" }}
            >{t}</text>
          ))}

          {/* Cluster halos + dashed rings */}
          {clusters && clusterInfo.map((ci, i) => ci && (
            <g key={i} style={{ pointerEvents: "none" }}>
              <ellipse cx={ci.cx} cy={ci.cy} rx={ci.r * 1.15} ry={ci.r * 0.95}
                fill={ci.color} opacity={0.065} filter="url(#halo)"/>
              <ellipse cx={ci.cx} cy={ci.cy} rx={ci.r * 1.15} ry={ci.r * 0.95}
                fill="none" stroke={ci.color} strokeWidth={0.8}
                opacity={0.25} strokeDasharray="5 7"/>
            </g>
          ))}

          {/* Intellectual spine arcs */}
          {showThreads && (
            <g style={{ pointerEvents: "none", opacity: loaded ? 1 : 0, transition: "opacity 1s ease" }}>
              {threadArcs.map(({ thread, segs }) => {
                const dimmed = focusThreadIds != null && !focusThreadIds.has(thread.id);
                const highlighted = focusThreadIds != null && focusThreadIds.has(thread.id);
                return (
                  <g key={thread.id}>
                    {segs.map((d, i) => (
                      <path key={i} d={d} fill="none"
                        stroke={thread.color}
                        strokeWidth={highlighted ? 2.2 : 1.2}
                        opacity={dimmed ? 0.05 : highlighted ? 0.65 : 0.22}
                        strokeLinecap="round"
                        style={{ transition: "opacity 0.25s ease, stroke-width 0.2s ease" }}
                      />
                    ))}
                  </g>
                );
              })}
            </g>
          )}

          {/* Thread labels — mid-point of each thread's x/y centroid */}
          {showThreads && (
            <g style={{ pointerEvents: "none", opacity: loaded ? 1 : 0, transition: "opacity 1s ease" }}>
              {threadArcs.map(({ thread, pts }) => {
                if (pts.length === 0) return null;
                const dimmed = focusThreadIds != null && !focusThreadIds.has(thread.id);
                const highlighted = focusThreadIds != null && focusThreadIds.has(thread.id);
                const mid = pts[Math.floor(pts.length / 2)];
                return (
                  <text key={thread.id}
                    x={mid.x} y={mid.y - 18}
                    textAnchor="middle"
                    fill={thread.color}
                    fontSize={highlighted ? 13 : 10}
                    fontFamily="var(--font-cormorant), Georgia, serif"
                    fontStyle="italic"
                    letterSpacing="0.03em"
                    opacity={dimmed ? 0.05 : highlighted ? 0.95 : 0.42}
                    style={{ transition: "opacity 0.25s ease, font-size 0.2s ease" }}
                  >{thread.name}</text>
                );
              })}
            </g>
          )}

          {/* Thread node highlights when spines are visible */}
          {showThreads && (
            <g style={{ pointerEvents: "none", opacity: loaded ? 1 : 0, transition: "opacity 1s ease" }}>
              {threadArcs.map(({ thread, pts }) => {
                const dimmed = focusThreadIds != null && !focusThreadIds.has(thread.id);
                const highlighted = focusThreadIds != null && focusThreadIds.has(thread.id);
                return pts.map((n, i) => (
                  <circle key={`${thread.id}-${i}`}
                    cx={n.x} cy={n.y} r={highlighted ? 7.5 : 4.5}
                    fill="none"
                    stroke={thread.color}
                    strokeWidth={highlighted ? 1.8 : 0.9}
                    opacity={dimmed ? 0.04 : highlighted ? 0.8 : 0.3}
                    style={{ transition: "opacity 0.25s ease, r 0.2s ease" }}
                  />
                ));
              })}
            </g>
          )}

          {/* Book points — fade in on mount */}
          <g style={{ opacity: loaded ? 1 : 0, transition: "opacity 1.4s ease" }}>
            {nodes.map((n, i) => {
              const inEra = (n.book.year ?? 2000) >= era[0] && (n.book.year ?? 2000) <= era[1];
              const isH = hovered  === i;
              const isS = selected === i;
              const bright = isH || isS;
              return (
                <circle key={i} data-book="1"
                  cx={n.x} cy={n.y}
                  r={bright ? 8.5 : 5}
                  fill={n.color}
                  opacity={inEra ? (bright ? 1 : 0.72) : 0.05}
                  filter={bright ? "url(#glow)" : undefined}
                  style={{ cursor: "pointer", transition: "r 0.1s ease, opacity 0.28s ease" }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={e => { e.stopPropagation(); setSelected(isS ? null : i); setHovered(null); }}
                />
              );
            })}
          </g>

          {/* Cluster labels */}
          {clusters && clusterInfo.map((ci, i) => ci && (
            <g key={i} style={{ pointerEvents: "none", opacity: loaded ? 1 : 0, transition: "opacity 0.6s ease" }}>
              {ci.name.split("\n").map((line, li) => (
                <text key={li}
                  x={ci.cx} y={ci.cy - ci.r - 24 + li * 19}
                  textAnchor="middle" fill={ci.color}
                  fontSize={14} fontFamily="var(--font-cormorant), Georgia, serif"
                  fontStyle="italic" letterSpacing="0.04em" opacity={0.88}
                >{line}</text>
              ))}
              <text
                x={ci.cx} y={ci.cy - ci.r - 5 + ci.name.split("\n").length * 19}
                textAnchor="middle" fill={ci.color}
                fontSize={8.5} fontFamily="var(--font-dm), system-ui"
                letterSpacing="0.13em" opacity={0.42}
              >{ci.count} BOOKS</text>
            </g>
          ))}

          {/* Timeline tick marks */}
          {YEAR_MARKS.map(yr => (
            <g key={yr} style={{ pointerEvents: "none" }}>
              <line x1={xOf(yr)} y1={H - PY + 15} x2={xOf(yr)} y2={H - PY + 26}
                stroke="rgba(200,168,122,0.2)" strokeWidth={1}/>
              <text x={xOf(yr)} y={H - PY + 38}
                textAnchor="middle" fill="rgba(200,168,122,0.28)"
                fontSize={8.5} fontFamily="var(--font-dm), system-ui" letterSpacing="0.04em"
              >{yr < 0 ? `${Math.abs(yr)} BCE` : yr}</text>
            </g>
          ))}

        </g>
      </svg>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 52, zIndex: 40,
        background: "rgba(7,5,3,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(200,168,122,0.1)",
        display: "flex", alignItems: "center", padding: "0 20px", gap: 16,
      }}>
        <Link href="/" style={{ color: "#c8a87a", fontSize: "0.66rem", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", opacity: 0.55, flexShrink: 0 }}>
          ← List
        </Link>
        <div style={{ width: 1, height: 16, background: "rgba(200,168,122,0.18)" }}/>
        <span style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1.1rem", color: "#c8a87a", letterSpacing: "0.06em", fontStyle: "italic" }}>
          An (Anti)Library
        </span>
        <span style={{ fontSize: "0.6rem", color: "rgba(200,168,122,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid rgba(200,168,122,0.25)", padding: "2px 8px" }}>
          Under experiment
        </span>
        <div style={{ flex: 1 }}/>
        <button
          onClick={() => setShowThreads(v => !v)}
          style={{
            background: showThreads ? "rgba(200,168,122,0.14)" : "transparent",
            border: `1px solid ${showThreads ? "rgba(200,168,122,0.45)" : "rgba(200,168,122,0.22)"}`,
            color: "#c8a87a", fontSize: "0.63rem", letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "5px 13px", cursor: "pointer", flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          {showThreads ? "Hide" : "Show"} Spines
        </button>
        <button
          onClick={() => setClusters(v => !v)}
          style={{
            background: clusters ? "rgba(200,168,122,0.14)" : "transparent",
            border: `1px solid ${clusters ? "rgba(200,168,122,0.45)" : "rgba(200,168,122,0.22)"}`,
            color: "#c8a87a", fontSize: "0.63rem", letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "5px 13px", cursor: "pointer", flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          {clusters ? "Hide" : "Show"} Clusters
        </button>
        <span style={{ color: "#3a2a18", fontSize: "0.6rem", letterSpacing: "0.06em", flexShrink: 0, display: "none" }} className="md:block">
          scroll · drag · pinch
        </span>
      </header>

      {/* ── Era strip (bottom) ───────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: sNode ? 320 : 0,
        height: 52, zIndex: 40,
        background: "rgba(5,4,2,0.92)", backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(200,168,122,0.08)",
        display: "flex", alignItems: "center", padding: "0 16px", gap: 5,
      }}>
        <span style={{ fontSize: "0.58rem", letterSpacing: "0.13em", color: "#4a3a28", textTransform: "uppercase", marginRight: 4, flexShrink: 0 }}>Era</span>
        {ERAS.map(e => {
          const active = era[0] === e.range[0] && era[1] === e.range[1];
          return (
            <button key={e.label} onClick={() => setEra(e.range)} style={{
              background: active ? "rgba(200,168,122,0.13)" : "transparent",
              border: `1px solid ${active ? "rgba(200,168,122,0.48)" : "rgba(200,168,122,0.13)"}`,
              color: active ? "#c8a87a" : "#5a4a38",
              fontSize: "0.61rem", letterSpacing: "0.07em", padding: "3px 9px",
              cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.14s", flexShrink: 0,
            }}>{e.label}</button>
          );
        })}
        <div style={{ flex: 1 }}/>
        {/* Dot legend */}
        <div style={{ display: "flex", gap: "3px 9px", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 360 }}>
          {Object.entries(COLOR).map(([cat, col]) => (
            <span key={cat} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, display: "inline-block", flexShrink: 0 }}/>
              <span style={{ fontSize: "0.56rem", color: "rgba(200,168,122,0.3)", letterSpacing: "0.03em" }}>{cat}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hover tooltip ────────────────────────────────────────── */}
      {hNode && selected !== hovered && (() => {
        const vw = containerRef.current?.getBoundingClientRect().width ?? 800;
        const vh = containerRef.current?.getBoundingClientRect().height ?? 600;
        const flipX = tipX > vw * 0.62;
        const clampY = Math.max(60, Math.min(vh - 180, tipY - 44));
        return (
          <div style={{
            position: "absolute",
            left: flipX ? tipX - 250 - 12 : tipX + 14,
            top: clampY,
            width: 248,
            background: "rgba(7,5,3,0.97)",
            border: "1px solid rgba(200,168,122,0.12)",
            borderLeft: `3px solid ${hNode.color}`,
            padding: "11px 14px",
            pointerEvents: "none",
            zIndex: 50,
            boxShadow: "0 10px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,168,122,0.06)",
          }}>
            <p style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1.05rem", fontWeight: 600, color: "#f0e4cc", lineHeight: 1.22, marginBottom: 4 }}>
              {hNode.book.title}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#806858", marginBottom: 5 }}>{hNode.book.author}</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {hNode.book.year != null && (
                <span style={{ fontSize: "0.6rem", color: "#5a4838", letterSpacing: "0.06em" }}>
                  {hNode.book.year < 0 ? `${Math.abs(hNode.book.year)} BCE` : hNode.book.year}
                </span>
              )}
              {hNode.book.author_origin && (
                <><span style={{ color: "#2a1a0a", fontSize: "0.7rem" }}>·</span>
                <span style={{ fontSize: "0.6rem", color: "#5a4838" }}>{hNode.book.author_origin}</span></>
              )}
            </div>
            {hNode.book.topic && (
              <p style={{ fontSize: "0.64rem", color: "#7a6850", fontStyle: "italic", marginTop: 6, lineHeight: 1.45 }}>
                {hNode.book.topic}
              </p>
            )}
          </div>
        );
      })()}

      {/* ── Selected side panel ──────────────────────────────────── */}
      {sNode && (
        <div style={{
          position: "absolute", right: 0, top: 52, bottom: 52, width: 320,
          background: "rgba(7,5,3,0.98)",
          borderLeft: "1px solid rgba(200,168,122,0.1)",
          borderTop: `3px solid ${sNode.color}`,
          overflowY: "auto", zIndex: 45,
          padding: "22px 18px 22px 20px",
        }}>
          <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "#4a3828", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}>
            ✕
          </button>

          <p style={{ fontSize: "0.57rem", letterSpacing: "0.15em", color: sNode.color, textTransform: "uppercase", marginBottom: 10 }}>
            {sNode.book.category}
          </p>
          <h2 style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1.55rem", fontWeight: 600, color: "#f0e4cc", lineHeight: 1.2, marginBottom: 6 }}>
            {sNode.book.title}
          </h2>
          <p style={{ fontSize: "0.78rem", color: "#806858", marginBottom: 14, letterSpacing: "0.01em" }}>
            {sNode.book.author}
          </p>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {sNode.book.year != null && (
              <span style={{ fontSize: "0.61rem", color: "#6a5840", border: "1px solid rgba(200,168,122,0.16)", padding: "2px 8px", letterSpacing: "0.06em" }}>
                {sNode.book.year < 0 ? `${Math.abs(sNode.book.year)} BCE` : sNode.book.year}
              </span>
            )}
            {sNode.book.author_origin && (
              <span style={{ fontSize: "0.61rem", color: "#6a5840", border: "1px solid rgba(200,168,122,0.16)", padding: "2px 8px" }}>
                {sNode.book.author_origin}
              </span>
            )}
            {sNode.book.notes?.includes("both") && (
              <span style={{ fontSize: "0.61rem", color: "#2d5a45", border: "1px solid #2d5a45", padding: "2px 7px" }}>K+P</span>
            )}
            {sNode.book.notes?.toLowerCase().includes("kindle") && !sNode.book.notes?.includes("both") && (
              <span style={{ fontSize: "0.61rem", color: "#7a5030", border: "1px solid #7a5030", padding: "2px 7px" }}>K</span>
            )}
          </div>

          {sNode.book.topic && (
            <p style={{ fontSize: "0.78rem", color: "#c8a87a", fontStyle: "italic", lineHeight: 1.55, marginBottom: 8 }}>
              {sNode.book.topic}
            </p>
          )}
          {sNode.book.author_tradition && (
            <p style={{ fontSize: "0.66rem", color: "#5a4838", marginBottom: 18, letterSpacing: "0.02em" }}>
              {sNode.book.author_tradition}
            </p>
          )}

          {!!sNode.book.subtopics?.length && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: "0.54rem", letterSpacing: "0.14em", color: "#3a2a18", textTransform: "uppercase", marginBottom: 7 }}>Topics</p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {sNode.book.subtopics!.map(st => (
                  <span key={st} style={{ fontSize: "0.61rem", color: sNode.color, border: `1px solid ${sNode.color}`, padding: "2px 7px", opacity: 0.78 }}>{st}</span>
                ))}
              </div>
            </div>
          )}

          {sNode.book.categories && sNode.book.categories.length > 1 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: "0.54rem", letterSpacing: "0.14em", color: "#3a2a18", textTransform: "uppercase", marginBottom: 7 }}>Also in</p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {sNode.book.categories.map(c => (
                  <span key={c} style={{ fontSize: "0.61rem", color: COLOR[c] ?? "#8a7a60", border: `1px solid ${COLOR[c] ?? "#8a7a60"}55`, padding: "2px 7px" }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const bookThreads = THREADS.filter(t => t.books.includes(sNode.book.title));
            if (!bookThreads.length) return null;
            return (
              <div>
                <p style={{ fontSize: "0.54rem", letterSpacing: "0.14em", color: "#3a2a18", textTransform: "uppercase", marginBottom: 9 }}>Intellectual Spines</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {bookThreads.map(t => (
                    <div key={t.id} style={{ borderLeft: `2px solid ${t.color}`, paddingLeft: 10 }}>
                      <p style={{ fontSize: "0.67rem", color: t.color, letterSpacing: "0.04em", marginBottom: 3 }}>{t.name}</p>
                      <p style={{ fontSize: "0.6rem", color: "#5a4838", lineHeight: 1.45 }}>{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
