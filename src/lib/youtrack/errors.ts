export const ROOT_ISSUE_NOT_FOUND = "ROOT_ISSUE_NOT_FOUND";
export const ROOT_ISSUE_FORBIDDEN = "ROOT_ISSUE_FORBIDDEN";
export const PARTIAL_SCOPE_FORBIDDEN = "PARTIAL_SCOPE_FORBIDDEN";

export type RootIssueErrorCode =
  | typeof ROOT_ISSUE_NOT_FOUND
  | typeof ROOT_ISSUE_FORBIDDEN
  | typeof PARTIAL_SCOPE_FORBIDDEN;

export type RootIssueErrorDetails =
  | {
      readonly code: typeof ROOT_ISSUE_NOT_FOUND;
      readonly issueKey: string;
    }
  | {
      readonly code: typeof ROOT_ISSUE_FORBIDDEN;
      readonly issueKey: string;
    }
  | {
      readonly code: typeof PARTIAL_SCOPE_FORBIDDEN;
      readonly issueKey: string;
      readonly blockedNodeIds: readonly string[];
    };

export class YouTrackScopeError extends Error {
  readonly code: RootIssueErrorCode;

  constructor(code: RootIssueErrorCode, message: string) {
    super(message);
    this.name = "YouTrackScopeError";
    this.code = code;
  }
}

export function isRootIssueErrorCode(value: string): value is RootIssueErrorCode {
  return (
    value === ROOT_ISSUE_NOT_FOUND ||
    value === ROOT_ISSUE_FORBIDDEN ||
    value === PARTIAL_SCOPE_FORBIDDEN
  );
}
