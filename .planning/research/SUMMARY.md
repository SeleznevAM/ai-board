# Project Research Summary

**Project:** Инструмент расчета рентабельности по требованиям YouTrack
**Domain:** Internal YouTrack-based profitability calculator for project managers
**Researched:** 2026-04-05
**Confidence:** MEDIUM-HIGH

## Executive Summary

This product is a focused internal decision tool, not a general PSA or reporting suite. The research converges on one core workflow: a manager enters a single YouTrack root issue, the system recursively collects the full issue tree and worklogs, maps labor into fixed disciplines, applies editable discipline budgets and requested extra hours, and returns current margin, projected margin, and the additional customer budget required to restore the fixed 20% target. Experts build this kind of tool as an integration-heavy operational app with a narrow UX, deterministic domain rules, and strong auditability around imported facts versus manual assumptions.

The recommended implementation is a TypeScript modular monolith: Next.js 15 + React 19 for the UI and server endpoints, PostgreSQL 16+ for snapshots, scenarios, and reference data, Prisma for schema access, and a backend-owned YouTrack integration using the current `/api` endpoints. The architectural rule that matters most is `immutable sync snapshot + editable scenario + deterministic profitability engine`. That separation keeps imported worklogs trustworthy, makes recalculation cheap, and prevents the most likely rewrite where fetched data and manual overrides get mixed into one mutable record.

The main risks are not UI risks. They are domain-contract and trust risks: ambiguous hierarchy semantics, incomplete worklog ingestion from pagination or permissions, brittle role mapping, historical cost drift, and loss of auditability when budgets become editable. The roadmap should therefore front-load YouTrack scope definition and ingestion correctness before spending effort on dashboards or alerts. A polished UI on top of partial or non-reproducible numbers would be a product failure.

## Key Findings

### Recommended Stack

The stack research is decisive: use a conservative TypeScript web stack with one deployable app and one database. That matches the product’s shape, keeps the calculation engine in one language, and avoids premature service splits. The only meaningful optional infrastructure is a Postgres-backed worker for asynchronous syncs once real YouTrack traversal proves too slow for the request path.

**Core technologies:**
- `Node.js 22 LTS`: runtime baseline with broad package compatibility for app and background jobs.
- `TypeScript 5.8.x`: mandatory for calculation logic, normalization, and DTO safety.
- `Next.js 15.x` + `React 19.x`: fastest low-risk full-stack path for an internal dashboard.
- `PostgreSQL 16+`: source of truth for snapshots, scenarios, role mappings, rates, and audit history.
- `Prisma 6.x`: pragmatic ORM choice for a clear relational model in a greenfield TypeScript app.
- `YouTrack REST /api`: supported integration surface for issue hierarchy, links, and work items.
- `zod 4.x`: runtime validation at env, request, and normalization boundaries.
- `Vitest` + `Playwright`: test calculation correctness deeply and cover the manager workflow end to end.

Critical version constraints are stable and simple: `next@15.x` with `react@19.x`, TypeScript 5.8 on ESLint 9 flat config, and YouTrack integration designed around explicit `fields` plus paginated collection reads.

### Expected Features

The feature research is clear that v1 must stay narrow. Launch credibility depends on getting the single-requirement workflow right, not on adding portfolio views or a configurable finance platform. The app should optimize for “Is this requirement still profitable, what happens if the team asks for more hours, and how much more budget must I approve?”

**Must have (table stakes):**
- Parent requirement lookup by YouTrack ID.
- Recursive traversal of nested tasks, subtasks, and supported groups.
- Worklog aggregation into actual hours and actual cost.
- Role-to-discipline cost allocation for `devops`, `backend`, `analytics`, `frontend`, `mobiledev`, `qa`, `design`, `pm`.
- Editable budgets by discipline with immediate recalculation.
- Actual profitability at total and per-discipline levels.
- Forecast profitability from additional requested hours.
- Shortfall-to-target calculation for the 20% margin rule.
- Threshold-based health highlighting with freshness and explicit refresh.

**Should have (competitive):**
- Explainable profitability breakdown from total to discipline to issue/worklog drivers.
- Data-quality diagnostics for unmapped roles, zero-rate paths, and suspicious gaps.
- Saved snapshots for before/after negotiation states.
- Partial-coverage warnings when hierarchy or permissions make a result incomplete.

**Defer (v2+):**
- Multi-requirement portfolio dashboards.
- Broad PSA capabilities like invoicing, contracts, or capacity planning.
- Freeform scenario labs detached from current YouTrack state.
- User-configurable formulas or variable target thresholds.

### Architecture Approach

The architecture research strongly recommends a modular monolith with backend-owned ingestion and server-side calculation. The most important decision is to keep imported facts immutable, scenario inputs separate, and report projections derived from those two plus reference rates. That gives the roadmap a clean sequence: prove the data contract, normalize it, lock the engine, then expose editing and reporting flows.

**Major components:**
1. `YouTrack sync + tree/worklog collectors` — recursively fetch supported scope, paginate exhaustively, and persist raw snapshots with sync metadata.
2. `Normalization + reference data layer` — convert raw issues/worklogs/users into canonical records and resolve discipline/rate mappings.
3. `Scenario service + profitability engine` — keep editable budgets/additional hours separate from imported facts and compute deterministic totals, margins, and target shortfall.
4. `Reporting read model` — serve fast dashboard, breakdown, and audit DTOs without leaking raw storage concerns into the UI.
5. `UI app + calculation API` — accept the root issue workflow, scenario edits, refresh actions, and diagnostic drill-downs.

### Critical Pitfalls

The pitfalls research aligns with the stack and architecture reports: correctness and auditability risks dominate delivery risk.

1. **Ambiguous hierarchy semantics** — define a versioned ingestion contract for supported link types before building the calculator, and surface unsupported scope instead of guessing.
2. **Incomplete worklog ingestion** — implement full pagination, explicit `fields`, least-privilege token testing, and completeness diagnostics so missing data cannot masquerade as healthy margin.
3. **Brittle role mapping and historical pricing drift** — version role mappings and rate cards, keep an `Unmapped` bucket visible, and persist the costing basis used for each snapshot.
4. **Mixing baseline facts with editable scenarios** — model actuals, approved budget, and proposed extra hours as separate layers so recalculation stays explainable and reversible.
5. **Budgets without auditability or concurrency control** — record revision history, author, reason, and optimistic concurrency from the first editable-budget phase.
6. **Polished UI hiding partial data or noisy alerts** — make calculation health first-class and keep visual threshold status separate from notification logic.

## Implications for Roadmap

Based on the research, suggested phase structure:

### Phase 1: YouTrack Data Contract
**Rationale:** Every downstream number depends on defining what “included in the requirement” means in this specific YouTrack installation.
**Delivers:** Supported hierarchy semantics, approved link types, service account assumptions, explicit `fields` contract, and sample validation roots.
**Addresses:** Parent requirement lookup, recursive traversal foundation.
**Avoids:** Ambiguous hierarchy semantics and hidden scope drift.

### Phase 2: Ingestion and Completeness Backbone
**Rationale:** The highest product risk is incomplete or partial actuals, so ingestion correctness comes before UI polish.
**Delivers:** Recursive issue collection, paginated worklog harvesting, raw snapshot persistence, sync metadata, and completeness diagnostics.
**Addresses:** Recursive traversal, worklog aggregation, data freshness/recalculate.
**Avoids:** Pagination bugs, permission gaps, and false profitability from partial data.

### Phase 3: Reference Data and Costing Engine
**Rationale:** Once facts are collected, the next dependency is converting time into trustworthy discipline-level cost.
**Delivers:** Canonical normalized records, discipline model, role mapping workflow, rate-card model, and deterministic profitability formulas with dense tests.
**Addresses:** Role-to-discipline allocation, actual profitability, shortfall-to-target.
**Uses:** PostgreSQL, Prisma, TypeScript domain package, Zod validation, Vitest.
**Avoids:** Silent unknown-role leakage, historical pricing drift, and math edge-case failures.

### Phase 4: Scenario Editing and Recalculation
**Rationale:** The product becomes operationally useful only when managers can edit budgets and additional hours without corrupting baseline facts.
**Delivers:** Editable budgets by discipline, proposed extra-hours inputs, scenario persistence, recalculation API, revision history, and concurrency rules.
**Addresses:** Editable budgets, forecast profitability, shortfall-to-target.
**Implements:** Snapshot + scenario separation and server-side recalculation flow.
**Avoids:** Mixing actuals with forecasts, lost baselines, and unaudited budget edits.

### Phase 5: PM Dashboard and Explainability
**Rationale:** After correctness and state semantics are stable, the UI can safely optimize for speed of decision-making.
**Delivers:** Summary card, per-discipline table, traffic-light threshold states, freshness indicators, drill-down explanations, and visible calculation-health badges.
**Addresses:** Threshold highlighting, PM-focused requirement health summary, explainable profitability breakdown.
**Uses:** Next.js, React, React Hook Form, TanStack Table, React Query, Tailwind/shadcn.
**Avoids:** A black-box calculator and polished-but-misleading UI states.

### Phase 6: Operational Hardening and Optional Async Sync
**Rationale:** Hardening belongs after the core loop works on real data, because only then will true sync latency and alerting needs be known.
**Delivers:** SSO, structured logs, monitoring, access controls, optional `pg-boss` worker, projection caching, snapshot history, and cautious alerting.
**Addresses:** Saved snapshots, partial-coverage visibility, secure access, and non-noisy operational status.
**Avoids:** Over-broad permissions, repeated synchronous refresh cost, and alert fatigue.

### Phase Ordering Rationale

- The order follows hard dependencies discovered in the research: hierarchy semantics before ingestion, ingestion before costing, costing before scenario editing, and scenario editing before polished reporting.
- The grouping matches the architecture boundaries: integration first, then normalization/domain, then scenario state, then read model/UI.
- This order directly neutralizes the highest-risk pitfalls before they become expensive rewrites.
- Portfolio views, arbitrary scenario labs, and configurable formulas stay out of the roadmap until the single-requirement loop is trusted.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Needs environment-specific research on actual YouTrack link semantics, custom fields, permissions, and supported hierarchy rules.
- **Phase 2:** Needs validation against real YouTrack pagination volumes, permission gaps, and service-account completeness.
- **Phase 3:** Needs confirmation of where role data actually lives and whether historical versus current-rate costing is acceptable for v1.
- **Phase 6:** Needs security and operational decisions on SSO provider, least-privilege access model, and whether async sync is justified by latency.

Phases with standard patterns (skip research-phase):
- **Phase 4:** Scenario persistence, optimistic concurrency, and recalculation APIs are standard once the domain model is fixed.
- **Phase 5:** Internal dashboard implementation with forms, tables, and drill-downs is conventional once report DTOs are stable.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core stack choices are backed by official docs and standard 2025 TypeScript web patterns; auth and worker choices are slightly more situational. |
| Features | MEDIUM | Feature priorities are coherent and fit the project context, but competitive analysis relied partly on vendor product pages rather than deep implementation references. |
| Architecture | HIGH | The modular monolith, snapshot/scenario split, and backend-owned ingestion pattern are well supported by the domain and official YouTrack API behavior. |
| Pitfalls | MEDIUM | Pitfalls are credible and well reasoned from official YouTrack constraints plus operational experience, but some are inferential rather than directly source-verified. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Hierarchy scope contract:** Confirm which YouTrack link types beyond native parent/subtask, if any, count toward profitability in this installation.
- **Role source of truth:** Validate whether discipline mapping comes from YouTrack user fields, groups, an external directory, or manual admin data.
- **Historical costing policy:** Decide explicitly whether v1 uses effective-dated rates or a documented current-rate approximation.
- **Permission model:** Verify what a least-privileged service account can read versus what managers should be allowed to see in drill-downs.
- **Scale threshold for async sync:** Measure real root sizes and worklog volume before committing to background-job infrastructure.

## Sources

### Primary (HIGH confidence)
- [STACK.md](/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/research/STACK.md) — stack recommendations, version compatibility, and official-source-backed integration guidance.
- [ARCHITECTURE.md](/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/research/ARCHITECTURE.md) — component boundaries, data flow, and build order.
- [PITFALLS.md](/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/research/PITFALLS.md) — failure modes, prevention strategies, and phase-level warnings.
- JetBrains YouTrack REST API docs — issue links, work items, permissions, custom fields, and `/api` integration behavior.
- Next.js, Node.js, TypeScript, Prisma, Zod, Playwright, and TypeScript ESLint official docs — core platform and tooling validation.

### Secondary (MEDIUM confidence)
- [FEATURES.md](/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/research/FEATURES.md) — v1 scope, differentiators, and anti-features derived from project context plus PSA market references.
- Tempo, Productive, and Kantata public product materials — used for table-stakes and differentiator framing rather than implementation details.

### Tertiary (LOW confidence)
- None identified beyond the above; the main remaining uncertainty is environment-specific validation, not weak public sourcing.

---
*Research completed: 2026-04-05*
*Ready for roadmap: yes*
