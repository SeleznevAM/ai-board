import React from "react";

import {
  getDashboardStatusBlockStyle,
  getDashboardStatusPresentation,
} from "./dashboard-status";
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

type DirectionRow = {
  readonly role: DirectionCostTotals["role"];
  readonly budget: number | null;
  readonly actualHours: number;
  readonly extraHours: number;
  readonly cost: number | null;
  readonly profitability: number | null;
  readonly contributionDelta: number | null;
  readonly hasForecastDelta: boolean;
  readonly secondaryCost: number | null;
  readonly secondaryProfitability: number | null;
};

function formatMoney(value: number | null): string {
  if (value === null) {
    return "Недоступно";
  }

  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function formatHours(value: number): string {
  return value.toFixed(2);
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "Недоступно";
  }

  return `${value.toFixed(2)}%`;
}

function columnHeaderStyle() {
  return {
    padding: "0 14px 10px",
    fontSize: "0.74rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#6e5430",
    textAlign: "left",
  } as const;
}

function buildDirectionRows({
  directionTotals,
  profitability,
  directionDeltas,
}: DirectionBreakdownProps): DirectionRow[] {
  return directionTotals.current.map((currentTotal) => {
    const currentProfitability = profitability.current.find(
      (entry) => entry.role === currentTotal.role,
    );
    const forecastTotal = directionTotals.forecast.find(
      (entry) => entry.role === currentTotal.role,
    );
    const forecastProfitability = profitability.forecast.find(
      (entry) => entry.role === currentTotal.role,
    );
    const delta = directionDeltas.find((entry) => entry.role === currentTotal.role);
    const hasForecastDelta = (delta?.addedHours ?? 0) > 0;

    return {
      role: currentTotal.role,
      budget: currentProfitability?.budget ?? null,
      actualHours: currentTotal.hours,
      extraHours: delta?.addedHours ?? 0,
      cost: hasForecastDelta ? (forecastTotal?.cost ?? currentTotal.cost) : currentTotal.cost,
      profitability: hasForecastDelta
        ? (forecastProfitability?.marginPercent ?? currentProfitability?.marginPercent ?? null)
        : (currentProfitability?.marginPercent ?? null),
      contributionDelta: hasForecastDelta
        ? (forecastProfitability?.delta ?? currentProfitability?.delta ?? null)
        : (currentProfitability?.delta ?? null),
      hasForecastDelta,
      secondaryCost: hasForecastDelta ? currentTotal.cost : forecastTotal?.cost ?? null,
      secondaryProfitability: hasForecastDelta
        ? (currentProfitability?.marginPercent ?? null)
        : (forecastProfitability?.marginPercent ?? null),
    };
  });
}

export function DirectionBreakdown(props: DirectionBreakdownProps) {
  const rows = buildDirectionRows(props);

  return (
    <section
      style={{
        display: "grid",
        gap: "18px",
        padding: "24px",
        borderRadius: "24px",
        border: "1px solid rgba(75, 49, 11, 0.18)",
        background: "rgba(255, 250, 242, 0.78)",
      }}
    >
      <div style={{ display: "grid", gap: "8px" }}>
        <h2 style={{ margin: 0 }}>Разбивка по направлениям</h2>
        <p style={{ margin: 0, lineHeight: 1.6, color: "#6e5430" }}>
          Компактная диагностическая таблица по бюджету, часам и рентабельности по направлениям.
        </p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "0 10px",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr>
              <th style={{ ...columnHeaderStyle(), width: "14%" }}>Направление</th>
              <th style={{ ...columnHeaderStyle(), width: "13%" }}>Бюджет</th>
              <th style={{ ...columnHeaderStyle(), width: "11%" }}>Факт, ч</th>
              <th style={{ ...columnHeaderStyle(), width: "10%" }}>Доп. ч</th>
              <th style={{ ...columnHeaderStyle(), width: "16%" }}>Затраты</th>
              <th style={{ ...columnHeaderStyle(), width: "15%" }}>Рентабельность</th>
              <th style={{ ...columnHeaderStyle(), width: "21%" }}>Вклад</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = getDashboardStatusPresentation(row.profitability);

              return (
                <tr
                  key={row.role}
                  data-role={row.role}
                  data-status={status.tone}
                  style={{
                    ...getDashboardStatusBlockStyle(row.profitability),
                  }}
                >
                  <td
                    data-column="direction"
                    style={{
                      padding: "14px",
                      borderTopLeftRadius: "18px",
                      borderBottomLeftRadius: "18px",
                      borderTop: `1px solid ${status.borderColor}`,
                      borderBottom: `1px solid ${status.borderColor}`,
                      borderLeft: `1px solid ${status.borderColor}`,
                      verticalAlign: "top",
                    }}
                  >
                    <div style={{ display: "grid", gap: "6px" }}>
                      <strong>{row.role}</strong>
                      <span style={{ fontSize: "0.86rem", color: status.mutedColor }}>
                        {row.hasForecastDelta ? "учтен прогноз" : "текущий факт"}
                      </span>
                    </div>
                  </td>
                  <td
                    data-column="budget"
                    style={{
                      padding: "14px",
                      borderTop: `1px solid ${status.borderColor}`,
                      borderBottom: `1px solid ${status.borderColor}`,
                      verticalAlign: "top",
                    }}
                  >
                    {formatMoney(row.budget)}
                  </td>
                  <td
                    data-column="actual-hours"
                    style={{
                      padding: "14px",
                      borderTop: `1px solid ${status.borderColor}`,
                      borderBottom: `1px solid ${status.borderColor}`,
                      verticalAlign: "top",
                    }}
                  >
                    {formatHours(row.actualHours)} h
                  </td>
                  <td
                    data-column="extra-hours"
                    style={{
                      padding: "14px",
                      borderTop: `1px solid ${status.borderColor}`,
                      borderBottom: `1px solid ${status.borderColor}`,
                      verticalAlign: "top",
                    }}
                  >
                    {formatHours(row.extraHours)} h
                  </td>
                  <td
                    data-column="cost"
                    style={{
                      padding: "14px",
                      borderTop: `1px solid ${status.borderColor}`,
                      borderBottom: `1px solid ${status.borderColor}`,
                      verticalAlign: "top",
                    }}
                  >
                    <div style={{ display: "grid", gap: "4px" }}>
                      <strong>{formatMoney(row.cost)}</strong>
                      {row.secondaryCost !== null ? (
                        <span style={{ fontSize: "0.86rem", color: status.mutedColor }}>
                          База: {formatMoney(row.secondaryCost)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td
                    data-column="profitability"
                    style={{
                      padding: "14px",
                      borderTop: `1px solid ${status.borderColor}`,
                      borderBottom: `1px solid ${status.borderColor}`,
                      verticalAlign: "top",
                    }}
                  >
                    <div style={{ display: "grid", gap: "4px" }}>
                      <strong>{formatPercent(row.profitability)}</strong>
                      <span style={{ fontSize: "0.86rem", color: status.mutedColor }}>
                        {status.label}
                      </span>
                      {row.secondaryProfitability !== null ? (
                        <span style={{ fontSize: "0.86rem", color: status.mutedColor }}>
                          База: {formatPercent(row.secondaryProfitability)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td
                    data-column="contribution"
                    style={{
                      padding: "14px",
                      borderTopRightRadius: "18px",
                      borderBottomRightRadius: "18px",
                      borderTop: `1px solid ${status.borderColor}`,
                      borderRight: `1px solid ${status.borderColor}`,
                      borderBottom: `1px solid ${status.borderColor}`,
                      verticalAlign: "top",
                    }}
                  >
                    <div style={{ display: "grid", gap: "4px" }}>
                      <strong>{formatMoney(row.contributionDelta)}</strong>
                      <span style={{ fontSize: "0.86rem", color: status.mutedColor }}>
                        отклонение от бюджета
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
