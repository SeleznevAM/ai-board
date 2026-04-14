import type {
  DirectionCostTotals,
  DirectionProfitability,
} from "../lib/costing/types";
import type {
  ScenarioComparison,
  ScenarioDirectionDelta,
} from "../lib/scenario/types";

type DirectionBreakdownProps = {
  readonly directionTotals: ScenarioComparison<readonly DirectionCostTotals[]>;
  readonly profitability: ScenarioComparison<readonly DirectionProfitability[]>;
  readonly directionDeltas: readonly ScenarioDirectionDelta[];
};

function formatValue(value: number | null): string {
  if (value === null) {
    return "Not available";
  }

  return value.toFixed(2);
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "Not available";
  }

  return `${value.toFixed(2)}%`;
}

export function DirectionBreakdown({
  directionTotals,
  profitability,
  directionDeltas,
}: DirectionBreakdownProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "12px",
        padding: "24px",
        borderRadius: "24px",
        border: "1px solid rgba(75, 49, 11, 0.18)",
        background: "rgba(255, 250, 242, 0.78)",
      }}
    >
      <h2 style={{ margin: 0 }}>Direction breakdown</h2>
      {directionTotals.current.map((directionTotal) => {
        const currentProfitability = profitability.current.find(
          (entry) => entry.role === directionTotal.role,
        );
        const forecastTotal = directionTotals.forecast.find(
          (entry) => entry.role === directionTotal.role,
        );
        const forecastProfitability = profitability.forecast.find(
          (entry) => entry.role === directionTotal.role,
        );
        const delta = directionDeltas.find(
          (entry) => entry.role === directionTotal.role,
        );

        return (
          <article
            key={directionTotal.role}
            style={{
              display: "grid",
              gap: "6px",
              padding: "16px",
              borderRadius: "18px",
              border: "1px solid rgba(75, 49, 11, 0.16)",
              background: "rgba(255, 252, 247, 0.94)",
            }}
          >
            <div style={{ fontWeight: 700 }}>{directionTotal.role}</div>
            <div
              style={{
                display: "grid",
                gap: "12px",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: "6px",
                  padding: "12px",
                  borderRadius: "14px",
                  background: "rgba(255, 250, 242, 0.88)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#6e5430",
                  }}
                >
                  Current
                </div>
                <div>Actual hours: {directionTotal.hours.toFixed(2)}</div>
                <div>Current cost: {formatValue(directionTotal.cost)}</div>
                <div>Budget: {formatValue(currentProfitability?.budget ?? null)}</div>
              </div>
              <div
                style={{
                  display: "grid",
                  gap: "6px",
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid rgba(111, 74, 22, 0.2)",
                  background: "rgba(255, 247, 235, 0.96)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#6f4a16",
                  }}
                >
                  Forecast
                </div>
                <div>Extra hours: {(delta?.addedHours ?? 0).toFixed(2)}</div>
                <div>Forecast cost: {formatValue(forecastTotal?.cost ?? null)}</div>
                <div>
                  Forecast profitability:{" "}
                  {formatPercent(forecastProfitability?.marginPercent ?? null)}
                </div>
              </div>
            </div>
            {directionTotal.role === "unmapped" ? <div>unmapped</div> : null}
          </article>
        );
      })}
    </section>
  );
}
