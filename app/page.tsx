"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BudgetAllocationForm } from "../src/components/budget-allocation-form";
import { DirectionBreakdown } from "../src/components/direction-breakdown";
import {
  PmDashboardTabs,
  type PmDashboardTabId,
} from "../src/components/pm-dashboard-tabs";
import { RequirementDecisionCard } from "../src/components/requirement-decision-card";
import { RootIssueForm, type RootIssueFormResult } from "../src/components/root-issue-form";
import { ScenarioOriginPanel } from "../src/components/scenario-origin-panel";
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

const WORKSPACE_STORAGE_KEY = "board-ai.requirement-workspace.v1";

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
  const [selectedTab, setSelectedTab] = useState<PmDashboardTabId>("overview");
  const [rootIssueKey, setRootIssueKey] = useState("");
  const [workspaceHydrated, setWorkspaceHydrated] = useState(false);
  const youTrackBaseUrl = process.env.NEXT_PUBLIC_YOUTRACK_BASE_URL ?? null;
  const successfulScope = result?.kind === "success" ? result.scope : null;
  const blockedScope = result?.kind === "blocked" ? result.scope : null;
  const lastSyncedAt = successfulScope?.syncedAt ?? blockedScope?.syncedAt;
  const activeDirectionBudgets = scenarioState?.scenarioBudgets ?? allocateEvenBudgets(0);
  const activeTotalBudget = scenarioState
    ? Object.values(activeDirectionBudgets).reduce((sum, value) => sum + value, 0)
    : null;
  const costResult = successfulScope?.issues
    ? calculateRequirementCost(successfulScope.issues, assigneeDirectory)
    : null;
  const profitability = useMemo(() => {
    if (!costResult) {
      return null;
    }

    return calculateRequirementProfitability(activeTotalBudget, costResult.totalCost);
  }, [activeTotalBudget, costResult]);
  const directionProfitability = costResult
    ? calculateDirectionProfitability(
        activeDirectionBudgets,
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
    if (typeof window === "undefined") {
      return;
    }

    const syncDirectory = () => {
      setAssigneeDirectory(loadAssigneeDirectory());
    };

    window.addEventListener("focus", syncDirectory);
    window.addEventListener("pageshow", syncDirectory);
    window.addEventListener("storage", syncDirectory);

    return () => {
      window.removeEventListener("focus", syncDirectory);
      window.removeEventListener("pageshow", syncDirectory);
      window.removeEventListener("storage", syncDirectory);
    };
  }, []);

  useEffect(() => {
    setAssigneeDirectory(loadAssigneeDirectory());

    if (typeof window === "undefined") {
      setWorkspaceHydrated(true);
      return;
    }

    const rawWorkspace = window.sessionStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!rawWorkspace) {
      setWorkspaceHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(rawWorkspace) as {
        readonly rootIssueKey?: string;
        readonly result?: RootIssueFormResult | null;
        readonly scenarioState?: ScenarioState | null;
        readonly selectedTab?: PmDashboardTabId;
      };

      setRootIssueKey(parsed.rootIssueKey ?? "");
      setResult(parsed.result ?? null);
      setScenarioState(parsed.scenarioState ?? null);
      setSelectedTab(parsed.selectedTab ?? "overview");
    } catch {
      window.sessionStorage.removeItem(WORKSPACE_STORAGE_KEY);
    } finally {
      setWorkspaceHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!workspaceHydrated || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        rootIssueKey,
        result,
        scenarioState,
        selectedTab,
      }),
    );
  }, [result, rootIssueKey, scenarioState, selectedTab, workspaceHydrated]);

  function createBaselineBudgets(): DirectionBudgetMap {
    return scenarioState?.scenarioBudgets ?? scenarioState?.baselineBudgets ?? allocateEvenBudgets(0);
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
      "Обновление снимка удалит все несохраненные сценарные часы и правки бюджета на этом экране. Продолжить?",
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

  const baselineTotalBudget = activeTotalBudget;
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
  const hasTrustworthySnapshot =
    successfulScope !== null && costResult !== null && profitability !== null;
  const dashboardShell =
    hasTrustworthySnapshot && scenarioState ? (
      <PmDashboardTabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        overviewContent={
          <div style={{ display: "grid", gap: "20px" }}>
            <RequirementDecisionCard
              totalHours={{
                current: costResult.totalHours,
                forecast: scenarioForecast?.summary.forecast.cost.totalHours ?? costResult.totalHours,
              }}
              profitability={{
                current: profitability,
                forecast: scenarioForecast?.profitability.forecast ?? profitability,
              }}
              hasScenarioChanges={scenarioDirty}
            />
            <div
              style={{
                display: "grid",
                gap: "20px",
                gridTemplateColumns: "minmax(0, 1.6fr) minmax(300px, 0.9fr)",
                alignItems: "start",
              }}
            >
              <BudgetAllocationForm
                baselineTotalBudget={baselineTotalBudget}
                baselineDirectionBudgets={scenarioState.baselineBudgets}
                scenarioDirectionBudgets={activeDirectionBudgets}
                onChange={handleScenarioBudgetChange}
              />
              <ScenarioOriginPanel origin={scenarioState} hasScenarioChanges={scenarioDirty} />
            </div>
          </div>
        }
        directionsContent={
          <DirectionBreakdown
            directionTotals={{
              current: costResult.directionTotals,
              forecast: scenarioForecast?.directionTotals.forecast ?? costResult.directionTotals,
            }}
            profitability={{
              current: directionProfitability,
              forecast: scenarioForecast?.directionProfitability.forecast ?? directionProfitability,
            }}
            directionDeltas={scenarioForecast?.directionDeltas ?? []}
          />
        }
      />
    ) : null;

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
            Панель проекта
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
            Панель рентабельности требования
          </h1>
          <p style={{ maxWidth: "62ch", fontSize: "1.1rem", lineHeight: 1.6, margin: 0 }}>
            Обнови требование из YouTrack, отдельно веди сценарные изменения и сначала смотри
            итоговое решение по требованию, а уже потом проваливайся в направления.
          </p>
        </header>

        <section
          style={{
            gap: "12px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 0.9fr)",
            alignItems: "start",
          }}
        >
          <div
            style={{
              ...panelStyle,
              padding: "24px",
              display: "grid",
              gap: "12px",
            }}
          >
            <h2 style={{ margin: 0 }}>Поиск корневой задачи</h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Обнови снимок требования из YouTrack и подготовь актуальные данные для расчета ниже.
            </p>
            <RootIssueForm
              rootIssueKey={rootIssueKey}
              onRootIssueKeyChange={setRootIssueKey}
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
            <h2 style={{ margin: 0 }}>Управление справочником</h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Перед анализом затрат проверь роли и ставки сотрудников, а затем переключайся между
              обзором и детализацией по направлениям.
            </p>
            <Link
              href="/assignees"
              style={{ color: "#6f4a16", fontWeight: 700, textDecoration: "none" }}
            >
              Открыть справочник сотрудников
            </Link>
          </div>
        </section>

        {dashboardShell}

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

        {result?.kind === "blocked" ? (
          <ScopeState
            code="SNAPSHOT_BLOCKED"
            issueKey={result.scope.issueKey}
            message="Текущее обновление заблокировано, потому что часть задач, которые считаются по оценке, еще не оценены."
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
            <h2 style={{ margin: 0 }}>Текущее состояние</h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Снимок еще не запрашивался. После успешного обновления здесь появится дерево задач
              и время последней синхронизации.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
