---
phase: 04-scenario-editing
plan: "01"
subsystem: testing
tags: [typescript, vitest, scenario, forecasting, auditability]
requires:
  - phase: 03-cost-engine
    provides: factual cost, profitability primitives, and assignee pricing rules
provides:
  - pure scenario overlay contracts for budgets, provenance, and fact-vs-forecast outputs
  - immutable state helpers for scenario refresh, edits, reset, and dirty checks
  - forecast derivation over canonical snapshot issues plus task-level extra hours
affects: [04-02, 04-03, ui, page-state, scope-tree]
tech-stack:
  added: []
  patterns: [canonical snapshot plus ephemeral overlay, issue-keyed extra hours, forecast as second pure pass]
key-files:
  created:
    - src/lib/scenario/types.ts
    - src/lib/scenario/state.ts
    - src/lib/scenario/forecast.ts
    - src/lib/scenario/state.test.ts
    - src/lib/scenario/forecast.test.ts
  modified:
    - src/lib/scenario/types.ts
    - src/lib/scenario/forecast.test.ts
key-decisions:
  - "Scenario state snapshots baseline budgets separately from editable scenario budgets to preserve the audit boundary."
  - "Forecast math reuses existing costing and profitability helpers over augmented issue minutes instead of duplicating formulas."
patterns-established:
  - "Canonical snapshot plus ephemeral overlay: imported YouTrack facts stay immutable while scenario edits live in a separate state object."
  - "Issue-keyed reforecasting: extra hours are attached to issue keys and then rolled up to direction deltas."
requirements-completed: [BUDG-03, REFO-02, REFO-04, AUDT-01, AUDT-02]
duration: 3min
completed: 2026-04-14
---

# Phase 4 Plan 01: Scenario Overlay Domain Summary

**Pure scenario overlay contracts with immutable state helpers and a second-pass forecast calculator over canonical YouTrack facts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-14T18:45:34Z
- **Completed:** 2026-04-14T18:48:18Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Froze the scenario domain contracts for baseline budgets, editable scenario budgets, issue-keyed extra hours, provenance, and side-by-side current versus forecast summaries.
- Added immutable state helpers for creating, refreshing, editing, resetting, dirty-checking, and materializing scenario origin metadata.
- Implemented a forecast pass that augments canonical issue minutes with overlay edits while reusing the existing cost and profitability engine.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write scenario contracts and failing regression tests** - `fa84970` (test)
2. **Task 2: Implement pure overlay state helpers** - `ac437ff` (feat)
3. **Task 3: Implement the forecast pass over canonical facts plus overlay edits** - `40982ee` (feat)

## Files Created/Modified
- `src/lib/scenario/types.ts` - Shared contracts for scenario state, provenance, comparison outputs, and forecast ledger rows.
- `src/lib/scenario/state.ts` - Pure helpers for overlay initialization, refresh resets, budget and extra-hour updates, dirty checks, and origin materialization.
- `src/lib/scenario/forecast.ts` - Pure forecast derivation that reuses the existing cost engine over augmented issue minutes and returns current versus forecast summaries.
- `src/lib/scenario/state.test.ts` - Regression tests for budget separation, issue-keyed edits, refresh/reset behavior, dirty checks, and provenance output.
- `src/lib/scenario/forecast.test.ts` - Regression tests for assignee-priced extra hours, multi-direction rollups, immutable factual inputs, and forecast profitability.

## Decisions Made
- Scenario state keeps `baselineBudgets` and `scenarioBudgets` as separate maps so downstream UI can explain agreed versus edited values without mutating refresh inputs.
- Forecast derivation recomputes the requirement cost from augmented issue minutes rather than patching totals in place, which keeps pricing behavior aligned with the canonical assignee-resolution rules.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Parallel `git add` operations contended on `.git/index.lock`; staging had to be serialized for task commits.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase `04-02` can wire page-level scenario state and task-card editing directly against the frozen `src/lib/scenario/*` contracts.
- No blockers remain in the scenario domain layer; refresh confirmation and UI composition stay for the next plans.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/04-scenario-editing/04-01-SUMMARY.md`
- Verified task commits: `fa84970`, `ac437ff`, `40982ee`

---
*Phase: 04-scenario-editing*
*Completed: 2026-04-14*
