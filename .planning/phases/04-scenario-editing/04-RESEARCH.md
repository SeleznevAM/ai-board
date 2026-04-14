# Phase 04: Scenario Editing - Research

**Researched:** 2026-04-14
**Domain:** Ephemeral scenario editing over a canonical YouTrack profitability snapshot
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Scenario baseline
- **D-01:** Базой расчета остается исходный бюджет требования.
- **D-02:** Phase 4 не вводит произвольное редактирование бюджетов как отдельный постоянный сценарий; основная цель фазы — понять, сколько дополнительных часов и денег нужно согласовать с заказчиком.

### Additional hours workflow
- **D-03:** Дополнительные часы добавляются прямо на карточке конкретной задачи в дереве требования.
- **D-04:** Сценарные дополнительные часы должны учитываться только в прогнозной затратной части и не изменять фактические трудозатраты snapshot из YouTrack.
- **D-05:** Стоимость дополнительных часов считается по исполнителю, уже назначенному на задаче.

### Scenario output
- **D-06:** После добавления дополнительных часов экран должен одновременно показывать текущую рентабельность и прогнозную рентабельность.
- **D-07:** После добавления дополнительных часов экран должен одновременно показывать текущие затраты и прогнозные затраты.
- **D-08:** После добавления дополнительных часов система должна показывать сумму, которую нужно согласовать, чтобы выйти на целевые `20%`.

### Scenario lifecycle
- **D-09:** Сценарий живет только на текущем экране и не сохраняется после перезагрузки страницы.
- **D-10:** Если пользователь запрашивает новый refresh из YouTrack при наличии сценарных часов, система должна сначала спросить подтверждение перед их сбросом.

### Explainability
- **D-11:** Для контекста расчета достаточно показывать только `root issue`.
- **D-12:** Для контекста расчета достаточно показывать время последнего refresh из YouTrack.

### Claude's Discretion
- Конкретная форма ввода дополнительных часов на карточке задачи, если она остается быстрой и однозначной для PM.
- Визуальное расположение текущих и прогнозных метрик на экране, если они остаются видны одновременно и не смешивают факт со сценарием.
- Формулировка confirm-диалога перед refresh при наличии сценарных часов.

### Deferred Ideas (OUT OF SCOPE)
- Долговременное сохранение сценариев и повторное открытие позже — отдельная future capability, вне границ Phase 4.
- История изменений сценария и полный audit trail ручных правок — отложено за пределы v1.
- Пересчет дополнительных часов по направлениям без привязки к задаче — не выбран, потому что пользователь предпочел task-level flow.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUDG-01 | Пользователь может вручную задать бюджет по каждому направлению перед расчетом. | Keep baseline direction budgets plus editable scenario direction budgets in page state. |
| BUDG-02 | Пользователь может в любой момент скорректировать бюджет по каждому направлению и сразу получить обновленный расчет. | Drive all displayed profitability from derived selectors over `scenarioBudgetState`. |
| BUDG-03 | Система сохраняет исходный согласованный бюджет отдельно от пользовательских изменений сценария пересчета. | Materialize `baselineBudgets` once per refresh and never mutate them. |
| REFO-01 | Пользователь может указать дополнительные часы по выбранному направлению для запроса на увеличение оценки. | Attach extra hours to task cards, then derive direction totals from the task assignee pricing. |
| REFO-02 | Система пересчитывает прогнозные затраты и прогнозную рентабельность с учетом дополнительных часов без изменения фактических трудозатрат. | Use a second pure forecast pass that leaves canonical snapshot hours untouched. |
| REFO-03 | Система показывает одновременно текущую фактическую рентабельность и новую прогнозную рентабельность после добавления дополнительных часов. | Render factual and forecast metrics side by side from baseline and scenario results. |
| REFO-04 | Система позволяет в одном сценарии добавить дополнительные часы по нескольким направлениям. | Store extra hours by issue key; multiple issues naturally roll up into multiple directions. |
| AUDT-01 | Система разделяет импортированные данные YouTrack и пользовательские сценарные изменения так, чтобы можно было объяснить происхождение расчета. | Keep `result.scope` canonical and isolate scenario overlay in a separate model with explicit provenance fields. |
| AUDT-02 | Система хранит метаданные расчета: какой root issue был рассчитан, когда были обновлены данные YouTrack и какие бюджеты/дополнительные часы использовались. | Build an in-memory `scenarioOrigin` object and surface it in the current page only. |
</phase_requirements>

## Summary

Phase 4 should stay entirely inside the existing `app/page.tsx` workspace. The right model is a canonical snapshot plus an ephemeral scenario overlay: the YouTrack snapshot and factual cost result remain immutable inputs, while budgets and extra hours are edited in a separate page-level scenario object that is discarded on page reload or confirmed refresh.

The cleanest implementation is to keep all scenario logic in pure helpers under `src/lib/scenario/` and let the page compose two views of the same requirement: factual and forecast. Extra hours must be keyed by issue, not by direction, because pricing comes from the task's already assigned performer and multi-direction scenarios emerge by editing multiple task cards. The UI should reuse the existing scope tree cards by adding a small per-task extra-hours editor and a visible provenance summary near the main metrics.

**Primary recommendation:** Use one page-level ephemeral `scenarioState` object plus pure forecast calculators; never persist it, never mutate `result.scope`, and gate explicit snapshot refresh with a confirm step when the scenario is dirty.

## Project Constraints (from local project instructions)

- `AGENTS.md` not present in repo root.
- `CLAUDE.md` not present in repo root.
- `.claude/skills/` and `.agents/skills/` are not present.
- `.planning/config.json` sets `workflow.nyquist_validation` to `true`, so validation architecture is required.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.14 | App Router page and API route surface | Already powers the workspace; no new framework boundary is needed. |
| React | 19.0.0 | Client-side ephemeral scenario state and recalculation UI | Current page is already a client component and Phase 4 is page-local state. |
| TypeScript | 5.9.2 | Strongly typed canonical vs scenario domain models | Prevents accidental mixing of imported facts and manual overlays. |
| Vitest | 3.2.4 | Fast pure-logic verification for forecast helpers | Existing tests already focus on deterministic library code. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing `src/lib/costing/*` helpers | repo-local | Budget allocation, factual cost, profitability math | Reuse for baseline math and shared rounding/target-margin rules. |
| Browser `window.confirm` | platform API | Confirm destructive refresh when scenario is dirty | Use only for explicit snapshot refresh reset, not page unload persistence. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Page-level ephemeral `useState` object | `localStorage` / `sessionStorage` | Violates D-09 and weakens the “current screen only” boundary. |
| Explicit refresh confirmation | `beforeunload` prompt | Wrong scope; requirement is about refreshing YouTrack data, not generic page exits. |
| Issue-keyed scenario hours | Direction-only hour inputs | Loses task provenance and cannot price by the assigned performer correctly. |

**Installation:** None. Phase 4 should use the existing project stack.

**Version verification:** Versions above are verified from `package.json` and local tool output (`node v24.14.1`, `npm 11.11.0`, `vitest 3.2.4`). Registry-current package verification was not possible in this offline environment, so stack-version confidence is based on the checked-in repo state.

## Architecture Patterns

### Recommended Project Structure

```text
app/
├── page.tsx                     # owns canonical snapshot + page-local scenario overlay
src/
├── components/
│   ├── scope-tree.tsx           # extend cards with extra-hours controls and provenance hints
│   ├── cost-summary.tsx         # render factual vs forecast totals side by side
│   └── direction-breakdown.tsx  # show current + scenario values per direction
├── lib/
│   ├── costing/                 # factual cost + profitability primitives stay here
│   └── scenario/
│       ├── types.ts             # scenario overlay model and metadata
│       ├── forecast.ts          # pure forecast cost/profitability derivation
│       └── state.ts             # pure helpers for dirty-check/reset/update
```

### Pattern 1: Canonical Snapshot + Scenario Overlay
**What:** Keep imported scope data and factual cost inputs immutable; store only user edits in a separate overlay.
**When to use:** Always for Phase 4. This is the core audit boundary.
**Example:**

```ts
type ScenarioHoursMap = Record<string, number>;

type ScenarioState = {
  readonly baselineBudgets: DirectionBudgetMap;
  readonly scenarioBudgets: DirectionBudgetMap;
  readonly extraHoursByIssueKey: ScenarioHoursMap;
};

type ScenarioOrigin = {
  readonly rootIssueKey: string;
  readonly lastSyncedAt: string | null;
  readonly baselineBudgets: DirectionBudgetMap;
  readonly scenarioBudgets: DirectionBudgetMap;
  readonly extraHoursByIssueKey: ScenarioHoursMap;
};
```

**Use:** `result.scope` remains the source of truth; `ScenarioState` is reset only when a new refresh is confirmed.

### Pattern 2: Forecast As Second Pure Calculation Pass
**What:** Recompute forecast totals from canonical issues plus extra minutes, without rewriting snapshot minutes.
**When to use:** For every scenario edit and every budget edit.
**Example:**

```ts
type ForecastInput = {
  readonly issues: readonly SnapshotIssueNode[];
  readonly directory: readonly AssigneeDirectoryEntry[];
  readonly scenarioBudgets: DirectionBudgetMap;
  readonly extraHoursByIssueKey: Record<string, number>;
};

type ForecastResult = {
  readonly forecastCost: RequirementCostResult;
  readonly forecastProfitability: RequirementProfitability;
  readonly forecastDirectionProfitability: DirectionProfitability[];
  readonly scenarioRows: readonly {
    issueKey: string;
    addedHours: number;
    role: CostDirectionKey;
    hourlyRate: number | null;
    addedCost: number | null;
  }[];
};
```

**Use:** derive factual results with current helpers first, then derive forecast results with the overlay. Do not “patch” factual totals in JSX.

### Pattern 3: Dirty Refresh Guard At Submit Boundary
**What:** The component that triggers `/api/scope` should ask permission before discarding a dirty scenario.
**When to use:** Only when the user clicks refresh and the overlay contains changes.
**Example:**

```ts
type RootIssueFormProps = {
  readonly onResolved: (result: RootIssueFormResult) => void;
  readonly lastSyncedAt?: string;
  readonly beforeRefresh?: (rootIssueKey: string) => boolean;
};

if (beforeRefresh && !beforeRefresh(normalizedRootIssue)) {
  return;
}
```

**Use:** implement `beforeRefresh` in `app/page.tsx`, check `isScenarioDirty`, call `window.confirm(...)`, reset overlay only after the user confirms.

### Pattern 4: Minimal In-Memory Audit Boundary
**What:** Track enough metadata to explain the current numbers without creating persistence or history.
**When to use:** For Phase 4 UI output and test assertions.
**Minimal metadata to keep:**
- `rootIssueKey`
- `lastSyncedAt`
- `baselineBudgets`
- `scenarioBudgets`
- `extraHoursByIssueKey`
- Derived per-edit pricing rows: `issueKey`, `assigneeLabel`, `role`, `hourlyRate`, `addedHours`, `addedCost`

### Anti-Patterns to Avoid
- **Mutating snapshot data:** never write extra hours into `SnapshotIssueNode.normalizedMinutes`.
- **Per-card local state as source of truth:** cards may have draft inputs, but committed scenario values must live in one page-level object.
- **Using browser persistence for scenarios:** `localStorage` is acceptable for the assignee directory in Phase 3, but wrong for this phase.
- **Aggregating by direction first:** compute from issue edits, then roll up to directions.
- **Implicit refresh reset:** never clear scenario edits just because the user clicked refresh.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scenario persistence | Ad hoc `localStorage`/API save flow | No persistence in Phase 4 | Requirement explicitly limits scenario lifetime to the current page. |
| Forecast math in components | JSX-time manual additions to totals | Pure helpers in `src/lib/scenario/` | Keeps recalculation deterministic and testable. |
| Separate duplicate tree for scenario mode | A second scenario-only hierarchy UI | Extend existing `ScopeTree` cards | Existing tree already provides the right task-level affordance and provenance context. |
| Custom modal framework | New dialog system | `window.confirm` for refresh discard only | Minimal destructive confirmation is enough for this phase. |
| Re-implementing budget math | New total/direction sync rules | Existing `budgetAllocation` helpers | Phase 3 already defines equal split and override semantics. |

**Key insight:** The complexity in Phase 4 is not storage or UI chrome. It is preserving a strict boundary between canonical facts and a temporary what-if overlay while keeping the math explainable.

## Common Pitfalls

### Pitfall 1: Losing the Budget Baseline
**What goes wrong:** User edits overwrite the only copy of direction budgets.
**Why it happens:** Phase 3 currently has a single mutable `budgetState`.
**How to avoid:** Snapshot `baselineBudgets` when a successful refresh becomes active, then edit `scenarioBudgets` separately.
**Warning signs:** No way to show “agreed budget” versus “scenario budget” in the current view.

### Pitfall 2: Mixing Scenario Hours Into Imported Facts
**What goes wrong:** Forecast numbers become impossible to explain and refresh reset gets ambiguous.
**Why it happens:** Extra hours are merged into `issues` or reused as if they came from YouTrack.
**How to avoid:** Keep extra hours in `extraHoursByIssueKey` only; forecast helpers consume both datasets.
**Warning signs:** Tests need to inspect mutated snapshot hours to assert scenario behavior.

### Pitfall 3: Pricing Extra Hours At Direction Level
**What goes wrong:** Added hours get the wrong rate or unmapped behavior.
**Why it happens:** The plan treats REFO-01 as direction-entry first instead of task-entry first.
**How to avoid:** Store edits by issue key, resolve pricing from the issue assignee using the same logic as factual costing.
**Warning signs:** Forecast helper has no access to issue assignee data.

### Pitfall 4: Over-Expanding Auditability
**What goes wrong:** Phase 4 drifts into persistence/history work that belongs to Phase 5+.
**Why it happens:** AUDT requirements are interpreted as durable storage.
**How to avoid:** Limit audit metadata to the current page state and derived provenance rows.
**Warning signs:** Any new API route, DB table, or browser storage key for scenarios.

### Pitfall 5: Confirming The Wrong User Action
**What goes wrong:** The app warns on every page leave or form edit instead of only on snapshot refresh reset.
**Why it happens:** The implementation chooses generic unload protection instead of explicit refresh gating.
**How to avoid:** Guard only the refresh submit path in `RootIssueForm`.
**Warning signs:** `beforeunload` appears in the implementation.

## Code Examples

Verified patterns from the current repo:

### Ephemeral Browser-Only State Belongs Behind An Explicit Boundary
```ts
export function loadAssigneeDirectory(): AssigneeDirectoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  // browser-local state stays isolated behind one module
}
```
Source: `src/lib/costing/storage.ts`

### Factual Profitability Is Already Pure And Reusable
```ts
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
```
Source: `src/lib/costing/calculateProfitability.ts`

### Root Refresh Is Already Centralized In One Submit Path
```ts
const response = await fetch("/api/scope", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ rootIssueKey: normalizedRootIssue }),
});
```
Source: `src/components/root-issue-form.tsx`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| One factual profitability pass from snapshot + budget | Two derived views from one snapshot: factual and forecast overlay | Phase 4 | Enables reforecasting without corrupting imported data |
| Single mutable budget object in page state | Baseline budget copy plus editable scenario budget copy | Phase 4 | Satisfies BUDG-03 and keeps origin explainable |
| Tree only shows factual task info | Tree cards become task-level scenario entry points | Phase 4 | Matches the locked PM flow and preserves task provenance |

**Deprecated/outdated:**
- Treating Phase 4 as “direction-only reforecasting”: outdated versus the locked task-card workflow.
- Reusing Phase 3 localStorage patterns for scenario data: outdated for this phase because the scenario must die on reload.

## Open Questions

1. **Should task cards commit extra hours on blur, on explicit save, or with inline +/- controls?**
   - What we know: input must stay fast and unambiguous for PMs.
   - What's unclear: the exact interaction shape was left to agent discretion.
   - Recommendation: plan for explicit per-card apply/reset controls; it keeps dirty-state boundaries and accidental edits clearer than blur-save.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next build and Vitest | ✓ | v24.14.1 | — |
| npm | Script execution | ✓ | 11.11.0 | — |
| Vitest | Phase logic verification | ✓ | 3.2.4 | `npm test` already wired |

**Missing dependencies with no fallback:**
- None for planning and pure logic implementation.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/scenario/*.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUDG-01 | Scenario keeps editable direction budgets | unit | `npx vitest run src/lib/scenario/state.test.ts -t "stores scenario budgets"` | ❌ Wave 0 |
| BUDG-02 | Budget edits immediately affect derived profitability | unit | `npx vitest run src/lib/scenario/forecast.test.ts -t "recomputes profitability after budget change"` | ❌ Wave 0 |
| BUDG-03 | Baseline budget remains separate from scenario budget | unit | `npx vitest run src/lib/scenario/state.test.ts -t "preserves baseline budgets"` | ❌ Wave 0 |
| REFO-01 | Extra hours attach to a task and inherit its priced direction | unit | `npx vitest run src/lib/scenario/forecast.test.ts -t "prices task extra hours from assignee"` | ❌ Wave 0 |
| REFO-02 | Forecast changes without mutating factual hours | unit | `npx vitest run src/lib/scenario/forecast.test.ts -t "leaves baseline issues untouched"` | ❌ Wave 0 |
| REFO-03 | Current and forecast profitability can coexist | unit | `npx vitest run src/lib/scenario/forecast.test.ts -t "returns baseline and forecast summaries"` | ❌ Wave 0 |
| REFO-04 | Multiple task edits roll up across directions | unit | `npx vitest run src/lib/scenario/forecast.test.ts -t "aggregates multiple issue edits"` | ❌ Wave 0 |
| AUDT-01 | Canonical data and scenario overlay stay separate | unit | `npx vitest run src/lib/scenario/state.test.ts -t "separates canonical and scenario state"` | ❌ Wave 0 |
| AUDT-02 | Scenario origin metadata includes root issue, sync time, budgets, hours | unit | `npx vitest run src/lib/scenario/state.test.ts -t "materializes scenario origin metadata"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/scenario/*.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test` and `npm run build` green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/scenario/state.test.ts` — covers BUDG-01, BUDG-03, AUDT-01, AUDT-02
- [ ] `src/lib/scenario/forecast.test.ts` — covers BUDG-02, REFO-01, REFO-02, REFO-03, REFO-04
- [ ] Browser interaction assertion for refresh confirm — either a small component-level test after adding a DOM test environment, or manual verification in phase execution

## Sources

### Primary (HIGH confidence)
- `.planning/phases/04-scenario-editing/04-CONTEXT.md` — locked decisions, scope boundary, and deferred items
- `.planning/REQUIREMENTS.md` — requirement definitions for BUDG, REFO, AUDT
- `.planning/phases/03-cost-engine/03-CONTEXT.md` — existing budget and profitability model boundaries
- `.planning/phases/03-cost-engine/03-VERIFICATION.md` — verified Phase 3 behavior and current persistence boundary
- `app/page.tsx` — current ownership of result, budgets, and derived cost/profitability
- `src/components/root-issue-form.tsx` — refresh submit path and current last-sync UX
- `src/components/scope-tree.tsx` — existing task-card rendering surface for scenario edits
- `src/components/cost-summary.tsx` — current top-level metrics surface
- `src/components/direction-breakdown.tsx` — current per-direction metrics surface
- `src/lib/costing/calculateRequirementCost.ts` — factual pricing pipeline
- `src/lib/costing/calculateProfitability.ts` — profitability primitives and target-margin math
- `src/lib/costing/storage.ts` — current browser-local persistence boundary
- `src/lib/costing/types.ts` — direction/budget/cost type model
- `src/lib/scope/types.ts` — ready vs blocked snapshot state shape
- `app/api/scope/route.ts` — canonical refresh route boundary

### Secondary (MEDIUM confidence)
- `package.json` and local CLI version output — current project toolchain versions
- `vitest.config.ts` and existing `src/lib/costing/*.test.ts` — validation style and current test approach

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries are needed; recommendations align with the checked-in app stack.
- Architecture: HIGH - derived directly from locked phase decisions and current code ownership boundaries.
- Pitfalls: HIGH - based on explicit Phase 4 constraints plus observable Phase 3 implementation shape.

**Research date:** 2026-04-14
**Valid until:** 2026-05-14
