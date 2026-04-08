---
phase: 02-ingestion-correctness
plan: "03"
subsystem: refresh-ui
tags: [nextjs, ui, snapshot, blocked-state]
requires: [YTSC-04, WORK-03]
provides:
  - "Manual snapshot refresh flow with last successful sync feedback"
  - "Soft-highlighted blocked issues inside the requirement tree"
  - "Dismissible blocked-snapshot card with direct links back to YouTrack issues"
affects: [phase-2-verification]
tech-stack:
  added: [react-client-components]
  patterns: [refresh-first ui, dismissible blocked state, linked tree diagnostics]
key-files:
  created: []
  modified:
    [
      src/components/root-issue-form.tsx,
      src/components/scope-tree.tsx,
      src/components/scope-state.tsx,
      app/page.tsx,
      src/lib/scope/types.ts
    ]
key-decisions:
  - "Blocked snapshot responses render the tree and the warning surface together so the user can diagnose missing estimates without losing context."
  - "The refresh UI surfaces only the last successful sync timestamp, which avoids implying that blocked snapshots are trustworthy for downstream calculations."
  - "YouTrack issue links are derived from the configured base URL plus readable issue key so the UI can jump directly to remediation."
patterns-established:
  - "Page shell separates ready, blocked, and error states while preserving one shared tree container"
  - "Blocked issue highlighting stays in the tree instead of moving diagnosis into a detached table"
requirements-completed: [YTSC-04, WORK-03]
duration: 20 min
completed: 2026-04-08
---

# Phase 02 Plan 03: Refresh UI Summary

**Manual snapshot refresh feedback, blocked issue highlighting, and dismissible remediation surfaces**

## Performance

- **Duration:** 20 min
- **Started:** 2026-04-08T16:55:00Z
- **Completed:** 2026-04-08T17:16:36Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Updated the root issue flow so the user explicitly refreshes a requirement snapshot and sees the last successful sync time.
- Rendered blocked snapshot issues directly inside the tree with a soft red treatment and direct links to the corresponding YouTrack issues.
- Added a dismissible blocked-snapshot card that lists unestimated issues while keeping normal error states unchanged.

## Task Commits

This plan was implemented in a single feature commit because `app/page.tsx` coordinates both tasks and would otherwise force an artificial split:

1. **Task 1-2: Refresh UI and blocked snapshot surfaces** - `32e09e5` (feat)

**Plan metadata:** pending

## Files Created/Modified

- `src/components/root-issue-form.tsx` - refresh action and last successful sync display
- `src/components/scope-tree.tsx` - blocked issue highlighting and direct YouTrack links
- `src/components/scope-state.tsx` - dismissible blocked-snapshot warning card
- `app/page.tsx` - refresh-oriented page shell and blocked snapshot integration
- `src/lib/scope/types.ts` - explicit ready and blocked snapshot state types for the UI

## Decisions Made

- Reused the existing page shell rather than creating a second phase-two screen, so refresh and tree diagnostics stay in one place.
- Kept blocked snapshots renderable in the tree because the user asked to see problematic tasks in context, not only in a summary warning.
- Used `NEXT_PUBLIC_YOUTRACK_BASE_URL` for client-side links so the UI can open the exact issue without leaking bearer tokens.

## Issues Encountered

- `app/page.tsx` initially hit a TypeScript narrowing issue around `syncedAt`; introducing explicit `ReadyScopeState` and `BlockedSnapshotState` types resolved it cleanly.

## Verification

- `grep -q "Last sync" src/components/root-issue-form.tsx`
- `grep -q "dismiss" src/components/scope-state.tsx`
- `grep -q "target=\"_blank\"" src/components/scope-tree.tsx`
- `npm test`
- `npm run build`

## User Setup Required

- Keep `YOUTRACK_BASE_URL` configured for server-side requests.
- Keep `NEXT_PUBLIC_YOUTRACK_BASE_URL` configured if tree links should open live YouTrack issues from the browser.

## Next Phase Readiness

- Phase 2 now exposes a full refresh loop with trustworthy blocked-state behavior, so Phase 3 can focus on cost allocation and profitability without reworking ingestion UX.

---
*Phase: 02-ingestion-correctness*
*Completed: 2026-04-08*
