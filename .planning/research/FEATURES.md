# Feature Research

**Domain:** Internal PM profitability calculator for YouTrack requirements
**Researched:** 2026-04-05
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Parent requirement lookup by YouTrack ID | The core user action is "paste requirement ID, get answer." Anything slower keeps the spreadsheet workflow alive. | LOW | Must support one requirement at a time in v1 and fail clearly on missing or inaccessible issues. |
| Recursive traversal of nested tasks/subtasks/groups | Real work is buried several levels deep; partial traversal makes profitability wrong. | MEDIUM | Must walk the full hierarchy, dedupe issue IDs, and show what was included. |
| Worklog aggregation into actual hours and actual cost | Profitability tools universally start with budget vs actuals from logged time. | MEDIUM | Sum actuals across all descendants; cache per requirement to avoid repeated API churn. |
| Role-to-discipline cost allocation | PMs need profitability by discipline, not only one total number. | HIGH | Requires a stable mapping from YouTrack user role to `devops`, `backend`, `analytics`, `frontend`, `mobiledev`, `qa`, `design`, `pm`. Flag unmapped users instead of silently dropping them. |
| Editable budgets by discipline | Current workflow assumes manual budget correction in the UI. This is common in profitability tools where the estimate source of truth is imperfect. | LOW | Must support fast edits and immediate recalculation for each discipline plus total. |
| Actual profitability at total and discipline level | Users expect both roll-up margin and breakdown because overruns usually hide inside one discipline. | MEDIUM | Use the fixed formula `(budget - cost) / budget * 100%`; show both money and percentage. |
| Forecast profitability from additional requested hours | Current PM workflow is driven by "team asks for more hours, what happens now?" | MEDIUM | Forecast should reuse the same role-based cost engine and accept per-discipline hour deltas. |
| Shortfall-to-target calculation | The business decision is not just "margin is low" but "how much more do I need to negotiate to get back to 20%?" | LOW | Output the additional customer budget required to restore the 20% target, per requirement and optionally per discipline. |
| Threshold-based status highlighting | Traffic-light health indicators are a standard expectation in margin/budget tools. | LOW | For v1, red below 20%, green at or above 20%; pair color with text so the result is still readable and accessible. |
| Data freshness and recalculate action | PMs need confidence that numbers reflect current worklogs before they act on them. | LOW | Show last sync time, explicit refresh, and loading/error states for YouTrack fetches. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Explainable profitability breakdown | Turns the calculator from a black box into a PM decision tool by showing exactly which tasks, people roles, and worklogs drove the result. | MEDIUM | Provide drill-down from total → discipline → issue/worklog contribution. |
| Data-quality diagnostics before calculation | Internal tools usually fail because source data is messy. Catching bad role mapping, missing worklogs, or empty budgets makes the output trustworthy. | MEDIUM | Detect unmapped roles, zero-rate roles, missing budgets, and suspicious no-worklog branches. |
| Inline "additional hours request" workflow | Most PSA tools forecast from plans; this product can differentiate by optimizing the exact negotiation moment when scope creeps mid-delivery. | MEDIUM | A compact per-discipline delta editor is better than a generic scenario builder for v1.x. |
| Saved snapshots for before/after negotiation | PMs often need to justify why they requested additional budget and what changed over time. | MEDIUM | Save timestamped calculation states for the same requirement without turning the app into full reporting software. |
| Requirement health summary tuned for PMs | Competitors optimize for finance/PSA dashboards; this tool can optimize for one fast operational answer: profitable now, profitable after change, and gap to target. | LOW | Keep the summary card opinionated and immediately actionable rather than configurable. |
| Partial-coverage warnings for incomplete hierarchies | In YouTrack-heavy environments, permissions or broken links can hide descendants. Surfacing coverage risk is a real differentiator for trust. | HIGH | Show counts of fetched vs skipped issues and whether the result is complete enough to trust. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multi-requirement portfolio view in v1 | Feels more "strategic" and looks like a natural dashboard add-on. | It expands scope into filtering, pagination, saved views, aggregate semantics, and portfolio permissions before the single-requirement workflow is reliable. | Nail one-requirement calculation first; add snapshots/export later if teams need lightweight comparison. |
| Full PSA suite: invoicing, contracts, revenue recognition, capacity planning | Stakeholders often bundle all financial operations into one "profitability" request. | This changes the product from a PM calculator into ERP/PSA software and buries the core decision flow under unrelated workflows. | Keep the app focused on cost-side profitability and shortfall guidance; integrate outbound numbers with existing finance tools if needed. |
| Arbitrary scenario lab detached from YouTrack | Scenario planning sounds powerful. | Detached simulations become stale quickly and encourage users to trust hypothetical data over current operational data. | Support one focused "additional hours" forecast tied to the current requirement state. |
| Manual per-worklog discipline classification | Teams may ask for overrides when role data is messy. | This creates a permanent data-cleaning UI and makes every calculation slower and less auditable. | Maintain role-mapping rules plus explicit unmapped-role exceptions reviewed centrally. |
| User-configurable profitability formulas and target thresholds in v1 | Sounds flexible for edge cases across teams. | It complicates trust, testing, and comparability. The current product has a fixed 20% business rule and should encode it. | Keep one formula and one target in v1; revisit configurability only after adoption across multiple teams. |
| Real-time background sync of all YouTrack activity | Feels modern and "live." | Operationally expensive, hard to reason about, and unnecessary for an on-demand PM decision tool. | Use explicit refresh plus short-lived caching of recent calculations. |

## Feature Dependencies

```text
[Parent requirement lookup by YouTrack ID]
    └──requires──> [Recursive traversal of nested tasks/subtasks/groups]
                         └──requires──> [Worklog aggregation into actual hours and actual cost]
                                              └──requires──> [Role-to-discipline cost allocation]
                                                                   ├──requires──> [Actual profitability at total and discipline level]
                                                                   ├──requires──> [Forecast profitability from additional requested hours]
                                                                   └──requires──> [Shortfall-to-target calculation]

[Editable budgets by discipline] ──requires──> [Actual profitability at total and discipline level]
[Editable budgets by discipline] ──requires──> [Shortfall-to-target calculation]
[Data freshness and recalculate action] ──enhances──> [Parent requirement lookup by YouTrack ID]
[Explainable profitability breakdown] ──enhances──> [Actual profitability at total and discipline level]
[Data-quality diagnostics before calculation] ──enhances──> [Role-to-discipline cost allocation]
[Partial-coverage warnings for incomplete hierarchies] ──enhances──> [Recursive traversal of nested tasks/subtasks/groups]

[Multi-requirement portfolio view in v1] ──conflicts──> [Requirement health summary tuned for PMs]
[Arbitrary scenario lab detached from YouTrack] ──conflicts──> [Inline "additional hours request" workflow]
[User-configurable profitability formulas and target thresholds in v1] ──conflicts──> [Threshold-based status highlighting]
```

### Dependency Notes

- **Recursive traversal requires YouTrack requirement lookup:** the hierarchy root is the user-entered requirement ID.
- **Worklog aggregation requires recursive traversal:** actual cost is only credible if every descendant issue is included.
- **Role-to-discipline allocation requires aggregated worklogs:** you cannot compute discipline-level cost or margin without attributed effort.
- **Actual profitability requires both role-based cost and editable budgets:** margin is a comparison, not just a cost sum.
- **Forecast profitability and shortfall-to-target require the same cost engine as actual profitability:** otherwise forecasted numbers will not reconcile with actuals.
- **Data-quality diagnostics enhance role-based allocation:** without quality checks, bad role mapping silently corrupts the most important output.
- **Portfolio views conflict with the PM-focused summary:** they push the UI toward reporting instead of fast operational decision-making.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Parent requirement lookup by YouTrack ID — this is the entry point to the entire workflow.
- [ ] Recursive traversal of nested tasks/subtasks/groups — required for complete cost coverage.
- [ ] Worklog aggregation into actual hours and actual cost — replaces the manual collection step.
- [ ] Role-to-discipline cost allocation — enables the promised discipline-level view.
- [ ] Editable budgets by discipline — matches the real PM correction workflow.
- [ ] Actual profitability at total and discipline level — core value delivery.
- [ ] Forecast profitability from additional requested hours — covers the main operational use case.
- [ ] Shortfall-to-target calculation — produces the negotiation number PMs need.
- [ ] Threshold-based status highlighting — immediate readability for the 20% rule.
- [ ] Data freshness and recalculate action — builds trust in a YouTrack-backed result.

### Add After Validation (v1.x)

- [ ] Explainable profitability breakdown — add when PMs start challenging or auditing the result.
- [ ] Data-quality diagnostics before calculation — add as soon as real data exposes mapping gaps.
- [ ] Saved snapshots for before/after negotiation — add when PMs need history for customer conversations.
- [ ] Partial-coverage warnings for incomplete hierarchies — add if permissions or hierarchy integrity become a frequent issue.

### Future Consideration (v2+)

- [ ] Lightweight exports or shareable reports — defer until stakeholders outside PMs need the output regularly.
- [ ] Multi-requirement comparison — only after the single-requirement workflow is trusted and heavily used.
- [ ] Configurable thresholds by business unit — only if different teams truly operate under different margin targets.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Parent requirement lookup by YouTrack ID | HIGH | LOW | P1 |
| Recursive traversal of nested tasks/subtasks/groups | HIGH | MEDIUM | P1 |
| Worklog aggregation into actual hours and actual cost | HIGH | MEDIUM | P1 |
| Role-to-discipline cost allocation | HIGH | HIGH | P1 |
| Editable budgets by discipline | HIGH | LOW | P1 |
| Actual profitability at total and discipline level | HIGH | MEDIUM | P1 |
| Forecast profitability from additional requested hours | HIGH | MEDIUM | P1 |
| Shortfall-to-target calculation | HIGH | LOW | P1 |
| Threshold-based status highlighting | MEDIUM | LOW | P1 |
| Explainable profitability breakdown | HIGH | MEDIUM | P2 |
| Data-quality diagnostics before calculation | HIGH | MEDIUM | P2 |
| Saved snapshots for before/after negotiation | MEDIUM | MEDIUM | P2 |
| Partial-coverage warnings for incomplete hierarchies | MEDIUM | HIGH | P2 |
| Multi-requirement comparison | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Tempo | Productive | Our Approach |
|---------|-------|------------|--------------|
| Actual vs projected profitability | Strong actual/projected KPI comparison based on logged and planned time | Strong real-time profitability and overrun visibility | Keep this as table stakes, but scope it to one YouTrack requirement and one PM decision flow. |
| Budget overrun visibility | Present in forecast and KPI views | Present, with warning/alert framing | Ship immediate threshold highlighting plus shortfall-to-target instead of broad reporting. |
| Flexible budget models | More PSA/project-centric | Supports fixed-price, hourly, mixed, retainers | Avoid broad budget model abstraction in v1; support editable discipline budgets directly. |
| Deep PM-facing negotiation workflow | Generic PSA workflow | Generic PSA workflow | Differentiate on additional-hours request handling and exact extra-budget guidance to reach 20%. |
| Data-quality visibility | Limited marketing emphasis | Limited marketing emphasis | Differentiate by explicitly surfacing unmapped roles, skipped issues, and incomplete coverage. |

## Sources

- JetBrains project context in [PROJECT.md](/Users/alexanderseleznev/Documents/PetProjects/board_ai/.planning/PROJECT.md)
- Tempo Help Center, "Compare Actual KPIs versus Projected KPIs" and project cost management overview: https://help.tempo.io/professionalservices/latest/forecast-your-costs-and-revenue
- Productive, profitability product page with real-time profitability, overrun forecasting, custom alerts, and budget models: https://productive.io/profitability/
- Kantata, project estimation and forecasting product page: https://www.kantata.com/psa/project-management-software/project-estimation-and-forecasting

---
*Feature research for: Internal PM profitability calculator for YouTrack requirements*
*Researched: 2026-04-05*
