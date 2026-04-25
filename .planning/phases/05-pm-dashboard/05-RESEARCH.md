# Phase 05: PM Dashboard - Research

**Researched:** 2026-04-16
**Domain:** Next.js desktop-first requirement dashboard refactor
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Page structure
- **D-01:** Страница требования должна использовать tab-based layout.
- **D-02:** Первая вкладка должна быть вкладкой `Обзор`.
- **D-03:** Детальная разбивка по направлениям должна быть вынесена из главного экрана в отдельную вкладку страницы.

### Overview tab
- **D-04:** Вкладка `Обзор` должна быть компактной.
- **D-05:** В верхней части `Обзора` должна находиться главная итоговая плитка требования.
- **D-06:** В главной плитке должны быть 3 основных блока: `бюджет`, `трудозатраты`, `процент рентабельности`.

### Scenario values in overview
- **D-07:** Если сценарные дополнительные часы отсутствуют, в главной плитке показываются только основные значения.
- **D-08:** Если сценарные дополнительные часы есть, в блоке `трудозатраты` справа снизу должно показываться дополнительное значение.
- **D-09:** Если сценарные дополнительные часы есть, в блоке `рентабельности` справа снизу должно показываться прогнозное значение.
- **D-10:** Текущая идея размещать прогнозную рентабельность справа снизу в блоке рентабельности принята как текущее предпочтение, но не как абсолютно жесткое решение, если в planning/research найдется заметно более читаемая подача без нарушения общей структуры.

### Direction tab
- **D-11:** Вкладка направлений нужна для детальной разбивки по `backend`, `qa`, `analytics` и другим направлениям.
- **D-12:** На главной вкладке не нужно отдельное объяснение причин перерасхода; для детализации пользователь переходит во вкладку направлений.

### Visual emphasis
- **D-13:** Цветовая индикация должна окрашивать весь блок или всю строку, а не только число процента.

### Target device
- **D-14:** Phase 5 проектируется как desktop-only experience.

### Claude's Discretion
- Конкретная визуальная форма вкладок, если она сохраняет быстрый desktop workflow.
- Точная композиция второй вкладки с разбивкой по направлениям, если она не возвращает лишнюю перегруженность на первый экран.
- Детали цветовой шкалы внутри красного/зеленого статуса, если сохраняется понятная семантика порога `20%`.

### Deferred Ideas (OUT OF SCOPE)
- Мобильная оптимизация и mobile-first layout — вне границ Phase 5.
- Автоматическое текстовое объяснение причин перерасхода — не нужно в этой фазе.
- Дополнительные вкладки сверх `Обзор` и направления — отложено, если не появится новая явная продуктовая потребность.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Пользователь видит итоговую карточку требования с ключевыми метриками: бюджет, затраты, фактическая рентабельность, прогнозная рентабельность и недостающая сумма до целевых 20%. | Decision card should be a new top-level component fed entirely from existing `profitability` and `scenarioForecast` objects. |
| UI-02 | Пользователь видит таблицу с разбивкой по направлениям, где для каждого направления показаны бюджет, фактические часы, дополнительные часы, затраты и рентабельность. | Direction breakdown should move to its own tab and become a dense desktop table/row grid instead of stacked current/forecast cards. |
| UI-03 | Система подсвечивает рентабельность красным цветом, если она ниже 20%, и зеленым, если она не ниже 20%. | Status semantics must come from existing 20% profitability threshold and color the whole block/row, not only numeric text. |
| UI-04 | Пользователь может быстро понять, на каких направлениях возник перерасход и какой вклад они дают в итоговую рентабельность. | Directions tab should sort/scan well, keep full-row status semantics, and expose current/forecast delta without reintroducing clutter into Overview. |
</phase_requirements>

## Summary

Phase 5 should be planned as a UI composition refactor, not as a new data-model phase. The current page already has the correct page-level ownership of canonical snapshot state, scenario overlay state, profitability math, forecast math, and per-direction deltas in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:1), [src/lib/costing/calculateProfitability.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/costing/calculateProfitability.ts:1), and [src/lib/scenario/forecast.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/forecast.ts:1). Planning should preserve that architecture and only redistribute presentation responsibilities.

The current clutter comes from sequentially rendering all major blocks in one long page: budget editor, scope tree, summary, provenance, and direction breakdown. The compact PM dashboard target is best served by introducing a lightweight tab shell with `Обзор` first and `Направления` second, then reworking the summary into a top decision card with three large blocks. The overview must answer one question immediately: "Is this requirement still healthy, and what does the scenario do to it?" Detailed direction diagnostics should move off the first screen.

The research-backed implementation path is to build ARIA-compliant tabs directly with local components instead of adding a UI library. The repo already uses manual inline styles, has no component system installed, and the dashboard only needs two static tabs. Official WAI guidance supports automatic activation when panels switch instantly, which applies here because both panels derive from already-loaded in-memory data.

**Primary recommendation:** Reuse the existing page-level calculation/state model, add an accessible two-tab shell, turn `CostSummary` into a compact three-block decision card, and move direction diagnostics into a dense desktop directions tab with row-wide status coloring.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.14 | App Router page shell and client/server boundary | Already in production code and matches current `app/page.tsx` architecture. |
| React | 19.0.0 | Stateful dashboard rendering and tab interaction | Already powers the page-level overlay model and interactive scenario editing. |
| TypeScript | 5.9.2 | Typed domain/UI composition | Existing repo already centralizes domain types and benefits from typed prop reshaping. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 3.2.4 | Existing unit test runner | Keep for domain regression tests and add targeted UI tests if phase adds component behavior. |
| `@testing-library/react` | 16.3.0 | Optional component-level DOM tests | Add only if planner wants automated coverage for tabs, decision card rendering, and status semantics. |
| `@testing-library/dom` | 10.4.1 | Required companion for RTL 16 | Install with RTL if component tests are added. |
| `@testing-library/jest-dom` | 6.8.0 | Better DOM assertions in Vitest | Add with RTL to assert visibility, selected state, and tabpanel semantics. |
| `jsdom` | 26.1.0 | Browser-like environment for React tests | Required because current Vitest config is `environment: "node"`. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local ARIA tabs | `react-tabs` or Headless UI tabs | Faster initial setup, but unnecessary dependency and style abstraction for a two-tab local workspace. |
| Inline-style local components | shadcn/ui or Radix-based redesign | More reusable primitives, but this repo currently has no component system and Phase 5 is a compact refactor, not a design-system phase. |
| Reusing page-level state | New global store | Adds architectural surface without solving a real Phase 5 problem. |

**Installation:**
```bash
npm install
npm install --save-dev @testing-library/react @testing-library/dom @testing-library/jest-dom jsdom
```

**Version verification:**
- Local repo versions verified from `package.json`: Next.js `15.5.14`, React `19.0.0`, TypeScript `5.9.2`, Vitest `3.2.4`.
- Current package metadata verified via npm pages on 2026-04-16: `@testing-library/react` `16.3.0`, `@testing-library/dom` `10.4.1`, `@testing-library/jest-dom` `6.8.0`, `jsdom` `26.1.0`.
- I did not independently verify npm publish dates for Next.js and React beyond repo-pinned versions, so "current latest" should be rechecked during implementation if the phase decides to upgrade packages.

## Architecture Patterns

### Recommended Project Structure
```text
app/
└── page.tsx                     # keeps data fetching + page-level scenario state ownership

src/components/
├── dashboard-tabs.tsx          # ARIA tablist/tab/tabpanel shell
├── requirement-decision-card.tsx
├── direction-breakdown-table.tsx
├── budget-allocation-form.tsx  # reused
├── scope-tree.tsx              # reused, possibly de-emphasized or moved below fold
└── scenario-origin-panel.tsx   # reused in compact form or moved out of overview
```

### Pattern 1: Keep State Ownership in `app/page.tsx`
**What:** `app/page.tsx` continues to own canonical refresh results, scenario state, profitability, and forecast derivations. New dashboard components stay presentational and receive already-derived comparison data.

**When to use:** For every Phase 5 UI change. Do not move domain calculations into view components.

**Example:**
```typescript
const hasTrustworthySnapshot =
  successfulScope !== null && costResult !== null && profitability !== null;

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
}, [assigneeDirectory, costResult, directionProfitability, profitability, scenarioState, successfulScope?.issues]);
```
Source: local code in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:39)

### Pattern 2: Tabs Are a Navigation Shell, Not a Data Boundary
**What:** Build the tab UI as an ARIA `tablist` with `button`-based tabs and `tabpanel`s. Panels only switch visibility; they do not own canonical data.

**When to use:** `Обзор` and `Направления`.

**Example:**
```tsx
<div role="tablist" aria-label="Dashboard sections">
  <button
    role="tab"
    id="overview-tab"
    aria-selected={activeTab === "overview"}
    aria-controls="overview-panel"
    tabIndex={activeTab === "overview" ? 0 : -1}
  >
    Обзор
  </button>
  <button
    role="tab"
    id="directions-tab"
    aria-selected={activeTab === "directions"}
    aria-controls="directions-panel"
    tabIndex={activeTab === "directions" ? 0 : -1}
  >
    Направления
  </button>
</div>
```
Source: WAI APG Tabs Pattern and MDN ARIA tab role  
Links: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ , https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tab_role

### Pattern 3: Overview Uses a Single Decision Card With Three Primary Blocks
**What:** Replace the current dual `Current`/`Forecast` summary cards with one compact top card containing three decision blocks: budget, labor, margin. Secondary forecast values appear only where scenario data exists.

**When to use:** Always on `Обзор`; this is the phase-defining composition.

**Implementation guidance:**
- `Budget` block: total budget, delta, needed upsell to 20%.
- `Трудозатраты` block: current total hours/cost as primary; forecast extra hours/cost as secondary annotation only when scenario exists.
- `Рентабельность` block: current margin as primary; forecast margin in a secondary corner/annotation only when scenario exists.
- Whole block background reflects current status relative to the 20% threshold; forecast should not override current-status semantics.

### Pattern 4: Directions Tab Should Be a Dense Desktop Table, Not Nested Cards
**What:** Rework `DirectionBreakdown` from paired mini-cards into a row-based table/grid optimized for scanning.

**When to use:** `Направления` tab.

**Recommended columns:**
- Direction
- Budget
- Actual hours
- Extra hours
- Current cost
- Forecast cost
- Current profitability
- Forecast profitability
- Contribution / warning note

**Reasoning:** UI-02 and UI-04 are fundamentally scan-and-compare requirements. A row model surfaces outliers faster than stacked "Current/Forecast" cards per direction.

### Pattern 5: Compact Provenance, Not Full Provenance Panel, on Overview
**What:** Keep auditability visible, but compress `Root issue` and `Last sync` into a slim metadata strip near the decision card instead of rendering the entire current provenance panel on the first screen.

**When to use:** Trustworthy snapshot states on `Обзор`.

**Reasoning:** AUDT-01 and AUDT-02 remain phase constraints from earlier work, but the current full provenance panel materially increases clutter.

### Anti-Patterns to Avoid
- **Duplicating profitability math in UI components:** All 20% threshold and upsell calculations already exist in `calculateProfitability.ts`.
- **Keeping both direction breakdown and full provenance panel on Overview:** This re-creates the current long-scroll workspace and defeats D-04/D-12.
- **Coloring only the percentage text:** Conflicts directly with D-13 and weakens scanability.
- **Turning tabs into route changes or separate pages:** Adds navigation complexity without a product requirement.
- **Letting forecast status fully replace actual status:** PM overview must still communicate current health first.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Profitability threshold logic | New UI-specific 20% formulas | `calculateRequirementProfitability`, `calculateDirectionProfitability`, `TARGET_MARGIN_PERCENT` | Existing helpers already encode the business rule and are tested. |
| Scenario pricing and per-direction deltas | New dashboard-side recomputation | `calculateScenarioForecast` | Existing helper already preserves actual-vs-forecast separation. |
| Scenario state source of truth | Local tab state or duplicated component state | Existing page-level `ScenarioState` in `app/page.tsx` | Prevents drift between overview and directions tab. |
| Tab accessibility semantics | Ad hoc clickable pills with no ARIA/keyboard support | WAI APG tab roles/states/keyboard pattern | Tabs are deceptively easy to get wrong for keyboard and screen-reader users. |

**Key insight:** The biggest implementation risk in this phase is not layout. It is accidentally creating a second calculation/view model while redesigning the page. The planner should treat all business calculations as locked infrastructure and spend effort on information hierarchy instead.

## Common Pitfalls

### Pitfall 1: Reintroducing Clutter Into Overview
**What goes wrong:** The page gets tabs, but Overview still keeps the direction breakdown, full provenance, and large scope tree, so the first screen remains slow to read.
**Why it happens:** Reuse is mistaken for "leave everything where it already is."
**How to avoid:** Plan Overview around one decision card plus compact supporting metadata. Put diagnostics in `Направления`.
**Warning signs:** Overview scrolls before the top card is fully visible or requires reading more than one major panel to judge health.

### Pitfall 2: UI Recomputes Domain Logic
**What goes wrong:** Components calculate their own margin, upsell, or delta values from display numbers.
**Why it happens:** Summary refactors often move logic closer to presentation.
**How to avoid:** Pass domain objects and comparisons from `app/page.tsx`; use render-only helper formatting in components.
**Warning signs:** Multiple 20% constants, duplicated budget summing, or view components importing low-level math inconsistently.

### Pitfall 3: Full-Block Status Color Becomes Visually Noisy
**What goes wrong:** Red/green backgrounds overpower typography and make the dashboard feel like alerts everywhere.
**Why it happens:** D-13 requires block-level color, but not every block needs maximum saturation.
**How to avoid:** Use soft surface fills with strong text contrast and reserve high saturation for truly critical states.
**Warning signs:** Users must work harder to read labels than to detect status.

### Pitfall 4: Tab Switching Resets Unsaved Per-Card Inputs
**What goes wrong:** A user types hours into a task card input, switches tabs before pressing apply, and the draft disappears.
**Why it happens:** React preserves state only while the same component remains mounted in the same position; conditionally unmounting a panel resets local state.
**How to avoid:** Either accept this explicitly and document it, or keep panels mounted and hide inactive ones, or lift draft input state higher.
**Warning signs:** Scope tree inputs use local `useState`, while tab panels are conditionally rendered.

### Pitfall 5: Directions Tab Remains Card-Based
**What goes wrong:** The breakdown moves to a new tab but stays as nested cards with split current/forecast subcards, so comparison remains slower than necessary.
**Why it happens:** It is the easiest reuse path from current `DirectionBreakdown`.
**How to avoid:** Plan a real row/table rewrite for desktop.
**Warning signs:** One direction consumes more than a single table row height without user interaction.

## Code Examples

Verified patterns from official sources and current code:

### Accessible Manual Tabs
```tsx
<div role="tablist" aria-label="Requirement dashboard sections">
  <button
    role="tab"
    id="overview-tab"
    aria-selected={activeTab === "overview"}
    aria-controls="overview-panel"
    tabIndex={activeTab === "overview" ? 0 : -1}
    onClick={() => setActiveTab("overview")}
  >
    Обзор
  </button>
</div>

<section
  id="overview-panel"
  role="tabpanel"
  aria-labelledby="overview-tab"
  hidden={activeTab !== "overview"}
  tabIndex={0}
>
  <RequirementDecisionCard />
</section>
```
Source: adapted from WAI APG Tabs Pattern and MDN `tab` role  
Links: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ , https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tab_role

### Reuse Domain Threshold Instead of UI Constants
```typescript
const status =
  profitability.current.marginPercent !== null &&
  profitability.current.marginPercent >= TARGET_MARGIN_PERCENT
    ? "healthy"
    : "at-risk";
```
Source: local domain helper contract in [src/lib/costing/calculateProfitability.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/costing/calculateProfitability.ts:1)

### Keep Forecast Derivation Centralized
```typescript
const forecastMargin =
  scenarioForecast?.profitability.forecast.marginPercent ??
  profitability.marginPercent;
```
Source: local page orchestration pattern in [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:58)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single long workspace with sequential sections | Compact dashboard shell with tabs and top decision card | Phase 05 | Faster PM triage and less first-screen noise. |
| Current/forecast shown as separate summary cards | Current remains primary, forecast becomes secondary annotation inside the same decision card | Phase 05 | Better supports "compact first screen" without losing scenario semantics. |
| Direction diagnostics mixed into main page flow | Directions get their own scan-optimized tab | Phase 05 | UI-04 becomes easier without crowding Overview. |

**Deprecated/outdated:**
- Rendering `ScenarioOriginPanel` in full on the first screen: too verbose for the new PM dashboard goal.
- Pair-of-cards direction rows: adequate for Phase 4 scenario workspace, weak for a compact desktop dashboard.

## Open Questions

1. **Should the scope tree stay visible on Overview at all?**
   - What we know: It is not required by UI-01..04 and is a major contributor to current page length.
   - What's unclear: Whether product wants instant access to task-level scenario editing from the first tab.
   - Recommendation: Default planning assumption should be "no full scope tree in the Overview viewport." Either move it below the fold, collapse it, or leave it outside the tab focus of this phase.

2. **Should inactive tab panels stay mounted?**
   - What we know: Keeping panels mounted preserves local input drafts; unmounting resets local component state.
   - What's unclear: Whether preserving uncommitted task-card input drafts matters for this phase.
   - Recommendation: If planner keeps scope editing accessible under tabs, prefer mounted-but-hidden panels. If scope editing is de-emphasized or moved off the primary dashboard path, unmounting is acceptable.

3. **Should direction rows be sorted by severity?**
   - What we know: UI-04 wants fast detection of overrun contributors.
   - What's unclear: Whether preserving canonical direction order is more important than surfacing the riskiest rows first.
   - Recommendation: Use canonical role order by default unless product explicitly wants analytical sorting. Severity can still be surfaced through row color and a contribution column.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js app, tests | ✓ | 24.14.1 | — |
| npm | scripts, dependency install | ✓ | 11.11.0 | — |
| Vitest CLI | current automated tests | ✓ | 3.2.4 | `npm test` wrapper |
| jsdom | future component tests for this phase | ✗ | — | Manual verification only until installed |
| `@testing-library/react` | future component tests for this phase | ✗ | — | Manual verification only until installed |

**Missing dependencies with no fallback:**
- None. Phase 5 can be implemented without adding packages.

**Missing dependencies with fallback:**
- Browser-like component test stack (`jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`) is absent; fallback is manual UI verification plus existing pure-domain tests.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | [vitest.config.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/vitest.config.ts:1) |
| Quick run command | `npx vitest run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Decision card shows current core metrics and scenario-only secondary forecast values | component | `npx vitest run src/components/requirement-decision-card.test.tsx` | ❌ Wave 0 |
| UI-02 | Directions tab renders compact row/table breakdown with budget, hours, extra hours, costs, and profitability | component | `npx vitest run src/components/direction-breakdown-table.test.tsx` | ❌ Wave 0 |
| UI-03 | 20% threshold maps to whole-block / whole-row status semantics | component | `npx vitest run src/components/pm-dashboard-status.test.tsx` | ❌ Wave 0 |
| UI-04 | User can identify problematic directions without cluttering overview | manual + component | `npx vitest run src/components/pm-dashboard-tabs.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/costing/calculateProfitability.test.ts src/lib/scenario/forecast.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Manual desktop walkthrough plus full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/requirement-decision-card.test.tsx` — covers UI-01.
- [ ] `src/components/direction-breakdown-table.test.tsx` — covers UI-02 and part of UI-04.
- [ ] `src/components/pm-dashboard-tabs.test.tsx` — covers tab switching, selected state, and panel visibility.
- [ ] `src/components/pm-dashboard-status.test.tsx` — covers UI-03 status semantics.
- [ ] `vitest.config.ts` or per-file docblocks — switch UI tests to `jsdom` instead of the current `node` environment.
- [ ] Install test helpers: `npm install --save-dev @testing-library/react @testing-library/dom @testing-library/jest-dom jsdom`

## Sources

### Primary (HIGH confidence)
- Local phase context: [05-CONTEXT.md](/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/phases/05-pm-dashboard/05-CONTEXT.md:1)
- Local requirement traceability: [REQUIREMENTS.md](/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/REQUIREMENTS.md:1)
- Current page orchestration: [app/page.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/app/page.tsx:1)
- Current summary component: [src/components/cost-summary.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/cost-summary.tsx:1)
- Current direction breakdown: [src/components/direction-breakdown.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/direction-breakdown.tsx:1)
- Current provenance panel: [src/components/scenario-origin-panel.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/scenario-origin-panel.tsx:1)
- Current scope tree behavior: [src/components/scope-tree.tsx](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/components/scope-tree.tsx:1)
- Profitability helper contract: [src/lib/costing/calculateProfitability.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/costing/calculateProfitability.ts:1)
- Scenario forecast helper contract: [src/lib/scenario/forecast.ts](/Users/alexanderseleznev/Documents/PetProjects/board_ai/src/lib/scenario/forecast.ts:1)
- WAI APG Tabs Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- MDN ARIA `tab` role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tab_role
- Next.js `use client` directive: https://nextjs.org/docs/app/api-reference/directives/use-client
- React preserving and resetting state: https://react.dev/learn/preserving-and-resetting-state
- Vitest environment config: https://vitest.dev/config/environment

### Secondary (MEDIUM confidence)
- React Testing Library setup docs: https://testing-library.com/docs/react-testing-library/setup/
- npm package page for `@testing-library/react`: https://www.npmjs.com/package/%40testing-library/react
- npm package page for `@testing-library/dom`: https://www.npmjs.com/package/%40testing-library/dom
- npm package page for `@testing-library/jest-dom`: https://www.npmjs.com/package/%40testing-library/jest-dom
- npm package page for `jsdom`: https://www.npmjs.com/package/jsdom

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - core stack comes from local repo state; optional UI test stack is verified from official docs and npm package pages.
- Architecture: HIGH - recommendations are tightly constrained by existing code structure and explicit phase decisions.
- Pitfalls: MEDIUM - two key pitfalls are directly documented by React/WAI guidance; clutter-related pitfalls are strong repo-specific inference.

**Research date:** 2026-04-16
**Valid until:** 2026-05-16
