import { describe, expect, it } from "vitest";

import {
  TARGET_MARGIN_PERCENT,
  calculateDirectionProfitability,
  calculateMarginPercent,
  calculateNeededUpsell,
  calculateRequirementProfitability,
} from "./calculateProfitability";
import { allocateEvenBudgets } from "./budgetAllocation";
import type { DirectionCostTotals } from "./types";

describe("calculateMarginPercent", () => {
  it("uses the locked profitability formula", () => {
    expect(calculateMarginPercent(1000, 750)).toBe(25);
  });

  it("suppresses percentage for empty or zero budget", () => {
    expect(calculateMarginPercent(null, 750)).toBeNull();
    expect(calculateMarginPercent(0, 750)).toBeNull();
  });
});

describe("calculateNeededUpsell", () => {
  it("calculates the extra amount required to reach 20% target margin", () => {
    expect(calculateNeededUpsell(1000, 900, TARGET_MARGIN_PERCENT)).toBe(125);
  });
});

describe("calculateRequirementProfitability", () => {
  it("returns overall profitability values", () => {
    expect(calculateRequirementProfitability(1000, 800)).toEqual({
      budget: 1000,
      cost: 800,
      delta: 200,
      marginPercent: 20,
      neededUpsell: 0,
    });
  });
});

describe("calculateDirectionProfitability", () => {
  it("calculates per-direction profitability from direction budgets", () => {
    const directionTotals: DirectionCostTotals[] = [
      { role: "backend", minutes: 60, hours: 1, cost: 60 },
      { role: "unmapped", minutes: 30, hours: 0.5, cost: 20 },
    ];

    const results = calculateDirectionProfitability(
      {
        ...allocateEvenBudgets(800),
        backend: 100,
        unmapped: 40,
      },
      directionTotals,
    );

    expect(results).toContainEqual({
      role: "backend",
      budget: 100,
      cost: 60,
      delta: 40,
      marginPercent: 40,
    });
    expect(results).toContainEqual({
      role: "unmapped",
      budget: 40,
      cost: 20,
      delta: 20,
      marginPercent: 50,
    });
  });
});
