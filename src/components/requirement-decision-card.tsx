import React, { type ReactNode } from "react";

import { calculateRequiredBudgetForTargetMargin } from "../lib/costing/calculateProfitability";
import { formatLocaleNumber } from "../lib/formatting/number";
import type { RequirementProfitability } from "../lib/costing/types";
import type { ScenarioComparison } from "../lib/scenario/types";
import {
  getDashboardStatusBlockStyle,
  getDashboardStatusPresentation,
} from "./dashboard-status";

type RequirementDecisionCardProps = {
  readonly totalHours: ScenarioComparison<number>;
  readonly profitability: ScenarioComparison<RequirementProfitability>;
  readonly hasScenarioChanges: boolean;
};

function formatMoney(value: number | null): string {
  return formatLocaleNumber(value, {
    maximumFractionDigits: 2,
  });
}

function formatHours(value: number): string {
  return formatLocaleNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "Недоступно";
  }

  return `${formatLocaleNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function supportingLine({
  label,
  value,
  hidden,
  slot,
  tone = "#6e5430",
  weight = 700,
}: {
  readonly label: string;
  readonly value: string;
  readonly hidden: boolean;
  readonly slot: string;
  readonly tone?: string;
  readonly weight?: number;
}): ReactNode {
  if (hidden) {
    return null;
  }

  return (
    <div
      data-slot={slot}
      style={{
        display: "grid",
        gap: "2px",
        fontSize: "0.95rem",
        color: tone,
      }}
    >
      <span>{label}</span>
      <strong style={{ color: tone, fontWeight: weight }}>{value}</strong>
    </div>
  );
}

function blockBaseStyle() {
  return {
    display: "grid",
    gap: "14px",
    minHeight: "188px",
    padding: "20px",
    borderRadius: "22px",
    border: "1px solid rgba(75, 49, 11, 0.12)",
    background: "rgba(255, 252, 247, 0.96)",
  } as const;
}

export function RequirementDecisionCard({
  totalHours,
  profitability,
  hasScenarioChanges,
}: RequirementDecisionCardProps) {
  const laborChanged = totalHours.current !== totalHours.forecast;
  const marginChanged =
    profitability.current.marginPercent !== profitability.forecast.marginPercent;
  const activeMarginPercent =
    hasScenarioChanges && marginChanged
      ? profitability.forecast.marginPercent
      : profitability.current.marginPercent;
  const marginStatus = getDashboardStatusPresentation(activeMarginPercent);
  const targetBudget = calculateRequiredBudgetForTargetMargin(profitability.current.cost);
  const needsApproval =
    profitability.current.neededUpsell !== null && profitability.current.neededUpsell > 0;

  return (
    <section
      data-scenario-state={hasScenarioChanges ? "changed" : "baseline"}
      style={{
        display: "grid",
        gap: "16px",
        padding: "28px",
        borderRadius: "28px",
        border: "1px solid rgba(75, 49, 11, 0.18)",
        background: "rgba(255, 250, 242, 0.82)",
      }}
    >
      <header style={{ display: "grid", gap: "8px" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.82rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#7a5a22",
          }}
        >
          Карточка решения
        </p>
        <h2 style={{ margin: 0, fontSize: "1.75rem" }}>Итог по требованию</h2>
        <p style={{ margin: 0, color: "#6e5430", lineHeight: 1.5 }}>
          {hasScenarioChanges
            ? "Сценарные значения показаны вторым слоем внутри карточки."
            : "Карточка показывает базовый снимок без сценарных добавок."}
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        }}
      >
        <article data-block="budget" style={blockBaseStyle()}>
          <div style={{ display: "grid", gap: "6px" }}>
            <div
              style={{
                fontSize: "0.78rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#6e5430",
              }}
            >
              Бюджет
            </div>
            <strong style={{ fontSize: "2rem", lineHeight: 1.1 }}>
              {formatMoney(profitability.current.budget)}
            </strong>
          </div>
          <div style={{ display: "grid", gap: "6px", color: "#4b310b" }}>
            <span>Дельта: {formatMoney(profitability.current.delta)}</span>
          </div>
        </article>

        <article data-block="labor" style={blockBaseStyle()}>
          <div style={{ display: "grid", gap: "6px" }}>
            <div
              style={{
                fontSize: "0.78rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#6e5430",
              }}
            >
              Трудозатраты
            </div>
            <strong style={{ fontSize: "2rem", lineHeight: 1.1 }}>
              {formatHours(totalHours.current)} ч
            </strong>
          </div>
          <div style={{ display: "grid", gap: "6px", color: "#4b310b" }}>
            <span>Себестоимость: {formatMoney(profitability.current.cost)}</span>
          </div>
          {supportingLine({
            label: "Сценарные трудозатраты",
            value: `${formatHours(totalHours.forecast)} ч`,
            hidden: !hasScenarioChanges || !laborChanged,
            slot: "scenario-hours",
          })}
        </article>

        <article
          data-block="margin"
          data-status={marginStatus.tone}
          style={{
            ...blockBaseStyle(),
            ...getDashboardStatusBlockStyle(activeMarginPercent),
          }}
        >
          <div style={{ display: "grid", gap: "6px" }}>
            <div
              style={{
                fontSize: "0.78rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: marginStatus.mutedColor,
              }}
            >
              Рентабельность
            </div>
            <strong style={{ fontSize: "2rem", lineHeight: 1.1 }}>
              {formatPercent(profitability.current.marginPercent)}
            </strong>
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <span>{marginStatus.label}</span>
          </div>
          {supportingLine({
            label: "Целевой бюджет",
            value: formatMoney(targetBudget),
            hidden: !needsApproval,
            slot: "target-budget",
          })}
          {supportingLine({
            label: "Требуется к согласованию",
            value: `+${formatMoney(profitability.current.neededUpsell)}`,
            hidden: !needsApproval,
            slot: "required-approval",
            tone: "#b42318",
            weight: 800,
          })}
          {supportingLine({
            label: "Прогнозная рентабельность",
            value: formatPercent(profitability.forecast.marginPercent),
            hidden: !hasScenarioChanges || !marginChanged,
            slot: "scenario-margin",
            tone:
              hasScenarioChanges && profitability.forecast.marginPercent !== null && profitability.forecast.marginPercent < 20
                ? "#b42318"
                : marginStatus.mutedColor,
            weight:
              hasScenarioChanges && profitability.forecast.marginPercent !== null && profitability.forecast.marginPercent < 20
                ? 800
                : 700,
          })}
        </article>
      </div>
    </section>
  );
}
