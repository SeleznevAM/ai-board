import { describe, expect, it } from "vitest";

import { buildRequirementSnapshot } from "./buildRequirementSnapshot";
import type { ScopeResolutionState, ScopeTreeNode } from "../scope/types";
import type { CurrentUserYouTrackAccess } from "../youtrack/auth";
import type { YouTrackIssueNode } from "../youtrack/contracts";

const currentUserAccess: CurrentUserYouTrackAccess = {
  baseUrl: "https://example.youtrack.cloud",
  authHeader: "Bearer test-token",
  userId: "pm-1",
};

function issueNode(
  overrides: Partial<YouTrackIssueNode> & Pick<YouTrackIssueNode, "id" | "key" | "summary">,
): YouTrackIssueNode {
  return {
    parentId: null,
    childIds: [],
    childCount: 0,
    childrenVisibility: "complete",
    statusName: null,
    estimateMinutes: null,
    spentMinutes: null,
    ...overrides,
  };
}

function treeNode(
  issue: YouTrackIssueNode,
  children: readonly ScopeTreeNode[] = [],
  depth = 0,
): ScopeTreeNode {
  return {
    issue,
    depth,
    children,
  };
}

function buildReadyScope(root: ScopeTreeNode, nodeCount: number): ScopeResolutionState {
  return {
    status: "ready",
    root,
    nodeCount,
    outcome: root.children.length === 0 ? "single-node" : "tree",
  };
}

describe("buildRequirementSnapshot", () => {
  it("aggregates mixed spent and estimate values during full refresh", async () => {
    const root = treeNode(
      issueNode({
        id: "1",
        key: "REQ-1",
        summary: "root",
        statusName: "сделана",
        spentMinutes: 120,
      }),
      [
        treeNode(
          issueNode({
            id: "2",
            key: "REQ-2",
            summary: "child",
            statusName: "в работе",
            estimateMinutes: 60,
          }),
          [],
          1,
        ),
      ],
    );

    const result = await buildRequirementSnapshot(
      {
        rootIssueKey: "REQ-1",
        currentUserAccess,
      },
      async () => buildReadyScope(root, 2),
    );

    expect(result.status).toBe("ready");
    expect(result.totalMinutes).toBe(180);
    expect(result.issues).toHaveLength(2);
    expect(result.blockedIssues).toHaveLength(0);
    expect(result.syncedAt).toBeDefined();
  });

  it("blocks when an estimate-based issue has missing estimate", async () => {
    const root = treeNode(
      issueNode({
        id: "1",
        key: "REQ-1",
        summary: "root",
        statusName: "в работе",
      }),
    );

    const result = await buildRequirementSnapshot(
      {
        rootIssueKey: "REQ-1",
        currentUserAccess,
      },
      async () => buildReadyScope(root, 1),
    );

    expect(result.status).toBe("snapshot_blocked");
    expect(result.outcome).toBe("snapshot-blocked");
    expect(result.totalMinutes).toBeNull();
    expect(result.blockedIssues).toHaveLength(1);
    expect(result.blockedIssues?.[0]?.problem?.code).toBe("MISSING_ESTIMATE");
  });

  it("deduplicates issue ids during full refresh aggregation", async () => {
    const shared = treeNode(
      issueNode({
        id: "2",
        key: "REQ-2",
        summary: "shared",
        statusName: "открыта",
        estimateMinutes: 30,
      }),
      [],
      1,
    );

    const root = treeNode(
      issueNode({
        id: "1",
        key: "REQ-1",
        summary: "root",
        statusName: "сделана",
        spentMinutes: 90,
      }),
      [shared, shared],
    );

    const result = await buildRequirementSnapshot(
      {
        rootIssueKey: "REQ-1",
        currentUserAccess,
      },
      async () => buildReadyScope(root, 2),
    );

    expect(result.status).toBe("ready");
    expect(result.totalMinutes).toBe(120);
    expect(result.issues).toHaveLength(2);
  });
});
