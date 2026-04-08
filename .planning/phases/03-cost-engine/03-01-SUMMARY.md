---
phase: 03-cost-engine
plan: "01"
subsystem: costing-contracts
tags: [typescript, costing, assignee-directory, vitest]
requires: [COST-01, COST-04]
provides:
  - "Assignee-aware snapshot and YouTrack contracts for Phase 3"
  - "Typed cost engine models for directory, warnings, ledger rows, and profitability outputs"
  - "Normalized assignee lookup with average-rate fallback"
affects: [03-02, 03-03, phase-3-verification]
tech-stack:
  added: [vitest]
  patterns: [assignee identity normalization, app-managed role-rate directory, average-rate fallback]
key-files:
  created:
    [
      src/lib/costing/types.ts,
      src/lib/costing/assigneeDirectory.ts,
      src/lib/costing/assigneeDirectory.test.ts
    ]
  modified:
    [
      src/lib/youtrack/contracts.ts,
      src/lib/youtrack/client.ts,
      src/lib/ingestion/types.ts,
      src/lib/ingestion/normalizeIssueHours.ts,
      src/lib/youtrack/client.test.ts,
      src/lib/ingestion/buildRequirementSnapshot.test.ts,
      src/lib/scope/buildScopeTree.test.ts
    ]
key-decisions:
  - "Phase 3 extends snapshot issues with assignee identity but keeps roles and rates outside YouTrack."
  - "Assignee lookup normalizes id/login/display name into one canonical key."
  - "Invalid or empty personal rates do not count as valid matches; fallback average rate remains the source of truth."
patterns-established:
  - "Role and rate data live in app-managed directory helpers rather than the snapshot layer"
  - "Fallback policies are encoded in pure functions with unit coverage before UI wiring"
requirements-completed: [COST-01, COST-04]
duration: 20 min
completed: 2026-04-08
---

# Phase 03 Plan 01: Costing Contracts Summary

**Assignee-aware contracts, directory resolution, and tested average-rate fallback**

## Performance

- **Duration:** 20 min
- **Started:** 2026-04-08T17:20:00Z
- **Completed:** 2026-04-08T17:40:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Extended the YouTrack and snapshot contracts so Phase 3 can carry assignee identity into the cost engine.
- Added canonical cost engine types for roles, warnings, direction totals, and profitability outputs.
- Implemented normalized assignee lookup and average-rate fallback with regression coverage for matched, unmapped, and missing-assignee cases.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define the costing contracts for assignee mapping and warnings** - `0e2b14d` (feat)
2. **Task 2: Implement assignee normalization, lookup, and average-rate fallback with tests** - `d05b3b3` (feat)

**Plan metadata:** pending

## Verification

- `npm test`
- `npm run build`

## Next Phase Readiness

- The cost engine now has a stable assignee identity contract and a tested directory fallback policy, so budget allocation and money aggregation can build on top of it without rethinking role/rate semantics.

---
*Phase: 03-cost-engine*
*Completed: 2026-04-08*
