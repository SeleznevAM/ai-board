import type {
  AssigneeDirectoryEntry,
  CostDirectionKey,
  CostLedgerRow,
  DirectionBudgetMap,
  DirectionCostTotals,
  DirectionProfitability,
  RequirementCostResult,
  RequirementProfitability,
} from "../costing/types";
import type { SnapshotIssueNode } from "../ingestion/types";

export type ScenarioExtraHoursMap = Readonly<Record<string, number>>;

export type ScenarioRefreshOrigin = {
  readonly rootIssueKey: string;
  readonly lastSyncedAt: string | null;
  readonly baselineBudgets: DirectionBudgetMap;
};

export type ScenarioState = ScenarioRefreshOrigin & {
  readonly scenarioBudgets: DirectionBudgetMap;
  readonly extraHoursByIssueKey: ScenarioExtraHoursMap;
};

export type ScenarioOrigin = {
  readonly rootIssueKey: string;
  readonly lastSyncedAt: string | null;
  readonly baselineBudgets: DirectionBudgetMap;
  readonly scenarioBudgets: DirectionBudgetMap;
  readonly extraHoursByIssueKey: ScenarioExtraHoursMap;
};

export type ScenarioSummary = {
  readonly cost: RequirementCostResult;
  readonly profitability: RequirementProfitability;
  readonly directionProfitability: readonly DirectionProfitability[];
};

export type ScenarioComparison<TValue> = {
  readonly current: TValue;
  readonly forecast: TValue;
};

export type ScenarioForecastLedgerRow = {
  readonly issueKey: string;
  readonly addedMinutes: number;
  readonly addedHours: number;
  readonly assignee: CostLedgerRow["assignee"];
  readonly assigneeKey: string | null;
  readonly assigneeLabel: string;
  readonly role: CostDirectionKey;
  readonly hourlyRate: number | null;
  readonly addedCost: number | null;
  readonly warning: CostLedgerRow["warning"];
};

export type ScenarioDirectionDelta = {
  readonly role: CostDirectionKey;
  readonly addedMinutes: number;
  readonly addedHours: number;
  readonly addedCost: number | null;
};

export type ScenarioForecastInput = {
  readonly issues: readonly SnapshotIssueNode[];
  readonly directoryEntries: readonly AssigneeDirectoryEntry[];
  readonly current: ScenarioSummary;
  readonly scenario: ScenarioState;
};

export type ScenarioForecastResult = {
  readonly origin: ScenarioOrigin;
  readonly summary: ScenarioComparison<ScenarioSummary>;
  readonly directionTotals: ScenarioComparison<readonly DirectionCostTotals[]>;
  readonly totalCost: ScenarioComparison<number | null>;
  readonly profitability: ScenarioComparison<RequirementProfitability>;
  readonly directionProfitability: ScenarioComparison<readonly DirectionProfitability[]>;
  readonly scenarioLedger: readonly ScenarioForecastLedgerRow[];
  readonly directionDeltas: readonly ScenarioDirectionDelta[];
};
