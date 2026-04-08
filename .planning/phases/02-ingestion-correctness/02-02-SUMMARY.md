---
phase: 02-ingestion-correctness
plan: "02"
subsystem: refresh-pipeline
tags: [snapshot, ingestion, route, vitest]
requires: [YTSC-04, WORK-01, WORK-02, WORK-03]
provides:
  - "Full requirement snapshot pipeline built from the phase-one canonical tree"
  - "Timestamped success payloads and blocked snapshot payloads"
  - "Regression coverage for mixed-source aggregation and missing-estimate blocking"
affects: [02-03, phase-2-execution]
tech-stack:
  added: [vitest]
  patterns: [canonical snapshot rebuild, blocked snapshot state, issue-id keyed aggregation]
key-files:
  created:
    [
      src/lib/ingestion/buildRequirementSnapshot.ts,
      src/lib/ingestion/buildRequirementSnapshot.test.ts
    ]
  modified:
    [src/lib/scope/types.ts, app/api/scope/route.ts]
key-decisions:
  - "Phase 2 refresh reuses the phase-one tree as its canonical source instead of inventing a second traversal."
  - "Blocked snapshots return the tree plus structured blocked issue data instead of a misleading ready state."
  - "Aggregation uses canonical issue IDs to avoid duplicate counting if a node is referenced twice in-memory."
patterns-established:
  - "Snapshot orchestration is separate from issue normalization"
  - "Route-level snapshot states preserve Phase 1 root error semantics and add blocked-ingestion behavior"
requirements-completed: [YTSC-04, WORK-01, WORK-02, WORK-03]
duration: 20 min
completed: 2026-04-08
---

# Phase 02 Plan 02: Refresh Pipeline Summary

**Full refresh snapshot orchestration, timestamped route payloads, and blocked-ingestion regression coverage**

## Performance

- **Duration:** 20 min
- **Started:** 2026-04-08T20:20:00Z
- **Completed:** 2026-04-08T20:40:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `buildRequirementSnapshot`, which rebuilds a requirement snapshot from the root issue using the phase-one canonical tree.
- Added snapshot blocking behavior and issue-level problem reporting for missing estimates.
- Updated `/api/scope` to return timestamped snapshot payloads on success and blocked snapshot payloads on ingestion failure while preserving root issue error handling.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the full requirement snapshot pipeline** - `c363d5f` (feat)
2. **Task 2: Expose manual refresh through the route with aggregation regression tests** - `975f34b` (feat)

**Plan metadata:** pending

## Files Created/Modified

- `src/lib/ingestion/buildRequirementSnapshot.ts` - full snapshot orchestration and aggregation
- `src/lib/ingestion/buildRequirementSnapshot.test.ts` - regression coverage for full refresh, mixed spent/estimate aggregation, and missing estimate blocking
- `src/lib/scope/types.ts` - extended route-facing state shapes for snapshot freshness and blocked issues
- `app/api/scope/route.ts` - route now returns snapshot-ready or snapshot-blocked responses

## Decisions Made

- Kept the refresh pipeline downstream of `buildScopeTree` so tree identity and refresh identity cannot drift apart.
- Returned blocked issue data in the route payload, because Phase 3 UI work needs the offending tasks and tree together.
- Preserved Phase 1 root issue errors as exceptions instead of folding them into the new snapshot-blocked state.

## Verification

- `grep -q "export async function buildRequirementSnapshot" src/lib/ingestion/buildRequirementSnapshot.ts`
- `grep -q "buildRequirementSnapshot" app/api/scope/route.ts`
- `grep -q "missing estimate" src/lib/ingestion/buildRequirementSnapshot.test.ts`
- `npm run test -- ingestion`
- `npm test`
- `npm run build`

## User Setup Required

None beyond the existing local YouTrack configuration.

## Next Phase Readiness

- The backend now exposes the data and blocked-state contract that `02-03` needs for refresh feedback and UI highlighting.
- The route can already distinguish trustworthy snapshots from blocked ingestion results.

---
*Phase: 02-ingestion-correctness*
*Completed: 2026-04-08*
