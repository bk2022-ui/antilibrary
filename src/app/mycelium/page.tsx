import Link from "next/link";

export default function Mycelium() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "1rem",
      fontFamily: "var(--font-dm), sans-serif",
      color: "#111",
    }}>
      <p style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#888" }}>
        Under experiment
      </p>
      <p style={{ fontSize: "1.1rem" }}>Mycelium — coming soon.</p>
      <Link href="/visualizations" style={{ fontSize: "0.85rem", color: "#555", textDecoration: "none", borderBottom: "1px solid #ccc" }}>
        ← Visualization Experiments
      </Link>
    </main>
  );
}
