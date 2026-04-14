import { describe, expect, it } from "vitest";

import { calculateRequirementCost } from "../costing/calculateRequirementCost";
import {
  calculateDirectionProfitability,
  calculateRequirementProfitability,
} from "../costing/calculateProfitability";
import type { AssigneeDirectoryEntry, DirectionBudgetMap } from "../costing/types";
import type { SnapshotIssueNode } from "../ingestion/types";
import { calculateScenarioForecast } from "./forecast";
import { createScenarioState, updateScenarioBudget, updateScenarioExtraHours } from "./state";

const directory: AssigneeDirectoryEntry[] = [
  {
    assigneeKey: "anna",
    assigneeLabel: "Anna",
    role: "backend",
    hourlyRate: 2400,
  },
  {
    assigneeKey: "boris",
    assigneeLabel: "Boris",
    role: "frontend",
    hourlyRate: 1800,
  },
];

function budgets(overrides: Partial<DirectionBudgetMap> = {}): DirectionBudgetMap {
  return {
    devops: 100,
    backend: 10000,
    analytics: 100,
    frontend: 8000,
    mobiledev: 100,
    qa: 100,
    design: 100,
    pm: 100,
    unmapped: 0,
    ...overrides,
  };
}

function issue(
  overrides: Partial<SnapshotIssueNode> &
    Pick<SnapshotIssueNode, "issueId" | "issueKey" | "summary">,
): SnapshotIssueNode {
  return {
    parentId: null,
    childIds: [],
    statusName: "In Progress",
    hoursSource: "estimate",
    normalizedMinutes: 60,
    estimateMinutes: 60,
    spentMinutes: null,
    assignee: null,
    blocked: false,
    problem: null,
    ...overrides,
  };
}

function createBaseline(issues: readonly SnapshotIssueNode[]) {
  const currentCost = calculateRequirementCost(issues, directory);
  const currentProfitability = calculateRequirementProfitability(
    18000,
    currentCost.totalCost,
  );
  const currentDirectionProfitability = calculateDirectionProfitability(
    budgets(),
    currentCost.directionTotals,
  );

  return {
    currentCost,
    currentProfitability,
    currentDirectionProfitability,
  };
}

describe("calculateScenarioForecast", () => {
  it("prices task extra hours from the issue assignee", () => {
    const issues = [
      issue({
        issueId: "1",
        issueKey: "REQ-1",
        summary: "Backend task",
        assignee: { id: null, login: "anna", displayName: "Anna" },
      }),
    ];
    const baseline = createBaseline(issues);
    const scenario = updateScenarioExtraHours(
      createScenarioState({
        rootIssueKey: "REQ-ROOT",
        lastSyncedAt: "2026-04-14T12:00:00.000Z",
        baselineBudgets: budgets(),
      }),
      "REQ-1",
      2,
    );

    const result = calculateScenarioForecast({
      issues,
      directoryEntries: directory,
      current: {
        cost: baseline.currentCost,
        profitability: baseline.currentProfitability,
        directionProfitability: baseline.currentDirectionProfitability,
      },
      scenario,
    });

    expect(result.scenarioLedger).toContainEqual({
      issueKey: "REQ-1",
      addedMinutes: 120,
      addedHours: 2,
      assignee: { id: null, login: "anna", displayName: "Anna" },
      assigneeKey: "anna",
      assigneeLabel: "Anna",
      role: "backend",
      hourlyRate: 2400,
      addedCost: 4800,
      warning: null,
    });
  });

  it("aggregates multiple issue edits across multiple directions in one scenario", () => {
    const issues = [
      issue({
        issueId: "1",
        issueKey: "REQ-1",
        summary: "Backend task",
        assignee: { id: null, login: "anna", displayName: "Anna" },
      }),
      issue({
        issueId: "2",
        issueKey: "REQ-2",
        summary: "Frontend task",
        assignee: { id: null, login: "boris", displayName: "Boris" },
      }),
    ];
    const baseline = createBaseline(issues);
    const scenario = updateScenarioExtraHours(
      updateScenarioExtraHours(
        createScenarioState({
          rootIssueKey: "REQ-ROOT",
          lastSyncedAt: "2026-04-14T12:00:00.000Z",
          baselineBudgets: budgets(),
        }),
        "REQ-1",
        2,
      ),
      "REQ-2",
      1.5,
    );

    const result = calculateScenarioForecast({
      issues,
      directoryEntries: directory,
      current: {
        cost: baseline.currentCost,
        profitability: baseline.currentProfitability,
        directionProfitability: baseline.currentDirectionProfitability,
      },
      scenario,
    });

    expect(result.directionDeltas).toContainEqual({
      role: "backend",
      addedMinutes: 120,
      addedHours: 2,
      addedCost: 4800,
    });
    expect(result.directionDeltas).toContainEqual({
      role: "frontend",
      addedMinutes: 90,
      addedHours: 1.5,
      addedCost: 2700,
    });
  });

  it("leaves factual cost and profitability unchanged while forecast values reflect only overlay edits", () => {
    const issues = [
      issue({
        issueId: "1",
        issueKey: "REQ-1",
        summary: "Backend task",
        assignee: { id: null, login: "anna", displayName: "Anna" },
      }),
    ];
    const canonicalMinutes = issues[0]?.normalizedMinutes;
    const baseline = createBaseline(issues);
    const scenario = updateScenarioExtraHours(
      createScenarioState({
        rootIssueKey: "REQ-ROOT",
        lastSyncedAt: "2026-04-14T12:00:00.000Z",
        baselineBudgets: budgets(),
      }),
      "REQ-1",
      1,
    );

    const result = calculateScenarioForecast({
      issues,
      directoryEntries: directory,
      current: {
        cost: baseline.currentCost,
        profitability: baseline.currentProfitability,
        directionProfitability: baseline.currentDirectionProfitability,
      },
      scenario,
    });

    expect(result.summary.current.cost.totalCost).toBe(baseline.currentCost.totalCost);
    expect(result.summary.current.profitability).toEqual(baseline.currentProfitability);
    expect(result.summary.forecast.cost.totalCost).toBe(4800);
    expect(result.summary.forecast.profitability.marginPercent).toBe(73.33);
    expect(issues[0]?.normalizedMinutes).toBe(canonicalMinutes);
  });

  it("returns both current and forecast summaries for side-by-side UI rendering", () => {
    const issues = [
      issue({
        issueId: "1",
        issueKey: "REQ-1",
        summary: "Backend task",
        assignee: { id: null, login: "anna", displayName: "Anna" },
      }),
    ];
    const baseline = createBaseline(issues);
    const scenario = updateScenarioExtraHours(
      createScenarioState({
        rootIssueKey: "REQ-ROOT",
        lastSyncedAt: "2026-04-14T12:00:00.000Z",
        baselineBudgets: budgets(),
      }),
      "REQ-1",
      1,
    );

    const result = calculateScenarioForecast({
      issues,
      directoryEntries: directory,
      current: {
        cost: baseline.currentCost,
        profitability: baseline.currentProfitability,
        directionProfitability: baseline.currentDirectionProfitability,
      },
      scenario,
    });

    expect(result.summary.current.cost.totalCost).toBe(2400);
    expect(result.summary.forecast.cost.totalCost).toBe(4800);
    expect(result.profitability.current.cost).toBe(2400);
    expect(result.profitability.forecast.cost).toBe(4800);
  });

  it("recomputes needed upsell from forecast cost against the active scenario budgets", () => {
    const issues = [
      issue({
        issueId: "1",
        issueKey: "REQ-1",
        summary: "Backend task",
        assignee: { id: null, login: "anna", displayName: "Anna" },
      }),
    ];
    const baseline = createBaseline(issues);
    const scenario = updateScenarioExtraHours(
      updateScenarioBudget(
        createScenarioState({
          rootIssueKey: "REQ-ROOT",
          lastSyncedAt: "2026-04-14T12:00:00.000Z",
          baselineBudgets: budgets({ backend: 5000 }),
        }),
        "backend",
        5000,
      ),
      "REQ-1",
      2,
    );

    const result = calculateScenarioForecast({
      issues,
      directoryEntries: directory,
      current: {
        cost: baseline.currentCost,
        profitability: baseline.currentProfitability,
        directionProfitability: baseline.currentDirectionProfitability,
      },
      scenario,
    });

    expect(result.profitability.forecast).toEqual({
      budget: 13300,
      cost: 9600,
      delta: 3700,
      marginPercent: 27.82,
      neededUpsell: 0,
    });
    expect(
      result.directionProfitability.forecast.find((row) => row.role === "backend"),
    ).toEqual({
      role: "backend",
      budget: 5000,
      cost: 7200,
      delta: -2200,
      marginPercent: -44,
    });
  });
});
