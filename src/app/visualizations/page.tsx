import Link from "next/link";

export default function Visualizations() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      padding: "4rem 6rem",
      fontFamily: "var(--font-dm), sans-serif",
    }}>
      <p style={{ fontSize: "0.8rem", color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2rem" }}>
        Under experiment
      </p>
      <h1 style={{
        fontFamily: "var(--font-cormorant), Georgia, serif",
        fontSize: "2rem",
        fontWeight: 400,
        color: "#111",
        marginBottom: "2.5rem",
      }}>
        Visualization Experiments
      </h1>
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[
          { label: "Mycelium", href: "/mycelium" },
          { label: "Constellation", href: "/constellation" },
          { label: "Stars", href: "/stars" },
        ].map(({ label, href }) => (
          <Link key={href} href={href} style={{
            fontSize: "1.1rem",
            color: "#111",
            textDecoration: "none",
            borderBottom: "1px solid #111",
            paddingBottom: "1px",
            width: "fit-content",
          }}>
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
