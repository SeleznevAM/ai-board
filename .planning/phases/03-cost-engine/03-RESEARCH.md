# Phase 03: cost-engine - Research

**Researched:** 2026-04-08
**Domain:** Cost allocation, per-assignee rate handling, profitability math, and minimal management UI on top of the phase-two snapshot
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Role source of truth
- **D-01:** Роль исполнителя не берется из YouTrack напрямую.
- **D-02:** Система берет исполнителя из задачи YouTrack и определяет его роль через внешнюю таблицу соответствия `исполнитель -> роль`.
- **D-03:** Для управления этой таблицей нужна отдельная страница приложения, где пользователь вручную задает и меняет роль исполнителя.

### Role model and directions
- **D-04:** У каждого исполнителя в v1 ровно одна роль.
- **D-05:** Допустимые роли совпадают с направлениями расчета: `devops`, `backend`, `analytics`, `frontend`, `mobiledev`, `qa`, `design`, `pm`.

### Rate card policy
- **D-06:** Ставка задается вручную в приложении и привязывается к конкретному человеку, а не к роли.
- **D-07:** Для расчета себестоимости система использует персональную ставку исполнителя, если он найден в таблице соответствия.
- **D-08:** Если исполнитель не найден в таблице соответствия, система использует среднюю ставку, рассчитанную по этой таблице.

### Unmapped and missing assignee handling
- **D-09:** Если исполнитель не найден в таблице соответствия, его затраты не блокируют расчет.
- **D-10:** Если исполнитель не найден в таблице соответствия, его затраты должны попадать в отдельную категорию `unmapped`.
- **D-11:** Если у задачи нет исполнителя, но есть часы для расчета, система не блокирует расчет.
- **D-12:** Задача без исполнителя должна быть подсвечена красным и явно сообщать, что исполнитель не назначен.
- **D-13:** Задача без исполнителя должна считаться по средней ставке и ее затраты тоже должны попадать в категорию `unmapped`.

### Budget and profitability input
- **D-14:** В Phase 3 нужен простой ручной ввод бюджета без полноценного scenario-editing.
- **D-15:** Пользователь может ввести один общий бюджет на все требование.
- **D-16:** После ввода общего бюджета система должна автоматически распределять его равномерно по основным направлениям `devops`, `backend`, `analytics`, `frontend`, `mobiledev`, `qa`, `design`, `pm`.
- **D-17:** Для ручной корректировки должна быть отдельная форма бюджетов по направлениям.
- **D-18:** Если пользователь вручную меняет бюджет одного или нескольких направлений и сохраняет форму, общий бюджет должен автоматически пересчитываться как сумма бюджетов всех направлений.
- **D-19:** `unmapped` не получает долю бюджета при автоматическом равномерном распределении.
- **D-20:** `unmapped` должен присутствовать в форме ручного распределения, чтобы пользователь мог при необходимости задать ему бюджет вручную.

### Claude's Discretion
- Конкретная форма хранения таблицы соответствия исполнителей и ставок, если она сохраняет пользовательскую семантику `исполнитель -> роль + ставка`.
- Точный способ вычисления средней ставки, если он использует все валидные записи таблицы и не меняет зафиксированную fallback-логику.
- Визуальная подача `unmapped`-категории и предупреждений о задачах без исполнителя, если она остается рабочей и заметной.

### Deferred Ideas (OUT OF SCOPE)
- Раздельные бюджеты по направлениям — Phase 4.
- Сценарное редактирование бюджетов и дополнительных часов с сохранением происхождения — Phase 4.
- История изменений таблицы соответствия исполнителей и ставок — вне границ текущей фазы, если не потребуется для минимального управления справочником.
- Полноценное scenario-editing дополнительных часов и версионирование бюджетных сценариев — Phase 4.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COST-01 | Система относит фактические трудозатраты к направлениям по роли исполнителя. | Build a per-assignee directory keyed by normalized assignee identity, then aggregate issue minutes through the assignee role into direction buckets. |
| COST-02 | Система показывает трудозатраты и себестоимость по требованию и по каждому направлению. | Compute one canonical cost result with overall totals plus per-direction buckets derived from the same issue-level ledger. |
| COST-03 | Система явно помечает пользователей или трудозатраты, которые не удалось отнести ни к одному направлению. | Preserve `unmapped` entries as first-class output, not only as warnings, so totals remain auditable. |
| COST-04 | Система рассчитывает себестоимость на основе настраиваемых ставок. | Keep rates in the assignee directory and make the cost engine pure over snapshot data + directory state + budget input. |
| PROF-01 | Рентабельность рассчитывается по формуле `(бюджет - затраты) / бюджет * 100%`. | Centralize profitability math in a pure helper with explicit invalid-budget handling. |
| PROF-02 | Система показывает фактическую рентабельность по требованию целиком. | Return overall profitability summary alongside overall cost totals. |
| PROF-03 | Система показывает рентабельность по каждому направлению отдельно. | Maintain a direction-budget map derived first from equal distribution of the total budget and then from manual overrides, so per-direction profitability remains truthful in Phase 3. |
| PROF-04 | Система показывает денежные значения бюджета, затрат и отклонения вместе с процентом рентабельности. | Return typed money outputs and deficit/surplus fields from the profitability layer. |
| PROF-05 | Если рентабельность ниже 20%, система показывает сумму, которую нужно дополнительно согласовать. | Add a helper that solves the inverse profitability target amount from the locked formula and target 20%. |
| PROF-06 | Если бюджет отсутствует или некорректен, система не показывает ложный процент. | Treat empty, zero, and negative budgets as invalid inputs and withhold profitability percentages. |
</phase_requirements>

## Summary

Phase 3 should stay downstream of the phase-two snapshot and should not introduce a second source of truth for hours. The clean boundary is:

1. Phase 2 provides trusted issue-level minutes and problem states.
2. Phase 3 adds a local assignee directory with `assignee -> role + rate`.
3. A pure cost engine combines snapshot issues, assignee directory state, and a budget model that starts from one total budget but materializes direction budgets through equal distribution plus manual overrides.

The strongest v1 shape is to keep the assignee directory client-managed and persisted in browser storage, then run the cost/profitability engine in shared TypeScript domain code that can be called from the current page. That avoids introducing a database or auth-backed write path before the product proves the cost model. The browser page already owns refresh, tree rendering, and last-sync feedback, so it is the natural place to add:
- a link to the assignee directory page,
- a single overall budget input,
- an expandable per-direction budget editor seeded by equal distribution,
- a money summary,
- per-direction totals including `unmapped`,
- warnings for tasks with no assignee.

**Primary recommendation:** Build a pure costing domain (`directory -> issue ledger -> direction budgets -> totals -> profitability`) and a lightweight local assignee-management page persisted via `localStorage`, then surface the results on top of the existing snapshot page with a minimal direction-budget editor.

## Project Constraints

No `AGENTS.md` exists in the repository root. The active stack remains minimal: Next.js App Router, React client components, TypeScript, and Vitest. There is no database, API mutation layer, or form library in the current codebase, so Phase 3 should avoid architecture that assumes backend persistence.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|-------------|
| Next.js | 15.5.14 | Page composition for the cost screen and assignee directory page | Already in use and sufficient for one additional route plus client-side local persistence. |
| React | 19.0.0 | Budget input, directory editing UI, and derived totals rendering | Existing UI layer already uses client components, so no new state library is required. |
| TypeScript | 5.9.2 | Typed domain models for directory entries, issue ledgers, totals, and profitability | Critical because profitability math and fallback handling must stay explicit and auditable. |
| Vitest | 3.2.4 | Unit coverage for rate fallback, `unmapped`, and profitability formulas | Already established and fast enough for the new pure-domain code. |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Browser `localStorage` | Persist the assignee directory locally in v1 | Use because the app has no backend persistence yet and the user asked for manual management inside the app. |
| Native number parsing + small form helpers | Budget and rate validation | Use to reject empty/zero/negative budgets and malformed rates without adding a form dependency. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `localStorage` directory persistence | JSON file in repo or ad hoc server write endpoint | File persistence is awkward in deployed Next apps, and a write API would introduce backend state before the product proves its value. |
| Pure cost engine functions | Inline math in `app/page.tsx` | Inline math will become untestable and brittle once Phase 4 adds scenarios. |
| `unmapped` bucket in the totals model | Only toast-level warnings | This hides real spend from the breakdown and makes totals impossible to reconcile. |

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── lib/
│   ├── ingestion/             # existing snapshot pipeline from Phase 2
│   └── costing/               # new Phase 3 domain
│       ├── types.ts
│       ├── assigneeDirectory.ts
│       ├── budgetAllocation.ts
│       ├── calculateRequirementCost.ts
│       ├── calculateProfitability.ts
│       └── storage.ts
app/
├── page.tsx                   # current snapshot + cost summary page
└── assignees/
    └── page.tsx               # manual assignee role/rate management
src/components/
├── assignee-directory-form.tsx
├── cost-summary.tsx
└── direction-breakdown.tsx
```

### Pattern 1: Normalize Assignee Identity Before Costing
**What:** Convert each issue’s assignee into one canonical lookup key before touching role or rate logic.
**When to use:** Every issue entering the cost engine.
**Why:** YouTrack assignee identity may drift between readable name, login, or display name. The directory needs one stable key.
**Example:**
```ts
type AssigneeIdentity = {
  id: string | null;
  displayName: string | null;
  login: string | null;
};

function normalizeAssigneeKey(assignee: AssigneeIdentity): string | null {
  return assignee.id ?? assignee.login ?? assignee.displayName?.trim().toLowerCase() ?? null;
}
```

### Pattern 2: Cost the Issue Ledger Before Aggregating Directions
**What:** Turn every snapshot issue into one money-bearing ledger row, then reduce the ledger into overall and per-direction totals.
**When to use:** Always; it keeps missing-assignee and unmapped logic explainable.
**Example:**
```ts
type CostLedgerRow = {
  issueKey: string;
  minutes: number;
  hours: number;
  assigneeKey: string | null;
  role: DirectionKey | "unmapped";
  rate: number;
  cost: number;
  warning: "UNMAPPED_ASSIGNEE" | "MISSING_ASSIGNEE" | null;
};
```

### Pattern 3: Materialize Direction Budgets from Total Budget + Overrides
**What:** Convert one overall budget into a direction-budget map by equal distribution across core directions, then merge manual overrides and recompute total budget as the sum of all direction budgets.
**When to use:** Every time the user edits the total budget or saves manual direction-budget edits.
**Example:**
```ts
const CORE_DIRECTIONS = ["devops", "backend", "analytics", "frontend", "mobiledev", "qa", "design", "pm"] as const;

function allocateEvenBudgets(totalBudget: number): Record<DirectionKey, number> {
  const share = totalBudget / CORE_DIRECTIONS.length;
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
```

### Pattern 4: Keep Profitability Math Pure and Invertible
**What:** Profitability and “needed amount to reach 20%” should be pure helpers over cost and budget.
**When to use:** Overall profitability, per-direction profitability from the materialized budget map, and future Phase 4 scenario deltas.
**Example:**
```ts
function calculateMarginPercent(budget: number, cost: number): number | null {
  if (!Number.isFinite(budget) || budget <= 0) return null;
  return ((budget - cost) / budget) * 100;
}

function calculateRequiredBudgetForTargetMargin(cost: number, targetMarginPercent: number): number | null {
  const target = targetMarginPercent / 100;
  if (target >= 1) return null;
  return cost / (1 - target);
}

function calculateNeededUpsell(cost: number, currentBudget: number, targetMarginPercent: number): number | null {
  const requiredBudget = calculateRequiredBudgetForTargetMargin(cost, targetMarginPercent);
  if (requiredBudget === null) return null;
  return Math.max(0, requiredBudget - currentBudget);
}
```

### Pattern 5: Minimal Local Persistence First
**What:** Persist the assignee directory in local storage through a small repository wrapper instead of wiring server mutations in this phase.
**When to use:** Phase 3 only; revisit in Phase 4 or later if multi-user persistence becomes a requirement.
**Example:**
```ts
const STORAGE_KEY = "board-ai.assignee-directory.v1";

export function loadAssigneeDirectory(): AssigneeDirectoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? parseDirectory(raw) : [];
}
```

## Recommended Plan Shape

1. Define the costing contracts: assignee directory entries, normalized assignee identity, fallback average-rate policy, `unmapped` ledger rows, and pure tests.
2. Build the cost/profitability engine over Phase 2 snapshot issues, including per-direction totals, direction-budget allocation, invalid-budget handling, and target-20% upsell math.
3. Add the assignee directory page and wire the current requirement page with overall budget input, per-direction budget editor, cost summary, direction breakdown, and missing-assignee highlighting.

## Anti-Patterns to Avoid

- **Storing role and rate inside snapshot issues:** Snapshot data comes from YouTrack; mapping/rate data belongs to the app-managed directory layer.
- **Calculating average rate ad hoc in components:** The fallback rule must be centralized or totals will drift between views.
- **Treating `unmapped` only as an error badge:** Those costs are still real and must stay in the money totals.
- **Showing profitability when budget is empty/zero/negative:** This directly violates `PROF-06`.
- **Hiding manual direction budgets behind Phase 4:** The updated user decision explicitly requires a lightweight direction-budget editor now; only scenario history and richer editing remain Phase 4.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Directory persistence | Ad hoc `localStorage` reads in each component | One small storage wrapper in `src/lib/costing/storage.ts` | Keeps parsing, validation, and versioning centralized. |
| Cost math | Inline calculations in page components | Pure helpers under `src/lib/costing/` | Testability and reuse for Phase 4. |
| `unmapped` visibility | Console warnings or hidden counters | Typed `unmapped` bucket plus visible warning list | Product requirement needs explicit visibility, not hidden diagnostics. |
| Budget validation | `Number(input) || 0` shortcuts | Explicit finite-positive validation with `null` result states | Avoids false profitability outputs. |

## Common Pitfalls

### Pitfall 1: No Stable Assignee Key
**What goes wrong:** The same person becomes multiple directory entries because the app mixes display name, login, and issue-level text.
**How to avoid:** Choose one normalized lookup key and store the original label separately for display.

### Pitfall 2: Average Rate Includes Invalid Rows
**What goes wrong:** Empty or malformed rates drag the fallback calculation toward zero.
**How to avoid:** Compute average only from valid positive numeric rates.

### Pitfall 3: Missing Assignee and Unmapped Assignee Get Collapsed
**What goes wrong:** The UI cannot explain whether a PM should assign a person or just map them in the directory.
**How to avoid:** Keep distinct warning codes even if both land in the same `unmapped` cost bucket.

### Pitfall 4: Direction Breakdown Uses Budget Semantics Too Early
**What goes wrong:** Planner accidentally invents per-direction budgets in Phase 3 and leaks Phase 4 scope into implementation.
**How to avoid:** Phase 3 direction breakdown should focus on hours, cost, and cost share; overall profitability can use the single total budget.

## Validation Architecture

Phase 3 should lean heavily on automated unit tests for the pure cost/profitability domain and reserve manual verification for the new assignee-management page and visual warnings.

Recommended validation split:
- **Automated:** directory normalization, average-rate fallback, cost ledger generation, direction aggregation, invalid-budget handling, 20% target math.
- **Manual:** assignee directory editing flow, persistence across reload, readable `unmapped`/missing-assignee warnings, overall page composition with refreshed snapshot data.

Recommended task-to-test alignment:
- Wave 1 domain contracts must add Vitest coverage before any UI work.
- Wave 2 profitability math must remain pure and fully unit-tested.
- Wave 3 UI wiring should verify `npm test` and `npm run build`, plus browser checks for persistence and warning rendering.

## Key Insight

The main risk in Phase 3 is not the formula. It is preserving trust while some people are unmapped or even unassigned. The winning shape is to keep those cases visible, priced by a documented fallback, and separated from the canonical snapshot so later scenario editing can build on a clean base.
