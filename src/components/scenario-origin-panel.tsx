import type { DirectionBudgetMap } from "../lib/costing/types";
import type { ScenarioOrigin } from "../lib/scenario/types";

type ScenarioOriginPanelProps = {
  readonly origin: ScenarioOrigin;
  readonly hasScenarioChanges: boolean;
};

function formatMoney(value: number): string {
  return value.toLocaleString();
}

function formatHours(value: number): string {
  return value.toFixed(2);
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString();
}

function renderBudgetList(title: string, budgets: DirectionBudgetMap) {
  return (
    <div
      style={{
        display: "grid",
        gap: "8px",
        padding: "16px",
        borderRadius: "18px",
        background: "rgba(255, 252, 247, 0.94)",
      }}
    >
      <div
        style={{
          fontSize: "0.82rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#6e5430",
        }}
      >
        {title}
      </div>
      {Object.entries(budgets).map(([role, budget]) => (
        <div
          key={role}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span style={{ fontWeight: 700 }}>{role}</span>
          <span>{formatMoney(budget)}</span>
        </div>
      ))}
    </div>
  );
}

export function ScenarioOriginPanel({
  origin,
  hasScenarioChanges,
}: ScenarioOriginPanelProps) {
  const extraHourEntries = Object.entries(origin.extraHoursByIssueKey).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return (
    <section
      style={{
        display: "grid",
        gap: "14px",
        padding: "20px",
        borderRadius: "24px",
        border: "1px solid rgba(75, 49, 11, 0.18)",
        background: "rgba(255, 250, 242, 0.78)",
      }}
    >
      <div style={{ display: "grid", gap: "8px" }}>
        <h2 style={{ margin: 0 }}>Scenario provenance</h2>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Actual values come from the latest YouTrack snapshot. Forecast values come only
          from edits on this screen.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "12px",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "6px",
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(255, 252, 247, 0.94)",
          }}
        >
          <div
            style={{
              fontSize: "0.76rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#6e5430",
            }}
          >
            Root issue
          </div>
          <div>{origin.rootIssueKey}</div>
        </div>
        <div
          style={{
            display: "grid",
            gap: "6px",
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(255, 252, 247, 0.94)",
          }}
        >
          <div
            style={{
              fontSize: "0.76rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#6e5430",
            }}
          >
            Last sync
          </div>
          <div>{formatTimestamp(origin.lastSyncedAt)}</div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "12px",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {renderBudgetList("Baseline budgets", origin.baselineBudgets)}
        {renderBudgetList("Scenario budgets", origin.scenarioBudgets)}
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px",
          padding: "14px 16px",
          borderRadius: "16px",
          border: "1px solid rgba(111, 74, 22, 0.2)",
          background: "rgba(255, 247, 235, 0.96)",
        }}
      >
        <div
          style={{
            fontSize: "0.82rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#6f4a16",
          }}
        >
          Issue deltas
        </div>
        {extraHourEntries.length > 0 ? (
          extraHourEntries.map(([issueKey, hours]) => (
            <div
              key={issueKey}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <span style={{ fontWeight: 700 }}>{issueKey}</span>
              <span>{formatHours(hours)} h</span>
            </div>
          ))
        ) : (
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            {hasScenarioChanges
              ? "No extra hours are stored in the current scenario."
              : "No issue-level extra hours yet. Forecast currently matches the snapshot."}
          </p>
        )}
      </div>
    </section>
  );
}
