---
phase: 03-cost-engine
plan: "02"
subsystem: money-engine
tags: [typescript, budgeting, costing, profitability, vitest]
requires: [COST-02, COST-03, PROF-01, PROF-03, PROF-04, PROF-05, PROF-06]
provides:
  - "Direction-budget allocation from one total budget plus manual overrides"
  - "Pure issue-ledger cost aggregation with unmapped and missing-assignee visibility"
  - "Overall and per-direction profitability math including 20% target upsell"
affects: [03-03, phase-3-verification]
tech-stack:
  added: [vitest]
  patterns: [equal budget allocation, issue ledger reduction, pure profitability math]
key-files:
  created:
    [
      src/lib/costing/budgetAllocation.ts,
      src/lib/costing/budgetAllocation.test.ts,
      src/lib/costing/calculateRequirementCost.ts,
      src/lib/costing/calculateRequirementCost.test.ts,
      src/lib/costing/calculateProfitability.ts,
      src/lib/costing/calculateProfitability.test.ts
    ]
  modified: [src/lib/costing/types.ts]
key-decisions:
  - "One total budget is materialized into per-direction budgets through equal distribution across the eight core directions."
  - "unmapped stays at zero during auto-allocation but remains editable for manual direction budgets."
  - "Profitability percentages are withheld when budget or cost inputs are not trustworthy."
patterns-established:
  - "The app computes money through a pure domain layer instead of inline page math"
  - "Issue-level cost is calculated once, then reduced into direction and overall totals"
requirements-completed: [COST-02, COST-03, PROF-01, PROF-03, PROF-04, PROF-05, PROF-06]
duration: 20 min
completed: 2026-04-08
---

# Phase 03 Plan 02: Money Engine Summary

**Budget allocation, deterministic cost aggregation, and tested profitability math**

## Performance

- **Duration:** 20 min
- **Started:** 2026-04-08T17:40:00Z
- **Completed:** 2026-04-08T18:00:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Added direction-budget allocation that starts from one total budget, distributes it evenly across the eight core directions, and then supports manual overrides including `unmapped`.
- Built a pure requirement-cost engine that converts snapshot issues plus assignee mappings into ledger rows, direction totals, warnings, and overall cost.
- Added overall and per-direction profitability helpers, including the inverse calculation for the extra amount needed to get back to 20%.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build direction-budget allocation from total budget plus manual overrides** - `11a14b1` (feat)
2. **Task 2: Build the issue ledger and direction cost aggregation** - `db2dada` (feat)
3. **Task 3: Implement overall and per-direction profitability math with target-margin deficit handling** - `d58fc63` (feat)

**Plan metadata:** pending

## Verification

- `npm test`
- `npm run build`

## Next Phase Readiness

- The main page can now consume ready-made money outputs instead of owning business logic, so the remaining work is user-facing wiring and persistence.

---
*Phase: 03-cost-engine*
*Completed: 2026-04-08*
