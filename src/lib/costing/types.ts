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
export const COST_DIRECTION_KEYS = [...DIRECTION_KEYS, "unmapped"] as const;

export type AssigneeDirectoryEntry = {
  readonly assigneeKey: string;
  readonly assigneeLabel: string;
  readonly role: DirectionKey;
  readonly hourlyRate: number;
};

export type CostWarningCode = "MISSING_ASSIGNEE" | "UNMAPPED_ASSIGNEE";

export type DirectionBudgetMap = Record<CostDirectionKey, number>;

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
  readonly cost: number | null;
};

export type RequirementProfitability = {
  readonly budget: number | null;
  readonly cost: number | null;
  readonly delta: number | null;
  readonly marginPercent: number | null;
  readonly neededUpsell: number | null;
};

export type DirectionProfitability = {
  readonly role: CostDirectionKey;
  readonly budget: number | null;
  readonly cost: number | null;
  readonly delta: number | null;
  readonly marginPercent: number | null;
};

export type RequirementCostResult = {
  readonly ledger: readonly CostLedgerRow[];
  readonly directionTotals: readonly DirectionCostTotals[];
  readonly totalMinutes: number;
  readonly totalHours: number;
  readonly totalCost: number | null;
  readonly warnings: readonly CostWarningCode[];
};
