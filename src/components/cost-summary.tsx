import type { RequirementProfitability } from "../lib/costing/types";

type CostSummaryProps = {
  readonly totalHours: number;
  readonly totalCost: number | null;
  readonly profitability: RequirementProfitability;
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

export function CostSummary({ totalHours, totalCost, profitability }: CostSummaryProps) {
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
      <div>Total hours: {totalHours.toFixed(2)}</div>
      <div>Total cost: {formatMoney(totalCost)}</div>
      <div>Budget: {formatMoney(profitability.budget)}</div>
      <div>Delta: {formatMoney(profitability.delta)}</div>
      <div>Profitability: {formatPercent(profitability.marginPercent)}</div>
      <div>Needed to reach 20%: {formatMoney(profitability.neededUpsell)}</div>
      {profitability.marginPercent === null ? (
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Enter a positive budget to unlock profitability percentages without showing fake numbers.
        </p>
      ) : null}
    </section>
  );
}
