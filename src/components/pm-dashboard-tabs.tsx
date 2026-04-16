import React, { type KeyboardEvent, type ReactNode } from "react";

export type PmDashboardTabId = "overview" | "directions";

type PmDashboardTabsProps = {
  readonly selectedTab: PmDashboardTabId;
  readonly onTabChange: (nextTab: PmDashboardTabId) => void;
  readonly overviewContent: ReactNode;
  readonly directionsContent: ReactNode;
};

const TAB_ORDER: readonly PmDashboardTabId[] = ["overview", "directions"];

function nextTabFromKey(
  key: string,
  currentTab: PmDashboardTabId,
): PmDashboardTabId | null {
  const currentIndex = TAB_ORDER.indexOf(currentTab);

  if (key === "ArrowRight") {
    return TAB_ORDER[(currentIndex + 1) % TAB_ORDER.length] ?? null;
  }

  if (key === "ArrowLeft") {
    return TAB_ORDER[(currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length] ?? null;
  }

  if (key === "Home") {
    return TAB_ORDER[0] ?? null;
  }

  if (key === "End") {
    return TAB_ORDER[TAB_ORDER.length - 1] ?? null;
  }

  return null;
}

function tabButtonStyle(selected: boolean) {
  return {
    borderRadius: "999px",
    border: selected ? "1px solid rgba(75, 49, 11, 0.28)" : "1px solid rgba(75, 49, 11, 0.12)",
    background: selected ? "rgba(255, 247, 235, 0.98)" : "rgba(255, 255, 255, 0.72)",
    color: selected ? "#5e4112" : "#6e5430",
    padding: "12px 18px",
    font: "inherit",
    fontWeight: selected ? 700 : 600,
    cursor: "pointer",
  } as const;
}

export function PmDashboardTabs({
  selectedTab,
  onTabChange,
  overviewContent,
  directionsContent,
}: PmDashboardTabsProps) {
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, tabId: PmDashboardTabId) {
    const nextTab = nextTabFromKey(event.key, tabId);
    if (nextTab === null) {
      return;
    }

    event.preventDefault();
    onTabChange(nextTab);
  }

  return (
    <section
      style={{
        display: "grid",
        gap: "20px",
      }}
    >
      <div
        role="tablist"
        aria-label="Dashboard sections"
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          id="pm-dashboard-tab-overview"
          type="button"
          role="tab"
          aria-controls="pm-dashboard-panel-overview"
          aria-selected={selectedTab === "overview"}
          tabIndex={selectedTab === "overview" ? 0 : -1}
          onClick={() => onTabChange("overview")}
          onKeyDown={(event) => handleTabKeyDown(event, "overview")}
          style={tabButtonStyle(selectedTab === "overview")}
        >
          Обзор
        </button>
        <button
          id="pm-dashboard-tab-directions"
          type="button"
          role="tab"
          aria-controls="pm-dashboard-panel-directions"
          aria-selected={selectedTab === "directions"}
          tabIndex={selectedTab === "directions" ? 0 : -1}
          onClick={() => onTabChange("directions")}
          onKeyDown={(event) => handleTabKeyDown(event, "directions")}
          style={tabButtonStyle(selectedTab === "directions")}
        >
          Направления
        </button>
      </div>

      <div
        id="pm-dashboard-panel-overview"
        role="tabpanel"
        aria-labelledby="pm-dashboard-tab-overview"
        hidden={selectedTab !== "overview"}
      >
        {overviewContent}
      </div>
      <div
        id="pm-dashboard-panel-directions"
        role="tabpanel"
        aria-labelledby="pm-dashboard-tab-directions"
        hidden={selectedTab !== "directions"}
      >
        {directionsContent}
      </div>
    </section>
  );
}
