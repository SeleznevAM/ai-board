"use client";

import { useEffect, useState } from "react";

import {
  allocateEvenBudgets,
  applyDirectionBudgetOverrides,
  recalculateTotalBudget,
} from "../lib/costing/budgetAllocation";
import { COST_DIRECTION_KEYS, type DirectionBudgetMap } from "../lib/costing/types";

type BudgetAllocationFormProps = {
  readonly baselineTotalBudget: number | null;
  readonly baselineDirectionBudgets: DirectionBudgetMap;
  readonly scenarioDirectionBudgets: DirectionBudgetMap;
  readonly onChange: (nextState: {
    directionBudgets: DirectionBudgetMap;
  }) => void;
};

function parseBudgetValue(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function BudgetAllocationForm({
  baselineTotalBudget,
  baselineDirectionBudgets,
  scenarioDirectionBudgets,
  onChange,
}: BudgetAllocationFormProps) {
  const [totalBudgetInput, setTotalBudgetInput] = useState(
    recalculateTotalBudget(scenarioDirectionBudgets).toString(),
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draftBudgets, setDraftBudgets] = useState<DirectionBudgetMap>(scenarioDirectionBudgets);

  useEffect(() => {
    setTotalBudgetInput(recalculateTotalBudget(scenarioDirectionBudgets).toString());
  }, [scenarioDirectionBudgets]);

  useEffect(() => {
    setDraftBudgets(scenarioDirectionBudgets);
  }, [scenarioDirectionBudgets]);

  function handleTotalBudgetChange(value: string) {
    setTotalBudgetInput(value);
    const parsed = parseBudgetValue(value);
    if (parsed === null) {
      onChange({
        directionBudgets: allocateEvenBudgets(0),
      });
      return;
    }

    onChange({
      directionBudgets: allocateEvenBudgets(parsed),
    });
  }

  function handleSaveDirectionBudgets() {
    const nextDirectionBudgets = applyDirectionBudgetOverrides(
      scenarioDirectionBudgets,
      draftBudgets,
    );
    onChange({
      directionBudgets: nextDirectionBudgets,
    });
    setIsEditorOpen(false);
  }

  const scenarioTotalBudget = recalculateTotalBudget(scenarioDirectionBudgets);
  const baselineTotalLabel = baselineTotalBudget === null ? "Не задан" : baselineTotalBudget.toFixed(2);
  const scenarioTotalLabel = scenarioTotalBudget.toFixed(2);

  return (
    <section
      style={{
        display: "grid",
        gap: "14px",
        padding: "24px",
        borderRadius: "24px",
        border: "1px solid rgba(75, 49, 11, 0.18)",
        background: "rgba(255, 250, 242, 0.78)",
      }}
    >
      <h2 style={{ margin: 0 }}>Распределение бюджета</h2>
      <div
        style={{
          display: "grid",
          gap: "10px",
          borderRadius: "16px",
          border: "1px solid rgba(75, 49, 11, 0.12)",
          background: "rgba(255, 255, 255, 0.6)",
          padding: "16px",
        }}
      >
        <div style={{ display: "grid", gap: "4px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.04em" }}>
            Бюджет в расчете
          </span>
          <span>Текущее значение: {scenarioTotalLabel}</span>
        </div>
        <div style={{ display: "grid", gap: "4px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.04em" }}>
            Значение при последнем обновлении
          </span>
          <span>Исходное значение: {baselineTotalLabel}</span>
        </div>
        <div
          style={{
            display: "grid",
            gap: "6px",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          }}
        >
          {COST_DIRECTION_KEYS.map((direction) => (
            <div
              key={direction}
              style={{
                borderRadius: "12px",
                background: "rgba(255, 250, 242, 0.88)",
                padding: "8px 10px",
              }}
            >
              <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{direction}</div>
              <div style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
                Было {baselineDirectionBudgets[direction].toFixed(2)}
              </div>
              <div style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
                Сейчас {scenarioDirectionBudgets[direction].toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <label style={{ display: "grid", gap: "6px" }}>
        Бюджет
        <input
          value={totalBudgetInput}
          onChange={(event) => handleTotalBudgetChange(event.target.value)}
          placeholder="100000"
          inputMode="decimal"
          style={{
            borderRadius: "12px",
            border: "1px solid rgba(75, 49, 11, 0.24)",
            padding: "10px 12px",
            font: "inherit",
          }}
        />
      </label>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setIsEditorOpen((current) => !current)}
          style={{
            width: "fit-content",
            borderRadius: "999px",
            border: "1px solid rgba(75, 49, 11, 0.2)",
            padding: "10px 16px",
            font: "inherit",
            background: "white",
            cursor: "pointer",
          }}
        >
          {isEditorOpen ? "Скрыть бюджеты направлений" : "Изменить бюджеты направлений"}
        </button>
      </div>

      {isEditorOpen ? (
        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          {COST_DIRECTION_KEYS.map((direction) => (
            <label key={direction} style={{ display: "grid", gap: "6px" }}>
              {direction}
              <input
                value={String(draftBudgets[direction])}
                onChange={(event) =>
                  setDraftBudgets((current) => ({
                    ...current,
                    [direction]: Number(event.target.value) || 0,
                  }))
                }
                inputMode="decimal"
                style={{
                  borderRadius: "12px",
                  border: "1px solid rgba(75, 49, 11, 0.24)",
                  padding: "10px 12px",
                  font: "inherit",
                }}
              />
            </label>
          ))}

          <button
            type="button"
            onClick={handleSaveDirectionBudgets}
            style={{
              width: "fit-content",
              borderRadius: "999px",
              border: "none",
              padding: "12px 18px",
              font: "inherit",
              fontWeight: 700,
              background: "#5e4112",
              color: "#fff7ea",
              cursor: "pointer",
            }}
          >
            Сохранить бюджеты направлений
          </button>
        </div>
      ) : null}
    </section>
  );
}
