---
phase: 04-scenario-editing
plan: "03"
subsystem: ui
tags: [nextjs, react, scenario-editing, profitability, provenance]
requires:
  - phase: 04-scenario-editing
    provides: "Page-level scenario state, forecast math, and task-card extra-hours editing"
provides:
  - "Current-versus-forecast summary metrics in the main workspace"
  - "Per-direction actual, extra-hour, and forecast profitability presentation"
  - "In-memory provenance panel with root issue, last sync, budgets, and issue-keyed scenario hours"
  - "Trust gating that hides scenario totals behind blocked snapshot messaging"
affects: [04-scenario-editing, 05-pm-dashboard]
tech-stack:
  added: []
  patterns: ["Side-by-side current/forecast metric groups", "Trustworthy-snapshot gating for scenario presentation"]
key-files:
  created: [src/components/scenario-origin-panel.tsx]
  modified: [app/page.tsx, src/components/cost-summary.tsx, src/components/direction-breakdown.tsx, src/components/scope-state.tsx]
key-decisions:
  - "Current and forecast totals remain visible side by side in the same cards instead of switching the workspace into a forecast-only mode."
  - "Scenario provenance stays minimal and in-memory, and only renders when the underlying snapshot is successful and trustworthy."
patterns-established:
  - "Scenario UI consumes the forecast pass as explicit current/forecast comparisons instead of recomputing labels in presentation components."
  - "Blocked YouTrack snapshots keep explanatory state dominant while suppressing derived scenario totals."
requirements-completed: [BUDG-02, REFO-02, REFO-03, AUDT-01, AUDT-02]
duration: 5min
completed: 2026-04-14
---

# Phase 4 Plan 3: Scenario Output and Provenance Summary

**Current-versus-forecast profitability surfaces with in-memory scenario provenance and blocked-snapshot trust gating**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-14T18:58:30Z
- **Completed:** 2026-04-14T19:03:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Reworked the cost summary to present current and forecast hours, cost, profitability, and needed upsell side by side with explicit labels.
- Reworked the direction breakdown so every direction stays visible with actual hours, extra hours, forecast cost, and forecast profitability.
- Added a minimal provenance panel and limited scenario output to trustworthy successful snapshots only.

## Task Commits

Each task was committed atomically:

1. **Task 1: Render current and forecast metrics side by side in the summary and direction breakdown** - `cbd695d` (feat)
2. **Task 2: Add minimal provenance output and gate scenario presentation on trustworthy snapshot state** - `57f4d20` (feat)

## Files Created/Modified
- `app/page.tsx` - Wires current and forecast values into the workspace, inserts provenance, and gates scenario surfaces behind trustworthy snapshots.
- `src/components/cost-summary.tsx` - Renders separate current and forecast metric groups with unchanged-scenario guidance.
- `src/components/direction-breakdown.tsx` - Renders per-direction current and forecast groups while preserving unchanged rows.
- `src/components/scenario-origin-panel.tsx` - Shows root issue, last sync, baseline budgets, scenario budgets, and issue-keyed extra hours.
- `src/components/scope-state.tsx` - Clarifies that blocked snapshots suppress scenario totals until the source snapshot is trustworthy.

## Decisions Made

- Current and forecast values stay on the same surfaces so PMs can compare fact and forecast without mode switches.
- Provenance is limited to the agreed Phase 4 audit fields and remains local to the current screen session.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Brief `git` index lock contention from parallel execution blocked staging twice; retrying after the lock cleared resolved it without code changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 scenario editing now exposes the forecast comparison and provenance context needed for the PM dashboard.
- No functional blockers remain for Phase 5, but visual verification of the new summary/provenance layout is still advisable in-browser.

## Self-Check: PASSED

- Found summary file: `.planning/phases/04-scenario-editing/04-03-SUMMARY.md`
- Found commit: `cbd695d`
- Found commit: `57f4d20`
- Found file: `src/components/scenario-origin-panel.tsx`

---
*Phase: 04-scenario-editing*
*Completed: 2026-04-14*
