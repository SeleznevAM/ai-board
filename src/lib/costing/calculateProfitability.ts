import type {
  CostDirectionKey,
  DirectionBudgetMap,
  DirectionCostTotals,
  DirectionProfitability,
  RequirementProfitability,
} from "./types";

const TARGET_MARGIN_PERCENT = 20;

function isValidBudget(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateMarginPercent(budget: number | null, cost: number | null): number | null {
  if (!isValidBudget(budget) || cost === null) {
    return null;
  }

  return roundPercent(((budget - cost) / budget) * 100);
}

export function calculateRequiredBudgetForTargetMargin(
  cost: number | null,
  targetMarginPercent = TARGET_MARGIN_PERCENT,
): number | null {
  if (cost === null || !Number.isFinite(cost)) {
    return null;
  }

  const targetMargin = targetMarginPercent / 100;
  if (targetMargin >= 1) {
    return null;
  }

  return roundMoney(cost / (1 - targetMargin));
}

export function calculateNeededUpsell(
  budget: number | null,
  cost: number | null,
  targetMarginPercent = TARGET_MARGIN_PERCENT,
): number | null {
  const requiredBudget = calculateRequiredBudgetForTargetMargin(cost, targetMarginPercent);
  if (!isValidBudget(budget) || requiredBudget === null) {
    return null;
  }

  return roundMoney(Math.max(0, requiredBudget - budget));
}

export function calculateRequirementProfitability(
  budget: number | null,
  cost: number | null,
): RequirementProfitability {
  return {
    budget,
    cost,
    delta: isValidBudget(budget) && cost !== null ? roundMoney(budget - cost) : null,
    marginPercent: calculateMarginPercent(budget, cost),
    neededUpsell: calculateNeededUpsell(budget, cost),
  };
}

export function calculateDirectionProfitability(
  directionBudgets: DirectionBudgetMap,
  directionTotals: readonly DirectionCostTotals[],
): DirectionProfitability[] {
  return directionTotals.map((directionTotal) => {
    const budget = directionBudgets[directionTotal.role];
    const cost = directionTotal.cost;

    return {
      role: directionTotal.role,
      budget,
      cost,
      delta: isValidBudget(budget) && cost !== null ? roundMoney(budget - cost) : null,
      marginPercent: calculateMarginPercent(budget, cost),
    };
  });
}

export { TARGET_MARGIN_PERCENT };
