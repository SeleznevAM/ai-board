---
created: 2026-04-14T17:55:33.307Z
title: Fix assignee rate resolution
area: general
files:
  - src/lib/costing/assigneeDirectory.ts
  - src/lib/costing/calculateRequirementCost.ts
  - src/components/assignee-directory-form.tsx
  - src/lib/costing/storage.ts
---

## Problem

The profitability workspace can still route task cost into `unmapped` even when the assignee already exists in the internal assignee directory with the expected role and rate. This means the assignee identity used by the snapshot does not always resolve to the same identity stored in the directory, so cost is calculated with fallback average-rate logic instead of the intended personal rate.

This distorts both total cost and direction allocation, because spend that should land in a mapped role can be counted under `unmapped`.

## Solution

Investigate how assignee identity is extracted from YouTrack snapshots and how directory entries are normalized before lookup. Tighten the matching rules so existing assignees resolve reliably even when the incoming payload uses a different display form than the stored record.

Add regression coverage for real-world identity variants and verify that mapped assignees use their personal rate and direction instead of the `unmapped` fallback.
