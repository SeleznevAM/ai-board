import { describe, expect, it } from "vitest";

import { buildScopeTree, type ScopeClient } from "./buildScopeTree";
import {
  PARTIAL_SCOPE_FORBIDDEN,
  ROOT_ISSUE_FORBIDDEN,
  ROOT_ISSUE_NOT_FOUND,
  YouTrackScopeError,
} from "../youtrack/errors";
import type { CurrentUserYouTrackAccess } from "../youtrack/auth";
import type {
  RootIssueLookupResult,
  YouTrackIssueNode,
} from "../youtrack/contracts";

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

function createClient(
  rootLookup: RootIssueLookupResult,
  issuesById: Record<string, YouTrackIssueNode>,
): ScopeClient {
  return {
    async fetchRootIssueTree() {
      return rootLookup;
    },
    async fetchIssue(_access, issueId) {
      const issue = issuesById[issueId];
      if (!issue) {
        return {
          kind: "forbidden",
          issueId,
        };
      }

      return {
        kind: "success",
        issue,
      };
    },
  };
}

describe("buildScopeTree", () => {
  it("returns a tree when the root issue exists and has nested subtasks", async () => {
    const root = issueNode({
      id: "1",
      key: "REQ-1",
      summary: "Root",
      childIds: ["2"],
      childCount: 1,
    });
    const child = issueNode({
      id: "2",
      key: "REQ-2",
      summary: "Child",
      parentId: "1",
      childIds: ["3"],
      childCount: 1,
    });
    const grandChild = issueNode({
      id: "3",
      key: "REQ-3",
      summary: "Grandchild",
      parentId: "2",
    });

    const result = await buildScopeTree(
      {
        rootIssueKey: "REQ-1",
        currentUserAccess,
      },
      createClient(
        {
          kind: "success",
          root,
          includesChildren: true,
          visibility: "complete",
        },
        {
          "2": child,
          "3": grandChild,
        },
      ),
    );

    expect(result.status).toBe("ready");
    expect(result.outcome).toBe("tree");
    expect(result.nodeCount).toBe(3);
    expect(result.root.children[0]?.children[0]?.issue.key).toBe("REQ-3");
  });

  it("returns a single-node tree when root issue exists and has no children", async () => {
    const root = issueNode({
      id: "1",
      key: "REQ-1",
      summary: "Root",
    });

    const result = await buildScopeTree(
      {
        rootIssueKey: "REQ-1",
        currentUserAccess,
      },
      createClient(
        {
          kind: "success",
          root,
          includesChildren: false,
          visibility: "complete",
        },
        {},
      ),
    );

    expect(result.status).toBe("ready");
    expect(result.outcome).toBe("single-node");
    expect(result.nodeCount).toBe(1);
    expect(result.root.children).toHaveLength(0);
  });

  it("throws when the root issue is missing", async () => {
    await expect(
      buildScopeTree(
        {
          rootIssueKey: "REQ-404",
          currentUserAccess,
        },
        createClient(
          {
            kind: "root_issue_not_found",
            issueKey: "REQ-404",
          },
          {},
        ),
      ),
    ).rejects.toMatchObject<Partial<YouTrackScopeError>>({
      code: ROOT_ISSUE_NOT_FOUND,
    });
  });

  it("throws when the root issue is inaccessible", async () => {
    await expect(
      buildScopeTree(
        {
          rootIssueKey: "REQ-403",
          currentUserAccess,
        },
        createClient(
          {
            kind: "root_issue_forbidden",
            issueKey: "REQ-403",
          },
          {},
        ),
      ),
    ).rejects.toMatchObject<Partial<YouTrackScopeError>>({
      code: ROOT_ISSUE_FORBIDDEN,
    });
  });

  it("blocks success when descendant visibility is partial", async () => {
    const root = issueNode({
      id: "1",
      key: "REQ-1",
      summary: "Root",
      childIds: ["2"],
      childCount: 1,
    });

    await expect(
      buildScopeTree(
        {
          rootIssueKey: "REQ-1",
          currentUserAccess,
        },
        createClient(
          {
            kind: "success",
            root,
            includesChildren: true,
            visibility: "complete",
          },
          {},
        ),
      ),
    ).rejects.toMatchObject({
      code: PARTIAL_SCOPE_FORBIDDEN,
      blockedNodeIds: ["2"],
    });
  });

  it("ignores duplicate or cyclic references without repeating nodes", async () => {
    const root = issueNode({
      id: "1",
      key: "REQ-1",
      summary: "Root",
      childIds: ["2", "2"],
      childCount: 2,
    });
    const child = issueNode({
      id: "2",
      key: "REQ-2",
      summary: "Child",
      parentId: "1",
      childIds: ["1"],
      childCount: 1,
    });

    const result = await buildScopeTree(
      {
        rootIssueKey: "REQ-1",
        currentUserAccess,
      },
      createClient(
        {
          kind: "success",
          root,
          includesChildren: true,
          visibility: "complete",
        },
        {
          "2": child,
        },
      ),
    );

    expect(result.status).toBe("ready");
    expect(result.nodeCount).toBe(2);
    expect(result.root.children).toHaveLength(1);
    expect(result.root.children[0]?.children).toHaveLength(0);
  });
});
