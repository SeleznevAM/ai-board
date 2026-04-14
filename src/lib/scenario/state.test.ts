import { describe, expect, it } from "vitest";

import {
  applyScenarioRefresh,
  createScenarioState,
  hasScenarioChanges,
  materializeScenarioOrigin,
  resetScenarioState,
  updateScenarioBudget,
  updateScenarioExtraHours,
} from "./state";
import type { ScenarioState } from "./types";
import type { DirectionBudgetMap } from "../costing/types";

function budgets(overrides: Partial<DirectionBudgetMap> = {}): DirectionBudgetMap {
  return {
    devops: 100,
    backend: 100,
    analytics: 100,
    frontend: 100,
    mobiledev: 100,
    qa: 100,
    design: 100,
    pm: 100,
    unmapped: 0,
    ...overrides,
  };
}

function createState(overrides: Partial<ScenarioState> = {}): ScenarioState {
  return createScenarioState({
    rootIssueKey: "REQ-100",
    lastSyncedAt: "2026-04-14T12:00:00.000Z",
    baselineBudgets: budgets(),
    ...overrides,
  });
}

describe("scenario state helpers", () => {
  it("snapshots baseline direction budgets separately from editable scenario budgets", () => {
    const state = createState();
    const updated = updateScenarioBudget(state, "backend", 175);

    expect(updated.baselineBudgets.backend).toBe(100);
    expect(updated.scenarioBudgets.backend).toBe(175);
    expect(state.scenarioBudgets.backend).toBe(100);
  });

  it("stores multiple issue edits keyed by issueKey without mutating canonical inputs", () => {
    const state = createState();
    const withFirstIssue = updateScenarioExtraHours(state, "REQ-101", 3);
    const withTwoIssues = updateScenarioExtraHours(withFirstIssue, "REQ-102", 1.5);
    const updatedFirstIssue = updateScenarioExtraHours(withTwoIssues, "REQ-101", 5);

    expect(updatedFirstIssue.extraHoursByIssueKey).toEqual({
      "REQ-101": 5,
      "REQ-102": 1.5,
    });
    expect(withTwoIssues.extraHoursByIssueKey).toEqual({
      "REQ-101": 3,
      "REQ-102": 1.5,
    });
  });

  it("resets scenario edits while preserving baseline budgets and origin metadata from the latest refresh", () => {
    const dirtyState = updateScenarioExtraHours(
      updateScenarioBudget(createState(), "frontend", 240),
      "REQ-101",
      2,
    );

    const refreshed = applyScenarioRefresh(dirtyState, {
      rootIssueKey: "REQ-200",
      lastSyncedAt: "2026-04-14T15:30:00.000Z",
      baselineBudgets: budgets({ backend: 150, frontend: 125 }),
    });
    const redirtied = updateScenarioExtraHours(
      updateScenarioBudget(refreshed, "backend", 300),
      "REQ-201",
      4,
    );

    expect(resetScenarioState(redirtied)).toEqual({
      rootIssueKey: "REQ-200",
      lastSyncedAt: "2026-04-14T15:30:00.000Z",
      baselineBudgets: budgets({ backend: 150, frontend: 125 }),
      scenarioBudgets: budgets({ backend: 150, frontend: 125 }),
      extraHoursByIssueKey: {},
    });
  });

  it("reports whether budgets or extra hours differ from baseline", () => {
    const initial = createState();
    const withBudgetChange = updateScenarioBudget(initial, "qa", 180);
    const withExtraHours = updateScenarioExtraHours(initial, "REQ-101", 2);

    expect(hasScenarioChanges(initial)).toBe(false);
    expect(hasScenarioChanges(withBudgetChange)).toBe(true);
    expect(hasScenarioChanges(withExtraHours)).toBe(true);
  });

  it("materializes scenario origin metadata with root issue, last sync, budgets, and issue-keyed hours", () => {
    const scenario = updateScenarioExtraHours(
      updateScenarioBudget(createState(), "design", 260),
      "REQ-300",
      6,
    );

    expect(materializeScenarioOrigin(scenario)).toEqual({
      rootIssueKey: "REQ-100",
      lastSyncedAt: "2026-04-14T12:00:00.000Z",
      baselineBudgets: budgets(),
      scenarioBudgets: budgets({ design: 260 }),
      extraHoursByIssueKey: {
        "REQ-300": 6,
      },
    });
  });
});
