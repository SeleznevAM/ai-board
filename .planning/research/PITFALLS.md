# Pitfalls Research

**Domain:** Internal profitability calculator web app on top of YouTrack issue hierarchies and worklogs
**Researched:** 2026-04-05
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Treating "hierarchy" as a UI assumption instead of a YouTrack data contract

**What goes wrong:**
The app assumes every child item can be discovered the same way, then silently misses work when a requirement mixes native `Subtask` links, parent references, or custom aggregation-style links. Profitability looks believable but is wrong because the traversal rule is ambiguous.

**Why it happens:**
Teams start from one example tree and encode "whatever links we saw there" instead of defining the exact supported hierarchy semantics for this installation. In YouTrack, issue links are typed, directed, and configurable; custom fields are also project-specific.

**How to avoid:**
Define a versioned ingestion contract before coding the calculator:
- List which link types count toward profitability scope.
- Decide whether only native parent/subtask relations are supported in v1 or whether custom aggregation links are also allowed.
- Add a diagnostics panel that shows exactly why each issue was included.
- Reject unsupported hierarchies with an explicit warning instead of guessing.

**Warning signs:**
- Two managers get different totals for the same root issue.
- Linked issues appear in YouTrack UI but not in the calculator result.
- Engineers say "we need one more special-case link type" after integration already works.

**Phase to address:**
Phase 1: YouTrack domain discovery and data contract

---

### Pitfall 2: Incomplete worklog aggregation from pagination, sparse field selection, or permission gaps

**What goes wrong:**
The calculator undercounts actual effort because it fetches only the first page of work items, omits required `fields`, or runs under a token that cannot read some issues or work items. The resulting margin is inflated and looks healthy until someone audits a specific branch.

**Why it happens:**
YouTrack REST responses are intentionally sparse unless `fields` are requested, and collection endpoints are paginated. Access also depends on `Read Issue` and `Read Work Item` permissions plus issue visibility rules.

**How to avoid:**
- Build the ingestion layer around exhaustive pagination with `$top` and `$skip`.
- Request explicit fields for every endpoint and treat missing required fields as ingestion failures, not zeros.
- Surface a completeness report: issue count visited, work items counted, permission-denied items, and hidden issues.
- Test with a restricted token as well as an admin token to expose visibility edge cases.

**Warning signs:**
- Totals change when the same query is executed with a different service account.
- Large parent issues stop growing after suspiciously round counts.
- API integration "works" in demo data but breaks on requirements with many worklogs.

**Phase to address:**
Phase 2: Hierarchy and worklog ingestion engine

---

### Pitfall 3: Using today's role or rate to price historical work

**What goes wrong:**
Past worklogs are repriced with a user's current role or current hourly cost. A promotion, team transfer, or rate-card update rewrites history and makes old profitability snapshots non-reproducible.

**Why it happens:**
It is tempting to multiply aggregated hours by a single current rate per role because it is easy to explain and implement. That is acceptable for rough estimation, but not for a management tool that people will compare against approved budgets and change requests.

**How to avoid:**
- Introduce an effective-dated rate card from the start.
- Store the costing basis used for each calculation snapshot: rate-card version, role mapping version, and calculation timestamp.
- Decide explicitly whether v1 uses historical rates or "current rate for all past work"; if the latter, label the result as a management approximation.
- Keep "actual recorded hours" separate from "cost interpretation of those hours."

**Warning signs:**
- Re-running last month's calculation produces a different result without any new worklogs.
- Finance asks why previously approved margin numbers changed after HR updates rates.
- Teams manually preserve screenshots because the app is not reproducible.

**Phase to address:**
Phase 3: Cost allocation and rate-card model

---

### Pitfall 4: Brittle role mapping and silent "unknown role" leakage

**What goes wrong:**
Hours are misallocated across `backend`, `frontend`, `qa`, and other budget buckets because user role data is inconsistent, missing, multi-valued, or stored differently by project. Unmapped work either disappears or gets forced into the wrong bucket.

**Why it happens:**
The business rule sounds simple, but "role" is often not a normalized single source of truth. In practice, a role may live in a user profile, a custom field, a group, or not be maintained consistently.

**How to avoid:**
- Define a single authoritative mapping source for v1.
- Add an explicit `Unmapped` bucket and fail the calculation health check if it is non-zero.
- Version role-to-budget-direction mappings.
- Provide an admin-visible reconciliation view listing users and worklogs that could not be classified.

**Warning signs:**
- New team members appear in totals only after manual intervention.
- The same person's hours land in different directions across projects.
- Product owners ask where "miscellaneous" hours came from.

**Phase to address:**
Phase 3: Cost allocation and rate-card model

---

### Pitfall 5: Mixing actuals, forecast scenarios, and approved budget into one mutable number

**What goes wrong:**
When extra hours are requested, the tool overwrites the baseline budget or actuals and loses the distinction between "what has happened," "what is approved," and "what is being proposed." Users can no longer explain why a profitability percentage changed.

**Why it happens:**
A simple form with editable budget and extra-hours inputs is easy to build, but profitability tools need state semantics, not just arithmetic. Scenario modeling is the first place where a spreadsheet mentality breaks down.

**How to avoid:**
- Model three layers explicitly: actuals, approved budget, and proposed change request.
- Make recalculation a pure function over a named scenario instead of mutating the base record.
- Show a delta view: current profitability, projected profitability, required extra approval amount, and assumptions used.
- Allow users to discard or save scenarios intentionally.

**Warning signs:**
- Users ask which number is "the real one."
- After entering extra hours, the previous baseline cannot be recovered.
- Screenshots become the only audit trail for negotiations with the customer.

**Phase to address:**
Phase 4: Budget editing and forecast scenario model

---

### Pitfall 6: Editable budgets without auditability, ownership, or concurrency rules

**What goes wrong:**
Managers can edit budget lines at any time, but nobody can answer who changed what, when, and why. Concurrent edits race each other, and trust in the tool collapses because the source of truth is now less reliable than the spreadsheet it replaced.

**Why it happens:**
Greenfield internal tools often postpone auditability because "only a few managers will use it." But budget adjustments are exactly the events stakeholders challenge later.

**How to avoid:**
- Record budget revisions with author, timestamp, reason, and before/after values.
- Use optimistic concurrency or revision numbers to prevent silent overwrites.
- Distinguish draft edits from published numbers used in alerts and reporting.
- Make the last calculation metadata visible in the UI.

**Warning signs:**
- Two people report different budget values on the same requirement.
- A user says "I didn't change that" and there is no revision history.
- Alert history cannot be reconciled with the budget shown on screen.

**Phase to address:**
Phase 4: Budget editing and forecast scenario model

---

### Pitfall 7: Profitability math that ignores zero-budget, negative-margin, and rounding edge cases

**What goes wrong:**
The formula is straightforward until budget is zero, nearly zero, stale, or only partially assigned by direction. Then the UI shows `Infinity`, `NaN`, misleading green states caused by rounding, or contradictory totals between line items and overall margin.

**Why it happens:**
Developers treat the formula as presentation logic instead of a domain rule set with validation and invariants.

**How to avoid:**
- Define domain invariants up front: non-negative budgets, behavior for zero budget, rounding precision, and how direction totals reconcile with overall totals.
- Keep money calculations in decimal-safe logic, not floating display math.
- Add test fixtures for tiny budgets, zero budgets, no-worklog cases, negative profitability, and partially unmapped roles.
- Show "insufficient input" or "invalid budget" states instead of rendering fake percentages.

**Warning signs:**
- Totals differ by one or two kopeks/rubles depending on screen.
- Overall profitability is green while one or more core directions are deeply negative.
- Users copy numbers to Excel to "check the real math."

**Phase to address:**
Phase 4: Budget editing and forecast scenario model

---

### Pitfall 8: Threshold alerts that create noise instead of intervention

**What goes wrong:**
The 20% profitability threshold exists, but alerts fire on every recalculation, every small edit, or every stale record refresh. Users stop trusting red states because they do not know whether the breach is new, acknowledged, or actionable.

**Why it happens:**
Teams implement threshold coloring first and then bolt on alerts without alert state, ownership, cadence, or deduplication.

**How to avoid:**
- Separate visual status from notification logic.
- Trigger alerts only on meaningful state changes, such as crossing below threshold or staying below threshold after recalculation.
- Add alert ownership, acknowledgement state, and last-triggered timestamp.
- Include enough context in the alert payload: root issue, current margin, delta from previous run, missing approval amount, and data freshness.

**Warning signs:**
- The same low-profitability requirement alerts repeatedly with no new work.
- Managers ask whether red means "new problem" or "already known."
- Teams start ignoring the notification channel entirely.

**Phase to address:**
Phase 5: Profitability UI, alerts, and explainability

---

### Pitfall 9: Hiding partial-data conditions behind a polished profitability number

**What goes wrong:**
The UI looks finished, but it does not tell users when calculations exclude hidden issues, unmapped users, stale YouTrack data, or unsupported link types. The polished number creates false confidence.

**Why it happens:**
Internal tools often optimize for the "happy-path demo" and omit data quality states because they feel messy in the interface.

**How to avoid:**
- Promote calculation health to a first-class UI concept.
- Show badges for `complete`, `partial`, and `failed` calculations.
- Explain every exclusion category inline with counts and drill-down links.
- Block alert generation for partial calculations unless the user explicitly allows it.

**Warning signs:**
- Users discover missing scope only by manually checking YouTrack.
- Support requests say "the number feels wrong" rather than "the app errored."
- The UI has no place where excluded items are listed.

**Phase to address:**
Phase 5: Profitability UI, alerts, and explainability

---

### Pitfall 10: Over-broad integration and visibility permissions

**What goes wrong:**
The service token can read more issues, work items, and internal cost data than the managers using the tool should see. The app becomes a side channel for sensitive payroll-like information or restricted issue contents.

**Why it happens:**
The fastest way to get the integration working is to use an admin-grade token and expose raw issue/worklog details in the UI. That shortcut becomes production architecture.

**How to avoid:**
- Use the least-privileged YouTrack service account that still produces a complete calculation for the intended audience.
- Keep rate cards and user-cost mappings in the app backend, never in client-visible payloads unless necessary.
- Decide whether results are shown as aggregated by direction only or whether per-user cost drill-down is allowed.
- Log access to profitability views and budget edits.

**Warning signs:**
- The app works only with a global admin token.
- Managers can inspect costs for users or projects outside their responsibility.
- Debug responses include raw rate-card or restricted issue details in browser tools.

**Phase to address:**
Phase 6: Security, auditability, and operational hardening

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode supported YouTrack link names in application code | Fast MVP integration | Breaks when admins rename or add link types; hidden scope drift | Only for a throwaway spike, never for roadmap MVP |
| Use one current hourly rate per direction for all historical work | Simple cost formula | Historical reports drift over time; finance disputes numbers | Only if explicitly labeled as approximation |
| Recompute the full YouTrack tree synchronously on every budget keystroke | Minimal backend design | Slow UI, API pressure, duplicate network calls | Acceptable only before autosave/scenario editing exists |
| Drop unmapped users or hidden issues from totals without showing them | Cleaner UI | Silent undercounting and false profitability | Never |
| Store only the final percentage, not calculation inputs and version metadata | Small schema | No reproducibility, impossible audits | Never |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| YouTrack issue hierarchy | Assume `relates to` or any visible linked issue belongs to profitability scope | Define supported hierarchy semantics using native parent/subtask and explicitly approved link types |
| YouTrack collections | Ignore pagination because test data fits on one page | Implement full `$top`/`$skip` pagination for issues, links, and work items |
| YouTrack REST fields | Rely on default response shape | Always request explicit `fields` and validate presence of required attributes |
| YouTrack permissions | Test only with an admin token | Verify with least-privileged service account and expose partial-data diagnostics |
| YouTrack timestamps | Treat UTC timestamps as local calendar dates without normalization | Normalize dates/time zones before period filtering, especially for forecast snapshots and audit logs |
| YouTrack custom fields | Assume role-related fields exist and are consistent across projects | Discover field configuration per project and version the mapping contract |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 traversal of issue tree and worklogs | Large roots take seconds or time out | Batch traversal where possible, cache immutable parts, and separate sync from presentation | Breaks on deep requirements with many descendants or hundreds of work items |
| Full recalculation on every input change | UI lag during budget edits and forecast typing | Debounce edits and separate cheap scenario math from expensive YouTrack refresh | Breaks as soon as managers actively edit multiple directions |
| No snapshot/cache strategy | Repeated identical requests hammer YouTrack and return inconsistent mid-edit states | Cache raw retrievals briefly and snapshot completed calculations with metadata | Breaks once several managers inspect the same hot requirement |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Using an admin-grade permanent token for production reads | Excessive exposure of restricted issues and work items | Use least-privileged service account, rotate credentials, and scope access intentionally |
| Exposing raw user-level cost/rate data to all managers | Sensitive compensation inference | Keep rate-card logic server-side and expose aggregated cost views unless drill-down is explicitly required |
| Treating a partial calculation as a valid financial statement | Decision-making on incomplete or restricted data | Mark calculation health clearly and block downstream alerts/reporting on incomplete runs |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing only one profitability percentage | Users cannot understand which direction is driving the loss | Show overall margin plus per-direction breakdown and required additional approval amount |
| Using color alone for the 20% threshold | Ambiguous for accessibility and screenshots; poor auditability | Pair color with explicit labels, icons, and numeric deltas |
| Hiding freshness and exclusion details | Users trust stale or partial numbers | Show last sync time, calculation status, excluded issue count, and unmapped-role count near the headline metric |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Hierarchy traversal:** Verify supported link types are documented and unsupported links are surfaced, not ignored.
- [ ] **Worklog aggregation:** Verify pagination is covered beyond 42 items and permission-denied data is counted separately.
- [ ] **Cost allocation:** Verify every work item lands in a direction or explicit `Unmapped` bucket.
- [ ] **Forecasting:** Verify proposed extra hours do not overwrite actuals or approved budgets.
- [ ] **Alerts:** Verify notifications fire on meaningful state changes, not every recalculation.
- [ ] **Auditability:** Verify budget edits and calculation snapshots retain author, time, and assumptions.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong hierarchy semantics shipped | HIGH | Freeze releases, define the true scope contract with stakeholders, backfill calculations, and mark prior results as superseded |
| Under-counted worklogs due to pagination or permissions | HIGH | Fix ingestion, rerun affected calculations, and notify users which previously viewed requirements were incomplete |
| Historical numbers drift after rate changes | HIGH | Introduce effective-dated rate cards, rebuild snapshots where possible, and distinguish revised vs. original reports |
| Budget edits lack audit trail | MEDIUM | Add revision logging immediately and require republishing of active requirements before alerts resume |
| Alert fatigue after launch | MEDIUM | Disable noisy notifications, keep visual states, add deduplication/ownership, and relaunch alerting with tighter rules |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Treating hierarchy as a UI assumption | Phase 1: YouTrack domain discovery and data contract | Test roots using native subtasks, mixed links, and unsupported links; verify the app explains inclusion rules |
| Incomplete worklog aggregation | Phase 2: Hierarchy and worklog ingestion engine | Seed scenarios with more than 42 work items and restricted issues; verify completeness diagnostics |
| Using current role/rate for historical work | Phase 3: Cost allocation and rate-card model | Re-run an old calculation after changing rates; verify the stored snapshot remains reproducible |
| Brittle role mapping | Phase 3: Cost allocation and rate-card model | Add users with missing or conflicting role data; verify they appear in `Unmapped` and block green status |
| Mixing actuals, forecasts, and approved budget | Phase 4: Budget editing and forecast scenario model | Create and discard multiple scenarios; verify baseline numbers remain intact |
| Editable budgets without auditability | Phase 4: Budget editing and forecast scenario model | Perform concurrent edits; verify revision conflict handling and visible change history |
| Profitability math edge cases | Phase 4: Budget editing and forecast scenario model | Run fixtures for zero budgets, tiny budgets, negative margins, and partial direction budgets |
| Noisy threshold alerts | Phase 5: Profitability UI, alerts, and explainability | Cross threshold repeatedly with small edits; verify deduplication and state-change-only notifications |
| Hidden partial-data conditions | Phase 5: Profitability UI, alerts, and explainability | Force a partial run and verify UI blocks misleading "healthy" status |
| Over-broad permissions | Phase 6: Security, auditability, and operational hardening | Review with least-privileged account and confirm the UI does not expose restricted detail |

## Sources

- JetBrains YouTrack REST API docs: https://www.jetbrains.com/help/youtrack/devportal/youtrack-rest-api.html
- JetBrains YouTrack issue links API: https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-links.html
- JetBrains YouTrack issue link types docs: https://www.jetbrains.com/help/youtrack/server/link-types.html
- JetBrains YouTrack issue link types API: https://www.jetbrains.com/help/youtrack/devportal/resource-api-issueLinkTypes.html
- JetBrains YouTrack issue work items API: https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-timeTracking-workItems.html
- JetBrains YouTrack work items API: https://www.jetbrains.com/help/youtrack/devportal/resource-api-workItems.html
- JetBrains YouTrack permissions reference: https://www.jetbrains.com/help/youtrack/server/YouTrack-Permissions-Reference.html
- JetBrains YouTrack issue visibility docs: https://www.jetbrains.com/help/youtrack/server/set-visibility-of-issue-or-comment.html
- JetBrains YouTrack custom fields in REST API: https://www.jetbrains.com/help/youtrack/devportal/api-concept-custom-fields.html
- JetBrains YouTrack issue custom fields API: https://www.jetbrains.com/help/youtrack/devportal/resource-api-issues-issueID-customFields.html
- Datadog monitor best practices, used only for alert-noise design guidance: https://docs.datadoghq.com/monitors/guide/monitor_best_practices/
- Datadog monitor clutter guidance, used only for alert ownership/deduplication guidance: https://docs.datadoghq.com/monitors/guide/clean_up_monitor_clutter/

---
*Pitfalls research for: internal profitability calculator web app based on YouTrack*
*Researched: 2026-04-05*
