import type { ScopeTreeNode } from "../lib/scope/types";

type ScopeTreeProps = {
  readonly root: ScopeTreeNode;
  readonly blockedIssueKeys?: readonly string[];
  readonly youTrackBaseUrl?: string;
};

function TreeBranch({
  node,
  blockedIssueKeys,
  youTrackBaseUrl,
}: {
  readonly node: ScopeTreeNode;
  readonly blockedIssueKeys: ReadonlySet<string>;
  readonly youTrackBaseUrl: string | null;
}) {
  const isBlocked = blockedIssueKeys.has(node.issue.key);
  const issueUrl = youTrackBaseUrl
    ? `${youTrackBaseUrl.replace(/\/$/, "")}/issue/${node.issue.key}`
    : null;

  return (
    <li
      style={{
        display: "grid",
        gap: "10px",
      }}
    >
      <div
        style={{
          borderRadius: "16px",
          border: isBlocked
            ? "1px solid rgba(186, 79, 79, 0.34)"
            : "1px solid rgba(75, 49, 11, 0.16)",
          background: isBlocked ? "rgba(255, 240, 238, 0.94)" : "rgba(255, 252, 247, 0.92)",
          padding: "14px 16px",
        }}
      >
        <div style={{ fontWeight: 700 }}>{node.issue.key}</div>
        <div style={{ marginTop: "6px", lineHeight: 1.5 }}>{node.issue.summary}</div>
        {isBlocked ? (
          <p
            style={{
              margin: "10px 0 0",
              color: "#9b3030",
              lineHeight: 1.5,
            }}
          >
            This issue is missing estimate data required for the current snapshot.
          </p>
        ) : null}
        {issueUrl ? (
          <a
            href={issueUrl}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              display: "inline-flex",
              marginTop: "10px",
              color: isBlocked ? "#8f2f2f" : "#6f4a16",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Open in YouTrack
          </a>
        ) : null}
      </div>

      {node.children.length > 0 ? (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            paddingLeft: "20px",
            display: "grid",
            gap: "10px",
            borderLeft: "2px solid rgba(122, 90, 34, 0.24)",
          }}
        >
          {node.children.map((child) => (
            <TreeBranch
              key={child.issue.id}
              node={child}
              blockedIssueKeys={blockedIssueKeys}
              youTrackBaseUrl={youTrackBaseUrl}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ScopeTree({ root, blockedIssueKeys = [], youTrackBaseUrl }: ScopeTreeProps) {
  const blockedSet = new Set(blockedIssueKeys);

  return (
    <section
      aria-label="Scope tree"
      style={{
        display: "grid",
        gap: "14px",
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: "1.35rem" }}>Scope tree</h2>
        <p style={{ marginBottom: 0, lineHeight: 1.6 }}>
          A successful result renders only the supported hierarchy returned by the
          phase-one scope contract.
        </p>
      </div>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gap: "10px",
        }}
      >
        <TreeBranch
          node={root}
          blockedIssueKeys={blockedSet}
          youTrackBaseUrl={youTrackBaseUrl ?? null}
        />
      </ul>
    </section>
  );
}
