import { normalizeIssueHours } from "./normalizeIssueHours";
import type { SnapshotIssueNode } from "./types";
import { buildScopeTree } from "../scope/buildScopeTree";
import type { ScopeResolutionState, ScopeTreeNode } from "../scope/types";
import type { CurrentUserYouTrackAccess } from "../youtrack/auth";

export type BuildRequirementSnapshotInput = {
  readonly rootIssueKey: string;
  readonly currentUserAccess: CurrentUserYouTrackAccess;
};

type ScopeBuilder = (input: BuildRequirementSnapshotInput) => Promise<ScopeResolutionState>;

function collectSnapshotIssues(
  node: ScopeTreeNode,
  visited: Set<string>,
  issues: SnapshotIssueNode[],
): number {
  if (visited.has(node.issue.id)) {
    return 0;
  }

  visited.add(node.issue.id);

  const normalizedIssue = normalizeIssueHours(node.issue);
  issues.push(normalizedIssue);

  let totalMinutes = normalizedIssue.normalizedMinutes ?? 0;
  for (const child of node.children) {
    totalMinutes += collectSnapshotIssues(child, visited, issues);
  }

  return totalMinutes;
}

export async function buildRequirementSnapshot(
  input: BuildRequirementSnapshotInput,
  scopeBuilder: ScopeBuilder = buildScopeTree,
): Promise<ScopeResolutionState> {
  const scope = await scopeBuilder(input);
  if (scope.status !== "ready") {
    return scope;
  }

  const issues: SnapshotIssueNode[] = [];
  const totalMinutes = collectSnapshotIssues(scope.root, new Set<string>(), issues);
  const blockedIssues = issues.filter((issue) => issue.blocked);
  const syncedAt = new Date().toISOString();

  if (blockedIssues.length > 0) {
    return {
      status: "snapshot_blocked",
      issueKey: input.rootIssueKey,
      outcome: "snapshot-blocked",
      root: scope.root,
      nodeCount: scope.nodeCount,
      syncedAt,
      totalMinutes: null,
      issues,
      blockedIssues,
    };
  }

  return {
    ...scope,
    syncedAt,
    totalMinutes,
    issues,
    blockedIssues: [],
  };
}
