import {
  calculateDirectionProfitability,
  calculateRequirementProfitability,
} from "../costing/calculateProfitability";
import { calculateRequirementCost } from "../costing/calculateRequirementCost";
import { COST_DIRECTION_KEYS, type CostDirectionKey, type DirectionBudgetMap } from "../costing/types";
import { resolveAssigneeDirectoryMatch } from "../costing/assigneeDirectory";
import type {
  ScenarioDirectionDelta,
  ScenarioForecastInput,
  ScenarioForecastLedgerRow,
  ScenarioForecastResult,
} from "./types";
import { materializeScenarioOrigin } from "./state";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function sumBudgets(budgets: DirectionBudgetMap): number {
  return Object.values(budgets).reduce((sum, value) => sum + value, 0);
}

function buildDirectionDeltaMap(): Record<CostDirectionKey, ScenarioDirectionDelta> {
  return {
    devops: { role: "devops", addedMinutes: 0, addedHours: 0, addedCost: 0 },
    backend: { role: "backend", addedMinutes: 0, addedHours: 0, addedCost: 0 },
    analytics: { role: "analytics", addedMinutes: 0, addedHours: 0, addedCost: 0 },
    frontend: { role: "frontend", addedMinutes: 0, addedHours: 0, addedCost: 0 },
    mobiledev: { role: "mobiledev", addedMinutes: 0, addedHours: 0, addedCost: 0 },
    qa: { role: "qa", addedMinutes: 0, addedHours: 0, addedCost: 0 },
    design: { role: "design", addedMinutes: 0, addedHours: 0, addedCost: 0 },
    pm: { role: "pm", addedMinutes: 0, addedHours: 0, addedCost: 0 },
    unmapped: { role: "unmapped", addedMinutes: 0, addedHours: 0, addedCost: 0 },
  };
}

function buildScenarioLedger(input: ScenarioForecastInput): readonly ScenarioForecastLedgerRow[] {
  const rows: ScenarioForecastLedgerRow[] = [];

  for (const issue of input.issues) {
    const addedHours = input.scenario.extraHoursByIssueKey[issue.issueKey];
    if (!addedHours) {
      continue;
    }

    const addedMinutes = addedHours * 60;
    const resolution = resolveAssigneeDirectoryMatch(issue.assignee, input.directoryEntries);
    const addedCost =
      resolution.hourlyRate === null ? null : roundMoney(addedHours * resolution.hourlyRate);

    rows.push({
      issueKey: issue.issueKey,
      addedMinutes,
      addedHours,
      assignee: issue.assignee,
      assigneeKey: resolution.assigneeKey,
      assigneeLabel: resolution.assigneeLabel,
      role: resolution.role,
      hourlyRate: resolution.hourlyRate,
      addedCost,
      warning: resolution.warning,
    });
  }

  return rows;
}

function buildDirectionDeltas(
  scenarioLedger: readonly ScenarioForecastLedgerRow[],
): readonly ScenarioDirectionDelta[] {
  const deltas = buildDirectionDeltaMap();

  for (const row of scenarioLedger) {
    const current = deltas[row.role];
    deltas[row.role] = {
      role: row.role,
      addedMinutes: current.addedMinutes + row.addedMinutes,
      addedHours: current.addedHours + row.addedHours,
      addedCost:
        current.addedCost === null || row.addedCost === null
          ? null
          : roundMoney(current.addedCost + row.addedCost),
    };
  }

  return COST_DIRECTION_KEYS.filter((role) => {
    const delta = deltas[role];
    return delta.addedMinutes > 0 || delta.addedCost !== 0;
  }).map((role) => deltas[role]);
}

export function calculateScenarioForecast(input: ScenarioForecastInput): ScenarioForecastResult {
  const scenarioLedger = buildScenarioLedger(input);
  const directionDeltas = buildDirectionDeltas(scenarioLedger);

  const augmentedIssues = input.issues.map((issue) => ({
    ...issue,
    normalizedMinutes:
      (issue.normalizedMinutes ?? 0) + (input.scenario.extraHoursByIssueKey[issue.issueKey] ?? 0) * 60,
  }));
  const forecastCost = calculateRequirementCost(augmentedIssues, input.directoryEntries);
  const forecastProfitability = calculateRequirementProfitability(
    sumBudgets(input.scenario.scenarioBudgets),
    forecastCost.totalCost,
  );
  const forecastDirectionProfitability = calculateDirectionProfitability(
    input.scenario.scenarioBudgets,
    forecastCost.directionTotals,
  );

  return {
    origin: materializeScenarioOrigin(input.scenario),
    summary: {
      current: input.current,
      forecast: {
        cost: forecastCost,
        profitability: forecastProfitability,
        directionProfitability: forecastDirectionProfitability,
      },
    },
    directionTotals: {
      current: input.current.cost.directionTotals,
      forecast: forecastCost.directionTotals,
    },
    totalCost: {
      current: input.current.cost.totalCost,
      forecast: forecastCost.totalCost,
    },
    profitability: {
      current: input.current.profitability,
      forecast: forecastProfitability,
    },
    directionProfitability: {
      current: input.current.directionProfitability,
      forecast: forecastDirectionProfitability,
    },
    scenarioLedger,
    directionDeltas,
  };
}
