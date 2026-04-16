---
phase: 05-pm-dashboard
plan: "01"
subsystem: ui
tags: [nextjs, react, vitest, dashboard, accessibility]
requires:
  - phase: 04-scenario-editing
    provides: "Page-owned current-vs-forecast state, profitability summaries, and scenario overlay semantics"
provides:
  - "Presentation-only profitability status helper for whole-block 20% threshold styling"
  - "Controlled two-tab PM dashboard shell with Overview-first ordering"
  - "Compact requirement decision card with inline scenario values and subordinate needed-upsell output"
affects: [05-pm-dashboard, app/page.tsx, dashboard-ui]
tech-stack:
  added: []
  patterns: ["React element-tree component contract tests in Vitest", "Controlled ARIA tabs with mounted panels", "Presentation-only dashboard surfaces fed by existing profitability data"]
key-files:
  created: [src/components/dashboard-status.ts, src/components/pm-dashboard-tabs.tsx, src/components/requirement-decision-card.tsx, src/components/pm-dashboard-status.test.tsx, src/components/pm-dashboard-tabs.test.tsx, src/components/requirement-decision-card.test.tsx]
  modified: [vitest.config.ts]
key-decisions:
  - "The 20% threshold stays centralized in a presentation helper so block styling never reimplements profitability math."
  - "The dashboard shell remains controlled by the page and keeps both tab panels mounted to avoid turning tabs into a second state boundary."
  - "The overview summary is locked to three primary blocks, with needed upsell subordinate inside the margin block rather than as a fourth card."
patterns-established:
  - "Phase 05 UI primitives accept already-derived comparison objects and do not recompute budget, cost, or margin values."
  - "Dashboard component tests can protect structural UI contracts by inspecting React element trees when DOM dependencies are unavailable."
requirements-completed: [UI-01, UI-03]
duration: 9min
completed: 2026-04-16
---

# Phase 05 Plan 01: PM Dashboard Summary

**Overview-first PM dashboard primitives with controlled tabs, whole-block profitability status, and a three-block decision card**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-16T18:37:31Z
- **Completed:** 2026-04-16T18:46:43Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Added reusable dashboard status primitives that map the locked 20% rule to neutral, good, and risk block semantics.
- Added an accessible controlled two-tab shell that keeps `Обзор` first and `Направления` second without taking ownership of page data.
- Built and protected a compact requirement decision card with exactly three primary blocks, inline scenario secondary values, and subordinate `neededUpsell`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the missing UI test harness and Wave 0 coverage for dashboard primitives** - `977591b` (test)
2. **Task 2: Create presentation-only dashboard status and tab-shell primitives** - `c724e06` (feat)
3. **Task 3: Build the compact requirement decision card for Overview** - `8eae5b5` (feat)

## Files Created/Modified
- `src/components/dashboard-status.ts` - Centralizes threshold-to-surface presentation mapping for dashboard blocks.
- `src/components/pm-dashboard-tabs.tsx` - Exposes a controlled, accessible two-tab shell with mounted panels.
- `src/components/requirement-decision-card.tsx` - Renders the compact three-block overview card from existing current/forecast values.
- `src/components/pm-dashboard-status.test.tsx` - Locks the 20% status helper contract.
- `src/components/pm-dashboard-tabs.test.tsx` - Protects tab order, controlled behavior, and panel visibility.
- `src/components/requirement-decision-card.test.tsx` - Protects the three-block card structure and inline scenario contract.
- `vitest.config.ts` - Narrows the Vitest include pattern for repo tests.

## Decisions Made

- The helper layer owns only presentation semantics for the 20% threshold; profitability math remains in the costing domain.
- The tabs component keeps both panels mounted so later page wiring does not accidentally reset local child state when switching tabs.
- The decision card keeps `neededUpsell` inside the margin block to preserve the locked three-block overview structure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created minimal primitive scaffolds during Task 1 so the new tests could execute**
- **Found during:** Task 1 (Add the missing UI test harness and Wave 0 coverage for dashboard primitives)
- **Issue:** The plan’s first verification step targeted component tests for files that did not exist until Tasks 2 and 3.
- **Fix:** Added minimal versions of `dashboard-status`, `pm-dashboard-tabs`, and `requirement-decision-card` during the test task, then refined them in the later planned tasks.
- **Files modified:** `src/components/dashboard-status.ts`, `src/components/pm-dashboard-tabs.tsx`, `src/components/requirement-decision-card.tsx`
- **Verification:** `npx vitest run src/components/pm-dashboard-status.test.tsx src/components/pm-dashboard-tabs.test.tsx src/components/requirement-decision-card.test.tsx`
- **Committed in:** `977591b` (part of Task 1 commit)

**2. [Rule 3 - Blocking] Reworked the requested component-test setup to avoid unavailable npm installs**
- **Found during:** Task 1 (Add the missing UI test harness and Wave 0 coverage for dashboard primitives)
- **Issue:** The plan asked for `@testing-library/*` and `jsdom`, but package install attempts were blocked by DNS/network restrictions in the execution environment.
- **Fix:** Implemented component contract tests against the React element tree in the existing Node Vitest runtime instead of waiting on unavailable packages.
- **Files modified:** `src/components/pm-dashboard-status.test.tsx`, `src/components/pm-dashboard-tabs.test.tsx`, `src/components/requirement-decision-card.test.tsx`
- **Verification:** `npx vitest run src/components/pm-dashboard-status.test.tsx src/components/pm-dashboard-tabs.test.tsx src/components/requirement-decision-card.test.tsx`
- **Committed in:** `977591b` (part of Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both deviations were required to keep the plan executable in the current environment. The shipped UI contract stayed within the planned scope.

## Issues Encountered

- `npm install` failed twice for non-product reasons: first due a permissions issue in the default npm cache path, then due `ENOTFOUND` against `registry.npmjs.org` after moving the cache to `/tmp`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `app/page.tsx` can now be recomposed around the new controlled shell without moving calculation ownership out of the page.
- The locked Overview-first structure and block-level profitability semantics are covered by tests, so the next plan can focus on page composition and directions-tab density.

## Self-Check: PASSED

- Found summary file: `.planning/phases/05-pm-dashboard/05-01-SUMMARY.md`
- Found commit: `977591b`
- Found commit: `c724e06`
- Found commit: `8eae5b5`
- Stub scan: no placeholder or TODO markers found in the plan files

---
*Phase: 05-pm-dashboard*
*Completed: 2026-04-16*
