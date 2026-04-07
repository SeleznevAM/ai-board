import type { ScopeTreeNode } from "../lib/scope/types";

type ScopeTreeProps = {
  readonly root: ScopeTreeNode;
};

function TreeBranch({ node }: { readonly node: ScopeTreeNode }) {
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
          border: "1px solid rgba(75, 49, 11, 0.16)",
          background: "rgba(255, 252, 247, 0.92)",
          padding: "14px 16px",
        }}
      >
        <div style={{ fontWeight: 700 }}>{node.issue.key}</div>
        <div style={{ marginTop: "6px", lineHeight: 1.5 }}>{node.issue.summary}</div>
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
            <TreeBranch key={child.issue.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ScopeTree({ root }: ScopeTreeProps) {
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
        <TreeBranch node={root} />
      </ul>
    </section>
  );
}
