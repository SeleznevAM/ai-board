import React, { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { DirectionBreakdown } from "./direction-breakdown";

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

describe("DirectionBreakdown", () => {
  it("renders the locked dense row contract including contribution cue columns", () => {
    const tree = DirectionBreakdown({
      directionTotals: {
        current: [
          { role: "backend", minutes: 480, hours: 8, cost: 16000 },
        ],
        forecast: [
          { role: "backend", minutes: 600, hours: 10, cost: 20000 },
        ],
      },
      profitability: {
        current: [
          {
            role: "backend",
            budget: 24000,
            cost: 16000,
            delta: 8000,
            marginPercent: 33.33,
          },
        ],
        forecast: [
          {
            role: "backend",
            budget: 24000,
            cost: 20000,
            delta: 4000,
            marginPercent: 16.67,
          },
        ],
      },
      directionDeltas: [{ role: "backend", addedMinutes: 120, addedHours: 2, addedCost: 4000 }],
    });

    const row = collectElements(tree, (element) => element.props["data-role"] === "backend")[0];
    const cells = collectElements(
      row,
      (element) => typeof element.props["data-column"] === "string",
    ).map((element) => element.props["data-column"]);

    expect(cells).toEqual([
      "direction",
      "budget",
      "actual-hours",
      "extra-hours",
      "cost",
      "profitability",
      "contribution",
    ]);
    expect(row?.props["data-status"]).toBe("risk");
    expect(collectText(row)).toContain("forecast active");
    expect(collectText(row)).toContain("delta vs budget");
  });

  it("keeps unmapped visible in the dense scan surface", () => {
    const tree = DirectionBreakdown({
      directionTotals: {
        current: [
          { role: "unmapped", minutes: 180, hours: 3, cost: 4500 },
        ],
        forecast: [
          { role: "unmapped", minutes: 180, hours: 3, cost: 4500 },
        ],
      },
      profitability: {
        current: [
          {
            role: "unmapped",
            budget: 0,
            cost: 4500,
            delta: -4500,
            marginPercent: null,
          },
        ],
        forecast: [
          {
            role: "unmapped",
            budget: 0,
            cost: 4500,
            delta: -4500,
            marginPercent: null,
          },
        ],
      },
      directionDeltas: [],
    });

    const row = collectElements(tree, (element) => element.props["data-role"] === "unmapped")[0];

    expect(row).toBeDefined();
    expect(row?.props["data-status"]).toBe("neutral");
    expect(collectText(row)).toContain("unmapped");
  });

  it("uses current profitability for row semantics when there are no extra hours", () => {
    const tree = DirectionBreakdown({
      directionTotals: {
        current: [
          { role: "qa", minutes: 240, hours: 4, cost: 6000 },
        ],
        forecast: [
          { role: "qa", minutes: 240, hours: 4, cost: 6000 },
        ],
      },
      profitability: {
        current: [
          {
            role: "qa",
            budget: 9000,
            cost: 6000,
            delta: 3000,
            marginPercent: 33.33,
          },
        ],
        forecast: [
          {
            role: "qa",
            budget: 9000,
            cost: 6000,
            delta: 3000,
            marginPercent: 12,
          },
        ],
      },
      directionDeltas: [{ role: "qa", addedMinutes: 0, addedHours: 0, addedCost: 0 }],
    });

    const row = collectElements(tree, (element) => element.props["data-role"] === "qa")[0];

    expect(row?.props["data-status"]).toBe("good");
    expect(collectText(row)).toContain("current active");
  });
});
