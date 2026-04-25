import { TARGET_MARGIN_PERCENT } from "../lib/costing/calculateProfitability";

export type DashboardStatusTone = "neutral" | "good" | "risk";

type DashboardStatusPresentation = {
  readonly tone: DashboardStatusTone;
  readonly label: string;
  readonly borderColor: string;
  readonly background: string;
  readonly textColor: string;
  readonly mutedColor: string;
};

export function getDashboardStatusTone(marginPercent: number | null): DashboardStatusTone {
  if (marginPercent === null) {
    return "neutral";
  }

  return marginPercent >= TARGET_MARGIN_PERCENT ? "good" : "risk";
}

export function getDashboardStatusPresentation(
  marginPercent: number | null,
): DashboardStatusPresentation {
  const tone = getDashboardStatusTone(marginPercent);

  if (tone === "good") {
    return {
      tone,
      label: `>= ${TARGET_MARGIN_PERCENT}%`,
      borderColor: "rgba(37, 99, 63, 0.22)",
      background: "rgba(233, 248, 238, 0.98)",
      textColor: "#1f5a37",
      mutedColor: "#356548",
    };
  }

  if (tone === "risk") {
    return {
      tone,
      label: `< ${TARGET_MARGIN_PERCENT}%`,
      borderColor: "rgba(165, 50, 41, 0.22)",
      background: "rgba(255, 239, 236, 0.98)",
      textColor: "#8a2e26",
      mutedColor: "#985147",
    };
  }

  return {
    tone,
    label: "Требуется бюджет",
    borderColor: "rgba(75, 49, 11, 0.12)",
    background: "rgba(255, 252, 247, 0.96)",
    textColor: "#4b310b",
    mutedColor: "#6e5430",
  };
}

export function getDashboardStatusBlockStyle(marginPercent: number | null) {
  const presentation = getDashboardStatusPresentation(marginPercent);

  return {
    borderColor: presentation.borderColor,
    background: presentation.background,
    color: presentation.textColor,
  } as const;
}
