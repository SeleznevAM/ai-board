# Phase 02: ingestion-correctness - Research

**Researched:** 2026-04-08
**Domain:** YouTrack full-refresh ingestion correctness, snapshot completeness, and aggregation semantics
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Refresh model
- **D-01:** При ручном обновлении система должна делать полный переснимок требования из YouTrack с нуля, а не частично обновлять отдельные ветки дерева.

### Status-based hours policy
- **D-02:** Источник часов зависит от статуса задачи.
- **D-03:** Если задача находится в статусах `на проверке QA`, `сделана`, `утверждена`, она считается закрытой и для нее нужно брать поле `затраченное время`.
- **D-04:** Если задача находится в статусах `зарегистрирована`, `открыта`, `в работе`, `код ревью`, для нее нужно брать поле `оценка`.
- **D-05:** Если у задачи неожиданный статус, для нее тоже нужно брать поле `оценка`.
- **D-06:** В одном дереве требования допустимо суммировать задачи, часть которых считается по `затраченному времени`, а часть по `оценке`.

### Incomplete data behavior
- **D-07:** Если у задачи нет оценки в том случае, когда по ее статусу должна использоваться оценка, расчет не должен выполняться.
- **D-08:** Нужное поле в модели YouTrack считаем существующим всегда; проблема для блокировки расчета — это отсутствие значения, а не отсутствие самого поля.

### UI for blocked calculation
- **D-09:** Задача без оценки должна быть выделена в дереве мягким красным цветом, без агрессивного визуального акцента.
- **D-10:** Справа сверху должно показываться закрываемое сообщение о том, какие задачи не оценены.
- **D-11:** В сообщении об ошибке должен быть перечислен список неоцененных задач.
- **D-12:** В карточке проблемной задачи в дереве должна быть ссылка на задачу в YouTrack.
- **D-13:** Ссылка на задачу должна вести прямо на задачу в YouTrack по `readable key`.

### Claude's Discretion
- Точная форма хранения snapshot-данных после переснимка, если она не меняет пользовательскую семантику фазы.
- Конкретный визуальный тон красной подсветки и расположение toast/error-блока при соблюдении условия "не вырвиглазно".
- Внутренний способ нормализации статусов YouTrack, если он не меняет зафиксированные правила выбора поля часов.

### Deferred Ideas (OUT OF SCOPE)
- Подробная explainability до отдельных worklog-записей — это уже больше похоже на будущие explainability/v2-задачи.
- Настройка статусной модели пользователем в интерфейсе — вне границ текущей фазы, сейчас статусы фиксированы решениями выше.
- Частичное обновление дерева вместо полного переснимка — сознательно не выбрано для v1.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| YTSC-04 | Система позволяет вручную обновить данные из YouTrack перед пересчетом и показывает момент последней синхронизации. | Immutable full-refresh snapshot with `refreshedAt`, separate refresh route/action, and explicit freshness status in response/UI. |
| WORK-01 | Система собирает фактически затраченное время по всем включенным задачам в иерархии требования. | Fetch scope first, then enrich each canonical issue with status, estimate custom field, and paginated work items/time tracking. |
| WORK-02 | Система корректно агрегирует трудозатраты по иерархии без двойного учета задач и worklog-записей. | Reuse Phase 1 canonical issue set, dedupe issues by issue ID, dedupe work items by work item ID per issue, aggregate from per-issue effective minutes only. |
| WORK-03 | Система сохраняет расчет в состоянии ошибки или частичного покрытия, если не удалось получить все обязательные данные для достоверного подсчета. | Split transport/integrity failures from business-rule blockers: `partial` for incomplete fetch, `blocked` for missing required estimate, never emit trusted total for either case. |
</phase_requirements>

## Summary

Phase 2 should stay additive to Phase 1, not a rewrite of it. The existing `buildScopeTree` flow already gives a canonical, deduplicated issue tree and blocked semantics for hidden descendants. Use that as the first step of ingestion, then build a separate immutable snapshot layer that enriches the resolved issue set with the fields needed for hours selection: status, estimate, and work items. Do not widen the existing scope route contract just to carry worklog data.

The safest design is a manual full-refresh pipeline that always rebuilds one snapshot from scratch for one root issue, stamps it with `refreshedAt`, and returns both the factual payload and a completeness verdict. Aggregation should happen only after each issue has exactly one computed `effectiveMinutes` value chosen by the locked status policy. This avoids double counting from both recursive traversal and paginated work-item reads.

**Primary recommendation:** Keep Phase 1 scope contracts stable, add a sibling ingestion snapshot domain and route, and make completeness explicit with `ready` / `partial` / `blocked` snapshot semantics.

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` file exists in the repository root, so there are no additional project-specific constraints beyond the phase context, roadmap, and current code.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.14 | App Router UI plus server route handlers for refresh endpoints | Already in use; Phase 2 can add route handlers and UI state without introducing a second backend. |
| React | 19.0.0 | Manual refresh UI, freshness/status rendering, blocked issue highlighting | Already in use; enough for the current scope without extra client-state libraries. |
| TypeScript | 5.9.2 | Typed snapshot contracts, issue enrichment, and aggregation rules | Critical for preventing contract drift between scope, ingestion, and later cost-engine inputs. |
| Vitest | 3.2.4 | Unit tests for pagination, policy selection, and aggregation correctness | Already established in Phase 1 and fast enough for a dense correctness suite. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `fetch` in Next route handlers | platform | Call YouTrack issue, custom field, and work-item endpoints | Reuse the existing transport pattern in `src/lib/youtrack/client.ts`. |
| Next Route Handlers | 15.5.14 | Expose refresh/snapshot server endpoint | Use for manual user-triggered refresh before calculation. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A new snapshot route beside `/api/scope` | Widen `/api/scope` into a multi-purpose ingestion endpoint | This couples Phase 1 scope discovery to Phase 2 snapshot semantics and raises regression risk for already-verified behavior. |
| Separate ingestion contracts | Expanding `YouTrackIssueNode` with status/estimate/work items | This pollutes the narrow Phase 1 scope contract with Phase 2-only data and makes tests/UI more brittle. |

**Installation:**
```bash
# No new package is required for the recommended Phase 2 shape.
```

**Version verification:** `package.json` and installed tooling were inspected locally. Attempted `npm view` registry verification did not complete inside the sandbox, so package currency could not be independently verified from npm during this research run.

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── lib/
│   ├── scope/                  # Phase 1 traversal contract remains stable
│   ├── youtrack/               # Transport + typed external payloads
│   └── ingestion/              # New Phase 2 snapshot builder, policy, aggregation, types
app/
├── api/
│   ├── scope/route.ts          # Existing Phase 1 route, unchanged contract
│   └── snapshot/route.ts       # New manual full-refresh endpoint
└── page.tsx                    # Refresh action, freshness, completeness surfaces
```

### Pattern 1: Full Refresh Produces an Immutable Snapshot
**What:** Every manual refresh discards any in-flight derived totals and rebuilds a single snapshot DTO from current YouTrack data.
**When to use:** Every user-triggered refresh for one root issue.
**Example:**
```ts
// Source: current codebase + Phase 2 locked decision D-01
type SnapshotStatus = "ready" | "partial" | "blocked";

type IssueSnapshot = {
  issueId: string;
  readableKey: string;
  statusName: string | null;
  estimateMinutes: number | null;
  spentMinutes: number;
  effectiveMinutes: number | null;
  source: "estimate" | "spent";
  problems: readonly string[];
};

type RequirementSnapshot = {
  rootIssueKey: string;
  refreshedAt: string;
  status: SnapshotStatus;
  issues: readonly IssueSnapshot[];
  totalEffectiveMinutes: number | null;
  problems: readonly string[];
};
```

### Pattern 2: Two-Phase Fetch, Not One Fat Scope Request
**What:** Resolve the supported tree first, then enrich the canonical issue set with Phase 2 fields.
**When to use:** Always; it preserves Phase 1 semantics and lets Phase 2 reuse the dedupe/visibility guarantees already tested.
**Example:**
```ts
// Source: local pattern from src/lib/scope/buildScopeTree.ts
const scope = await buildScopeTree({ rootIssueKey, currentUserAccess });
const issueIds = collectUniqueIssueIds(scope.root);

for (const issueId of issueIds) {
  const details = await ingestionClient.fetchIssueDetails(currentUserAccess, issueId);
  const workItems = await ingestionClient.fetchAllWorkItems(currentUserAccess, issueId);
  // map -> per-issue factual record
}
```

### Pattern 3: Compute Per-Issue Effective Minutes Before Tree Aggregation
**What:** Decide one authoritative minutes value per issue, then sum issue totals. Do not sum raw work items while traversing the tree.
**When to use:** For all aggregate totals and later cost-engine inputs.
**Example:**
```ts
// Source: official YouTrack docs for StateIssueCustomField, PeriodValue, and Issue Work Items
function selectEffectiveMinutes(issue: {
  statusName: string | null;
  estimateMinutes: number | null;
  spentMinutes: number;
}): { source: "estimate" | "spent"; effectiveMinutes: number | null; problem?: string } {
  const normalized = normalizeStatus(issue.statusName);

  if (isClosedStatus(normalized)) {
    return { source: "spent", effectiveMinutes: issue.spentMinutes };
  }

  if (issue.estimateMinutes === null) {
    return {
      source: "estimate",
      effectiveMinutes: null,
      problem: "MISSING_REQUIRED_ESTIMATE",
    };
  }

  return { source: "estimate", effectiveMinutes: issue.estimateMinutes };
}
```

### Recommended Plan Shape

1. Keep Phase 1 contracts frozen, add new Phase 2 contracts and typed YouTrack fetch helpers for issue details, custom fields, and paginated work items.
2. Implement the snapshot builder and aggregation policy as pure server-side domain code with exhaustive tests for status mapping, missing estimates, pagination, and dedupe.
3. Add a new manual refresh endpoint and wire UI freshness/completeness states, issue highlighting, toast copy, and issue links without regressing `/api/scope`.

### Anti-Patterns to Avoid
- **Overloading `YouTrackIssueNode`:** Keep the Phase 1 scope node lightweight. Status, estimates, work items, and completeness belong to Phase 2 snapshot types.
- **Partial branch refreshes:** They directly contradict D-01 and make snapshot freshness impossible to explain.
- **Summing work items during recursive traversal:** This makes issue duplication and pagination duplication harder to prove away.
- **Deriving policy from `isResolved`:** The company policy is fixed by explicit Russian status names, not generic resolved/unresolved semantics.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Snapshot freshness | Implicit “last request time” in UI state | Explicit `refreshedAt` in the snapshot payload | Freshness must belong to the factual snapshot, not the component lifecycle. |
| Deduplication | Ad hoc array scans at each recursion step | Canonical `Set`/`Map` keyed by issue ID and work item ID | Correctness is easier to test and reason about once IDs are the only source of identity. |
| Issue status semantics | Heuristic “resolved means spent” logic | Fixed normalized name map for the locked statuses | The product decision is company-specific and intentionally stricter than generic YouTrack semantics. |
| Work-item totals | Assuming a single page or inline issue payload is complete | Paginated reads from `/api/issues/{issueID}/timeTracking/workItems` | Official docs cap most collection responses unless `$top`/`$skip` are handled. |
| Completeness handling | Returning a numeric total plus warning text | `ready` / `partial` / `blocked` snapshot states with numeric totals withheld when unsafe | Phase 2 is about trusted numbers; warnings without state semantics invite false confidence. |

**Key insight:** The hard part is not fetching YouTrack once. It is proving that every number in the snapshot came from one canonical issue set, one explicit source-of-hours rule, and one completeness verdict.

## Common Pitfalls

### Pitfall 1: Treating Scope Discovery and Snapshot Enrichment as the Same Contract
**What goes wrong:** Phase 2 changes break Phase 1 route/UI tests because the scope endpoint starts carrying worklog-specific state.
**Why it happens:** The current codebase has only one YouTrack route, so it is tempting to stuff ingestion into it.
**How to avoid:** Keep `/api/scope` and `YouTrackIssueNode` stable. Add new snapshot contracts and a separate route.
**Warning signs:** Existing Phase 1 tests need broad fixture rewrites just to add work-item logic.

### Pitfall 2: Missing Pagination on Work Items or Custom Fields
**What goes wrong:** Larger issues silently undercount spent time or miss the needed estimate/status field.
**Why it happens:** YouTrack collection resources are capped unless paginated.
**How to avoid:** Use a reusable paginated fetch helper with `$top` and `$skip` until the page is smaller than requested.
**Warning signs:** Totals match only on small fixtures; larger real issues look suspiciously low.

### Pitfall 3: Double Counting by Summing at Multiple Levels
**What goes wrong:** Parent and child totals are both included, or duplicate/cyclic references inflate totals.
**Why it happens:** Recursive traversal and aggregation get mixed into the same step.
**How to avoid:** Reuse the Phase 1 canonical tree, collect unique issue IDs once, compute one `effectiveMinutes` per issue, then reduce.
**Warning signs:** The same issue key appears twice in intermediate arrays or debug logs.

### Pitfall 4: Confusing “Missing Value” with “Field Missing”
**What goes wrong:** The implementation creates fallback behavior that contradicts D-08.
**Why it happens:** Custom field APIs are dynamic, so developers defensively handle absent fields and absent values the same way.
**How to avoid:** Model the field as expected to exist, but its `value` as nullable. Missing required estimate blocks calculation.
**Warning signs:** Code branches that silently replace `null` estimate with `0`.

### Pitfall 5: Using Generic Resolved Semantics Instead of Locked Status Names
**What goes wrong:** Unexpected statuses start using spent time even though D-05 requires estimate.
**Why it happens:** YouTrack exposes `StateBundleElement.isResolved`, which is tempting as a shortcut.
**How to avoid:** Normalize the returned name/localized name and map explicitly to the locked open/closed sets.
**Warning signs:** Policy tests assert on `isResolved` instead of status names.

## Code Examples

Verified patterns from official sources:

### Paginated Work-Item Fetch
```ts
// Source:
// https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-timeTracking-workItems.html
const PAGE_SIZE = 100;

async function fetchAllWorkItems(issueId: string): Promise<readonly IssueWorkItemDto[]> {
  const items: IssueWorkItemDto[] = [];

  for (let skip = 0; ; skip += PAGE_SIZE) {
    const page = await requestJson<IssueWorkItemDto[]>(
      `/api/issues/${encodeURIComponent(issueId)}/timeTracking/workItems`,
      {
        fields: "id,date,created,updated,duration(minutes,presentation),author(id,login,name)",
        $top: String(PAGE_SIZE),
        $skip: String(skip),
      },
    );

    items.push(...page);

    if (page.length < PAGE_SIZE) {
      return dedupeById(items);
    }
  }
}
```

### Custom-Field Read for Status and Estimate
```ts
// Source:
// https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-customFields.html
// https://www.jetbrains.com/help/youtrack/devportal/api-entity-StateIssueCustomField.html
// https://www.jetbrains.com/help/youtrack/devportal/api-entity-PeriodIssueCustomField.html
const fields =
  "id,name,$type,value(name,localizedName,isResolved,minutes,presentation)";

const customFields = await requestJson<readonly IssueCustomFieldDto[]>(
  `/api/issues/${encodeURIComponent(issueId)}/customFields`,
  { fields, $top: "100", $skip: "0" },
);
```

### Safe Aggregation Boundary
```ts
// Source: local codebase design recommendation for Phase 2
const issues = buildCanonicalIssueMap(scope.root);

const enriched = await Promise.all(
  Array.from(issues.keys()).map((issueId) => enrichIssue(issueId)),
);

const blockingProblems = enriched.filter((issue) => issue.effectiveMinutes === null);
const totalEffectiveMinutes =
  blockingProblems.length > 0
    ? null
    : enriched.reduce((sum, issue) => sum + issue.effectiveMinutes, 0);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 1 lightweight scope tree only | Scope tree as canonical input into a richer immutable snapshot | Phase 2 | Preserves verified traversal behavior while adding factual completeness. |
| Assuming collection endpoints are “small enough” | Explicit pagination on collection resources | Long-standing YouTrack REST pattern; docs current through 2025-2026 | Required for trustworthy totals on larger issues. |
| Generic issue status heuristics | Explicit business status-name mapping | Locked in Phase 2 context on 2026-04-08 | Prevents silent drift from company rules. |

**Deprecated/outdated:**
- Relying on a single issue fetch for all ingestion data: outdated for this phase because work items and custom fields are collection resources with pagination limits.

## Open Questions

1. **Exact custom-field names in the target YouTrack instance**
   - What we know: The API exposes custom fields by `name`, typed by `$type`, with period values in minutes.
   - What's unclear: The exact Russian/English field names for status, estimate, and spent-time fields in the real installation were not available in the local environment.
   - Recommendation: Planner should include an early fixture-capture task or configuration constant task for the exact field names before broad implementation.

2. **Whether Phase 2 freshness must survive page reloads**
   - What we know: YTSC-04 requires manual refresh and a visible last-sync moment.
   - What's unclear: There is no persistence layer in the current repo, and v1 history is out of scope.
   - Recommendation: Default to immutable snapshot payload + client-held freshness for this phase unless the planner explicitly decides to add durable storage.

3. **Whether visible issues can still hide work items in the target permissions model**
   - What we know: Reading issue work items requires issue access plus Read Work Item permission.
   - What's unclear: The target installation permissions were not available for live probing because `YOUTRACK_BASE_URL` and `YOUTRACK_TOKEN` are absent in this shell.
   - Recommendation: Treat work-item fetch failures as `partial` snapshot problems and test that explicitly.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js app, tests, build | ✓ | v24.14.1 | — |
| npm | Build/test scripts | ✓ | 11.11.0 | — |
| Python | Not required for this phase | ✓ | 3.9.6 | — |
| `YOUTRACK_BASE_URL` env var | Live YouTrack API calls | ✗ | — | Use official docs + test doubles during planning/research |
| `YOUTRACK_TOKEN` env var | Live YouTrack API calls | ✗ | — | Use official docs + test doubles during planning/research |

**Missing dependencies with no fallback:**
- None for planning. Live end-to-end verification against a real YouTrack tenant is blocked until `YOUTRACK_BASE_URL` and a valid bearer token are available.

**Missing dependencies with fallback:**
- Real YouTrack credentials are missing, but official JetBrains docs plus unit-test fixtures are sufficient to plan the phase safely.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | none — default Vitest invocation from `package.json` |
| Quick run command | `npm test` |
| Full suite command | `npm test && npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| YTSC-04 | Manual refresh returns snapshot with `refreshedAt` and visible freshness/completeness state | unit + route integration | `npm test` | ❌ Wave 0 |
| WORK-01 | Closed issues use spent time, open/unexpected issues use estimate | unit | `npm test` | ❌ Wave 0 |
| WORK-02 | No duplicate issue totals or work-item totals | unit | `npm test` | ❌ Wave 0 |
| WORK-03 | Missing required estimate blocks totals; fetch failures mark snapshot partial/error | unit + route integration | `npm test` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/ingestion/buildSnapshot.test.ts` — status policy, missing estimate blockers, canonical total rules
- [ ] `src/lib/youtrack/ingestionClient.test.ts` — pagination, custom-field extraction, work-item dedupe
- [ ] `app/api/snapshot/route.test.ts` or equivalent route-level coverage — refresh API status mapping and freshness metadata
- [ ] UI/component tests for blocked issue highlighting and closeable message surface, if the phase includes direct UI changes in this repo

## Sources

### Primary (HIGH confidence)
- Local codebase:
  - `src/lib/youtrack/client.ts` — current lightweight issue fetch pattern
  - `src/lib/scope/buildScopeTree.ts` — canonical recursive scope traversal and dedupe
  - `app/api/scope/route.ts` — existing route contract to preserve
  - `src/lib/scope/buildScopeTree.test.ts` — verified Phase 1 traversal guarantees
- Official JetBrains docs:
  - https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues.html — `Issue` entity includes `customFields`; collection pagination behavior
  - https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-customFields.html — issue custom fields endpoint, `$top`/`$skip`, 42-item collection limit
  - https://www.jetbrains.com/help/youtrack/devportal/api-entity-StateIssueCustomField.html — state field type and value shape
  - https://www.jetbrains.com/help/youtrack/devportal/api-entity-StateBundleElement.html — state value fields including `name`, `localizedName`, `isResolved`
  - https://www.jetbrains.com/help/youtrack/devportal/api-entity-PeriodIssueCustomField.html — period field type and nullable value
  - https://www.jetbrains.com/help/youtrack/devportal/api-entity-PeriodValue.html — period value exposes `minutes`
  - https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-timeTracking-workItems.html — issue work items endpoint, item fields, pagination
  - https://www.jetbrains.com/help/youtrack/devportal/operations-api-issues-issueID-timeTracking-workItems.html — required permissions and work-item field shapes
  - https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-timeTracking.html — time tracking availability per issue/project

### Secondary (MEDIUM confidence)
- `.planning/phases/02-ingestion-correctness/02-CONTEXT.md` — locked business rules for source-of-hours and blocking semantics
- `.planning/ROADMAP.md` — success criteria for freshness, correctness, and completeness
- `.planning/REQUIREMENTS.md` — requirement wording and traceability

### Tertiary (LOW confidence)
- None. Unverified claims were intentionally avoided.

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — existing repo versions are known, but npm-registry freshness could not be re-verified from the sandbox.
- Architecture: HIGH — strongly constrained by current codebase boundaries and locked phase decisions.
- Pitfalls: HIGH — supported by both Phase 1 code structure and official YouTrack collection/custom-field semantics.

**Research date:** 2026-04-08
**Valid until:** 2026-05-08
