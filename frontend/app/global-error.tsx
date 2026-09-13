"use client";
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#c1c0b6", color: "#18181b", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 600, marginBottom: "1rem" }}>Something went wrong</h1>
          <p style={{ color: "#71717a", marginBottom: "1.5rem" }}>{error.message || "An unexpected error occurred."}</p>
          <button onClick={reset} style={{ background: "#1f21b6", color: "#fff", padding: "0.5rem 1.5rem", border: "none", cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
