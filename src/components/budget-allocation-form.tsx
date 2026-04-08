"use client";

import { useEffect, useState } from "react";

import {
  allocateEvenBudgets,
  applyDirectionBudgetOverrides,
  recalculateTotalBudget,
} from "../lib/costing/budgetAllocation";
import { COST_DIRECTION_KEYS, type DirectionBudgetMap } from "../lib/costing/types";

type BudgetAllocationFormProps = {
  readonly totalBudget: number | null;
  readonly directionBudgets: DirectionBudgetMap;
  readonly onChange: (nextState: {
    totalBudget: number | null;
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
  totalBudget,
  directionBudgets,
  onChange,
}: BudgetAllocationFormProps) {
  const [totalBudgetInput, setTotalBudgetInput] = useState(totalBudget?.toString() ?? "");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draftBudgets, setDraftBudgets] = useState<DirectionBudgetMap>(directionBudgets);

  useEffect(() => {
    setTotalBudgetInput(totalBudget?.toString() ?? "");
  }, [totalBudget]);

  useEffect(() => {
    setDraftBudgets(directionBudgets);
  }, [directionBudgets]);

  function handleTotalBudgetChange(value: string) {
    setTotalBudgetInput(value);
    const parsed = parseBudgetValue(value);
    if (parsed === null) {
      onChange({
        totalBudget: null,
        directionBudgets: allocateEvenBudgets(0),
      });
      return;
    }

    onChange({
      totalBudget: parsed,
      directionBudgets: allocateEvenBudgets(parsed),
    });
  }

  function handleSaveDirectionBudgets() {
    const nextDirectionBudgets = applyDirectionBudgetOverrides(directionBudgets, draftBudgets);
    const nextTotalBudget = recalculateTotalBudget(nextDirectionBudgets);
    setTotalBudgetInput(String(nextTotalBudget));
    onChange({
      totalBudget: nextTotalBudget,
      directionBudgets: nextDirectionBudgets,
    });
    setIsEditorOpen(false);
  }

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
      <h2 style={{ margin: 0 }}>Budget allocation</h2>
      <label style={{ display: "grid", gap: "6px" }}>
        Total budget
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
          {isEditorOpen ? "Hide direction budgets" : "Edit direction budgets"}
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
            Save direction budgets
          </button>
        </div>
      ) : null}
    </section>
  );
}
