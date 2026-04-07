import type { YouTrackIssueNode } from "../youtrack/contracts";

export type ScopeStatus =
  | "idle"
  | "loading"
  | "not_found"
  | "forbidden"
  | "partial_scope_blocked"
  | "ready";

export type ScopeOutcome =
  | "single-node"
  | "tree"
  | "not-found"
  | "forbidden"
  | "partial-scope-blocked";

export type ScopeTreeNode = {
  readonly issue: YouTrackIssueNode;
  readonly depth: number;
  readonly children: readonly ScopeTreeNode[];
};

export type ScopeResolutionState =
  | {
      readonly status: "ready";
      readonly root: ScopeTreeNode;
      readonly nodeCount: number;
      readonly outcome: Extract<ScopeOutcome, "single-node" | "tree">;
    }
  | {
      readonly status: Exclude<ScopeStatus, "idle" | "loading" | "ready">;
      readonly issueKey: string;
      readonly outcome: Exclude<ScopeOutcome, "single-node" | "tree">;
    };
