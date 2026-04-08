import type {
  DirectionCostTotals,
  DirectionProfitability,
} from "../lib/costing/types";

type DirectionBreakdownProps = {
  readonly directionTotals: readonly DirectionCostTotals[];
  readonly profitability: readonly DirectionProfitability[];
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
      {directionTotals.map((directionTotal) => {
        const directionProfitability = profitability.find(
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
            <div>Hours: {directionTotal.hours.toFixed(2)}</div>
            <div>Cost: {formatValue(directionTotal.cost)}</div>
            <div>Budget: {formatValue(directionProfitability?.budget ?? null)}</div>
            <div>Profitability: {formatPercent(directionProfitability?.marginPercent ?? null)}</div>
            {directionTotal.role === "unmapped" ? <div>unmapped</div> : null}
          </article>
        );
      })}
    </section>
  );
}
