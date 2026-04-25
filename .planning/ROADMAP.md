# Roadmap: Инструмент расчета рентабельности по требованиям YouTrack

## Overview

Дорожная карта идет от самого рискованного слоя к пользовательскому решению: сначала фиксируется контракт данных YouTrack и границы поддерживаемой иерархии, затем доказывается полнота импорта и корректность фактических трудозатрат, после этого вводится детерминированный cost engine, далее отдельно добавляется сценарное редактирование без смешения с импортированными фактами, и только потом собирается PM-ориентированный экран принятия решений. Такая последовательность держит v1 узким, интеграционно-ориентированным и не позволяет построить красивый интерфейс поверх недостоверных чисел.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: YouTrack Data Contract** - Пользователь вводит root issue и видит, какую поддерживаемую иерархию система реально возьмет в расчет.
- [x] **Phase 2: Ingestion Correctness** - Система надежно синхронизирует задачи и worklog-данные из YouTrack и явно показывает полноту расчета.
- [x] **Phase 3: Cost Engine** - Импортированные трудозатраты превращаются в себестоимость и базовую рентабельность по требованию и направлениям.
- [x] **Phase 4: Scenario Editing** - Менеджер меняет бюджеты и дополнительные часы как отдельный сценарий с сохранением происхождения расчета.
- [ ] **Phase 5: PM Dashboard** - Пользователь получает быстрый экран принятия решения с итогами, цветовой индикацией и вкладом направлений.

## Phase Details

### Phase 1: YouTrack Data Contract
**Goal**: Пользователь может ввести root issue YouTrack и понять, какие связанные задачи система поддерживает и включает в будущий расчет.
**Depends on**: Nothing (first phase)
**Requirements**: YTSC-01, YTSC-02, YTSC-03
**Success Criteria** (what must be TRUE):
  1. Пользователь может ввести ID родительской задачи YouTrack и запустить разбор одного требования.
  2. Система определяет поддерживаемую иерархию вложенных задач и строит scope расчета без ручного уточнения структуры.
  3. Пользователь либо видит полное дерево поддерживаемого scope, либо получает явную ошибку, если root issue или часть поддерживаемой иерархии недоступны текущему пользователю.
**Plans**: 3 plans
Plans:
- [x] 01-01-PLAN.md - Bootstrap the minimal app/test shell and freeze the Phase 1 scope contract.
- [x] 01-02-PLAN.md - Implement defensive recursive scope resolution against a narrow YouTrack source boundary.
- [x] 01-03-PLAN.md - Wire the root issue flow and render the minimal nested scope tree.

### Phase 2: Ingestion Correctness
**Goal**: Пользователь получает воспроизводимый снимок фактических данных YouTrack с признаком свежести и понятным статусом полноты.
**Depends on**: Phase 1
**Requirements**: YTSC-04, WORK-01, WORK-02, WORK-03
**Success Criteria** (what must be TRUE):
  1. Пользователь может вручную обновить данные YouTrack и увидеть момент последней синхронизации перед пересчетом.
  2. Система собирает фактически затраченное время по всем включенным задачам и не дублирует задачи или worklog-записи при агрегации.
  3. Если обязательные данные из YouTrack получены не полностью, расчет сохраняется как частичный или ошибочный, а не выдается как достоверный итог.
**Plans**: 3 plans
Plans:
- [x] 02-01-PLAN.md - Freeze the YouTrack field contract and normalize hours by the agreed status model.
- [x] 02-02-PLAN.md - Build the canonical snapshot refresh pipeline and blocked-ingestion route contract.
- [x] 02-03-PLAN.md - Expose manual refresh, last-sync feedback, and blocked issue diagnostics in the UI.

### Phase 3: Cost Engine
**Goal**: Пользователь получает корректную базовую себестоимость и фактическую рентабельность по требованию и каждому направлению на основе импортированных фактов.
**Depends on**: Phase 2
**Requirements**: COST-01, COST-02, COST-03, COST-04, PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06
**Success Criteria** (what must be TRUE):
  1. Система относит фактические трудозатраты к направлениям по роли исполнителя и явно выделяет unmapped пользователей или затраты.
  2. Пользователь видит часы, себестоимость и денежные показатели по требованию целиком и по каждому направлению отдельно.
  3. Система рассчитывает фактическую рентабельность по фиксированной формуле и не показывает ложный процент, если бюджет отсутствует или некорректен.
  4. Если фактическая рентабельность опускается ниже 20%, система показывает сумму, которую нужно дополнительно согласовать для возврата к целевой норме.
**Plans**: 3 plans
Plans:
- [x] 03-01-PLAN.md - Add assignee-aware costing contracts and directory fallback rules.
- [x] 03-02-PLAN.md - Build direction-budget allocation, cost aggregation, and profitability math.
- [x] 03-03-PLAN.md - Add the assignee directory page and wire the profitability workspace into the main requirement flow.

### Phase 4: Scenario Editing
**Goal**: Менеджер может редактировать бюджеты и дополнительные часы как отдельный сценарий, не смешивая их с импортированными данными YouTrack.
**Depends on**: Phase 3
**Requirements**: BUDG-01, BUDG-02, BUDG-03, REFO-01, REFO-02, REFO-03, REFO-04, AUDT-01, AUDT-02
**Success Criteria** (what must be TRUE):
  1. Пользователь может задать исходный бюджет по каждому направлению и в любой момент скорректировать его с немедленным пересчетом.
  2. Пользователь может добавить дополнительные часы по одному или нескольким направлениям и сразу увидеть прогнозные затраты и прогнозную рентабельность рядом с фактическими значениями.
  3. Система хранит исходные импортированные данные YouTrack отдельно от пользовательских бюджетов и дополнительных часов, так что происхождение расчета можно объяснить.
  4. Для каждого расчета сохраняются метаданные о root issue, времени обновления YouTrack и использованных бюджетах и дополнительных часах.
**Plans**: 3 plans
Plans:
- [x] 04-01-PLAN.md - Freeze the pure scenario overlay contracts, provenance model, and forecast math with regression coverage.
- [x] 04-02-PLAN.md - Wire page-level scenario state, refresh discard confirmation, baseline-vs-scenario budgets, and task-card extra-hours editing.
- [x] 04-03-PLAN.md - Present current-vs-forecast metrics and in-memory provenance while keeping blocked snapshot trust boundaries intact.
**UI hint**: yes

### Phase 5: PM Dashboard
**Goal**: Пользователь получает компактный интерфейс, в котором сразу видно итог по требованию, проблемные направления и влияние перерасхода на итоговую рентабельность.
**Depends on**: Phase 4
**Requirements**: UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. Пользователь видит итоговую карточку требования с бюджетом, затратами, фактической рентабельностью, прогнозной рентабельностью и недостающей суммой до целевых 20%.
  2. Пользователь видит таблицу по направлениям с бюджетом, фактическими часами, дополнительными часами, затратами и рентабельностью для каждого направления.
  3. Рентабельность подсвечивается красным ниже 20% и зеленым при 20% и выше как на общем итоге, так и на разбивке по направлениям.
  4. Пользователь может быстро понять, какие направления дают перерасход и какой вклад они вносят в итоговую рентабельность требования.
**Plans**: 2 plans
Plans:
- [x] 05-01-PLAN.md - Create reusable dashboard presentation primitives: threshold status helper, two-tab shell, and compact requirement decision card.
- [ ] 05-02-PLAN.md - Recompose the page around the new shell and move direction diagnostics into a dense desktop directions tab.
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. YouTrack Data Contract | 3/3 | Complete | 2026-04-07 |
| 2. Ingestion Correctness | 3/3 | Complete | 2026-04-08 |
| 3. Cost Engine | 3/3 | Complete | 2026-04-08 |
| 4. Scenario Editing | 3/3 | Complete | 2026-04-14 |
| 5. PM Dashboard | 1/2 | In progress | - |

## Backlog

### Phase 999.1: Вынести целевую рентабельность в конфигурацию (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with $gsd-review-backlog when ready)
