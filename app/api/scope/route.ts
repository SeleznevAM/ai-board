import { NextResponse } from "next/server";

import { buildRequirementSnapshot } from "../../../src/lib/ingestion/buildRequirementSnapshot";
import { resolveCurrentUserYouTrackAccess } from "../../../src/lib/youtrack/auth";
import {
  PARTIAL_SCOPE_FORBIDDEN,
  ROOT_ISSUE_FORBIDDEN,
  ROOT_ISSUE_NOT_FOUND,
  YouTrackScopeError,
} from "../../../src/lib/youtrack/errors";

type ScopeRequestPayload = {
  rootIssueKey?: string;
};

function isYouTrackScopeError(error: unknown): error is YouTrackScopeError & {
  readonly blockedNodeIds?: readonly string[];
} {
  return error instanceof YouTrackScopeError;
}

export async function POST(request: Request) {
  let payload: ScopeRequestPayload;

  try {
    payload = (await request.json()) as ScopeRequestPayload;
  } catch {
    return NextResponse.json(
      {
        message: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const rootIssueKey = payload.rootIssueKey?.trim();
  if (!rootIssueKey) {
    return NextResponse.json(
      {
        message: "rootIssueKey is required.",
      },
      { status: 400 },
    );
  }

  try {
    const currentUserAccess = await resolveCurrentUserYouTrackAccess(request);
    const scope = await buildRequirementSnapshot({
      rootIssueKey,
      currentUserAccess,
    });

    if (scope.status === "snapshot_blocked") {
      return NextResponse.json(scope, { status: 409 });
    }

    return NextResponse.json(scope, { status: 200 });
  } catch (error) {
    if (isYouTrackScopeError(error)) {
      if (error.code === ROOT_ISSUE_NOT_FOUND) {
        return NextResponse.json(
          {
            status: "not_found",
            issueKey: rootIssueKey,
            outcome: "not-found",
          },
          { status: 404 },
        );
      }

      if (error.code === ROOT_ISSUE_FORBIDDEN) {
        return NextResponse.json(
          {
            status: "forbidden",
            issueKey: rootIssueKey,
            outcome: "forbidden",
          },
          { status: 403 },
        );
      }

      if (error.code === PARTIAL_SCOPE_FORBIDDEN) {
        return NextResponse.json(
          {
            status: "partial_scope_blocked",
            issueKey: rootIssueKey,
            outcome: "partial-scope-blocked",
          },
          { status: 409 },
        );
      }
    }

    throw error;
  }
}
