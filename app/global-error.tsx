"use client";

// Replaces the whole document when the root layout itself fails, so it can't rely on
// globals.css or fonts: everything here is inline.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#04060d", color: "#eef1ff", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 16 }}>
        <title>Something went wrong · Reelpick</title>
        <div style={{ maxWidth: 420 }}>
          <p style={{ letterSpacing: "0.3em", fontSize: 12, color: "#19b5fe", textTransform: "uppercase" }}>Reelpick</p>
          <h1 style={{ fontSize: 36, margin: "8px 0" }}>The reel snapped</h1>
          <p style={{ color: "#98a0c4" }}>The site hit an error. Try again in a moment.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ marginTop: 24, height: 48, padding: "0 24px", borderRadius: 999, border: 0, background: "#19b5fe", color: "#00131f", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Try again
          </button>
          {error.digest && <p style={{ marginTop: 24, fontSize: 12, color: "#98a0c4" }}>Error reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
