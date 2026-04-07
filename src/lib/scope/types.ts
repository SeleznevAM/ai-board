import type { YouTrackIssueNode } from "../youtrack/contracts";

export type ScopeStatus =
  | "idle"
  | "loading"
  | "not_found"
  | "forbidden"
  | "partial_scope_blocked"
  | "ready";

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
    }
  | {
      readonly status: Exclude<ScopeStatus, "idle" | "loading" | "ready">;
      readonly issueKey: string;
    };
