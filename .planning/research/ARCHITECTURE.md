# Architecture Research

**Domain:** Internal profitability calculator web app on top of YouTrack
**Researched:** 2026-04-05
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                           Presentation Layer                        │
├──────────────────────────────────────────────────────────────────────┤
│  Input Form   Budget Editor   Profitability Dashboard   Drilldowns  │
│  (root issue) (manual edits)  (total + per discipline) (issues/logs)│
└───────────────┬───────────────────────┬──────────────────────────────┘
                │ HTTP/JSON             │
┌───────────────▼───────────────────────▼──────────────────────────────┐
│                         Application Layer                            │
├──────────────────────────────────────────────────────────────────────┤
│ Calculation API  Sync Orchestrator  Scenario API  Reference Data API│
└───────────────┬───────────────┬───────────────┬──────────────────────┘
                │               │               │
┌───────────────▼───────────────▼───────────────▼──────────────────────┐
│                           Domain Layer                               │
├──────────────────────────────────────────────────────────────────────┤
│ YouTrack Tree Collector  Worklog Normalizer  Cost Mapper            │
│ Budget/Scenario Engine   Profitability Engine  Audit/Validation     │
└───────────────┬───────────────┬───────────────┬──────────────────────┘
                │               │               │
┌───────────────▼───────────────▼───────────────▼──────────────────────┐
│                        Data / Integration Layer                      │
├──────────────────────────────────────────────────────────────────────┤
│ YouTrack REST Client   Raw Sync Tables   Normalized Read Model      │
│ Scenario Tables        User-Role/Rate Tables  Snapshot Cache        │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `ui-app` | Accept root issue ID, show totals and per-discipline profitability, allow budget and additional-hours edits | SPA or server-rendered web UI with chart/table components |
| `calculation-api` | Expose one app-facing contract for sync status, calculations, scenario edits, and drilldowns | REST endpoints in the same deployable backend |
| `youtrack-sync` | Traverse nested issues recursively, paginate through linked issues and worklogs, persist raw payloads and sync metadata | Backend service/module with retry and rate-limit handling |
| `normalization` | Convert raw issues/worklogs/users into canonical internal records | Pure mapping layer plus DB upsert pipeline |
| `reference-data` | Own discipline list, user-role mapping, internal cost rates, validation rules | Admin/reference tables in Postgres |
| `scenario-engine` | Store editable budgets and requested additional hours without mutating imported source data | Scenario tables versioned per root issue calculation |
| `profitability-engine` | Compute actual cost, projected cost, delta to target margin, and threshold coloring inputs | Deterministic domain service with tested formulas |
| `read-model` | Serve fast dashboard queries for totals, discipline rows, issue drilldowns, and audit info | SQL views/materialized projections or denormalized tables |

## Recommended Project Structure

```text
apps/
├── web/                         # Internal UI
└── api/                         # Single backend deployable

packages/
├── domain/                      # Pure calculation and scenario rules
│   ├── profitability/           # Margin, target uplift, forecast logic
│   ├── budgeting/               # Editable budgets and additional hours
│   └── normalization/           # Role/discpline/cost mapping rules
├── integrations/
│   └── youtrack/                # REST client, pagination, traversal
├── application/                 # Use cases and orchestration
│   ├── sync-root-issue/
│   ├── recalculate-scenario/
│   └── get-profitability-report/
├── persistence/                 # Repositories, SQL, migrations
└── shared/                      # Types, config, auth helpers, logging
```

### Structure Rationale

- **`packages/domain/`:** Keeps profitability logic framework-agnostic and easy to test. This is the highest-risk logic and should not depend on HTTP or YouTrack payload shapes.
- **`packages/integrations/youtrack/`:** Isolates traversal, pagination, field selection, and API quirks behind one boundary.
- **`packages/application/`:** Owns workflow orchestration: sync, normalize, calculate, persist projection, return report.
- **`packages/persistence/`:** Prevents query code from leaking into domain logic and makes later reporting optimization easier.
- **`apps/web` + `apps/api`:** Greenfield internal app does not need microservices. A two-app monorepo keeps delivery fast while preserving clear module boundaries.

## Recommended Architecture

Use a **modular monolith with asynchronous ingestion and synchronous calculation reads**.

For v1, one backend service and one database are the right tradeoff. The expensive and failure-prone part is YouTrack traversal and worklog collection, not internal request volume. Keep integration, normalization, scenario management, and reporting as modules inside one deployable service, but treat them as separate boundaries from day one.

The critical design rule is:

1. **Imported facts are immutable within a sync snapshot.**
2. **User edits live in separate scenario data.**
3. **Profitability is always computed from `snapshot + scenario + reference rates`.**

That separation avoids the most common rewrite: mixing fetched worklogs with editable budget state in one mutable record.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| UI | Data entry, scenario editing, result visualization | Calculation API |
| Calculation API | Validate commands, return report DTOs, expose sync status | Application services |
| Sync Orchestrator | Start sync for root issue, track progress, re-run refreshes | YouTrack client, persistence |
| YouTrack Tree Collector | Fetch root issue, descend through `subtasks` / link relationships, dedupe issue IDs | YouTrack REST API, raw store |
| Worklog Collector | Fetch paginated work items for collected issues | YouTrack REST API, raw store |
| Normalizer | Map issues, worklogs, users, roles, disciplines into canonical records | Raw store, reference data |
| Reference Data Service | Resolve user-to-discipline, discipline-to-rate, active cost rules | Reference tables, scenario engine |
| Scenario Service | Persist editable budgets, additional requested hours, what-if inputs | Scenario tables, profitability engine |
| Profitability Engine | Compute totals and per-discipline report rows | Normalized records, scenario data |
| Reporting Read Model | Flatten report for UI, keep audit links to source items | Profitability engine, persistence |

## Architectural Patterns

### Pattern 1: Snapshot + Scenario Separation

**What:** Store imported YouTrack data as immutable sync snapshots, and store budgets/additional-hours as separate editable scenario records.
**When to use:** Always. This app has both imported facts and user-authored assumptions.
**Trade-offs:** Slightly more schema and orchestration work, but avoids corrupted audit trails and makes recalculation trivial.

**Example:**
```typescript
type SyncSnapshot = {
  snapshotId: string;
  rootIssueId: string;
  importedAt: string;
};

type Scenario = {
  scenarioId: string;
  snapshotId: string;
  budgetByDiscipline: Record<Discipline, number>;
  additionalHoursByDiscipline: Record<Discipline, number>;
};

function calculateReport(snapshot: NormalizedSnapshot, scenario: Scenario, rates: RateCard) {
  return profitabilityEngine.run({ snapshot, scenario, rates });
}
```

### Pattern 2: Backend-Owned Recursive Aggregation

**What:** The backend performs recursive traversal and pagination against YouTrack, then emits a normalized tree plus worklog set.
**When to use:** Always. YouTrack pagination limits and nested traversal make client-side fetching fragile.
**Trade-offs:** Slightly more backend code, but correctness and observability are much better.

**Example:**
```typescript
async function collectIssueTree(rootIssueId: string): Promise<string[]> {
  const seen = new Set<string>();
  const queue = [rootIssueId];

  while (queue.length) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);

    const issue = await youTrack.getIssue(current, {
      fields: "id,idReadable,summary,subtasks(id,idReadable)"
    });

    for (const child of issue.subtasks?.issues ?? []) {
      queue.push(child.idReadable);
    }
  }

  return [...seen];
}
```

### Pattern 3: Projection-Based Reporting

**What:** Build a report projection optimized for the UI instead of recalculating every join in every request.
**When to use:** After the first end-to-end version works. Start with on-demand calculation, then persist projections once shape stabilizes.
**Trade-offs:** Adds storage and refresh semantics, but keeps the dashboard fast and simpler to query.

**Example:**
```typescript
type ProfitabilityProjection = {
  rootIssueId: string;
  snapshotId: string;
  scenarioId: string;
  totalRevenue: number;
  totalCost: number;
  totalMarginPct: number;
  byDiscipline: DisciplineRow[];
  needsAdditionalApprovalAmount: number;
};
```

## Data Flow

### Request Flow

```text
[Manager enters root issue ID]
    ↓
[POST /calculations]
    ↓
[Sync Orchestrator]
    ↓
[Collect issue tree from YouTrack]
    ↓
[Collect worklogs for every collected issue]
    ↓
[Normalize issues/worklogs/users]
    ↓
[Join with user-role/rate reference data]
    ↓
[Create or update scenario defaults]
    ↓
[Run profitability engine]
    ↓
[Persist report projection]
    ↓
[Return dashboard DTO]
```

### Edit/Recalculation Flow

```text
[Manager edits budget or additional hours]
    ↓
[PATCH /scenarios/:id]
    ↓
[Scenario Service writes editable inputs only]
    ↓
[Profitability Engine recalculates from latest snapshot + scenario]
    ↓
[Projection updated]
    ↓
[UI rerenders total + per-discipline profitability]
```

### State Management

```text
[Server state cache/query client]
    ↓
[Dashboard page] ←→ [Edit forms]
    ↓ mutations
[Scenario API / Calculation API]
    ↓
[Backend recalculation]
    ↓
[Fresh report DTO]
```

### Key Data Flows

1. **Issue hierarchy ingestion:** Root issue ID enters the sync pipeline, which recursively expands child issues and persists a complete issue set for the calculation.
2. **Worklog normalization:** Raw work items are converted into canonical labor entries keyed by issue, author, discipline, minutes, and source snapshot.
3. **Cost resolution:** Canonical labor entries are joined against user-role mappings and rate cards. Unknown mappings are flagged explicitly instead of silently defaulting.
4. **Scenario recalculation:** Budget edits and requested extra hours update only scenario records; imported facts remain unchanged.
5. **Profitability reporting:** Total and per-discipline metrics are materialized into a projection tailored for dashboard, table, and export/drilldown needs.

## Suggested Build Order

1. **YouTrack ingestion backbone**
   - Implement root issue lookup, recursive child traversal, pagination, and raw snapshot persistence.
   - This de-risks the biggest unknown first: whether real YouTrack structures are consistent enough for reliable collection.

2. **Normalization and reference-data layer**
   - Create canonical tables for issues, worklogs, users, disciplines, role mappings, and rate cards.
   - Add validation for missing role mappings and duplicate user identities.

3. **Profitability engine**
   - Implement deterministic formulas for actual cost, projected cost, total margin, per-discipline margin, and required extra approval amount for target 20%.
   - Lock this down with tests before building a rich UI.

4. **Scenario editing**
   - Add editable budgets and additional-hours recalculation on top of immutable snapshots.
   - This creates the core product loop without coupling edits to source sync.

5. **Reporting UI**
   - Build the dashboard, discipline breakdown, color-threshold indicators, and issue/worklog drilldowns.

6. **Operational hardening**
   - Add refresh controls, sync status, audit visibility, retry behavior, and performance optimizations like persisted projections.

### Build Order Rationale

- Ingestion first, because if recursive collection is wrong, every downstream number is wrong.
- Normalization second, because profitability depends on clean discipline and rate resolution.
- Calculation before polished UI, because the product’s value is correctness, not interface volume.
- Projection optimization last, because v1 is single-requirement and internal; correctness beats premature denormalization.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 internal users | Single backend + Postgres. Compute on demand, persist snapshots and scenarios. |
| 100-1,000 internal users | Add background jobs for sync, cache latest projections, and introduce row-level audit/status tables. |
| 1,000+ or heavy scheduled syncing | Split ingestion worker from API process, queue sync jobs, and isolate read projections from write-heavy sync tables. |

### Scaling Priorities

1. **First bottleneck:** YouTrack I/O and pagination. Fix with background jobs, incremental refresh, and projection caching.
2. **Second bottleneck:** Reporting joins over raw worklogs. Fix with normalized labor tables and persisted profitability projections.

## Anti-Patterns

### Anti-Pattern 1: UI-Driven YouTrack Traversal

**What people do:** Fetch root issue, children, and worklogs directly from the browser.
**Why it's wrong:** Leaks credentials, breaks on pagination, duplicates traversal logic, and makes auditability poor.
**Do this instead:** Keep all traversal and aggregation in backend integration modules.

### Anti-Pattern 2: One Mutable “Calculation” Record

**What people do:** Store fetched worklogs, budgets, overrides, and computed totals in one row and keep mutating it.
**Why it's wrong:** You lose source-of-truth separation and can no longer explain whether a number came from YouTrack or a manual override.
**Do this instead:** Keep separate snapshot, scenario, and projection records.

### Anti-Pattern 3: Silent Role Fallbacks

**What people do:** If a user has no mapped discipline/rate, assign them to a default bucket automatically.
**Why it's wrong:** Profitability numbers become directionally wrong while looking precise.
**Do this instead:** Block or visibly flag unmapped users until reference data is fixed.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| YouTrack REST API | Backend-only REST client with pagination, field selection, and retry logic | Official docs show paginated collections and explicit `fields` selection; design for partial fetch retries |
| Internal identity or reference source | Optional sync or manual admin entry for user-role/rate mapping | Keep this decoupled from YouTrack so finance logic is not forced into issue tracker data |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI ↔ Calculation API | HTTP/JSON | Keep UI contract report-oriented, not raw-table oriented |
| Calculation API ↔ Application Services | Direct module calls | Fine inside a modular monolith |
| Application Services ↔ Domain Engine | In-process function calls | Domain stays pure and testable |
| Application Services ↔ Persistence | Repository/API boundary | Prevent SQL shape from leaking into business rules |
| Sync Orchestrator ↔ YouTrack Client | Typed adapter interface | Makes real API behavior easy to mock in tests |

## Sources

- JetBrains YouTrack Developer Portal, Issue Work Items: https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-timeTracking-workItems.html
- JetBrains YouTrack Developer Portal, Work Items: https://www.jetbrains.com/help/youtrack/devportal/resource-api-workItems.html
- JetBrains YouTrack Developer Portal, Issue Links: https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-links.html
- JetBrains YouTrack Developer Portal, Link Issues / Issue fields including `parent` and `subtasks`: https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-links-linkID-issues.html
- JetBrains YouTrack Developer Portal, Subtasks workflow examples showing recursive parent/subtask traversal: https://www.jetbrains.com/help/youtrack/devportal/Workflow-Subtasks.html
- JetBrains YouTrack Server documentation, default `Subtask` link type semantics: https://www.jetbrains.com/help/youtrack/server/link-types.html

---
*Architecture research for: internal profitability calculator web app on top of YouTrack*
*Researched: 2026-04-05*
