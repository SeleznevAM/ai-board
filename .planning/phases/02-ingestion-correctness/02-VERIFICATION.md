---
phase: 02-ingestion-correctness
status: passed
verified: 2026-04-08
score: 3/3
---

# Phase 02 Verification

## Goal

Пользователь получает воспроизводимый снимок данных требования из YouTrack с ручным refresh, признаком свежести и явной блокировкой, если обязательных данных для доверенного расчета не хватает.

## Verified Requirements

- `YTSC-04` passed: the page triggers an explicit snapshot refresh and shows the timestamp of the last successful sync.
- `WORK-01` passed: the ingestion layer rebuilds the requirement snapshot from the full supported tree and normalizes issue hours by the agreed status model.
- `WORK-02` passed: snapshot aggregation de-duplicates visited issue IDs so the same issue is not counted twice.
- `WORK-03` passed: missing estimate data blocks the snapshot, highlights the offending issues in the tree, and surfaces a dismissible blocked-state card instead of returning a misleading result.

## Automated Checks

- `npm run test -- ingestion`
- `npm test`
- `npm run build`
- `grep -q "Last sync" src/components/root-issue-form.tsx`
- `grep -q "target=\"_blank\"" src/components/scope-tree.tsx`
- `grep -q "SNAPSHOT_BLOCKED" src/components/scope-state.tsx`

## Must-Haves

- Manual refresh produces a fresh snapshot payload and visible freshness feedback: passed
- Status-driven hour normalization chooses spent time for closed statuses and estimate for active or unexpected statuses: passed
- Missing estimates block downstream trust and are rendered as actionable UI, not hidden or coerced to zero: passed

## Notes

- The current implementation still uses custom field name matching for status, estimate, and spent time, so field label changes in YouTrack will need corresponding updates in the client parser.
- Client-side YouTrack links require `NEXT_PUBLIC_YOUTRACK_BASE_URL`; server-side refresh continues to rely on `YOUTRACK_BASE_URL` and auth configuration.

## Verdict

Phase 2 goal achieved. The app now produces a refreshable requirement snapshot with deterministic aggregation, freshness feedback, and explicit blocked-ingestion behavior that is safe to build cost calculations on top of.
