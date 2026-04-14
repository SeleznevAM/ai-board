---
phase: 4
slug: 04-scenario-editing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && npm run build` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `$gsd-verify-work`:** Run `npm test && npm run build`
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | AUDT-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | AUDT-02 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | REFO-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | REFO-02 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 2 | REFO-04 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | BUDG-01 | component | `npm test` | ✅ | ⬜ pending |
| 04-03-02 | 03 | 3 | REFO-03 | component | `npm run build` | ✅ | ⬜ pending |
| 04-03-03 | 03 | 3 | BUDG-02 | component | `npm run build` | ✅ | ⬜ pending |
| 04-03-04 | 03 | 3 | BUDG-03 | component | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/scenario/*.test.ts` — pure-domain coverage for scenario overlays, extra-hours pricing, and forecast profitability
- [ ] `src/lib/scenario/` — scenario state and forecast calculation scaffold
- [ ] `src/components/` scenario form coverage or focused interaction tests for task-card hour entry and refresh confirmation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Additional hours are added on the correct task card and clearly remain a scenario-only edit | REFO-01, AUDT-01 | Card-level UX and separation of fact vs forecast need human judgment | Load a requirement, add hours on one task card, confirm the task card shows the scenario edit without mutating the baseline snapshot presentation |
| Current and forecast metrics are visible together and easy to compare | REFO-03 | Relative emphasis and readability are visual concerns | Add scenario hours and verify current cost/profitability plus forecast cost/profitability are visible at the same time |
| Refresh with dirty scenario hours asks for confirmation before discarding them | AUDT-02 | Browser confirm flow and loss-prevention behavior are user-facing | Add scenario hours, trigger a new refresh, confirm a prompt appears, cancel once, then confirm discard on the second attempt |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
