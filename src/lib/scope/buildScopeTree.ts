import type { ScopeResolutionState, ScopeTreeNode } from "./types";
import type { RootIssueLookupResult, YouTrackIssueNode } from "../youtrack/contracts";
import {
  PARTIAL_SCOPE_FORBIDDEN,
  ROOT_ISSUE_FORBIDDEN,
  ROOT_ISSUE_NOT_FOUND,
  YouTrackScopeError,
} from "../youtrack/errors";
import type { CurrentUserYouTrackAccess } from "../youtrack/auth";
import {
  fetchIssue as fetchIssueFromYouTrack,
  fetchRootIssueTree as fetchRootIssueTreeFromYouTrack,
  type FetchIssueResult,
} from "../youtrack/client";

export type ScopeClient = {
  fetchRootIssueTree: (
    currentUserAccess: CurrentUserYouTrackAccess,
    issueKey: string,
  ) => Promise<RootIssueLookupResult>;
  fetchIssue: (
    currentUserAccess: CurrentUserYouTrackAccess,
    issueId: string,
  ) => Promise<FetchIssueResult>;
};

export type BuildScopeTreeInput = {
  readonly rootIssueKey: string;
  readonly currentUserAccess: CurrentUserYouTrackAccess;
};

const defaultScopeClient: ScopeClient = {
  fetchRootIssueTree: fetchRootIssueTreeFromYouTrack,
  fetchIssue: fetchIssueFromYouTrack,
};

type TraversalResult = {
  readonly node: ScopeTreeNode;
  readonly nodeCount: number;
};

function buildScopeError(
  code: typeof ROOT_ISSUE_NOT_FOUND | typeof ROOT_ISSUE_FORBIDDEN | typeof PARTIAL_SCOPE_FORBIDDEN,
  issueKey: string,
  blockedNodeIds: readonly string[] = [],
): YouTrackScopeError & { readonly blockedNodeIds?: readonly string[] } {
  const error = new YouTrackScopeError(code, `${code}: ${issueKey}`);

  if (code === PARTIAL_SCOPE_FORBIDDEN) {
    return Object.assign(error, {
      blockedNodeIds,
    });
  }

  return error;
}

async function traverseIssueTree(
  issue: YouTrackIssueNode,
  depth: number,
  currentUserAccess: CurrentUserYouTrackAccess,
  client: ScopeClient,
  visited: Set<string>,
  rootIssueKey: string,
): Promise<TraversalResult> {
  visited.add(issue.id);

  const children: ScopeTreeNode[] = [];
  let nodeCount = 1;

  for (const childId of issue.childIds) {
    if (visited.has(childId)) {
      continue;
    }

    const childResult = await client.fetchIssue(currentUserAccess, childId);
    if (childResult.kind !== "success") {
      throw buildScopeError(PARTIAL_SCOPE_FORBIDDEN, rootIssueKey, [childId]);
    }

    const traversedChild = await traverseIssueTree(
      childResult.issue,
      depth + 1,
      currentUserAccess,
      client,
      visited,
      rootIssueKey,
    );

    children.push(traversedChild.node);
    nodeCount += traversedChild.nodeCount;
  }

  return {
    node: {
      issue,
      depth,
      children,
    },
    nodeCount,
  };
}

export async function buildScopeTree(
  input: BuildScopeTreeInput,
  client: ScopeClient = defaultScopeClient,
): Promise<ScopeResolutionState> {
  const { currentUserAccess, rootIssueKey } = input;
  const rootLookup = await client.fetchRootIssueTree(currentUserAccess, rootIssueKey);

  if (rootLookup.kind === "root_issue_not_found") {
    throw buildScopeError(ROOT_ISSUE_NOT_FOUND, rootIssueKey);
  }

  if (rootLookup.kind === "root_issue_forbidden") {
    throw buildScopeError(ROOT_ISSUE_FORBIDDEN, rootIssueKey);
  }

  if (rootLookup.kind === "partial_scope_forbidden") {
    throw buildScopeError(
      PARTIAL_SCOPE_FORBIDDEN,
      rootIssueKey,
      rootLookup.blockedNodeIds,
    );
  }

  const visited = new Set<string>();
  const traversedRoot = await traverseIssueTree(
    rootLookup.root,
    0,
    currentUserAccess,
    client,
    visited,
    rootIssueKey,
  );

  return {
    status: "ready",
    root: traversedRoot.node,
    nodeCount: traversedRoot.nodeCount,
    outcome: traversedRoot.node.children.length === 0 ? "single-node" : "tree",
  };
}
