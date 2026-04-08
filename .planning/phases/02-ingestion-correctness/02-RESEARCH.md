# Phase 2 Research: Ingestion Correctness

**Phase:** 2
**Name:** Ingestion Correctness
**Date:** 2026-04-08
**Status:** Complete

## Objective

Понять, что нужно знать для качественного планирования Phase 2, где продукт впервые делает полный переснимок требования из YouTrack и строит достоверный snapshot часов по всему дереву задач.

## What This Phase Must Lock

Phase 2 не считает деньги и рентабельность. Ее задача зафиксировать, как система:

1. вручную обновляет данные одного требования из YouTrack;
2. делает полный переснимок дерева задач с нуля;
3. определяет, по какому полю брать часы для каждой задачи;
4. блокирует расчет, если snapshot недостоверен;
5. показывает пользователю, почему расчет заблокирован.

Если на этом этапе snapshot часов будет недостоверным, следующие фазы посчитают себестоимость и рентабельность поверх неверной базы.

## Planner-Relevant Findings

### 1. This phase is about normalized hours, not raw worklog import

Пользователь явно выбрал статусную модель, а не "брать всегда worklog". Это значит:

- closed-like статусы используют `spent time`;
- active-like статусы используют `estimate`;
- неожиданные статусы тоже идут через `estimate`;
- в одном дереве могут сосуществовать задачи, рассчитанные по разным источникам часов.

**Вывод для плана:** фаза должна иметь отдельный слой нормализации snapshot-часов на уровне задачи. Planner не должен сводить ее к простому импорту одного поля.

### 2. Full refresh is part of the trust contract

Пользователь выбрал полный переснимок требования с нуля при ручном обновлении. Это важно, потому что:

- инкрементальные патчи дерева могут скрыть изменения статуса, оценки или состава дочерних задач;
- phase-one traversal уже доказал, что требование нужно трактовать как единый scope;
- последующие cost-calculations должны опираться на один консистентный срез, а не на смесь старых и новых веток.

**Вывод для плана:** нужна отдельная задача на orchestration полного refresh-пайплайна: root issue -> дерево -> snapshot значений -> агрегаты/ошибки -> timestamp.

### 3. Missing estimate is a blocking state, not a warning

Пользователь выбрал жесткую семантику:

- если задача должна считаться по `estimate`, но значение пустое, расчет не выполняется;
- задачу нужно выделить в дереве;
- нужно показать закрываемое сообщение со списком проблемных задач.

Это значит, что отсутствие оценки не является "partial success". Это блокирующее бизнес-состояние, но не transport error.

**Вывод для плана:** должны появиться:
- контракт blocked snapshot state;
- список offending issue keys;
- route/UI поведение, при котором часы не выдаются как достоверные.

### 4. Aggregation correctness must preserve Phase 1 traversal guarantees

Phase 1 уже закрепила:

- subtasks-only hierarchy;
- current-user visibility semantics;
- no duplicate nodes / no cyclic inflation.

Phase 2 должна строиться поверх этого, а не переизобретать traversal.

**Вывод для плана:** нужно переиспользовать scope builder или его shape как вход в ingestion, а не вводить второй независимый обход дерева. Иначе появится риск рассинхронизации между UI-tree и data snapshot.

### 5. The live YouTrack integration already exposed contract drift risk

Во время Phase 1 выяснилось, что:

- `subtasks` пришли не в ожидаемой форме;
- поле нужно запрашивать как `subtasks(id,issues(id,idReadable))`;
- клиент уже пришлось делать более defensive.

Это сильный сигнал для Phase 2:

- `status`, `estimate`, `spent time` и work fields тоже могут приходить не так, как ожидается по памяти;
- planner должен заложить отдельную задачу на contract probing и normalization, а не хардкод без проверки.

**Вывод для плана:** ранний plan wave должен зафиксировать YouTrack field contract именно для статуса, оценки и затраченного времени.

### 6. UI in this phase is operational, not dashboard-grade

Хотя фаза в основном про ingestion, у нее есть user-visible часть:

- кнопка/действие ручного обновления;
- timestamp последней синхронизации;
- blocked-state UI для неоцененных задач;
- мягкая визуальная подсветка проблем в дереве.

Но это все еще не Phase 5 dashboard.

**Вывод для плана:** UI-задачи должны быть достаточными для демонстрации полноты snapshot и причин блокировки, без ухода в cost/profitability presentation.

## YouTrack Concepts That Matter For Planning

- **Readable issue key** — нужен для дерева, ошибок и ссылок обратно в YouTrack.
- **Status field** — определяет источник часов на задаче.
- **Estimate field** — используется как обязательное значение для active-like и fallback статусов.
- **Spent time field** — используется для closed-like статусов.
- **Last sync timestamp** — должен отражать, когда был создан текущий snapshot.
- **Current-user scope** — snapshot valid только в рамках того дерева, которое уже было признано видимым.

## Recommended Acceptance Boundaries For Phase 2

Phase 2 можно считать успешно спланированной и затем успешно реализованной только если после выполнения будет верно следующее:

1. Пользователь может вручную обновить данные одного требования из YouTrack.
2. При обновлении система делает полный переснимок всего требования с нуля.
3. Для каждой задачи источник часов выбирается по зафиксированной статусной логике.
4. В одном требовании корректно агрегируются задачи, часть которых идет по `spent time`, а часть по `estimate`.
5. Если задача должна считаться по `estimate`, но не оценена, достоверный расчет не показывается.
6. Неоцененные задачи выделяются в дереве и перечисляются в закрываемом сообщении.
7. Пользователь видит время последней успешной синхронизации snapshot.

## Explicit Non-Goals For Phase 2

Чтобы planner не раздувал объем, в Phase 2 не нужно включать:

- расчет себестоимости;
- ставки по ролям/направлениям;
- рентабельность и недостающую сумму до 20%;
- сохранение сценарных изменений бюджета или дополнительных часов;
- полную explainability до отдельных worklog-записей.

## Risks That Should Become Plan Tasks

### Risk 1: Status labels drift from the company model

Если статусы YouTrack приходят не в том виде, который ожидает продукт, задачи будут читаться по неверному полю часов.

**Plan implication:** нужна ранняя задача на field/status normalization contract.

### Risk 2: Missing estimate is detected too late

Если проблема обнаруживается только после частичной агрегации, UI может получить полуправдоподобные цифры до того, как их заблокируют.

**Plan implication:** blocked-snapshot detection должна происходить до публикации успешного result payload.

### Risk 3: Full refresh and UI tree diverge

Если snapshot строится отдельно от phase-one tree representation, дерево и агрегаты могут ссылаться на разные наборы задач.

**Plan implication:** plan должен опираться на единую canonical tree shape.

### Risk 4: Double counting reappears during aggregation

Хотя phase-one traversal уже защищает от циклов, phase-two aggregation может повторно суммировать задачи или значения, если не переиспользует canonical node IDs.

**Plan implication:** нужен explicit acceptance criterion на no-double-count aggregation.

## Validation Architecture

Phase 2 needs fast automated feedback around three axes:

1. **Normalization tests** — status -> hours-source -> hours-value.
2. **Snapshot blocking tests** — missing estimate creates blocked result with issue list.
3. **Refresh contract tests** — route/service returns timestamped full snapshot state and never emits a false-success payload on invalid data.

The validation strategy should keep fast unit tests around normalization logic and a narrow integration layer around the refresh route/service.

## Suggested Plan Shape

Для этой фазы логично ожидать 3 плана:

1. **Field contract and normalization plan** — определить и реализовать статусы, поля часов и canonical snapshot types.
2. **Refresh and aggregation plan** — построить полный refresh pipeline и aggregation без двойного учета.
3. **Blocked snapshot presentation plan** — показать sync timestamp, blocked state, список неоцененных задач и мягкую подсветку в дереве.

## Sources Already Reflected In Project Artifacts

- `.planning/phases/02-ingestion-correctness/02-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/01-youtrack-data-contract/01-VERIFICATION.md`
- `src/lib/youtrack/client.ts`
- `src/lib/scope/buildScopeTree.ts`

---
*Phase research completed: 2026-04-08*
