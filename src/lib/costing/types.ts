import type { SnapshotIssueAssignee } from "../ingestion/types";

export const DIRECTION_KEYS = [
  "devops",
  "backend",
  "analytics",
  "frontend",
  "mobiledev",
  "qa",
  "design",
  "pm",
] as const;

export type DirectionKey = (typeof DIRECTION_KEYS)[number];
export type CostDirectionKey = DirectionKey | "unmapped";

export type AssigneeDirectoryEntry = {
  readonly assigneeKey: string;
  readonly assigneeLabel: string;
  readonly role: DirectionKey;
  readonly hourlyRate: number;
};

export type CostWarningCode = "MISSING_ASSIGNEE" | "UNMAPPED_ASSIGNEE";

export type AssigneeDirectoryResolution =
  | {
      readonly status: "matched";
      readonly assigneeKey: string;
      readonly assigneeLabel: string;
      readonly role: DirectionKey;
      readonly hourlyRate: number;
      readonly warning: null;
    }
  | {
      readonly status: "fallback";
      readonly assigneeKey: string | null;
      readonly assigneeLabel: string;
      readonly role: "unmapped";
      readonly hourlyRate: number | null;
      readonly warning: CostWarningCode;
    };

export type CostLedgerRow = {
  readonly issueKey: string;
  readonly summary: string;
  readonly minutes: number;
  readonly hours: number;
  readonly assignee: SnapshotIssueAssignee | null;
  readonly assigneeKey: string | null;
  readonly assigneeLabel: string;
  readonly role: CostDirectionKey;
  readonly hourlyRate: number | null;
  readonly cost: number | null;
  readonly warning: CostWarningCode | null;
};

export type DirectionCostTotals = {
  readonly role: CostDirectionKey;
  readonly minutes: number;
  readonly hours: number;
  readonly cost: number;
};

export type RequirementProfitability = {
  readonly budget: number | null;
  readonly cost: number;
  readonly delta: number | null;
  readonly marginPercent: number | null;
  readonly neededUpsell: number | null;
};
