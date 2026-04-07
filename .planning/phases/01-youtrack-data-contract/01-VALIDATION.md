---
phase: 1
slug: 01-youtrack-data-contract
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test -- buildScopeTree` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- buildScopeTree` once `01-02` creates the scope tests
- **After every plan wave:** Run `npm run test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | YTSC-01 | shell | `npm run build` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | YTSC-02 | unit-shell | `npm run test` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | YTSC-02 | unit | `npm run test -- buildScopeTree` | ✅ | ⬜ pending |
| 01-02-02 | 02 | 2 | YTSC-03 | integration | `npm run test -- buildScopeTree` | ✅ | ⬜ pending |
| 01-03-01 | 03 | 3 | YTSC-01 | component | `npm run test` | ✅ | ⬜ pending |
| 01-03-02 | 03 | 3 | YTSC-03 | component | `npm run test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration created by `01-01`
- [ ] `package.json` — contains `"test": "vitest run"`
- [ ] `npm run build` — succeeds after the app shell is created
- [ ] `src/lib/scope/buildScopeTree.test.ts` — regression coverage scaffold for phase-one scope logic

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tree renders with nested indentation on the page | YTSC-01 | Visual hierarchy presentation is easiest to confirm in-browser | Open the phase page, submit a valid root issue fixture, and confirm nested tasks render as a tree rather than a flat list |
| Blocked visibility state does not show a partial tree | YTSC-03 | UI trust behavior is visual and conditional | Trigger a partial-visibility fixture and confirm the blocked state appears without rendering `ScopeTree` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
