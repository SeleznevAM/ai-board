"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BudgetAllocationForm } from "../src/components/budget-allocation-form";
import { CostSummary } from "../src/components/cost-summary";
import { DirectionBreakdown } from "../src/components/direction-breakdown";
import { RootIssueForm, type RootIssueFormResult } from "../src/components/root-issue-form";
import { ScopeState } from "../src/components/scope-state";
import { ScopeTree } from "../src/components/scope-tree";
import { allocateEvenBudgets } from "../src/lib/costing/budgetAllocation";
import { calculateRequirementCost } from "../src/lib/costing/calculateRequirementCost";
import {
  calculateDirectionProfitability,
  calculateRequirementProfitability,
} from "../src/lib/costing/calculateProfitability";
import { loadAssigneeDirectory } from "../src/lib/costing/storage";
import type { AssigneeDirectoryEntry, DirectionBudgetMap } from "../src/lib/costing/types";
import { calculateScenarioForecast } from "../src/lib/scenario/forecast";
import {
  createScenarioState,
  hasScenarioChanges,
  updateScenarioExtraHours,
  updateScenarioBudget,
} from "../src/lib/scenario/state";
import type { ScenarioState } from "../src/lib/scenario/types";

const panelStyle = {
  borderRadius: "24px",
  border: "1px solid rgba(75, 49, 11, 0.18)",
  background: "rgba(255, 250, 242, 0.78)",
  boxShadow: "0 24px 60px rgba(62, 42, 12, 0.12)",
} as const;

export default function HomePage() {
  const [result, setResult] = useState<RootIssueFormResult | null>(null);
  const [assigneeDirectory, setAssigneeDirectory] = useState<AssigneeDirectoryEntry[]>([]);
  const [scenarioState, setScenarioState] = useState<ScenarioState | null>(null);
  const youTrackBaseUrl = process.env.NEXT_PUBLIC_YOUTRACK_BASE_URL ?? null;
  const successfulScope = result?.kind === "success" ? result.scope : null;
  const blockedScope = result?.kind === "blocked" ? result.scope : null;
  const lastSyncedAt = successfulScope?.syncedAt ?? blockedScope?.syncedAt;
  const costResult = successfulScope?.issues
    ? calculateRequirementCost(successfulScope.issues, assigneeDirectory)
    : null;
  const profitability = useMemo(() => {
    if (!costResult) {
      return null;
    }

    const totalBudget = scenarioState
      ? Object.values(scenarioState.baselineBudgets).reduce((sum, value) => sum + value, 0)
      : null;

    return calculateRequirementProfitability(totalBudget, costResult.totalCost);
  }, [costResult, scenarioState]);
  const directionProfitability = costResult
    ? calculateDirectionProfitability(
        scenarioState?.baselineBudgets ?? allocateEvenBudgets(0),
        costResult.directionTotals,
      )
    : [];
  const missingAssigneeIssueKeys =
    costResult?.ledger
      .filter((row) => row.warning === "MISSING_ASSIGNEE")
      .map((row) => row.issueKey) ?? [];
  const scenarioDirty = scenarioState ? hasScenarioChanges(scenarioState) : false;
  const scenarioForecast = useMemo(() => {
    if (!successfulScope?.issues || !costResult || !profitability || !scenarioState) {
      return null;
    }

    return calculateScenarioForecast({
      issues: successfulScope.issues,
      directoryEntries: assigneeDirectory,
      current: {
        cost: costResult,
        profitability,
        directionProfitability,
      },
      scenario: scenarioState,
    });
  }, [
    assigneeDirectory,
    costResult,
    directionProfitability,
    profitability,
    scenarioState,
    successfulScope?.issues,
  ]);

  useEffect(() => {
    setAssigneeDirectory(loadAssigneeDirectory());
  }, []);

  function createBaselineBudgets(): DirectionBudgetMap {
    return scenarioState?.baselineBudgets ?? allocateEvenBudgets(0);
  }

  function handleResolved(nextResult: RootIssueFormResult) {
    setResult(nextResult);

    if (nextResult.kind === "success" || nextResult.kind === "blocked") {
      const baselineBudgets = createBaselineBudgets();
      const rootIssueKey =
        nextResult.kind === "success" ? nextResult.scope.root.issue.key : nextResult.scope.issueKey;

      setScenarioState(
        createScenarioState({
          rootIssueKey,
          lastSyncedAt: nextResult.scope.syncedAt ?? null,
          baselineBudgets,
        }),
      );
      return;
    }

    setScenarioState(null);
  }

  function handleBeforeRefresh() {
    if (!scenarioDirty) {
      return true;
    }

    return window.confirm(
      "Refresh snapshot: Refreshing from YouTrack will discard all unsaved scenario hours on this screen. Continue?",
    );
  }

  function handleScenarioBudgetChange(nextState: { directionBudgets: DirectionBudgetMap }) {
    setScenarioState((current) => {
      if (!current) {
        return current;
      }

      return (Object.keys(nextState.directionBudgets) as (keyof DirectionBudgetMap)[]).reduce(
        (state, role) => updateScenarioBudget(state, role, nextState.directionBudgets[role]),
        current,
      );
    });
  }

  function handleApplyScenarioExtraHours(issueKey: string, hours: number) {
    setScenarioState((current) => {
      if (!current) {
        return current;
      }

      return updateScenarioExtraHours(current, issueKey, hours);
    });
  }

  function handleClearScenarioExtraHours(issueKey: string) {
    setScenarioState((current) => {
      if (!current) {
        return current;
      }

      return updateScenarioExtraHours(current, issueKey, 0);
    });
  }

  const baselineTotalBudget = scenarioState
    ? Object.values(scenarioState.baselineBudgets).reduce((sum, value) => sum + value, 0)
    : null;
  const activeDirectionBudgets = scenarioState?.scenarioBudgets ?? allocateEvenBudgets(0);
  const scenarioIssueStateByIssueKey = Object.fromEntries(
    (scenarioForecast?.scenarioLedger ?? []).map((row) => [
      row.issueKey,
      {
        extraHours: row.addedHours,
        assigneeLabel: row.assigneeLabel,
        addedCost: row.addedCost,
      },
    ]),
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "48px 20px",
      }}
    >
      <section
        style={{
          ...panelStyle,
          width: "min(980px, 100%)",
          padding: "40px",
          display: "grid",
          gap: "28px",
        }}
      >
        <header style={{ display: "grid", gap: "14px" }}>
          <p
            style={{
              margin: 0,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              color: "#7a5a22",
            }}
          >
            Phase 3 cost engine
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
            Requirement profitability workspace
          </h1>
          <p style={{ maxWidth: "62ch", fontSize: "1.1rem", lineHeight: 1.6, margin: 0 }}>
            Refresh one requirement from YouTrack, map assignees to roles and rates,
            then see hours, cost, budgets, and profitability in one place.
          </p>
        </header>

        <div
          style={{
            ...panelStyle,
            padding: "24px",
            display: "grid",
            gap: "12px",
          }}
        >
          <h2 style={{ margin: 0 }}>Root issue lookup</h2>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Refresh the full requirement snapshot from YouTrack and confirm whether the
            current tree is trustworthy for downstream calculations.
          </p>
          <RootIssueForm
            onResolved={handleResolved}
            lastSyncedAt={lastSyncedAt}
            onBeforeSubmit={handleBeforeRefresh}
          />
        </div>

        <div
          style={{
            ...panelStyle,
            padding: "24px",
            display: "grid",
            gap: "12px",
          }}
        >
          <h2 style={{ margin: 0 }}>Assignee directory</h2>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Maintain the assignee to role and rate mapping before trusting direction costs.
          </p>
          <Link href="/assignees" style={{ color: "#6f4a16", fontWeight: 700, textDecoration: "none" }}>
            Open assignee directory
          </Link>
        </div>

        {successfulScope ? (
          <BudgetAllocationForm
            baselineTotalBudget={baselineTotalBudget}
            baselineDirectionBudgets={scenarioState?.baselineBudgets ?? allocateEvenBudgets(0)}
            scenarioDirectionBudgets={activeDirectionBudgets}
            onChange={handleScenarioBudgetChange}
          />
        ) : null}

        {(successfulScope || blockedScope) ? (
          <div style={{ ...panelStyle, padding: "24px" }}>
            <ScopeTree
              root={(successfulScope ?? blockedScope)!.root}
              blockedIssueKeys={blockedScope?.blockedIssues?.map((issue) => issue.issueKey) ?? []}
              missingAssigneeIssueKeys={missingAssigneeIssueKeys}
              youTrackBaseUrl={youTrackBaseUrl ?? undefined}
              scenarioExtraHoursByIssueKey={scenarioState?.extraHoursByIssueKey}
              scenarioIssueStateByIssueKey={scenarioIssueStateByIssueKey}
              onApplyScenarioExtraHours={successfulScope ? handleApplyScenarioExtraHours : undefined}
              onClearScenarioExtraHours={successfulScope ? handleClearScenarioExtraHours : undefined}
            />
          </div>
        ) : null}

        {costResult && profitability ? (
          <>
            <CostSummary
              totalHours={{
                current: costResult.totalHours,
                forecast: scenarioForecast?.summary.forecast.cost.totalHours ?? costResult.totalHours,
              }}
              totalCost={{
                current: costResult.totalCost,
                forecast: scenarioForecast?.totalCost.forecast ?? costResult.totalCost,
              }}
              profitability={{
                current: profitability,
                forecast: scenarioForecast?.profitability.forecast ?? profitability,
              }}
              hasScenarioChanges={scenarioDirty}
            />
            <DirectionBreakdown
              directionTotals={{
                current: costResult.directionTotals,
                forecast: scenarioForecast?.directionTotals.forecast ?? costResult.directionTotals,
              }}
              profitability={{
                current: directionProfitability,
                forecast:
                  scenarioForecast?.directionProfitability.forecast ?? directionProfitability,
              }}
              directionDeltas={scenarioForecast?.directionDeltas ?? []}
            />
          </>
        ) : null}

        {result?.kind === "blocked" ? (
          <ScopeState
            code="SNAPSHOT_BLOCKED"
            issueKey={result.scope.issueKey}
            message="The current refresh is blocked because some issues that depend on estimate values are not estimated yet."
            blockedIssueKeys={result.scope.blockedIssues?.map((issue) => issue.issueKey) ?? []}
            dismissible
          />
        ) : null}

        {result?.kind === "error" ? (
          <ScopeState
            code={result.code}
            issueKey={result.issueKey}
            message={result.message}
          />
        ) : result === null ? (
          <div
            style={{
              ...panelStyle,
              padding: "24px",
              display: "grid",
              gap: "10px",
            }}
          >
            <h2 style={{ margin: 0 }}>Current state</h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              No refresh has been requested yet. A successful refresh will render the
              current tree here together with the latest sync time.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
