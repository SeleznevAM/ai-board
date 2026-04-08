---
phase: 03-cost-engine
plan: "03"
subsystem: ui
tags: [nextjs, react, localstorage, budgeting, profitability]
requires: [COST-01, COST-02, COST-03, COST-04, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06]
provides:
  - "Dedicated assignee directory page with local persistence"
  - "Requirement profitability workspace with total budget and direction-budget editing"
  - "In-context missing-assignee highlighting in the existing scope tree"
affects: [phase-3-verification]
tech-stack:
  added: [react-client-components]
  patterns: [browser-local directory persistence, budget form plus derived totals, page-level composition over pure domain helpers]
key-files:
  created:
    [
      app/assignees/page.tsx,
      src/components/assignee-directory-form.tsx,
      src/components/budget-allocation-form.tsx,
      src/components/cost-summary.tsx,
      src/components/direction-breakdown.tsx,
      src/lib/costing/storage.ts
    ]
  modified: [app/page.tsx, src/components/scope-tree.tsx]
key-decisions:
  - "The existing snapshot page remains the primary profitability workspace instead of introducing a second main screen."
  - "Assignee mappings persist in the browser through localStorage-backed helpers until a later phase introduces richer persistence."
  - "Tasks without assignee stay visible in the tree and are still costed through the documented average-rate fallback."
patterns-established:
  - "Pure cost domain in lib, lightweight orchestration in page components"
  - "Budget editing and warning states sit beside the scope tree instead of replacing it"
requirements-completed: [COST-01, COST-02, COST-03, COST-04, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06]
duration: 20 min
completed: 2026-04-08
---

# Phase 03 Plan 03: Cost UI Summary

**Assignee management, budget editing, and the first full profitability workspace**

## Performance

- **Duration:** 20 min
- **Started:** 2026-04-08T18:00:00Z
- **Completed:** 2026-04-08T18:19:21Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added a dedicated `/assignees` page where the user can maintain `assignee -> role + hourly rate` mappings in the browser.
- Extended the main requirement page with total-budget input, manual direction-budget editing, cost summary, direction breakdown, and profitability output.
- Updated the scope tree so tasks with no assignee are softly highlighted in-context and clearly labeled as average-rate `unmapped` spend.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the assignee directory page with local persistence** - `8a778f9` (feat)
2. **Task 2: Wire budget input, direction-budget editor, cost summary, and assignee warnings into the main page** - `6eeb4da` (feat)

**Plan metadata:** pending

## Verification

- `npm test`
- `npm run build`

## User Setup Required

- The assignee directory is currently stored in the browser, so mappings need to be entered in the browser where the PM will use the tool.

## Next Phase Readiness

- Phase 4 can now focus on scenario editing and budget provenance rather than basic cost/profitability mechanics.

---
*Phase: 03-cost-engine*
*Completed: 2026-04-08*
