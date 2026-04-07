# Phase 1: YouTrack Data Contract - Research

**Researched:** 2026-04-07
**Domain:** YouTrack issue-tree contract and permission-aware visibility
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Scope semantics
- **D-01:** В v1 частью требования считается только основная иерархия `родитель -> подзадачи -> их подзадачи` до самого нижнего уровня.
- **D-02:** Неиерархические связи и связанные задачи вне основной иерархии в v1 полностью игнорируются.
- **D-03:** Игнорируемые неиерархические связи не нужно явно показывать пользователю как исключенные из расчета.

### Access model
- **D-04:** Система должна работать в контексте прав текущего пользователя, который открыл приложение, а не через единый сервисный аккаунт.
- **D-05:** Если пользователю недоступна хотя бы часть дерева задач, расчет не должен показываться вообще.

### Root issue handling
- **D-06:** Если `root issue` не существует, система показывает отдельную ошибку.
- **D-07:** Если `root issue` существует, но недоступна текущему пользователю, система показывает отдельную ошибку доступа.
- **D-08:** Если у `root issue` нет дочерних элементов, система все равно строит дерево из одной корневой задачи.

### Phase output
- **D-09:** На выходе этой фазы пользователь должен видеть дерево задач с вложенностью.

### Claude's Discretion
- Точная форма визуализации дерева задач.
- Формулировки ошибок и пустых состояний при соблюдении зафиксированной логики.
- Внутренний способ обхода дерева и нормализации данных YouTrack, если он не меняет пользовательские решения выше.

### Deferred Ideas (OUT OF SCOPE)
- Поддержка неиерархических связей как части scope — возможное расширение будущих фаз, но вне границ v1 Phase 1.
- Отдельная индикация исключенных связанных задач вне основной иерархии — отложено, так как пользователь решил не перегружать интерфейс этой версии.
- Общий сервисный доступ вместо пользовательского контекста — сознательно не выбран для v1.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| YTSC-01 | Пользователь может ввести ID родительской задачи YouTrack и запустить расчет по одному требованию. | Root lookup via `GET /api/issues/{issueID}` and explicit root error taxonomy. |
| YTSC-02 | Система определяет поддерживаемую иерархию задач для расчета и рекурсивно обходит все вложенные задачи до нижнего уровня. | Traverse only `subtasks` / `parent` hierarchy recursively; ignore non-hierarchical links for v1. |
| YTSC-03 | Система явно показывает, какие задачи были включены в расчет, а какие не были включены из-за ограничений доступа или неподдерживаемых связей. | Show included tree and calculation-blocking visibility diagnostics; unsupported links remain out of scope for v1 per locked decisions, but planner must reconcile requirement wording with phase decisions. |
</phase_requirements>

## Summary

Phase 1 should define a narrow, explicit YouTrack scope contract, not a generic "related issues" explorer. Current JetBrains docs support a clean v1 rule: use the native issue hierarchy exposed through issue `parent`/`subtasks`, recurse until leaf nodes, and do not include other link types in the calculation scope. YouTrack link types are configurable and can be marked as `aggregation`, but that does not make them safe to interpret as hierarchy for this product. The planner should treat `subtask` hierarchy as the only supported graph for Phase 1.

Permissions are the main product risk. The API is sparse by default, most collections are paginated, and visibility depends on the authenticated user. Phase 1 must run in current-user context and must not silently degrade to a partial tree. If any descendant is hidden or inaccessible, the tree can still be partially discovered but the calculation must be blocked and the UI must show an incomplete-visibility state instead of a trustworthy scope result.

The biggest unresolved item is root error taxonomy. The phase context requires separate errors for "root does not exist" and "root exists but is not accessible", but the official docs reviewed here do not clearly guarantee distinct status semantics for those cases. That means the plan must include a live verification task against the target YouTrack installation before implementation locks API-level behavior.

**Primary recommendation:** Plan Phase 1 around a versioned contract: `root issue -> recursive subtasks only`, fetched with explicit fields in current-user context, with hard blocking on any visibility gap and a mandatory spike to verify root error semantics in the real YouTrack instance.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| YouTrack REST API `/api` | Current docs published 2026-02 to 2026-04 | Source of issue, subtask, link-type, and current-user data | Official supported integration surface for YouTrack |
| `GET /api/issues/{issueID}` | Current | Read root issue and child hierarchy using explicit `fields` | Native issue entity already exposes hierarchical data |
| `GET /api/users/me` | Current | Confirm current authenticated user context | Simplest official identity probe for per-user access |
| `GET /api/issueLinkTypes` | Current | Discover configured link types and detect unsupported aggregation-style links | Needed for diagnostics and future-proofing against custom link setups |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `GET /api/issues/{issueID}/links` | Current | Inspect non-hierarchical links on included issues | Use for diagnostics or future phases, not for v1 traversal |
| `GET /api/issues?query=...` | Current | Optional fallback search/list endpoint | Use only if product later allows search by query rather than exact ID |
| Permanent token auth or OAuth-backed user session | Current docs | Carry current-user permissions into backend calls | Use whichever matches deployment model, but keep per-user identity intact |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `subtasks` traversal | Generic traversal over all `aggregation=true` link types | Too ambiguous for v1; link semantics are admin-configurable and can over-include scope |
| Raw REST with explicit `fields` | Third-party YouTrack client wrappers | Wrapper value is low here; planner needs contract clarity more than SDK abstraction |
| Current-user context | Shared service account | Contradicts locked decision D-04 and hides permission risk |

**Installation:**
```bash
# No phase-specific package is mandatory yet.
# The planning-critical dependency is access to the target YouTrack instance.
```

**Version verification:** JetBrains docs reviewed in current form:
- `REST API URL and Endpoints` published 2026-02
- `IssueLinkTypes` published 2026-03-24
- `Issue Links`, `Issues`, and `Issue Work Items` pages crawled from current docs in 2026

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── application/youtrack-scope/   # root lookup + recursive traversal use case
├── integrations/youtrack/        # raw REST client and field definitions
├── domain/scope-contract/        # normalized tree DTOs and visibility states
└── ui/phase-1/                   # root input + tree rendering + diagnostics
```

### Pattern 1: Contract-First Traversal
**What:** Define one normalized DTO for Phase 1 output before coding transport or UI details.
**When to use:** Immediately. The phase goal is data-contract clarity.
**Example:**
```typescript
type ScopeNode = {
  issueId: string;
  idReadable: string;
  summary: string;
  children: ScopeNode[];
  visibility: "visible" | "unknown-child-gap";
};

type ScopeResult =
  | { kind: "ok"; root: ScopeNode; completeness: "complete" }
  | { kind: "incomplete"; root: ScopeNode; completeness: "partial"; blockedReason: "hidden-descendant" }
  | { kind: "root-not-found" }
  | { kind: "root-forbidden" }
  | { kind: "integration-error"; message: string };
```

### Pattern 2: Explicit Field Selection Everywhere
**What:** Every YouTrack request declares `fields` explicitly.
**When to use:** Always. The docs state that unspecified fields are omitted, and many endpoints otherwise return only minimal identifiers.
**Example:**
```typescript
const fields =
  "id,idReadable,summary,parent(id,idReadable),subtasks(id,idReadable,summary)";
```

### Pattern 3: Hierarchy Traversal via `subtasks`, Not Generic Links
**What:** Traverse the tree through the native subtask relationship only.
**When to use:** For all Phase 1 inclusion logic.
**Example:**
```typescript
async function collectTree(rootId: string): Promise<ScopeNode> {
  const issue = await youTrack.getIssue(rootId, {
    fields: "id,idReadable,summary,subtasks(id,idReadable,summary,subtasks(id,idReadable,summary))"
  });

  return {
    issueId: issue.id,
    idReadable: issue.idReadable,
    summary: issue.summary,
    children: await Promise.all((issue.subtasks ?? []).map(child => collectTree(child.idReadable))),
    visibility: "visible"
  };
}
```

### Pattern 4: Visibility as a First-Class Domain State
**What:** Partial visibility is not a rendering detail; it is a contract outcome.
**When to use:** Whenever a descendant cannot be confirmed as readable in current-user context.
**Example:**
```typescript
type ScopeCompleteness =
  | { state: "complete" }
  | { state: "blocked"; reason: "hidden-descendant" | "permission-unknown" };
```

### Anti-Patterns to Avoid
- **Treating "related issues" as scope:** `links` contain arbitrary configured relationships and must not drive v1 inclusion.
- **Silent partial success:** Missing descendants cannot collapse to an apparently complete tree.
- **Client-side recursive fetching:** Traversal and permission handling belong on the backend for observability and deterministic error handling.
- **Assuming `aggregation=true` means supported hierarchy:** That flag includes predefined types like `Duplicate` and custom admin-defined links, which do not match v1 semantics.

## Recommended Contract Boundaries For Phase 1

### Included in supported scope
- Root issue itself.
- All descendants reachable only through native `subtasks` recursion.
- Single-node tree when root has no children.

### Explicitly excluded from supported scope
- `relates to`, `depends on`, duplicates, and any other non-subtask link type.
- Custom aggregation link types, even if admins configured them as structural.
- Work items, budgets, and profitability math.

### Contract outputs planner should require
- `root` tree with nested children.
- `completeness` state: `complete` or `blocked`.
- Distinct top-level root states: `root-not-found`, `root-forbidden`, `integration-error`.
- Minimal viewer metadata from `/api/users/me` for debugging and support.
- Source metadata: request timestamp, root ID entered, and field set/version used.

### Contract questions that must become plan tasks
1. Verify whether target YouTrack distinguishes nonexistent vs inaccessible root with different API responses.
2. Verify whether `subtasks` is sufficient in the target installation or whether some projects encode hierarchy differently.
3. Decide whether unsupported links need zero UI indication in Phase 1 or only an internal diagnostic count for debugging.
4. Decide how to detect incomplete descendants in practice if visibility failures surface as omission rather than explicit errors.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hierarchy semantics | Custom graph rules over every link type | Native `subtasks` / `parent` contract | Avoids ambiguous scope and future rewrite |
| User permission model | Shadow ACL in app DB | Current-user YouTrack API context + `/api/users/me` | YouTrack already owns issue visibility |
| Field introspection | Loose JSON parsing with optional everything | Fixed field lists + DTO validation | Sparse API responses otherwise produce false negatives |
| Pagination assumptions | "Default page is enough" logic | Exhaustive `$top`/`$skip` handling where collections are used | Docs say most collection resources default to max 42 items |

**Key insight:** The hard part here is not tree rendering. It is constraining YouTrack's flexible graph into one deterministic, auditable scope rule and refusing to guess when permissions obscure the result.

## Common Pitfalls

### Pitfall 1: Using `/links` as the primary tree source
**What goes wrong:** The app accidentally includes custom aggregation links, duplicates, or arbitrary relations in the requirement scope.
**Why it happens:** YouTrack exposes many link types and some are marked `aggregation`.
**How to avoid:** Traverse only `subtasks`; use `links` only for diagnostics.
**Warning signs:** Different projects produce inconsistent tree shapes for similar requirements.

### Pitfall 2: Missing descendants because fields were under-requested
**What goes wrong:** Children disappear simply because the request omitted nested `subtasks(...)` fields.
**Why it happens:** YouTrack returns sparse payloads unless fields are requested explicitly.
**How to avoid:** Centralize field strings and test them against sample payloads.
**Warning signs:** Root loads successfully, but child lists are unexpectedly empty.

### Pitfall 3: Treating absence as proof of access denial
**What goes wrong:** The system labels children as hidden when the API simply omitted them due to query shape or pagination.
**Why it happens:** Sparse fields and paginated collections can look like permissions.
**How to avoid:** First prove request completeness, then classify visibility gaps.
**Warning signs:** "Forbidden" counts drop to zero after changing `fields` or pagination settings.

### Pitfall 4: Root error taxonomy assumed, not tested
**What goes wrong:** Product promises separate not-found and forbidden states that the live API does not expose cleanly.
**Why it happens:** Official docs reviewed here do not clearly document these response semantics.
**How to avoid:** Make live verification against the target YouTrack instance an explicit first plan task.
**Warning signs:** Implementation starts writing UI copy before probing real responses.

### Pitfall 5: Pagination ignored for collection resources
**What goes wrong:** Large link sets or list endpoints truncate silently.
**Why it happens:** Most collection resources default to a maximum of 42 returned entries.
**How to avoid:** Always model `$top`/`$skip` in the adapter even if initial trees are small.
**Warning signs:** Counts flatten at suspiciously round numbers.

## Code Examples

Verified patterns from official sources:

### Read Current User
```http
GET /api/users/me
Authorization: Bearer <user token>
```

### Read One Issue With Explicit Hierarchy Fields
```http
GET /api/issues/PRJ-123?fields=id,idReadable,summary,parent(id,idReadable),subtasks(id,idReadable,summary)
Authorization: Bearer <user token>
```

### Inspect Link Types Before Deciding What To Ignore
```http
GET /api/issueLinkTypes?fields=aggregation,directed,id,name,readOnly,sourceToTarget,targetToSource
Authorization: Bearer <user token>
```

### Read Issue Links For Diagnostics
```http
GET /api/issues/2-17/links?fields=id,direction,linkType(name,sourceToTarget,targetToSource,aggregation),issues(id,idReadable,summary)
Authorization: Bearer <user token>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Legacy REST assumptions with broad payloads | `/api` with explicit `fields` selection | Current YouTrack docs | Integrations must request exactly what they need |
| Treating issue relationships as one generic graph | Distinguish native subtask hierarchy from configurable link types | Current docs and admin model | Product contract must be explicit about supported hierarchy |
| Shared integration identity | Per-user authorization context for visibility-sensitive products | Current security practice | Results match what the viewer is allowed to see |

**Deprecated/outdated:**
- Assuming default response payloads are complete: current docs explicitly require `fields` for useful attributes.
- Assuming collection defaults are exhaustive: current docs state most collection resources cap at 42 items by default.

## Open Questions

1. **Can the real YouTrack instance distinguish nonexistent root vs inaccessible root at API level?**
   - What we know: phase decisions require separate UI states.
   - What's unclear: official docs reviewed do not clearly document status-code differences for these cases.
   - Recommendation: add an integration spike with known nonexistent key and known restricted key.

2. **Does the target installation use only native subtasks for requirement hierarchy?**
   - What we know: v1 decisions want only parent/subtask recursion.
   - What's unclear: some teams may model structure with custom aggregation links instead.
   - Recommendation: inspect a few representative real requirements before locking implementation copy.

3. **How will hidden descendants manifest: explicit error or silent omission?**
   - What we know: Phase 1 must block calculation on incomplete visibility.
   - What's unclear: docs do not fully specify how nested inaccessible children appear in every endpoint shape.
   - Recommendation: probe with users of different permissions and record response shapes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Local tooling / future app scaffolding | ✓ | v24.14.1 | — |
| npm | Local package management | ✓ | 11.11.0 | — |
| Python 3 | Auxiliary scripts if needed | ✓ | 3.9.6 | — |
| pnpm | Potential JS package manager | ✗ | — | npm |
| pytest | Python test runner | ✗ | — | not needed yet |
| Target YouTrack base URL | Live API verification | ✗ in repo context | — | none |
| Current-user YouTrack credentials/session | Permission validation | ✗ in repo context | — | none |

**Missing dependencies with no fallback:**
- Target YouTrack URL and test accounts with different visibility levels.
- Current-user auth mechanism for the app-to-YouTrack hop.

**Missing dependencies with fallback:**
- `pnpm` is absent, but npm is available if the project adopts Node tooling next.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none detected |
| Config file | none — see Wave 0 |
| Quick run command | `none yet` |
| Full suite command | `none yet` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| YTSC-01 | Root issue ID can be submitted and classified into success/not-found/forbidden states | unit + integration | `none yet` | ❌ Wave 0 |
| YTSC-02 | Recursive traversal follows only supported hierarchy to leaf nodes | unit | `none yet` | ❌ Wave 0 |
| YTSC-03 | Included scope is visible and incomplete visibility blocks calculation | integration | `none yet` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `none yet`
- **Per wave merge:** `none yet`
- **Phase gate:** live YouTrack contract checks plus automated unit coverage before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Test framework bootstrap for the chosen app stack.
- [ ] Contract tests for normalized `ScopeResult` states.
- [ ] Adapter tests with recorded YouTrack responses for: leaf root, multi-level tree, unsupported links present, hidden descendant, missing root, restricted root.
- [ ] A small manual verification script or fixture set for live target-instance probes.

## Sources

### Primary (HIGH confidence)
- Official YouTrack REST API docs: https://www.jetbrains.com/help/youtrack/devportal/api-url-and-endpoints.html - base `/api` endpoint and `users/me`
- Official YouTrack REST API docs: https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues.html - issue list/search behavior, explicit `fields`, default collection limits
- Official YouTrack REST API docs: https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-links.html - issue links model, `trimmedIssues`, `$topLinks`, `$skipLinks`
- Official YouTrack REST API docs: https://www.jetbrains.com/help/youtrack/devportal/resource-api-issueLinkTypes.html - configurable link types, `aggregation`, predefined `Subtask` example
- Official YouTrack REST API docs: https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-timeTracking-workItems.html - work item collection behavior for later phase boundary checks

### Secondary (MEDIUM confidence)
- Project research summary: [/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/research/SUMMARY.md](/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/research/SUMMARY.md) - prior project-wide risks and recommended sequencing
- Project architecture research: [/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/research/ARCHITECTURE.md](/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/research/ARCHITECTURE.md) - backend-owned traversal and snapshot boundaries
- Project pitfalls research: [/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/research/PITFALLS.md](/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/research/PITFALLS.md) - hierarchy ambiguity and permission risks

### Tertiary (LOW confidence)
- Official docs did not clearly confirm nonexistent-vs-forbidden root response semantics; this remains a live-validation item, not a documented fact.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - based on official YouTrack API docs and narrow phase scope.
- Architecture: MEDIUM-HIGH - contract-first traversal and visibility blocking follow official API shape plus project decisions.
- Pitfalls: MEDIUM - most are strongly inferred from docs and product constraints, but root error semantics still need live confirmation.

**Research date:** 2026-04-07
**Valid until:** 2026-05-07
