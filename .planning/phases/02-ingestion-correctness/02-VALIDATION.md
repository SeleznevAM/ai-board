---
phase: 2
slug: 02-ingestion-correctness
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test -- ingestion` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every normalization task:** Run the phase-2 targeted vitest selection
- **After every plan wave:** Run `npm run test`
- **Before verification:** Run `npm run build`
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | WORK-01 | unit | `npm run test -- ingestion` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | WORK-02 | unit | `npm run test -- ingestion` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | YTSC-04 | integration | `npm run test -- ingestion` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | WORK-03 | integration | `npm run test -- ingestion` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | WORK-03 | component | `npm run test` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | YTSC-04 | component | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] snapshot domain types for phase-two refresh and blocked states
- [ ] vitest coverage scaffold for status-based normalization
- [ ] route/service contract for manual refresh
- [ ] tree problem-state rendering test or route-level assertion for missing estimates

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Soft red highlighting of unestimated tasks is readable and not harsh | WORK-03 | Visual tone needs human judgment | Trigger a blocked snapshot and confirm the problematic tree node is visibly red but not aggressive |
| Dismissible error card appears in the top-right and lists all missing-estimate issues | WORK-03 | Layout and interaction are easiest to verify in-browser | Trigger a blocked snapshot, confirm list contents, and dismiss the card |
| Last sync timestamp reflects the latest successful full refresh | YTSC-04 | Browser-visible timing is user-facing | Run refresh twice and confirm the timestamp updates on the successful snapshot |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
