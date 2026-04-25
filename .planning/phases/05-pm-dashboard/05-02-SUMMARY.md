---
phase: 05-pm-dashboard
plan: "02"
subsystem: ui
tags: [nextjs, react, vitest, dashboard, tabs, table]
requires:
  - phase: 04-scenario-editing
    provides: "Page-owned snapshot, scenario overlay, and current-vs-forecast profitability calculations"
  - phase: 05-pm-dashboard
    provides: "Overview-first dashboard primitives: status helper, tabs, and requirement decision card"
provides:
  - "Page composition that routes existing requirement state through the PM dashboard shell"
  - "Compact provenance placement that keeps the Overview viewport decision-first"
  - "Dense directions table with row-level 20% status semantics and contribution cues"
affects: [05-pm-dashboard, app/page.tsx, dashboard-ui, verification]
tech-stack:
  added: []
  patterns: ["Page-owned state composed into controlled dashboard tabs", "React element-tree tests for dense table row contracts"]
key-files:
  created: [src/components/direction-breakdown-table.test.tsx]
  modified: [app/page.tsx, src/components/direction-breakdown.tsx, src/components/scenario-origin-panel.tsx]
key-decisions:
  - "The page keeps ownership of snapshot, scenario, cost, and forecast state while the dashboard shell only redistributes presentation."
  - "Direction rows use forecast profitability semantics only when extra scenario hours exist; otherwise they keep current-state semantics."
  - "The directions contribution cue uses per-direction delta vs budget because that contract is present in DirectionProfitability while neededUpsell is not."
patterns-established:
  - "Overview stays compact by keeping refresh controls outside the tab content and pairing budgets with provenance instead of the old stacked summary flow."
  - "Dense dashboard diagnostics can be protected with row-level data attributes and element-tree tests without adding DOM test dependencies."
requirements-completed: []
duration: 7min
completed: 2026-04-16
---

# Phase 05 Plan 02: PM Dashboard Summary

**Decision-first page shell with compact overview composition and a dense per-direction scan table on the second tab**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-16T18:49:00Z
- **Completed:** 2026-04-16T18:55:41Z
- **Tasks:** 2 implemented, 1 pending human verification
- **Files modified:** 4

## Accomplishments
- Rewired `app/page.tsx` into the new PM dashboard shell without moving ownership of snapshot, scenario, costing, or forecast state out of the page.
- Compacted provenance placement so the decision card, not the old Phase 4 stack, owns the first desktop viewport.
- Replaced stacked direction cards with a dense row surface that shows budget, actual hours, extra hours, cost, profitability, and a contribution cue with full-row status semantics.

## Task Commits

Each implementation task was committed atomically:

1. **Task 1: Recompose `app/page.tsx` around the new PM dashboard shell without changing its data ownership** - `8f49b86` (feat)
2. **Task 2: Convert the directions surface into a dense desktop scan view with full-row health semantics** - `4c61f0c` (feat)

Checkpoint status:

3. **Task 3: Verify desktop scanability of the compact PM dashboard** - Pending human verification

## Files Created/Modified
- `app/page.tsx` - Routes existing page-owned state through the overview-first dashboard shell and keeps lookup controls accessible above the tab panels.
- `src/components/scenario-origin-panel.tsx` - Compacts provenance copy and spacing so it supports the shorter Overview viewport.
- `src/components/direction-breakdown.tsx` - Replaces stacked cards with a dense row table that applies whole-row status semantics.
- `src/components/direction-breakdown-table.test.tsx` - Locks the row contract, `unmapped` visibility, and contribution cue semantics.

## Decisions Made

- The page remains the only owner of canonical snapshot and scenario overlay state; the new shell is presentation-only.
- The dense directions surface uses the active forecast row when extra hours exist and otherwise reads from current profitability to preserve the agreed 20% semantics.
- The contribution cue is implemented as direction delta versus budget because that is available in the locked type contract and still satisfies the PM scan requirement.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched the direction contribution cue from `neededUpsell` to `delta`**
- **Found during:** Task 2 (Convert the directions surface into a dense desktop scan view with full-row health semantics)
- **Issue:** The plan example mentioned `needed to reach 20%`, but `DirectionProfitability` does not expose `neededUpsell`, so the build failed when the table tried to consume a non-existent field.
- **Fix:** Reworked the contribution cue to use the per-direction `delta` already present in the shared profitability contract.
- **Files modified:** `src/components/direction-breakdown.tsx`, `src/components/direction-breakdown-table.test.tsx`
- **Verification:** `npx vitest run src/components/direction-breakdown-table.test.tsx && npm run build`
- **Committed in:** `4c61f0c`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No scope change. The contribution cue stayed within the plan’s allowed contract examples and the implementation remains aligned with the dashboard goal.

## Issues Encountered

- A transient `git` index lock appeared while staging task 2 during parallel execution. Retrying once the lock cleared was sufficient.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The implementation is ready for the blocked desktop walkthrough from the plan checkpoint.
- Requirements are not marked complete yet because desktop scanability still needs human approval.

## Self-Check: PASSED

- Found summary file: `.planning/phases/05-pm-dashboard/05-02-SUMMARY.md`
- Found task commit: `8f49b86`
- Found task commit: `4c61f0c`
- Stub scan: no placeholder or TODO markers found in the modified implementation files

---
*Phase: 05-pm-dashboard*
*Completed: 2026-04-16*
