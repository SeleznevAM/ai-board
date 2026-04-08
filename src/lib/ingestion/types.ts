export type IssueHoursSource = "spent" | "estimate";

export type SnapshotIssueProblem =
  {
    readonly code: "MISSING_ESTIMATE";
    readonly message: string;
  };

export type SnapshotIssueNode = {
  readonly issueId: string;
  readonly issueKey: string;
  readonly summary: string;
  readonly parentId: string | null;
  readonly childIds: readonly string[];
  readonly statusName: string | null;
  readonly hoursSource: IssueHoursSource;
  readonly normalizedMinutes: number | null;
  readonly estimateMinutes: number | null;
  readonly spentMinutes: number | null;
  readonly blocked: boolean;
  readonly problem: SnapshotIssueProblem | null;
};
