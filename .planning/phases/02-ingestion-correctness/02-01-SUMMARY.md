---
phase: 02-ingestion-correctness
plan: "01"
subsystem: ingestion-contract
tags: [youtrack, ingestion, normalization, vitest]
requires: [WORK-01, WORK-02]
provides:
  - "Phase-two field contract for YouTrack status, estimate, and spent time"
  - "Canonical snapshot issue type for later refresh aggregation"
  - "Status-based hours normalization with regression coverage"
affects: [02-02, 02-03, phase-2-execution]
tech-stack:
  added: [vitest]
  patterns: [status-based normalization, canonical snapshot issue type, defensive custom-field parsing]
key-files:
  created:
    [
      src/lib/ingestion/types.ts,
      src/lib/ingestion/normalizeIssueHours.ts,
      src/lib/ingestion/normalizeIssueHours.test.ts
    ]
  modified:
    [src/lib/youtrack/contracts.ts, src/lib/youtrack/client.ts, src/lib/scope/buildScopeTree.test.ts]
key-decisions:
  - "Phase 2 normalizes issue hours by the locked company status model instead of a single source field."
  - "Missing estimate is represented as a blocking issue-level problem, while spent-time rows remain non-blocking in this plan."
  - "The existing YouTrack client now exposes status, estimate, and spent-time values without breaking Phase 1 tree traversal."
patterns-established:
  - "Canonical snapshot node type decouples ingestion math from raw YouTrack payload shapes"
  - "Custom field parsing is centralized in the YouTrack client and normalized before business rules run"
requirements-completed: [WORK-01, WORK-02]
duration: 20 min
completed: 2026-04-08
---

# Phase 02 Plan 01: Ingestion Contract Summary

**Status-based hours normalization, canonical snapshot issue typing, and phase-two YouTrack field parsing**

## Performance

- **Duration:** 20 min
- **Started:** 2026-04-08T20:00:00Z
- **Completed:** 2026-04-08T20:20:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Extended the YouTrack issue contract and client field request to expose phase-two values for status, estimate, and spent time.
- Added the canonical `SnapshotIssueNode` type as the future base for refresh snapshots and aggregation.
- Implemented and tested `normalizeIssueHours` against the locked company status model, including fallback to estimate for unexpected statuses and blocked results for missing estimate.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend the YouTrack contract for phase-two hours fields** - `bd1d998` (feat)
2. **Task 2: Implement status-based hours normalization with regression coverage** - `8bd418b` (feat)

**Plan metadata:** pending

## Files Created/Modified

- `src/lib/youtrack/contracts.ts` - phase-two status and hours fields on canonical issue nodes and raw payloads
- `src/lib/youtrack/client.ts` - custom-field parsing for status, estimate, and spent-time values
- `src/lib/ingestion/types.ts` - canonical issue snapshot typing
- `src/lib/ingestion/normalizeIssueHours.ts` - status-based hours normalization logic
- `src/lib/ingestion/normalizeIssueHours.test.ts` - regression coverage for the company status model
- `src/lib/scope/buildScopeTree.test.ts` - compatibility update for the expanded issue contract

## Decisions Made

- Kept the phase-two field parsing inside the existing YouTrack client so later refresh logic can stay focused on snapshot orchestration.
- Treated unexpected statuses as estimate-based exactly as locked in `02-CONTEXT.md`.
- Kept missing estimate as the only blocking normalization problem in this plan to stay aligned with the user's explicit business rule.

## Verification

- `grep -q "SnapshotIssueNode" src/lib/ingestion/types.ts`
- `grep -q "export function normalizeIssueHours" src/lib/ingestion/normalizeIssueHours.ts`
- `grep -q "unexpected status" src/lib/ingestion/normalizeIssueHours.test.ts`
- `npm run test -- ingestion`
- `npm test`
- `npm run build`

## User Setup Required

None beyond the existing local YouTrack configuration already used in Phase 1.

## Next Phase Readiness

- The repository is ready for `02-02` to build a full requirement snapshot pipeline on top of the canonical issue contract.
- Status-to-hours-source policy is now frozen in tested code, which removes ambiguity from later aggregation work.

---
*Phase: 02-ingestion-correctness*
*Completed: 2026-04-08*
