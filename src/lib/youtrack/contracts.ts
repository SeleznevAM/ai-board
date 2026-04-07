export type YouTrackIssueIdentifier = {
  readonly id: string;
  readonly key: string;
};

export type YouTrackIssueNode = YouTrackIssueIdentifier & {
  readonly summary: string;
  readonly parentId: string | null;
  readonly childIds: readonly string[];
  readonly childCount: number;
  readonly childrenVisibility: "complete" | "blocked";
};

export type YouTrackIssueLookupPayload = {
  readonly issue: YouTrackIssueNode;
  readonly retrievedAt: string;
};

export type RootIssueLookupResult =
  | {
      readonly kind: "success";
      readonly root: YouTrackIssueNode;
      readonly includesChildren: boolean;
    }
  | {
      readonly kind: "root_issue_not_found";
      readonly issueKey: string;
    }
  | {
      readonly kind: "root_issue_forbidden";
      readonly issueKey: string;
    }
  | {
      readonly kind: "partial_scope_forbidden";
      readonly issueKey: string;
      readonly blockedNodeIds: readonly string[];
    };

export type YouTrackSubtaskRelationship = {
  readonly parentId: string;
  readonly childId: string;
};
