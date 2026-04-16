---
phase: 5
slug: 05-pm-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/costing/calculateProfitability.test.ts src/lib/scenario/forecast.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/costing/calculateProfitability.test.ts src/lib/scenario/forecast.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | UI-01 | component | `npm run build` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | UI-03 | component | `npm run build` | ✅ | ⬜ pending |
| 05-02-01 | 02 | 2 | UI-01 | component | `npm run build` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 2 | UI-02, UI-03, UI-04 | component | `npm run build` | ✅ | ⬜ pending |
| 05-02-03 | 02 | 2 | UI-01, UI-02, UI-03, UI-04 | manual | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/requirement-decision-card.test.tsx` — covers UI-01
- [ ] `src/components/direction-breakdown-table.test.tsx` — covers UI-02 and part of UI-04
- [ ] `src/components/pm-dashboard-tabs.test.tsx` — covers tab switching, selected state, and panel visibility
- [ ] `src/components/pm-dashboard-status.test.tsx` — covers UI-03 status semantics
- [ ] `vitest.config.ts` or per-file docblocks — switch UI tests to `jsdom` instead of the current `node` environment
- [ ] Install test helpers: `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `jsdom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Overview tab feels compact and clearly desktop-first | UI-01 | Visual density and hierarchy need human judgment | Open the requirement page on desktop and confirm the overview tab reads as a short dashboard, not a long workspace |
| Full-block color status is readable and not overly aggressive | UI-03 | Color balance and scanability are design judgments | Inspect good/bad profitability states and confirm the whole block/row changes status while text remains readable |
| Tab split reduces clutter without hiding useful detail | UI-02, UI-04 | The usefulness of `Обзор` vs `Направления` is experiential | Switch between tabs and confirm overview stays compact while the directions tab holds the detailed scan surface |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
