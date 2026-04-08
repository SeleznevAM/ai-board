import type { SnapshotIssueNode } from "../ingestion/types";
import { resolveAssigneeDirectoryMatch } from "./assigneeDirectory";
import {
  COST_DIRECTION_KEYS,
  type AssigneeDirectoryEntry,
  type CostDirectionKey,
  type CostLedgerRow,
  type DirectionCostTotals,
  type RequirementCostResult,
} from "./types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildDirectionTotalsMap(): Record<CostDirectionKey, DirectionCostTotals> {
  return {
    devops: { role: "devops", minutes: 0, hours: 0, cost: 0 },
    backend: { role: "backend", minutes: 0, hours: 0, cost: 0 },
    analytics: { role: "analytics", minutes: 0, hours: 0, cost: 0 },
    frontend: { role: "frontend", minutes: 0, hours: 0, cost: 0 },
    mobiledev: { role: "mobiledev", minutes: 0, hours: 0, cost: 0 },
    qa: { role: "qa", minutes: 0, hours: 0, cost: 0 },
    design: { role: "design", minutes: 0, hours: 0, cost: 0 },
    pm: { role: "pm", minutes: 0, hours: 0, cost: 0 },
    unmapped: { role: "unmapped", minutes: 0, hours: 0, cost: 0 },
  };
}

export function calculateRequirementCost(
  issues: readonly SnapshotIssueNode[],
  directoryEntries: readonly AssigneeDirectoryEntry[],
): RequirementCostResult {
  const ledger: CostLedgerRow[] = [];
  const directionTotals = buildDirectionTotalsMap();
  const warnings = new Set<CostLedgerRow["warning"]>();
  let totalMinutes = 0;
  let hasUnknownCost = false;

  for (const issue of issues) {
    const minutes = issue.normalizedMinutes ?? 0;
    const hours = minutes / 60;
    const resolution = resolveAssigneeDirectoryMatch(issue.assignee, directoryEntries);
    const cost = resolution.hourlyRate === null ? null : roundMoney(hours * resolution.hourlyRate);
    const currentDirectionTotal = directionTotals[resolution.role];

    ledger.push({
      issueKey: issue.issueKey,
      summary: issue.summary,
      minutes,
      hours,
      assignee: issue.assignee,
      assigneeKey: resolution.assigneeKey,
      assigneeLabel: resolution.assigneeLabel,
      role: resolution.role,
      hourlyRate: resolution.hourlyRate,
      cost,
      warning: resolution.warning,
    });

    totalMinutes += minutes;
    directionTotals[resolution.role] = {
      role: resolution.role,
      minutes: currentDirectionTotal.minutes + minutes,
      hours: currentDirectionTotal.hours + hours,
      cost:
        currentDirectionTotal.cost === null || cost === null
          ? null
          : roundMoney(currentDirectionTotal.cost + cost),
    };

    if (resolution.warning) {
      warnings.add(resolution.warning);
    }

    if (cost === null) {
      hasUnknownCost = true;
    }
  }

  const totalCost = hasUnknownCost
    ? null
    : roundMoney(
        ledger.reduce((sum, row) => {
          return sum + (row.cost ?? 0);
        }, 0),
      );

  return {
    ledger,
    directionTotals: COST_DIRECTION_KEYS.map((role) => directionTotals[role]),
    totalMinutes,
    totalHours: totalMinutes / 60,
    totalCost,
    warnings: Array.from(warnings).filter(
      (warning): warning is NonNullable<typeof warning> => warning !== null,
    ),
  };
}
