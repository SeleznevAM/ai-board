import { describe, expect, it } from "vitest";

import { calculateRequirementCost } from "./calculateRequirementCost";
import type { SnapshotIssueNode } from "../ingestion/types";
import type { AssigneeDirectoryEntry } from "./types";

const directory: AssigneeDirectoryEntry[] = [
  {
    assigneeKey: "anna",
    assigneeLabel: "Anna",
    role: "backend",
    hourlyRate: 2400,
  },
  {
    assigneeKey: "boris",
    assigneeLabel: "Boris",
    role: "frontend",
    hourlyRate: 1800,
  },
];

function issue(overrides: Partial<SnapshotIssueNode> & Pick<SnapshotIssueNode, "issueId" | "issueKey" | "summary">): SnapshotIssueNode {
  return {
    parentId: null,
    childIds: [],
    statusName: "в работе",
    hoursSource: "estimate",
    normalizedMinutes: 60,
    estimateMinutes: 60,
    spentMinutes: null,
    assignee: null,
    blocked: false,
    problem: null,
    ...overrides,
  };
}

describe("calculateRequirementCost", () => {
  it("aggregates overall and per-direction cost totals", () => {
    const result = calculateRequirementCost(
      [
        issue({
          issueId: "1",
          issueKey: "REQ-1",
          summary: "Backend task",
          assignee: { id: null, login: "anna", displayName: "Anna" },
        }),
        issue({
          issueId: "2",
          issueKey: "REQ-2",
          summary: "Frontend task",
          assignee: { id: null, login: "boris", displayName: "Boris" },
          normalizedMinutes: 120,
          estimateMinutes: 120,
        }),
      ],
      directory,
    );

    expect(result.totalMinutes).toBe(180);
    expect(result.totalCost).toBe(6000);
    expect(result.directionTotals.find((row) => row.role === "backend")?.cost).toBe(2400);
    expect(result.directionTotals.find((row) => row.role === "frontend")?.cost).toBe(3600);
  });

  it("routes missing assignee costs into unmapped with fallback average rate", () => {
    const result = calculateRequirementCost(
      [
        issue({
          issueId: "1",
          issueKey: "REQ-1",
          summary: "Unassigned task",
          assignee: null,
        }),
      ],
      directory,
    );

    expect(result.warnings).toContain("MISSING_ASSIGNEE");
    expect(result.directionTotals.find((row) => row.role === "unmapped")?.cost).toBe(2100);
    expect(result.ledger[0]?.warning).toBe("MISSING_ASSIGNEE");
  });

  it("keeps unmapped assignee costs visible", () => {
    const result = calculateRequirementCost(
      [
        issue({
          issueId: "1",
          issueKey: "REQ-1",
          summary: "Unknown person",
          assignee: { id: null, login: "ghost", displayName: "Ghost" },
        }),
      ],
      directory,
    );

    expect(result.warnings).toContain("UNMAPPED_ASSIGNEE");
    expect(result.directionTotals.find((row) => row.role === "unmapped")?.minutes).toBe(60);
  });
});
