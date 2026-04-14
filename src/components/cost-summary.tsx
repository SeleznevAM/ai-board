import type { RequirementProfitability } from "../lib/costing/types";
import type { ScenarioComparison } from "../lib/scenario/types";

type CostSummaryProps = {
  readonly totalHours: ScenarioComparison<number>;
  readonly totalCost: ScenarioComparison<number | null>;
  readonly profitability: ScenarioComparison<RequirementProfitability>;
  readonly hasScenarioChanges: boolean;
};

function formatMoney(value: number | null): string {
  if (value === null) {
    return "Not available";
  }

  return value.toLocaleString();
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "Not available";
  }

  return `${value.toFixed(2)}%`;
}

function metricBlockStyle(accent: boolean) {
  return {
    display: "grid",
    gap: "8px",
    padding: "16px",
    borderRadius: "18px",
    border: accent ? "1px solid rgba(111, 74, 22, 0.28)" : "1px solid rgba(75, 49, 11, 0.12)",
    background: accent ? "rgba(255, 247, 235, 0.96)" : "rgba(255, 252, 247, 0.94)",
  } as const;
}

export function CostSummary({
  totalHours,
  totalCost,
  profitability,
  hasScenarioChanges,
}: CostSummaryProps) {
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
      <h2 style={{ margin: 0 }}>Cost summary</h2>
      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        <div style={metricBlockStyle(false)}>
          <div
            style={{
              margin: 0,
              fontSize: "0.85rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#6e5430",
            }}
          >
            Current
          </div>
          <div>Total hours: {totalHours.current.toFixed(2)}</div>
          <div>Total cost: {formatMoney(totalCost.current)}</div>
          <div>Budget: {formatMoney(profitability.current.budget)}</div>
          <div>Delta: {formatMoney(profitability.current.delta)}</div>
          <div>Profitability: {formatPercent(profitability.current.marginPercent)}</div>
          <div>Needed to reach 20%: {formatMoney(profitability.current.neededUpsell)}</div>
        </div>

        <div style={metricBlockStyle(true)}>
          <div
            style={{
              margin: 0,
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#6f4a16",
            }}
          >
            Forecast
          </div>
          <div>Total hours: {totalHours.forecast.toFixed(2)}</div>
          <div>Total cost: {formatMoney(totalCost.forecast)}</div>
          <div>Budget: {formatMoney(profitability.forecast.budget)}</div>
          <div>Delta: {formatMoney(profitability.forecast.delta)}</div>
          <div>Profitability: {formatPercent(profitability.forecast.marginPercent)}</div>
          <div>Needed to reach 20%: {formatMoney(profitability.forecast.neededUpsell)}</div>
        </div>
      </div>
      {!hasScenarioChanges ? (
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          No extra hours added yet. Current values match the YouTrack snapshot.
        </p>
      ) : null}
      {profitability.current.marginPercent === null || profitability.forecast.marginPercent === null ? (
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Enter a positive budget to unlock profitability percentages without showing fake numbers.
        </p>
      ) : null}
    </section>
  );
}
