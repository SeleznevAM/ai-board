"use client";

import { useState } from "react";

import {
  PARTIAL_SCOPE_FORBIDDEN,
  ROOT_ISSUE_FORBIDDEN,
  ROOT_ISSUE_NOT_FOUND,
} from "../lib/youtrack/errors";

type ScopeStateProps = {
  readonly code:
    | typeof ROOT_ISSUE_NOT_FOUND
    | typeof ROOT_ISSUE_FORBIDDEN
    | typeof PARTIAL_SCOPE_FORBIDDEN
    | "SNAPSHOT_BLOCKED"
    | "UNKNOWN_ERROR";
  readonly issueKey: string;
  readonly message: string;
  readonly blockedIssueKeys?: readonly string[];
  readonly dismissible?: boolean;
};

const stateCopy = {
  [ROOT_ISSUE_NOT_FOUND]: {
    title: "Root issue not found",
    body: "The requested issue key does not exist in the visible YouTrack scope.",
    tone: "#8a3b00",
  },
  [ROOT_ISSUE_FORBIDDEN]: {
    title: "Root issue is not available",
    body: "The current user cannot read this root issue, so phase one cannot confirm scope.",
    tone: "#7a2f16",
  },
  [PARTIAL_SCOPE_FORBIDDEN]: {
    title: "Scope is blocked",
    body:
      "Part of the supported subtask tree is hidden from the current user, so no tree can be confirmed.",
    tone: "#9c1c1c",
  },
  SNAPSHOT_BLOCKED: {
    title: "Snapshot is blocked",
    body:
      "Some issues require estimate values before the refreshed snapshot can be trusted.",
    tone: "#a63b3b",
  },
  UNKNOWN_ERROR: {
    title: "Scope request failed",
    body: "The request did not return a usable phase-one result.",
    tone: "#5b4012",
  },
} as const;

export function ScopeState({
  code,
  issueKey,
  message,
  blockedIssueKeys = [],
  dismissible = false,
}: ScopeStateProps) {
  const copy = stateCopy[code];
  const [dismissed, setDismissed] = useState(false);

  if (dismissible && dismissed) {
    return null;
  }

  return (
    <section
      aria-live="polite"
      style={{
        justifySelf: "end",
        width: "min(360px, 100%)",
        borderRadius: "24px",
        border: `1px solid color-mix(in srgb, ${copy.tone} 30%, transparent)`,
        background: "rgba(255, 250, 242, 0.88)",
        padding: "24px",
        display: "grid",
        gap: "10px",
      }}
    >
      {dismissible ? (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            justifySelf: "end",
            border: "none",
            background: "transparent",
            color: copy.tone,
            cursor: "pointer",
            font: "inherit",
            fontWeight: 700,
          }}
        >
          dismiss
        </button>
      ) : null}
      <div
        style={{
          fontSize: "0.85rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: copy.tone,
        }}
      >
        {code}
      </div>
      <h2 style={{ margin: 0 }}>{copy.title}</h2>
      <p style={{ margin: 0, lineHeight: 1.6 }}>{copy.body}</p>
      {issueKey ? (
        <p style={{ margin: 0, fontWeight: 700 }}>
          Requested root issue: <span style={{ color: copy.tone }}>{issueKey}</span>
        </p>
      ) : null}
      <p style={{ margin: 0, lineHeight: 1.6 }}>{message}</p>
      {blockedIssueKeys.length > 0 ? (
        <ul
          style={{
            margin: 0,
            paddingLeft: "18px",
            display: "grid",
            gap: "6px",
            lineHeight: 1.5,
          }}
        >
          {blockedIssueKeys.map((blockedIssueKey) => (
            <li key={blockedIssueKey}>{blockedIssueKey}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
