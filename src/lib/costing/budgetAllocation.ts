import {
  COST_DIRECTION_KEYS,
  DIRECTION_KEYS,
  type CostDirectionKey,
  type DirectionBudgetMap,
} from "./types";

function zeroBudgetMap(): DirectionBudgetMap {
  return {
    devops: 0,
    backend: 0,
    analytics: 0,
    frontend: 0,
    mobiledev: 0,
    qa: 0,
    design: 0,
    pm: 0,
    unmapped: 0,
  };
}

function isValidBudget(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function allocateEvenBudgets(totalBudget: number): DirectionBudgetMap {
  if (!isValidBudget(totalBudget)) {
    return zeroBudgetMap();
  }

  const share = totalBudget / DIRECTION_KEYS.length;

  return {
    devops: share,
    backend: share,
    analytics: share,
    frontend: share,
    mobiledev: share,
    qa: share,
    design: share,
    pm: share,
    unmapped: 0,
  };
}

export function applyDirectionBudgetOverrides(
  baseBudgets: DirectionBudgetMap,
  overrides: Partial<Record<CostDirectionKey, number>>,
): DirectionBudgetMap {
  const merged = { ...baseBudgets };

  for (const direction of COST_DIRECTION_KEYS) {
    const override = overrides[direction];
    if (override === undefined) {
      continue;
    }

    merged[direction] = isValidBudget(override) ? override : baseBudgets[direction];
  }

  return merged;
}

export function recalculateTotalBudget(directionBudgets: DirectionBudgetMap): number {
  return COST_DIRECTION_KEYS.reduce((sum, direction) => sum + directionBudgets[direction], 0);
}
