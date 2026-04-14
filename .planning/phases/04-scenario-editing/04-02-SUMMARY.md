---
phase: 04-scenario-editing
plan: "02"
subsystem: ui
tags: [nextjs, react, scenario, budgeting, youtrack]
requires:
  - phase: 04-scenario-editing
    provides: pure scenario overlay contracts, immutable state helpers, and forecast derivation
provides:
  - page-level ephemeral scenario overlay rebuilt from the latest refresh context
  - refresh confirmation that discards dirty scenario edits only after explicit consent
  - issue-keyed scope-tree editing with apply and clear actions plus assignee-priced hints
affects: [04-03, ui, page-state, scope-tree, profitability-workspace]
tech-stack:
  added: []
  patterns: [ephemeral page-owned scenario overlay, guarded destructive refresh, issue-keyed tree editing]
key-files:
  created: []
  modified:
    - app/page.tsx
    - src/components/root-issue-form.tsx
    - src/components/budget-allocation-form.tsx
    - src/components/scope-tree.tsx
key-decisions:
  - "The page now owns canonical refresh results and a separate in-memory scenario overlay so reloads discard scenario edits automatically."
  - "Dirty refresh confirmation is only evaluated on form submit, which avoids warning during ordinary typing or task-card edits."
patterns-established:
  - "Baseline-versus-scenario budgets: the latest agreed budget snapshot stays read-only while scenario edits mutate a separate map."
  - "Task-card scenario controls: issue-keyed extra hours are applied from the tree and priced through the existing forecast helper."
requirements-completed: [BUDG-01, BUDG-02, BUDG-03, REFO-01, REFO-04, AUDT-01, AUDT-02]
duration: 6min
completed: 2026-04-14
---

# Phase 4 Plan 02: Scenario Workspace Wiring Summary

**Page-owned scenario overlay with guarded refresh resets, baseline-versus-scenario budget editing, and issue-keyed extra-hour controls in the scope tree**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-14T18:50:55Z
- **Completed:** 2026-04-14T18:56:13Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Replaced the single mutable budget state with a page-level scenario overlay that tracks baseline budgets separately from local scenario edits.
- Added a pre-submit refresh guard so a new YouTrack refresh asks for confirmation only when dirty scenario edits would be discarded.
- Extended task cards with issue-keyed extra-hours apply and clear actions plus scenario confirmation and assignee-priced cost hints.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace single budget state with a page-level scenario overlay and refresh discard guard** - `fb455a0` (feat)
2. **Task 2: Add task-card scenario editing keyed by issueKey in the existing scope tree** - `a1601ee` (feat)

## Files Created/Modified
- `app/page.tsx` - Owns canonical scope results, scenario overlay lifecycle, refresh guarding, and tree-level scenario edit handlers.
- `src/components/root-issue-form.tsx` - Accepts a pre-submit guard callback before posting a new scope refresh.
- `src/components/budget-allocation-form.tsx` - Shows baseline versus scenario budgets separately while editing only the scenario side.
- `src/components/scope-tree.tsx` - Adds issue-keyed extra-hours controls, per-card scenario confirmation, and added-cost hints.

## Decisions Made
- Kept scenario state local to `app/page.tsx` so refreshes can recreate the overlay from the latest synced context and page reloads clear scenario edits automatically.
- Disabled scenario controls for blocked snapshots by omitting tree edit callbacks unless the canonical scope refresh succeeded.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed refresh-origin typing for successful versus blocked scope payloads**
- **Found during:** Task 2 (Add task-card scenario editing keyed by issueKey in the existing scope tree)
- **Issue:** `npm run build` failed because the refresh handler assumed both success and blocked payloads exposed `issueKey` and nullable `syncedAt` with the same shape.
- **Fix:** Added a discriminated branch for root issue extraction and normalized `syncedAt` to `null` before materializing the overlay origin.
- **Files modified:** `app/page.tsx`
- **Verification:** `npm run build`
- **Committed in:** `a1601ee` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The auto-fix was required for the planned Task 2 build to pass. No scope expansion.

## Issues Encountered

- `rg` is not installed in this workspace, so file discovery fell back to `grep` and direct file reads.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The page now has the overlay state and issue-keyed edits needed for Phase `04-03` to render current-versus-forecast summary cards and provenance details.
- Refresh confirmation is wired only to form submission, which matches the UI spec and avoids false warnings during normal typing.

## Self-Check: PASSED

- Verified summary file exists at `.planning/phases/04-scenario-editing/04-02-SUMMARY.md`
- Verified task commits: `fb455a0`, `a1601ee`

---
*Phase: 04-scenario-editing*
*Completed: 2026-04-14*
