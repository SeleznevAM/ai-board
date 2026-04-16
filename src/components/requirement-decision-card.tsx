import React, { type ReactNode } from "react";

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
  if (value === null) {
    return "Not available";
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
    return "Not available";
  }

  return `${value.toFixed(2)}%`;
}

function supportingLine({
  label,
  value,
  hidden,
  slot,
}: {
  readonly label: string;
  readonly value: string;
  readonly hidden: boolean;
  readonly slot: string;
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
        color: "#6e5430",
      }}
    >
      <span>{label}</span>
      <strong style={{ color: "#4b310b" }}>{value}</strong>
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
  const budgetChanged = profitability.current.budget !== profitability.forecast.budget;
  const laborChanged = totalHours.current !== totalHours.forecast;
  const marginChanged =
    profitability.current.marginPercent !== profitability.forecast.marginPercent;
  const marginStatus = getDashboardStatusPresentation(profitability.current.marginPercent);

  return (
    <section
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
          Requirement decision card
        </p>
        <h2 style={{ margin: 0, fontSize: "1.75rem" }}>Итог по требованию</h2>
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
          {supportingLine({
            label: "Сценарный бюджет",
            value: formatMoney(profitability.forecast.budget),
            hidden: !hasScenarioChanges || !budgetChanged,
            slot: "scenario-budget",
          })}
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
            ...getDashboardStatusBlockStyle(profitability.current.marginPercent),
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
            <span data-slot="needed-upsell">
              До 20% не хватает: {formatMoney(profitability.current.neededUpsell)}
            </span>
          </div>
          {supportingLine({
            label: "Сценарная рентабельность",
            value: formatPercent(profitability.forecast.marginPercent),
            hidden: !hasScenarioChanges || !marginChanged,
            slot: "scenario-margin",
          })}
        </article>
      </div>
    </section>
  );
}
