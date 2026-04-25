import React, { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import type { RequirementProfitability } from "../lib/costing/types";
import { RequirementDecisionCard } from "./requirement-decision-card";

function collectElements(
  node: ReactNode,
  predicate: (element: ReactElement<Record<string, unknown>>) => boolean,
): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) {
    return node.flatMap((child) => collectElements(child, predicate));
  }

  if (!isValidElement(node)) {
    return [];
  }

  const current = predicate(node as ReactElement<Record<string, unknown>>)
    ? [node as ReactElement<Record<string, unknown>>]
    : [];

  return [...current, ...collectElements(node.props.children, predicate)];
}

function collectText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join(" ");
  }

  if (!isValidElement(node)) {
    return "";
  }

  return collectText(node.props.children);
}

function profitability(
  overrides: Partial<RequirementProfitability>,
): RequirementProfitability {
  return {
    budget: 120000,
    cost: 84000,
    delta: 36000,
    marginPercent: 30,
    neededUpsell: 0,
    ...overrides,
  };
}

describe("RequirementDecisionCard", () => {
  it("renders exactly three primary blocks for budget, labor, and margin", () => {
    const tree = RequirementDecisionCard({
      totalHours: {
        current: 180,
        forecast: 180,
      },
      profitability: {
        current: profitability({}),
        forecast: profitability({}),
      },
      hasScenarioChanges: false,
    });

    const blocks = collectElements(tree, (element) => typeof element.props["data-block"] === "string");
    const scenarioSlots = collectElements(
      tree,
      (element) => typeof element.props["data-slot"] === "string",
    );

    expect(blocks.map((element) => element.props["data-block"])).toEqual([
      "budget",
      "labor",
      "margin",
    ]);
    expect((tree as ReactElement<Record<string, unknown>>).props["data-scenario-state"]).toBe(
      "baseline",
    );
    expect(scenarioSlots).toHaveLength(0);
  });

  it("shows inline secondary scenario values only inside the relevant blocks", () => {
    const tree = RequirementDecisionCard({
      totalHours: {
        current: 180,
        forecast: 212,
      },
      profitability: {
        current: profitability({
          budget: 120000,
          marginPercent: 18,
          neededUpsell: 6500,
        }),
        forecast: profitability({
          budget: 126000,
          marginPercent: 11.5,
          neededUpsell: 13200,
        }),
      },
      hasScenarioChanges: true,
    });

    const scenarioSlots = collectElements(
      tree,
      (element) => typeof element.props["data-slot"] === "string",
    ).map((element) => element.props["data-slot"]);

    expect(scenarioSlots).toEqual([
      "target-budget",
      "required-approval",
      "scenario-hours",
      "scenario-margin",
    ]);
    expect((tree as ReactElement<Record<string, unknown>>).props["data-scenario-state"]).toBe(
      "changed",
    );
    expect(collectText(tree)).toContain("Целевой бюджет");
    expect(collectText(tree)).toContain("Требуется к согласованию");
    expect(collectText(tree)).toContain("Сценарные трудозатраты");
    expect(collectText(tree)).toContain("Сценарная рентабельность");
  });

  it("applies whole-block status styling to the margin block from the 20% threshold helper", () => {
    const tree = RequirementDecisionCard({
      totalHours: {
        current: 180,
        forecast: 200,
      },
      profitability: {
        current: profitability({
          marginPercent: 16,
          neededUpsell: 9000,
        }),
        forecast: profitability({
          marginPercent: 12,
          neededUpsell: 15000,
        }),
      },
      hasScenarioChanges: true,
    });

    const marginBlock = collectElements(
      tree,
      (element) => element.props["data-block"] === "margin",
    )[0];

    expect(marginBlock?.props["data-status"]).toBe("risk");
    expect(collectText(marginBlock)).toContain("< 20%");
    expect(collectText(tree)).toContain("Целевой бюджет");
    expect(collectText(tree)).toContain("Требуется к согласованию");
  });
});
