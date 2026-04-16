import React, { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { PmDashboardTabs } from "./pm-dashboard-tabs";

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

describe("PmDashboardTabs", () => {
  it("renders exactly two tabs in the locked order with overview first", () => {
    const tree = PmDashboardTabs({
      selectedTab: "overview",
      onTabChange: vi.fn(),
      overviewContent: <div>Overview panel</div>,
      directionsContent: <div>Directions panel</div>,
    });

    const tabs = collectElements(tree, (element) => element.props.role === "tab");

    expect(tabs).toHaveLength(2);
    expect(collectText(tabs[0]?.props.children)).toContain("Обзор");
    expect(collectText(tabs[1]?.props.children)).toContain("Направления");
  });

  it("uses a controlled API for tab changes", () => {
    const onTabChange = vi.fn();
    const tree = PmDashboardTabs({
      selectedTab: "overview",
      onTabChange,
      overviewContent: <div>Overview panel</div>,
      directionsContent: <div>Directions panel</div>,
    });

    const directionsTab = collectElements(
      tree,
      (element) => element.props.role === "tab" && collectText(element.props.children).includes("Направления"),
    )[0];

    expect(directionsTab).toBeDefined();

    directionsTab?.props.onClick();

    expect(onTabChange).toHaveBeenCalledWith("directions");
  });

  it("keeps both panels mounted and hides the inactive panel", () => {
    const tree = PmDashboardTabs({
      selectedTab: "directions",
      onTabChange: vi.fn(),
      overviewContent: <div>Overview panel</div>,
      directionsContent: <div>Directions panel</div>,
    });

    const panels = collectElements(tree, (element) => element.props.role === "tabpanel");

    expect(panels).toHaveLength(2);
    expect(panels[0]?.props.hidden).toBe(true);
    expect(panels[1]?.props.hidden).toBe(false);
    expect(collectText(panels[0]?.props.children)).toContain("Overview panel");
    expect(collectText(panels[1]?.props.children)).toContain("Directions panel");
  });
});
