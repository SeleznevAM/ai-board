# Stack Research

**Domain:** Internal web app for YouTrack-based profitability calculation
**Researched:** 2026-04-05
**Confidence:** MEDIUM-HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | 22 LTS | Runtime for the web app and background jobs | Use the conservative LTS baseline that was the standard production choice through 2025. It keeps package compatibility high while avoiding the churn of current-only releases. Confidence: HIGH. |
| TypeScript | 5.8.x | End-to-end type safety across API, calculations, and integration code | This product has non-trivial financial logic, recursive traversal, and role-rate mapping. TypeScript reduces category errors between YouTrack payloads, persisted snapshots, and profitability formulas. Confidence: HIGH. |
| Next.js | 15.x | Full-stack web framework for UI, server rendering, route handlers, and deployment | For an internal app, the fastest standard stack is one TypeScript codebase for UI plus backend endpoints. App Router fits authenticated dashboards, server-side data loading, and form-driven recalculations well. Confidence: HIGH. |
| React | 19.x | UI layer for the internal dashboard | React remains the default UI layer for Next.js and is the lowest-risk choice for tables, forms, and drill-down profitability views. Confidence: HIGH. |
| PostgreSQL | 16+ | Persistent storage for rate cards, role mappings, saved scenarios, sync state, and cached YouTrack snapshots | You need relational integrity for users, roles, budgets, scenarios, and snapshot history. PostgreSQL is the standard choice for internal line-of-business apps and removes the need for a separate analytics store at this scale. Confidence: HIGH. |
| Prisma ORM | 6.x | Database access, schema migrations, typed queries | Prisma is the pragmatic default for a greenfield TypeScript app where developer speed matters more than hand-optimized SQL from day one. It is especially useful here because the domain model is clear and relational. Confidence: MEDIUM-HIGH. |
| YouTrack REST API | Current `/api` endpoints | Source of truth for issues, links, users, and work items | Build the integration directly on the supported REST API. This product needs issue hierarchy traversal and work item aggregation; YouTrack exposes issue links, issue work items, and explicit field selection for that. Confidence: HIGH. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 4.x | Runtime validation for env vars, API inputs, and normalized YouTrack payloads | Use at every trust boundary: incoming request payloads, configuration, and transformed data from YouTrack. Confidence: HIGH. |
| `react-hook-form` | 7.x | Budget-edit and recalculation forms | Use for editable budget inputs, requested extra hours, and rate overrides. It keeps forms fast without overbuilding local state. Confidence: HIGH. |
| `@tanstack/react-query` | 5.x | Client-side fetching, cache invalidation, optimistic UI for recalculations | Use for user-triggered recalculation actions and drill-down panels where client state should stay in sync with server mutations. Confidence: MEDIUM-HIGH. |
| `@tanstack/react-table` | 8.x | Dense tables for role-level cost and profitability breakdowns | Use for the main profitability grid and expandable row details. It is better suited than a heavy enterprise grid for a focused internal app. Confidence: MEDIUM-HIGH. |
| `openid-client` | 6.x | SSO via the company IdP over OIDC | Use this as the default for internal tools that authenticate against Azure AD, Okta, or Google Workspace. It keeps the auth layer standards-based and avoids locking the stack to one higher-level auth abstraction. Confidence: MEDIUM. |
| `pino` | 9.x | Structured application logs | Use for API requests, YouTrack sync traces, and recalculation audit logs. Internal tools still need machine-readable logs when financial outputs are questioned. Confidence: HIGH. |
| `@sentry/nextjs` | 9.x | Error monitoring for UI and server code | Use from the first deployed version because profitability bugs will be operationally sensitive even in an internal app. Confidence: MEDIUM-HIGH. |
| `pg-boss` | 10.x | Background jobs using PostgreSQL | Add when YouTrack syncs become slow enough to move traversal and refresh work off the request path. It is a better fit than Redis-backed queues when Postgres is already mandatory. Confidence: MEDIUM. |
| `tailwindcss` | 4.x | Fast internal UI styling | Use for shipping quickly with a small design surface. This app needs clarity and speed more than a heavyweight component framework. Confidence: MEDIUM-HIGH. |
| `shadcn/ui` | current generator output | Accessible baseline components | Use selectively for dialogs, selects, tables, and form primitives. It keeps the UI consistent without forcing a full opinionated design system. Confidence: MEDIUM. |
| `chart.js` | 4.x | Simple trend and forecast visualizations | Use only for a few focused charts: margin trend, actual vs budget, and forecast delta. Do not introduce a more complex charting stack unless analysis screens expand materially. Confidence: MEDIUM. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `pnpm` | Package management | Fast, deterministic, and the current default choice for modern TypeScript monorepo or single-app setups. Confidence: MEDIUM-HIGH. |
| ESLint 9 + `typescript-eslint` | Linting for correctness | Use flat config and the `recommendedTypeChecked` baseline for a calculation-heavy codebase. Confidence: HIGH. |
| Prettier 3 | Formatting | Keep formatting boring and automatic. Confidence: HIGH. |
| Vitest | Unit and integration tests for calculation logic and data normalization | Put the profitability formula, rate mapping, and traversal normalization under dense test coverage here. Confidence: MEDIUM-HIGH. |
| Playwright | Browser tests for the main manager workflow | Cover: enter parent issue ID, load hierarchy, edit budgets, request extra hours, verify recalculated profitability. Confidence: HIGH. |
| Docker | Consistent local/dev/prod runtime | Package app + migrations + optional worker in one standard deployment path. Confidence: HIGH. |

## Installation

```bash
# Core
pnpm add next@15 react@19 react-dom@19 zod@4 @prisma/client pino

# Supporting
pnpm add react-hook-form @tanstack/react-query @tanstack/react-table \
  chart.js tailwindcss @sentry/nextjs

# Optional auth and jobs
pnpm add openid-client pg-boss

# Dev dependencies
pnpm add -D typescript@5.8 prisma vitest playwright eslint @eslint/js \
  typescript-eslint prettier
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 15 | NestJS backend + separate React/Vite frontend | Use only if the team already runs a strong backend/frontend split and expects this internal tool to grow into a larger multi-service platform. For greenfield MVP, it adds coordination cost without product benefit. |
| Prisma | Drizzle ORM | Use Drizzle if the team strongly prefers SQL-first control and already has good discipline around migrations and query composition. For this product, Prisma is faster to standardize. |
| PostgreSQL | MongoDB | Use MongoDB only if the rest of the company stack is already deeply document-oriented and reporting requirements stay very light. This product is relational by nature. |
| `pg-boss` | BullMQ | Use BullMQ only if Redis is already a mandatory platform dependency elsewhere. Do not add Redis just to queue YouTrack sync jobs. |
| `openid-client` | NextAuth/Auth.js | Use NextAuth/Auth.js only if the team already has working patterns for it and wants more batteries-included Next.js session handling. For a greenfield internal tool, direct OIDC is the less ambiguous default. |
| Tailwind + shadcn/ui | MUI | Use MUI if the org already standardizes on it and consistency with other internal apps matters more than bundle size and control. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| A separate Python ETL service for v1 | It creates a second deployment/runtime path for a problem that the Node app can already handle. That complexity is unjustified before sync scale is proven. | Keep ingestion in the Next.js app, then extract a worker later if needed. |
| MongoDB as the primary store | Budgets, rates, roles, scenario snapshots, and auditability are relational. You will end up rebuilding joins in application code. | PostgreSQL. |
| GraphQL between frontend and backend | This app has a narrow, stable domain. GraphQL adds schema and resolver overhead without solving a real composition problem. | Next.js route handlers or server actions with typed DTOs. |
| Redis-first architecture | Adding Redis for cache and queueing on day one is premature for a single-requirement internal calculator. | PostgreSQL first; add Redis later only if measured latency justifies it. |
| Building a YouTrack plugin first | The product is a management dashboard with its own budgeting and profitability model, not just a YouTrack UI extension. Plugins constrain UX and deployment. | Standalone internal web app integrating via REST API. |
| Legacy YouTrack `/rest` endpoints | JetBrains documents the legacy API as discontinued; new integration work should be on `/api`. | Current YouTrack REST API. |

## Stack Patterns by Variant

**If the app is company-internal and only accessible behind SSO/VPN:**
- Use Next.js + PostgreSQL + company OIDC SSO.
- Because the main problem is trusted access and fast delivery, not multi-tenant identity management.

**If YouTrack hierarchy scans become slow or rate-limited:**
- Add a dedicated sync worker with `pg-boss`, persist normalized snapshots, and serve UI reads from Postgres.
- Because the user-facing recalculation path should stay fast even when YouTrack traversal is expensive.

**If finance needs historical audit trails of every manual adjustment:**
- Add append-only scenario/version tables instead of overwriting budget inputs in place.
- Because profitability disputes are usually about “what changed and when,” not just the latest value.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@15.x` | `react@19.x` | This is the intended pairing for the current App Router stack. Confidence: HIGH. |
| `typescript@5.8.x` | ESLint 9 + `typescript-eslint` current line | Use flat config and type-aware linting. Confidence: HIGH. |
| `@prisma/client@6.x` | PostgreSQL 16+ | Safe default for this project shape; validate exact engine version during implementation. Confidence: MEDIUM-HIGH. |
| YouTrack REST `/api` | Field-selected requests and paginated collection reads | Important because collection endpoints have server-side limits and require explicit `fields`. Design the client around that from day one. Confidence: HIGH. |

## Recommended Default Architecture for This Product

Use a single deployable web app plus one optional worker:

1. `Next.js` app serves the dashboard, authenticated routes, and server endpoints.
2. A `YouTrack client` module fetches issue trees, work items, and user metadata from `/api`.
3. A `normalization layer` converts YouTrack data into internal domain records: issue snapshot, worklog entries, role mapping, rate card, profitability scenario.
4. `PostgreSQL` stores normalized snapshots, role/rate configuration, and saved recalculation scenarios.
5. The profitability engine runs in TypeScript on the server so one implementation feeds both UI responses and background refresh jobs.
6. Add a `pg-boss` worker only when sync latency or volume justifies asynchronous refreshes.

This is the standard 2025 shape because it minimizes moving parts while preserving a clean upgrade path.

## Sources

- https://www.jetbrains.com/help/youtrack/devportal/youtrack-rest-api.html — verified current YouTrack REST API direction and legacy `/rest` deprecation. Confidence: HIGH.
- https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-links-linkID-issues.html — verified issue link model includes `parent` and `subtasks`. Confidence: HIGH.
- https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-timeTracking-workItems.html — verified per-issue work item access, pagination, and explicit `fields` behavior. Confidence: HIGH.
- https://www.jetbrains.com/help/youtrack/devportal/api-entity-IssueWorkItem.html — verified available work item attributes such as `author`, `duration`, `date`, and `attributes`. Confidence: HIGH.
- https://nextjs.org/docs/app — verified App Router remains the primary Next.js architecture. Confidence: HIGH.
- https://nextjs.org/docs/13/pages/building-your-application/optimizing/open-telemetry — verified official OpenTelemetry support and self-hosted path. Confidence: MEDIUM.
- https://nodejs.org/en/about/previous-releases — verified current LTS guidance and release train. Confidence: HIGH.
- https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/ — verified TypeScript 5.8 as a current production baseline. Confidence: HIGH.
- https://www.prisma.io/docs — verified Prisma’s role as TypeScript ORM and PostgreSQL support. Confidence: MEDIUM-HIGH.
- https://zod.dev/packages/zod — verified Zod 4 stability. Confidence: HIGH.
- https://tanstack.com/table/docs/ — verified TanStack Table current docs and headless table approach. Confidence: MEDIUM-HIGH.
- https://www.chartjs.org/docs/latest/ — verified Chart.js current documentation. Confidence: MEDIUM.
- https://www.npmjs.com/package/openid-client — verified current `openid-client` 6.x line and runtime baseline. Confidence: MEDIUM.
- https://typescript-eslint.io/users/configs — verified recommended typed linting configs. Confidence: HIGH.
- https://playwright.dev/docs/intro — verified Playwright as the browser automation and E2E testing path. Confidence: HIGH.

---
*Stack research for: YouTrack profitability calculator*
*Researched: 2026-04-05*
