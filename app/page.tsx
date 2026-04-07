const panelStyle = {
  borderRadius: "24px",
  border: "1px solid rgba(75, 49, 11, 0.18)",
  background: "rgba(255, 250, 242, 0.78)",
  boxShadow: "0 24px 60px rgba(62, 42, 12, 0.12)",
} as const;

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "48px 20px",
      }}
    >
      <section
        style={{
          ...panelStyle,
          width: "min(880px, 100%)",
          padding: "40px",
        }}
      >
        <p
          style={{
            margin: 0,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontSize: "0.8rem",
            color: "#7a5a22",
          }}
        >
          Phase 1 foundation
        </p>
        <h1 style={{ marginBottom: "16px", fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
          YouTrack scope discovery
        </h1>
        <p style={{ maxWidth: "60ch", fontSize: "1.1rem", lineHeight: 1.6 }}>
          This first phase freezes the contract for how a root issue becomes a supported
          requirement scope. Version one follows a subtasks-only model: the root issue and
          nested subtasks are in scope, while non-hierarchical links stay out of the tree.
        </p>
        <div
          style={{
            display: "grid",
            gap: "16px",
            marginTop: "32px",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <article style={{ ...panelStyle, padding: "20px" }}>
            <h2 style={{ marginTop: 0 }}>Root issue input</h2>
            <p style={{ marginBottom: 0 }}>
              A future plan will render the issue key field here and resolve the starting
              node in the current user context.
            </p>
          </article>
          <article style={{ ...panelStyle, padding: "20px" }}>
            <h2 style={{ marginTop: 0 }}>Scope tree</h2>
            <p style={{ marginBottom: 0 }}>
              Another plan will render the nested tree here with explicit states for
              not-found, forbidden, partial-scope-blocked, and single-node success.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
