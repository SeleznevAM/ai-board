import type { YouTrackIssueNode } from "../youtrack/contracts";
import type { SnapshotIssueNode } from "../ingestion/types";

export type ScopeStatus =
  | "idle"
  | "loading"
  | "not_found"
  | "forbidden"
  | "partial_scope_blocked"
  | "snapshot_blocked"
  | "ready";

export type ScopeOutcome =
  | "single-node"
  | "tree"
  | "not-found"
  | "forbidden"
  | "partial-scope-blocked"
  | "snapshot-blocked";

export type ScopeTreeNode = {
  readonly issue: YouTrackIssueNode;
  readonly depth: number;
  readonly children: readonly ScopeTreeNode[];
};

export type ReadyScopeState = {
  readonly status: "ready";
  readonly root: ScopeTreeNode;
  readonly nodeCount: number;
  readonly outcome: Extract<ScopeOutcome, "single-node" | "tree">;
  readonly syncedAt?: string;
  readonly totalMinutes?: number;
  readonly issues?: readonly SnapshotIssueNode[];
  readonly blockedIssues?: readonly SnapshotIssueNode[];
};

export type BlockedSnapshotState = {
  readonly status: "snapshot_blocked";
  readonly issueKey: string;
  readonly outcome: "snapshot-blocked";
  readonly root: ScopeTreeNode;
  readonly nodeCount: number;
  readonly syncedAt: string;
  readonly totalMinutes: null;
  readonly issues: readonly SnapshotIssueNode[];
  readonly blockedIssues: readonly SnapshotIssueNode[];
};

export type ErrorScopeState = {
  readonly status: Exclude<ScopeStatus, "idle" | "loading" | "ready" | "snapshot_blocked">;
  readonly issueKey: string;
  readonly outcome: Exclude<ScopeOutcome, "single-node" | "tree" | "snapshot-blocked">;
  readonly root?: ScopeTreeNode;
  readonly nodeCount?: number;
  readonly syncedAt?: string;
  readonly totalMinutes?: number | null;
  readonly issues?: readonly SnapshotIssueNode[];
  readonly blockedIssues?: readonly SnapshotIssueNode[];
};

export type ScopeResolutionState = ReadyScopeState | BlockedSnapshotState | ErrorScopeState;
