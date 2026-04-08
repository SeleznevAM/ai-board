import { describe, expect, it } from "vitest";

import {
  allocateEvenBudgets,
  applyDirectionBudgetOverrides,
  recalculateTotalBudget,
} from "./budgetAllocation";

describe("allocateEvenBudgets", () => {
  it("distributes the total budget evenly across core directions", () => {
    expect(allocateEvenBudgets(800)).toEqual({
      devops: 100,
      backend: 100,
      analytics: 100,
      frontend: 100,
      mobiledev: 100,
      qa: 100,
      design: 100,
      pm: 100,
      unmapped: 0,
    });
  });

  it("keeps unmapped at zero during auto allocation", () => {
    expect(allocateEvenBudgets(80).unmapped).toBe(0);
  });
});

describe("applyDirectionBudgetOverrides", () => {
  it("merges manual direction budgets including unmapped", () => {
    expect(
      applyDirectionBudgetOverrides(allocateEvenBudgets(80), {
        backend: 25,
        unmapped: 10,
      }),
    ).toMatchObject({
      backend: 25,
      unmapped: 10,
    });
  });
});

describe("recalculateTotalBudget", () => {
  it("recomputes the total budget after overrides are saved", () => {
    expect(
      recalculateTotalBudget(
        applyDirectionBudgetOverrides(allocateEvenBudgets(80), {
          backend: 25,
          unmapped: 10,
        }),
      ),
    ).toBe(105);
  });
});
