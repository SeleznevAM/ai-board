import type { SnapshotIssueNode, SnapshotIssueProblem } from "./types";
import type { YouTrackIssueNode } from "../youtrack/contracts";

const CLOSED_STATUSES = new Set(["на проверке qa", "сделана", "утверждена"]);
const ESTIMATE_STATUSES = new Set([
  "зарегистрирована",
  "открыта",
  "в работе",
  "код ревью",
]);
const IGNORED_ISSUE_TYPES = new Set(["группа задач"]);

function normalizeStatusName(statusName: string | null): string | null {
  return statusName?.trim().toLowerCase() ?? null;
}

function buildProblem(code: SnapshotIssueProblem["code"], issueKey: string): SnapshotIssueProblem {
  return {
    code,
    message: `Issue ${issueKey} requires estimate but has no value.`,
  };
}

export function normalizeIssueHours(issue: YouTrackIssueNode): SnapshotIssueNode {
  const normalizedStatus = normalizeStatusName(issue.statusName);
  const normalizedIssueType = normalizeStatusName(issue.issueTypeName);
  const ignoresOwnTime =
    normalizedIssueType !== null && IGNORED_ISSUE_TYPES.has(normalizedIssueType);
  const usesSpentTime = normalizedStatus !== null && CLOSED_STATUSES.has(normalizedStatus);
  const usesEstimate =
    normalizedStatus === null ||
    ESTIMATE_STATUSES.has(normalizedStatus) ||
    !usesSpentTime;

  const hoursSource = usesSpentTime ? "spent" : "estimate";
  const normalizedMinutes = ignoresOwnTime
    ? 0
    : usesSpentTime
      ? issue.spentMinutes
      : issue.estimateMinutes;

  let problem: SnapshotIssueProblem | null = null;
  if (!ignoresOwnTime && usesEstimate && issue.estimateMinutes === null) {
    problem = buildProblem("MISSING_ESTIMATE", issue.key);
  }

  if (!ignoresOwnTime && usesSpentTime && issue.spentMinutes === null) {
    problem = null;
  }

  return {
    issueId: issue.id,
    issueKey: issue.key,
    summary: issue.summary,
    parentId: issue.parentId,
    childIds: issue.childIds,
    issueTypeName: issue.issueTypeName,
    statusName: issue.statusName,
    hoursSource,
    normalizedMinutes,
    estimateMinutes: issue.estimateMinutes,
    spentMinutes: issue.spentMinutes,
    assignee: issue.assignee,
    blocked: problem !== null,
    problem,
  };
}
