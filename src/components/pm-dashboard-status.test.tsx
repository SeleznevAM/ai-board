import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { describe, expect, it } from "vitest";

import {
  getDashboardStatusPresentation,
  getDashboardStatusTone,
} from "./dashboard-status";

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

function findByProp(
  node: ReactNode,
  name: string,
  value: string,
): ReactElement<Record<string, unknown>> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findByProp(child, name, value);
      if (match) {
        return match;
      }
    }

    return null;
  }

  if (!isValidElement(node)) {
    return null;
  }

  if (node.props[name] === value) {
    return node as ReactElement<Record<string, unknown>>;
  }

  return findByProp(node.props.children, name, value);
}

describe("dashboard-status", () => {
  it("maps missing percentages to a neutral whole-block state", () => {
    expect(getDashboardStatusTone(null)).toBe("neutral");

    const presentation = getDashboardStatusPresentation(null);

    expect(presentation).toMatchObject({
      tone: "neutral",
      label: "Требуется бюджет",
    });
  });

  it("maps profitability below 20% to a risk state", () => {
    expect(getDashboardStatusTone(19.99)).toBe("risk");

    const presentation = getDashboardStatusPresentation(19.99);

    expect(presentation).toMatchObject({
      tone: "risk",
      label: "< 20%",
    });
    expect(presentation.background).toContain("255, 239, 236");
  });

  it("maps profitability at or above 20% to a good state", () => {
    expect(getDashboardStatusTone(20)).toBe("good");
    expect(getDashboardStatusTone(41.3)).toBe("good");

    const presentation = getDashboardStatusPresentation(41.3);

    expect(presentation).toMatchObject({
      tone: "good",
      label: ">= 20%",
    });
  });
});
