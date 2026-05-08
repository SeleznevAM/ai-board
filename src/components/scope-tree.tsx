import { useEffect, useState } from "react";

import { formatLocaleNumber, parseLocaleNumber } from "../lib/formatting/number";
import type { ScopeTreeNode } from "../lib/scope/types";

type ScenarioIssueCardState = {
  readonly extraHours: number;
  readonly assigneeLabel: string;
  readonly addedCost: number | null;
};

type ScopeTreeProps = {
  readonly root: ScopeTreeNode;
  readonly blockedIssueKeys?: readonly string[];
  readonly missingAssigneeIssueKeys?: readonly string[];
  readonly youTrackBaseUrl?: string;
  readonly scenarioExtraHoursByIssueKey?: Readonly<Record<string, number>>;
  readonly scenarioIssueStateByIssueKey?: Readonly<Record<string, ScenarioIssueCardState>>;
  readonly onApplyScenarioExtraHours?: (issueKey: string, hours: number) => void;
  readonly onClearScenarioExtraHours?: (issueKey: string) => void;
};

function formatHours(hours: number): string {
  return formatLocaleNumber(hours, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMoney(value: number | null): string {
  if (value === null) {
    return "Ставка недоступна";
  }

  return formatLocaleNumber(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function parseExtraHours(value: string): number | null {
  const parsed = parseLocaleNumber(value);
  if (parsed === null || !Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function TreeBranch({
  node,
  blockedIssueKeys,
  missingAssigneeIssueKeys,
  youTrackBaseUrl,
  scenarioExtraHoursByIssueKey,
  scenarioIssueStateByIssueKey,
  onApplyScenarioExtraHours,
  onClearScenarioExtraHours,
}: {
  readonly node: ScopeTreeNode;
  readonly blockedIssueKeys: ReadonlySet<string>;
  readonly missingAssigneeIssueKeys: ReadonlySet<string>;
  readonly youTrackBaseUrl: string | null;
  readonly scenarioExtraHoursByIssueKey: Readonly<Record<string, number>>;
  readonly scenarioIssueStateByIssueKey: Readonly<Record<string, ScenarioIssueCardState>>;
  readonly onApplyScenarioExtraHours?: (issueKey: string, hours: number) => void;
  readonly onClearScenarioExtraHours?: (issueKey: string) => void;
}) {
  const isBlocked = blockedIssueKeys.has(node.issue.key);
  const isMissingAssignee = missingAssigneeIssueKeys.has(node.issue.key);
  const issueUrl = youTrackBaseUrl
    ? `${youTrackBaseUrl.replace(/\/$/, "")}/issue/${node.issue.key}`
    : null;
  const scenarioHours = scenarioExtraHoursByIssueKey[node.issue.key] ?? 0;
  const scenarioState = scenarioIssueStateByIssueKey[node.issue.key];
  const [extraHoursInput, setExtraHoursInput] = useState(
    scenarioHours > 0
      ? formatLocaleNumber(scenarioHours, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : "",
  );
  const canEditScenario = Boolean(onApplyScenarioExtraHours && onClearScenarioExtraHours) && !isBlocked;

  useEffect(() => {
    setExtraHoursInput(
      scenarioHours > 0
        ? formatLocaleNumber(scenarioHours, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })
        : "",
    );
  }, [scenarioHours]);

  return (
    <li
      style={{
        display: "grid",
        gap: "10px",
      }}
    >
      <div
        style={{
          borderRadius: "16px",
          border: isBlocked
            ? "1px solid rgba(186, 79, 79, 0.34)"
            : isMissingAssignee
            ? "1px solid rgba(186, 79, 79, 0.34)"
            : "1px solid rgba(75, 49, 11, 0.16)",
          background:
            isBlocked || isMissingAssignee
              ? "rgba(255, 240, 238, 0.94)"
              : "rgba(255, 252, 247, 0.92)",
          padding: "14px 16px",
        }}
      >
        <div style={{ fontWeight: 700 }}>{node.issue.key}</div>
        <div style={{ marginTop: "6px", lineHeight: 1.5 }}>{node.issue.summary}</div>
        {node.issue.assignee?.displayName || node.issue.assignee?.login ? (
          <p style={{ margin: "10px 0 0", lineHeight: 1.5 }}>
            Исполнитель: {node.issue.assignee?.displayName ?? node.issue.assignee?.login}
          </p>
        ) : null}
        {canEditScenario ? (
          <div
            style={{
              display: "grid",
              gap: "8px",
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(75, 49, 11, 0.12)",
            }}
          >
            <label style={{ display: "grid", gap: "6px", fontWeight: 700 }}>
              Дополнительные часы
              <input
                value={extraHoursInput}
                onChange={(event) => setExtraHoursInput(event.target.value)}
                inputMode="decimal"
                placeholder="2.5"
                style={{
                  minHeight: "44px",
                  borderRadius: "12px",
                  border: "1px solid rgba(75, 49, 11, 0.24)",
                  padding: "10px 12px",
                  font: "inherit",
                }}
              />
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseExtraHours(extraHoursInput);
                  if (parsed !== null) {
                    onApplyScenarioExtraHours?.(node.issue.key, parsed);
                  }
                }}
                style={{
                  minHeight: "44px",
                  borderRadius: "999px",
                  border: "none",
                  padding: "10px 16px",
                  font: "inherit",
                  fontWeight: 700,
                  background: "#6f4a16",
                  color: "#fffaf2",
                  cursor: "pointer",
                }}
              >
                Добавить часы
              </button>
              <button
                type="button"
                onClick={() => {
                  setExtraHoursInput("");
                  onClearScenarioExtraHours?.(node.issue.key);
                }}
                style={{
                  minHeight: "44px",
                  borderRadius: "999px",
                  border: "1px solid rgba(156, 28, 28, 0.3)",
                  padding: "10px 16px",
                  font: "inherit",
                  fontWeight: 700,
                  background: "rgba(255, 240, 238, 0.9)",
                  color: "#9c1c1c",
                  cursor: "pointer",
                }}
              >
                Сбросить сценарий
              </button>
            </div>
            {scenarioState ? (
              <div style={{ display: "grid", gap: "4px", lineHeight: 1.5 }}>
                <span>
                  Прогноз по сценарию: +{formatHours(scenarioState.extraHours)} ч для{" "}
                  {scenarioState.assigneeLabel}
                </span>
                <span>Дополнительная стоимость: {formatMoney(scenarioState.addedCost)}</span>
              </div>
            ) : (
              <p style={{ margin: 0, lineHeight: 1.5, color: "#6b5128" }}>
                Дополнительные часы еще не добавлены. Текущее значение совпадает со снимком YouTrack.
              </p>
            )}
          </div>
        ) : null}
        {isBlocked ? (
          <p
            style={{
              margin: "10px 0 0",
              color: "#9b3030",
              lineHeight: 1.5,
            }}
          >
            Для этой задачи не хватает данных оценки, поэтому текущий снимок по ней нельзя считать корректным.
          </p>
        ) : null}
        {isMissingAssignee ? (
          <p
            style={{
              margin: "10px 0 0",
              color: "#9b3030",
              lineHeight: 1.5,
            }}
          >
            У задачи не назначен исполнитель. Она считается по средней ставке и попадает в категорию «unmapped».
          </p>
        ) : null}
        {issueUrl ? (
          <a
            href={issueUrl}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              display: "inline-flex",
              marginTop: "10px",
              color: isBlocked ? "#8f2f2f" : "#6f4a16",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Открыть в YouTrack
          </a>
        ) : null}
      </div>

      {node.children.length > 0 ? (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            paddingLeft: "20px",
            display: "grid",
            gap: "10px",
            borderLeft: "2px solid rgba(122, 90, 34, 0.24)",
          }}
        >
          {node.children.map((child) => (
            <TreeBranch
              key={child.issue.id}
              node={child}
              blockedIssueKeys={blockedIssueKeys}
              missingAssigneeIssueKeys={missingAssigneeIssueKeys}
              youTrackBaseUrl={youTrackBaseUrl}
              scenarioExtraHoursByIssueKey={scenarioExtraHoursByIssueKey}
              scenarioIssueStateByIssueKey={scenarioIssueStateByIssueKey}
              onApplyScenarioExtraHours={onApplyScenarioExtraHours}
              onClearScenarioExtraHours={onClearScenarioExtraHours}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ScopeTree({
  root,
  blockedIssueKeys = [],
  missingAssigneeIssueKeys = [],
  youTrackBaseUrl,
  scenarioExtraHoursByIssueKey = {},
  scenarioIssueStateByIssueKey = {},
  onApplyScenarioExtraHours,
  onClearScenarioExtraHours,
}: ScopeTreeProps) {
  const blockedSet = new Set(blockedIssueKeys);
  const missingAssigneeSet = new Set(missingAssigneeIssueKeys);

  return (
    <section
      aria-label="Scope tree"
      style={{
        display: "grid",
        gap: "14px",
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: "1.35rem" }}>Scope tree</h2>
        <p style={{ marginBottom: 0, lineHeight: 1.6 }}>
          A successful result renders only the supported hierarchy returned by the
          phase-one scope contract.
        </p>
      </div>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gap: "10px",
        }}
      >
        <TreeBranch
          node={root}
          blockedIssueKeys={blockedSet}
          missingAssigneeIssueKeys={missingAssigneeSet}
          youTrackBaseUrl={youTrackBaseUrl ?? null}
          scenarioExtraHoursByIssueKey={scenarioExtraHoursByIssueKey}
          scenarioIssueStateByIssueKey={scenarioIssueStateByIssueKey}
          onApplyScenarioExtraHours={onApplyScenarioExtraHours}
          onClearScenarioExtraHours={onClearScenarioExtraHours}
        />
      </ul>
    </section>
  );
}
