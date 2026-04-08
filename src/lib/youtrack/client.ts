import type {
  RootIssueLookupResult,
  YouTrackIssueApiPayload,
  YouTrackIssueNode,
} from "./contracts";
import type { CurrentUserYouTrackAccess } from "./auth";

export type FetchIssueResult =
  | {
      readonly kind: "success";
      readonly issue: YouTrackIssueNode;
    }
  | {
      readonly kind: "not_found";
      readonly issueId: string;
    }
  | {
      readonly kind: "forbidden";
      readonly issueId: string;
    };

const ISSUE_FIELDS =
  "id,idReadable,summary,parent(id),subtasks(id,issues(id,idReadable))";
const RESPONSE_LOG_PREVIEW_LENGTH = 1200;

function buildIssueUrl(baseUrl: string, issueKeyOrId: string): URL {
  const url = new URL(`/api/issues/${encodeURIComponent(issueKeyOrId)}`, baseUrl);
  url.searchParams.set("fields", ISSUE_FIELDS);
  return url;
}

type YouTrackSubtaskRef = {
  readonly id: string;
  readonly idReadable: string;
};

function normalizeSubtasks(
  subtasks: YouTrackIssueApiPayload["subtasks"],
): readonly YouTrackSubtaskRef[] {
  if (Array.isArray(subtasks)) {
    return subtasks;
  }

  if (!subtasks || typeof subtasks !== "object") {
    return [];
  }

  if ("issues" in subtasks && Array.isArray(subtasks.issues)) {
    return subtasks.issues;
  }

  if ("value" in subtasks && Array.isArray(subtasks.value)) {
    return subtasks.value;
  }

  return [];
}

function mapIssuePayload(payload: YouTrackIssueApiPayload): YouTrackIssueNode {
  const childIds = normalizeSubtasks(payload.subtasks).map((issue) => issue.id);

  return {
    id: payload.id,
    key: payload.idReadable,
    summary: payload.summary,
    parentId: payload.parent?.id ?? null,
    childIds,
    childCount: childIds.length,
    childrenVisibility: "complete",
  };
}

export const __private__ = {
  normalizeSubtasks,
};

function previewBody(body: string): string {
  if (body.length <= RESPONSE_LOG_PREVIEW_LENGTH) {
    return body;
  }

  return `${body.slice(0, RESPONSE_LOG_PREVIEW_LENGTH)}... [truncated]`;
}

async function requestIssue(
  currentUserAccess: CurrentUserYouTrackAccess,
  issueKeyOrId: string,
): Promise<Response> {
  const url = buildIssueUrl(currentUserAccess.baseUrl, issueKeyOrId);

  console.log("[youtrack] request", {
    method: "GET",
    url: url.toString(),
    issueKeyOrId,
    hasAuthHeader: currentUserAccess.authHeader.length > 0,
    userId: currentUserAccess.userId,
  });

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: currentUserAccess.authHeader,
    },
    cache: "no-store",
  });

  const responseBody = await response.clone().text();
  console.log("[youtrack] response", {
    method: "GET",
    url: url.toString(),
    issueKeyOrId,
    status: response.status,
    ok: response.ok,
    body: previewBody(responseBody),
  });

  return response;
}

export async function fetchRootIssueTree(
  currentUserAccess: CurrentUserYouTrackAccess,
  issueKey: string,
): Promise<RootIssueLookupResult> {
  const response = await requestIssue(currentUserAccess, issueKey);

  if (response.status === 404) {
    return {
      kind: "root_issue_not_found",
      issueKey,
    };
  }

  if (response.status === 403) {
    return {
      kind: "root_issue_forbidden",
      issueKey,
    };
  }

  if (!response.ok) {
    throw new Error(`YouTrack root issue lookup failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as YouTrackIssueApiPayload;
  const root = mapIssuePayload(payload);

  return {
    kind: "success",
    root,
    includesChildren: root.childCount > 0,
    visibility: "complete",
  };
}

export async function fetchIssue(
  currentUserAccess: CurrentUserYouTrackAccess,
  issueId: string,
): Promise<FetchIssueResult> {
  const response = await requestIssue(currentUserAccess, issueId);

  if (response.status === 404) {
    return {
      kind: "not_found",
      issueId,
    };
  }

  if (response.status === 403) {
    return {
      kind: "forbidden",
      issueId,
    };
  }

  if (!response.ok) {
    throw new Error(`YouTrack issue lookup failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as YouTrackIssueApiPayload;
  return {
    kind: "success",
    issue: mapIssuePayload(payload),
  };
}
