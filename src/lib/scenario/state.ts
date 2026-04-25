import type { CostDirectionKey, DirectionBudgetMap } from "../costing/types";
import type { ScenarioOrigin, ScenarioRefreshOrigin, ScenarioState } from "./types";

function cloneBudgets(budgets: DirectionBudgetMap): DirectionBudgetMap {
  return { ...budgets };
}

function cloneExtraHours(extraHoursByIssueKey: Readonly<Record<string, number>>): Record<string, number> {
  return { ...extraHoursByIssueKey };
}

export function createScenarioState(
  origin: ScenarioRefreshOrigin & {
    readonly scenarioBudgets?: DirectionBudgetMap;
    readonly extraHoursByIssueKey?: Readonly<Record<string, number>>;
  },
): ScenarioState {
  return {
    rootIssueKey: origin.rootIssueKey,
    lastSyncedAt: origin.lastSyncedAt,
    baselineBudgets: cloneBudgets(origin.baselineBudgets),
    scenarioBudgets: cloneBudgets(origin.scenarioBudgets ?? origin.baselineBudgets),
    extraHoursByIssueKey: cloneExtraHours(origin.extraHoursByIssueKey ?? {}),
  };
}

export function applyScenarioRefresh(
  _state: ScenarioState,
  origin: ScenarioRefreshOrigin,
): ScenarioState {
  return createScenarioState(origin);
}

export function updateScenarioBudget(
  state: ScenarioState,
  role: CostDirectionKey,
  budget: number,
): ScenarioState {
  return {
    ...state,
    baselineBudgets: cloneBudgets(state.baselineBudgets),
    scenarioBudgets: {
      ...state.scenarioBudgets,
      [role]: budget,
    },
    extraHoursByIssueKey: cloneExtraHours(state.extraHoursByIssueKey),
  };
}

export function updateScenarioExtraHours(
  state: ScenarioState,
  issueKey: string,
  hours: number,
): ScenarioState {
  const nextExtraHours = cloneExtraHours(state.extraHoursByIssueKey);

  if (hours === 0) {
    delete nextExtraHours[issueKey];
  } else {
    nextExtraHours[issueKey] = hours;
  }

  return {
    ...state,
    baselineBudgets: cloneBudgets(state.baselineBudgets),
    scenarioBudgets: cloneBudgets(state.scenarioBudgets),
    extraHoursByIssueKey: nextExtraHours,
  };
}

export function resetScenarioState(state: ScenarioState): ScenarioState {
  return {
    ...state,
    baselineBudgets: cloneBudgets(state.baselineBudgets),
    scenarioBudgets: cloneBudgets(state.baselineBudgets),
    extraHoursByIssueKey: {},
  };
}

export function hasScenarioChanges(state: ScenarioState): boolean {
  const budgetKeys = Object.keys(state.baselineBudgets) as CostDirectionKey[];

  for (const key of budgetKeys) {
    if (state.baselineBudgets[key] !== state.scenarioBudgets[key]) {
      return true;
    }
  }

  return Object.keys(state.extraHoursByIssueKey).length > 0;
}

export function materializeScenarioOrigin(state: ScenarioState): ScenarioOrigin {
  return {
    rootIssueKey: state.rootIssueKey,
    lastSyncedAt: state.lastSyncedAt,
    baselineBudgets: cloneBudgets(state.baselineBudgets),
    scenarioBudgets: cloneBudgets(state.scenarioBudgets),
    extraHoursByIssueKey: cloneExtraHours(state.extraHoursByIssueKey),
  };
}
