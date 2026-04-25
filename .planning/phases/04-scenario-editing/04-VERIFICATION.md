---
phase: 04-scenario-editing
verified: 2026-04-14T19:37:41Z
status: human_needed
score: 9/9 must-haves verified
human_verification:
  - test: "Task-card scenario editing stays clearly separate from imported facts"
    expected: "Adding hours on one task card shows scenario-only confirmation and cost hint on that card, while baseline YouTrack facts stay unchanged."
    why_human: "The card-level separation and clarity of fact-vs-scenario presentation are visual UX checks."
  - test: "Current and forecast metrics remain easy to compare"
    expected: "After adding scenario hours, summary and direction breakdown show current and forecast values side by side without ambiguity."
    why_human: "Readability and visual emphasis cannot be validated from static code alone."
  - test: "Dirty refresh confirmation matches discard behavior"
    expected: "Refreshing with pending scenario edits prompts once, cancel preserves the scenario, confirm discards it, and the copy accurately describes what will be lost."
    why_human: "Browser confirm flow and user-facing wording require interactive verification."
---

# Phase 4: Scenario Editing Verification Report

**Phase Goal:** Менеджер может редактировать бюджеты и дополнительные часы как отдельный сценарий, не смешивая их с импортированными данными YouTrack.
**Verified:** 2026-04-14T19:37:41Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Canonical YouTrack snapshot inputs remain unchanged while scenario edits are derived separately. | ✓ VERIFIED | Scenario state stores separate `baselineBudgets`, `scenarioBudgets`, and `extraHoursByIssueKey` in [src/lib/scenario/state.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/state.ts:12); forecast augments copied issues instead of mutating canonical inputs in [src/lib/scenario/forecast.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/forecast.ts:97); immutability is asserted in [src/lib/scenario/forecast.test.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/forecast.test.ts:163). |
| 2 | One scenario can hold multiple task-card extra-hour edits keyed by issueKey. | ✓ VERIFIED | `updateScenarioExtraHours` writes issue-keyed edits in [src/lib/scenario/state.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/state.ts:50); `ScopeTree` commits by `issue.key` in [src/components/scope-tree.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/scope-tree.tsx:138); multi-issue rollup is covered in [src/lib/scenario/forecast.test.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/forecast.test.ts:109). |
| 3 | The current calculation context can explain root issue, last sync, baseline budgets, scenario budgets, and extra hours without persistence. | ✓ VERIFIED | The provenance shape is defined in [src/lib/scenario/types.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/types.ts:18), materialized in [src/lib/scenario/state.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/state.ts:92), and rendered in [src/components/scenario-origin-panel.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/scenario-origin-panel.tsx:64). |
| 4 | The page owns a local scenario overlay that is recreated from the latest snapshot context and disappears on page reload. | ✓ VERIFIED | `app/page.tsx` holds `scenarioState` in React state and rebuilds it inside `handleResolved` after scope refreshes in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:38) and [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:102). No persistence API or browser storage is used in the scenario layer. |
| 5 | Refreshing YouTrack with dirty scenario edits requires explicit confirmation before those edits are discarded. | ✓ VERIFIED | `hasScenarioChanges` detects dirty budgets or extra hours in [src/lib/scenario/state.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/state.ts:80); `handleBeforeRefresh` gates refresh with `window.confirm` in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:123); `RootIssueForm` calls the guard before `fetch("/api/scope")` in [src/components/root-issue-form.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/root-issue-form.tsx:80). |
| 6 | Task cards accept extra hours keyed by issueKey, and direction-budget edits remain separate from the baseline budget snapshot. | ✓ VERIFIED | Budget editor shows baseline vs scenario values in [src/components/budget-allocation-form.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/budget-allocation-form.tsx:106); task cards expose `Extra hours`, `Apply extra hours`, and `Clear scenario` actions in [src/components/scope-tree.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/scope-tree.tsx:121). |
| 7 | When a scenario exists, the user can see current and forecast cost/profitability at the same time. | ✓ VERIFIED | `app/page.tsx` feeds both current and forecast values into `CostSummary` in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:283); `CostSummary` renders labeled `Current` and `Forecast` groups in [src/components/cost-summary.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/cost-summary.tsx:63). |
| 8 | Direction rows show actual hours, extra hours, forecast cost, and forecast profitability without hiding unchanged directions. | ✓ VERIFIED | `DirectionBreakdown` iterates over `directionTotals.current` so unchanged directions still render, and shows `Actual hours`, `Extra hours`, `Forecast cost`, and `Forecast profitability` in [src/components/direction-breakdown.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/direction-breakdown.tsx:49). |
| 9 | The current screen explains calculation provenance while keeping blocked snapshots from showing misleading scenario totals. | ✓ VERIFIED | Provenance is rendered only when `hasTrustworthySnapshot` is true in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:180) and [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:283); blocked snapshots show `ScopeState` messaging that suppresses scenario totals in [src/components/scope-state.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/scope-state.tsx:41). |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/lib/scenario/types.ts` | Overlay contracts for baseline/scenario budgets, extra hours, provenance, and comparisons | ✓ VERIFIED | Exists and is substantive; used by state, forecast, and UI components. |
| `src/lib/scenario/state.ts` | Pure scenario overlay lifecycle helpers | ✓ VERIFIED | Exists, substantive, and imported by [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:22). |
| `src/lib/scenario/forecast.ts` | Pure forecast cost/profitability pass | ✓ VERIFIED | Exists, substantive, and imported by [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:21). |
| `src/lib/scenario/state.test.ts` | Regression coverage for overlay separation and provenance | ✓ VERIFIED | Exists and passed `npx vitest run src/lib/scenario/state.test.ts src/lib/scenario/forecast.test.ts`. |
| `src/lib/scenario/forecast.test.ts` | Regression coverage for reforecast math and immutability | ✓ VERIFIED | Exists and passed targeted vitest run. |
| `app/page.tsx` | Page-level scenario orchestration and composition | ✓ VERIFIED | Wires refresh results, overlay state, forecast derivation, and gated rendering. |
| `src/components/root-issue-form.tsx` | Refresh confirmation gate before scope POST | ✓ VERIFIED | `onBeforeSubmit` runs before `fetch("/api/scope")`. |
| `src/components/budget-allocation-form.tsx` | Baseline-vs-scenario budget editor | ✓ VERIFIED | Shows both budget sets and emits scenario-only changes. |
| `src/components/scope-tree.tsx` | Issue-keyed extra-hours controls in task cards | ✓ VERIFIED | Page-owned handlers are invoked per issue key. |
| `src/components/cost-summary.tsx` | Side-by-side current/forecast top-level metrics | ✓ VERIFIED | Labels and displays current and forecast summary values. |
| `src/components/direction-breakdown.tsx` | Per-direction current/forecast output | ✓ VERIFIED | Keeps all current direction rows visible and overlays forecast deltas. |
| `src/components/scenario-origin-panel.tsx` | In-memory provenance output | ✓ VERIFIED | Renders root issue, last sync, budgets, and issue-keyed extra hours. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/lib/scenario/forecast.ts` | `src/lib/costing/calculateRequirementCost.ts` | Reuses canonical assignee pricing rules for extra hours | ✓ WIRED | `gsd-tools verify key-links` passed; forecast calls `calculateRequirementCost(...)` in [src/lib/scenario/forecast.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/forecast.ts:102). |
| `src/lib/scenario/state.ts` | `src/lib/costing/types.ts` | Stores baseline and scenario direction budgets separately | ✓ WIRED | `DirectionBudgetMap` is imported and used in [src/lib/scenario/state.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/state.ts:1). |
| `src/lib/scenario/state.ts` | `src/lib/ingestion/types.ts` | Keys extra hours by issueKey without mutating snapshot issues | ✓ WIRED | Scenario contracts rely on issue-keyed overlays; immutability is asserted by tests. |
| `app/page.tsx` | `src/lib/scenario/state.ts` | Initializes and updates overlay state from refreshes and edits | ✓ WIRED | `createScenarioState`, `hasScenarioChanges`, `updateScenarioBudget`, and `updateScenarioExtraHours` are imported and used in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:21). |
| `src/components/root-issue-form.tsx` | `app/page.tsx` | Calls a refresh guard before POST `/api/scope` | ✓ WIRED | `onBeforeSubmit` blocks submission in [src/components/root-issue-form.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/root-issue-form.tsx:80) and is passed from [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:235). |
| `src/components/scope-tree.tsx` | `app/page.tsx` | Commits per-issue extra-hour edits into page-level scenario state | ✓ WIRED | Buttons call issue-keyed handlers in [src/components/scope-tree.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/scope-tree.tsx:138), provided by [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:270). |
| `app/page.tsx` | `src/lib/scenario/forecast.ts` | Feeds factual and forecast outputs into presentation components | ✓ WIRED | `calculateScenarioForecast` result is passed into summary and breakdown components in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:285). |
| `src/components/scenario-origin-panel.tsx` | `src/lib/scenario/state.ts` | Displays in-memory provenance metadata only | ✓ WIRED | Origin shape matches `materializeScenarioOrigin` output; panel consumes the same fields in [src/components/scenario-origin-panel.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/scenario-origin-panel.tsx:64). |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `app/page.tsx` | `scenarioState` | Initialized from refresh context via `createScenarioState(...)` and mutated by budget/task handlers | Yes | ✓ FLOWING |
| `app/page.tsx` | `scenarioForecast` | Derived from canonical `successfulScope.issues`, assignee directory, current cost/profitability, and `scenarioState` in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:70) | Yes | ✓ FLOWING |
| `src/components/scope-tree.tsx` | `scenarioIssueStateByIssueKey` | Populated from `scenarioForecast.scenarioLedger` in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:170) | Yes | ✓ FLOWING |
| `src/components/cost-summary.tsx` | `totalHours`, `totalCost`, `profitability` | Passed from `costResult` and `scenarioForecast` in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:285) | Yes | ✓ FLOWING |
| `src/components/direction-breakdown.tsx` | `directionTotals`, `profitability`, `directionDeltas` | Passed from `costResult`, `scenarioForecast`, and current profitability arrays in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:301) | Yes | ✓ FLOWING |
| `src/components/scenario-origin-panel.tsx` | `origin` | Directly receives the page-owned scenario overlay with root issue, sync time, budgets, and issue hours in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:300) | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Pure scenario overlay and forecast math regressions | `npx vitest run src/lib/scenario/state.test.ts src/lib/scenario/forecast.test.ts` | 10 tests passed | ✓ PASS |
| Full project regression suite | `npm test` | 48 tests passed across scenario, costing, ingestion, scope, and YouTrack modules | ✓ PASS |
| Production build and type validation | `npm run build` | Next.js build completed successfully; `/` prerendered and `/api/scope` compiled | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `BUDG-01` | `04-02-PLAN.md` | User can manually set budget per direction before scenario recalculation | ✓ SATISFIED | Budget form allows total budget and per-direction edits via [src/components/budget-allocation-form.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/budget-allocation-form.tsx:145) and [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:133). |
| `BUDG-02` | `04-02-PLAN.md`, `04-03-PLAN.md` | User can adjust direction budgets and immediately get updated calculation | ✓ SATISFIED | Budget edits update `scenarioState`, which re-drives `scenarioForecast` and rendered summary/breakdown through React state in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:133) and [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:285). |
| `BUDG-03` | `04-01-PLAN.md`, `04-02-PLAN.md` | Baseline budget is preserved separately from scenario changes | ✓ SATISFIED | Separate baseline/scenario budgets are stored in [src/lib/scenario/state.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/state.ts:18) and displayed side by side in [src/components/budget-allocation-form.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/budget-allocation-form.tsx:106). |
| `REFO-01` | `04-02-PLAN.md` | User can enter extra hours for the selected direction/task | ✓ SATISFIED | Task-card `Extra hours` controls commit issue-keyed edits in [src/components/scope-tree.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/scope-tree.tsx:121). |
| `REFO-02` | `04-01-PLAN.md`, `04-03-PLAN.md` | Forecast cost/profitability recalculate without changing factual labor | ✓ SATISFIED | Forecast augments copied issue minutes and recalculates cost/profitability in [src/lib/scenario/forecast.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/forecast.ts:97); immutability is covered in [src/lib/scenario/forecast.test.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/forecast.test.ts:163). |
| `REFO-03` | `04-03-PLAN.md` | System shows current and forecast profitability together | ✓ SATISFIED | `CostSummary` renders side-by-side current and forecast groups in [src/components/cost-summary.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/cost-summary.tsx:63). |
| `REFO-04` | `04-01-PLAN.md`, `04-02-PLAN.md` | One scenario can include extra hours for multiple directions | ✓ SATISFIED | Extra hours are stored by issue key in [src/lib/scenario/state.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/state.ts:50), aggregated across directions in [src/lib/scenario/forecast.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/forecast.ts:69), and covered in [src/lib/scenario/forecast.test.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/forecast.test.ts:109). |
| `AUDT-01` | All three phase plans | Imported YouTrack data and scenario edits stay explainably separate | ✓ SATISFIED | Canonical issues feed current metrics; forecast uses overlay-only deltas; provenance text explicitly states `Actual from YouTrack. Forecast from scenario edits on this screen only.` in [src/components/scenario-origin-panel.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/scenario-origin-panel.tsx:83). |
| `AUDT-02` | All three phase plans | Root issue, sync time, budgets, and extra hours are stored as calculation metadata | ✓ SATISFIED | Those fields are defined in [src/lib/scenario/types.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/types.ts:18) and rendered in [src/components/scenario-origin-panel.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/scenario-origin-panel.tsx:97). |

No orphaned Phase 4 requirement IDs were found: all requested IDs appear in plan frontmatter and in `.planning/REQUIREMENTS.md`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `app/page.tsx` | 128 | Refresh confirm copy mentions only “scenario hours” even though `hasScenarioChanges` also treats budget edits as dirty via [src/lib/scenario/state.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/state.ts:80) | ⚠️ Warning | Refresh discard protection exists, but the dialog may under-describe what will be lost if the user changed scenario budgets only. |
| `app/page.tsx` | 211 | Header still says `Phase 3 cost engine` | ℹ️ Info | Stale copy does not break scenario behavior, but it mislabels the current workspace state. |

### Human Verification Required

### 1. Task-Card Scenario Separation

**Test:** Load a successful requirement snapshot, add extra hours on one task card, and inspect that card plus the unchanged tree.
**Expected:** The edited card shows a scenario-only confirmation and added-cost hint, while the underlying actual snapshot presentation stays unchanged.
**Why human:** Visual separation of actual vs forecast is a UI judgment call.

### 2. Side-by-Side Metric Readability

**Test:** Add scenario hours and compare the summary and direction breakdown blocks.
**Expected:** `Current` and `Forecast` remain simultaneously visible and easy to compare without the forecast being mistaken for actual data.
**Why human:** Readability, emphasis, and scanability need browser inspection.

### 3. Dirty Refresh Confirm Flow

**Test:** Create scenario edits, click `Refresh snapshot`, cancel once, then confirm on the next attempt.
**Expected:** Cancel keeps current scenario state intact; confirm rebuilds the overlay from the refreshed scope context and discards the previous scenario.
**Why human:** Browser confirm behavior and wording cannot be fully verified by static inspection.

### Gaps Summary

Automated verification did not find blocker gaps against the Phase 4 goal. The phase contract is implemented in code, key links are wired, data flows from the canonical snapshot into a separate scenario overlay, and both targeted and full regression suites pass. Remaining work is human verification of UI clarity and confirm-flow wording.

---

_Verified: 2026-04-14T19:37:41Z_  
_Verifier: Claude (gsd-verifier)_
