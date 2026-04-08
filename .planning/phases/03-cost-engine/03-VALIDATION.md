---
phase: 3
slug: 03-cost-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && npm run build` |
| **Estimated runtime** | ~15 seconds |

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
| 03-01-01 | 01 | 1 | COST-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | COST-04 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | COST-02 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | PROF-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | PROF-05 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | COST-03 | component | `npm test` | ✅ | ⬜ pending |
| 03-03-02 | 03 | 3 | PROF-02 | component | `npm run build` | ✅ | ⬜ pending |
| 03-03-03 | 03 | 3 | PROF-06 | component | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/costing/*.test.ts` — initial pure-domain coverage for directory, fallback rate, and profitability helpers
- [ ] `src/lib/costing/` — costing domain scaffold
- [ ] `app/assignees/page.tsx` — manual directory route shell

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Assignee directory edits persist after reload | COST-04 | Browser storage behavior is user-facing | Open the assignee page, add/edit entries, reload, and confirm the same rows remain |
| Task without assignee is highlighted but the page still shows cost totals | COST-03 | Visual tone and mixed-state UX need human judgment | Use a snapshot containing an unassigned task and confirm soft red highlighting plus `unmapped` totals |
| Invalid budget suppresses profitability percentage instead of showing fake numbers | PROF-06 | The absence state is UI-copy sensitive | Clear the budget input or set it to `0`, then confirm percentages disappear and guidance remains visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

