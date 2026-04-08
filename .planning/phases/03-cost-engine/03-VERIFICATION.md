---
phase: 03-cost-engine
status: passed
verified: 2026-04-08
score: 4/4
---

# Phase 03 Verification

## Goal

Пользователь получает базовую себестоимость, разнесение по направлениям, общий и понаправленный бюджет, фактическую рентабельность и сумму дефицита до целевых 20% на основе уже доверенного snapshot из Phase 2.

## Verified Requirements

- `COST-01` passed: the application maps issue effort into directions through the app-managed assignee directory instead of YouTrack profile roles.
- `COST-02` passed: the app now computes and renders hours and costs both overall and per direction.
- `COST-03` passed: `unmapped` spend remains visible in the totals, and tasks without assignee are highlighted in the tree.
- `COST-04` passed: personal hourly rates are configurable on the dedicated assignee directory page.
- `PROF-01` passed: profitability math is centralized and uses the locked formula `(budget - cost) / budget * 100%`.
- `PROF-02` passed: the main page shows overall profitability for the requirement.
- `PROF-03` passed: per-direction profitability is computed from the materialized direction-budget map.
- `PROF-04` passed: budget, cost, delta, and profitability values are all exposed together in the UI.
- `PROF-05` passed: the UI shows the extra amount needed to return to the 20% target margin.
- `PROF-06` passed: invalid budgets suppress profitability percentages rather than showing fake values.

## Automated Checks

- `npm test`
- `npm run build`
- `grep -q "localStorage" src/components/assignee-directory-form.tsx`
- `grep -q "unmapped" src/components/budget-allocation-form.tsx`
- `grep -q "20%" src/components/cost-summary.tsx`
- `grep -q "BudgetAllocationForm" app/page.tsx`

## Must-Haves

- Assignee role/rate source of truth lives inside the app and not in YouTrack: passed
- One total budget can be expanded into direction budgets, then manually overridden without losing total-budget consistency: passed
- Missing-assignee and unmapped spend remain visible instead of disappearing from the money totals: passed
- Profitability withholds fake percentages when the budget is invalid: passed

## Notes

- Assignee directory persistence is browser-local for now. Multi-user/shared persistence remains future work.
- Manual browser verification of the editing flows was not performed in this pass; the route built successfully and the automated checks covered the domain logic and static rendering.

## Verdict

Phase 3 goal achieved. The app now has a functioning cost engine, a usable assignee-management flow, and a first profitability workspace that is strong enough to support Phase 4 scenario editing.
