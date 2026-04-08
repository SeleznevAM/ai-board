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
  const youTrackBaseUrl = process.env.NEXT_PUBLIC_YOUTRACK_BASE_URL ?? null;
  const successfulScope = result?.kind === "success" ? result.scope : null;
  const blockedScope = result?.kind === "blocked" ? result.scope : null;
  const lastSyncedAt = successfulScope?.syncedAt ?? blockedScope?.syncedAt;

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
            Refresh the full requirement snapshot from YouTrack and confirm whether the
            current tree is trustworthy for downstream calculations.
          </p>
          <RootIssueForm onResolved={setResult} lastSyncedAt={lastSyncedAt} />
        </div>

        {(successfulScope || blockedScope) ? (
          <div style={{ ...panelStyle, padding: "24px" }}>
            <ScopeTree
              root={(successfulScope ?? blockedScope)!.root}
              blockedIssueKeys={blockedScope?.blockedIssues?.map((issue) => issue.issueKey) ?? []}
              youTrackBaseUrl={youTrackBaseUrl ?? undefined}
            />
          </div>
        ) : null}

        {result?.kind === "blocked" ? (
          <ScopeState
            code="SNAPSHOT_BLOCKED"
            issueKey={result.scope.issueKey}
            message="The current refresh is blocked because some issues that depend on estimate values are not estimated yet."
            blockedIssueKeys={result.scope.blockedIssues?.map((issue) => issue.issueKey) ?? []}
            dismissible
          />
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
              No refresh has been requested yet. A successful refresh will render the
              current tree here together with the latest sync time.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
