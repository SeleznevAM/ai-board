"use client";

import { useState } from "react";

import { RootIssueForm, type RootIssueFormResult } from "../src/components/root-issue-form";
import { ScopeState } from "../src/components/scope-state";
import { ScopeTree } from "../src/components/scope-tree";

const panelStyle = {
  borderRadius: "24px",
  border: "1px solid rgba(75, 49, 11, 0.18)",
  background: "rgba(255, 250, 242, 0.78)",
  boxShadow: "0 24px 60px rgba(62, 42, 12, 0.12)",
} as const;

export default function HomePage() {
  const [result, setResult] = useState<RootIssueFormResult | null>(null);

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
          width: "min(980px, 100%)",
          padding: "40px",
          display: "grid",
          gap: "28px",
        }}
      >
        <header style={{ display: "grid", gap: "14px" }}>
          <p
            style={{
              margin: 0,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              color: "#7a5a22",
            }}
          >
            Phase 1 scope discovery
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
            YouTrack scope discovery
          </h1>
          <p style={{ maxWidth: "62ch", fontSize: "1.1rem", lineHeight: 1.6, margin: 0 }}>
            Enter a root issue to verify the supported requirement scope for phase one.
            In this phase only the subtask hierarchy is supported.
          </p>
        </header>

        <div
          style={{
            ...panelStyle,
            padding: "24px",
            display: "grid",
            gap: "12px",
          }}
        >
          <h2 style={{ margin: 0 }}>Root issue lookup</h2>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            The page confirms whether the requested issue produces a complete visible tree
            for the current user.
          </p>
          <RootIssueForm onResolved={setResult} />
        </div>

        {result?.kind === "success" ? (
          <div style={{ ...panelStyle, padding: "24px" }}>
            <ScopeTree root={result.scope.root} />
          </div>
        ) : null}

        {result?.kind === "error" ? (
          <ScopeState
            code={result.code}
            issueKey={result.issueKey}
            message={result.message}
          />
        ) : (
          <div
            style={{
              ...panelStyle,
              padding: "24px",
              display: "grid",
              gap: "10px",
            }}
          >
            <h2 style={{ margin: 0 }}>Current state</h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              No scope has been requested yet. A successful lookup will render a nested tree
              here, and blocked outcomes will replace it with an explicit phase-one state.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
