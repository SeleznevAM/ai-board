import { describe, expect, it } from "vitest";

import { normalizeIssueHours } from "./normalizeIssueHours";
import type { YouTrackIssueNode } from "../youtrack/contracts";

function issueNode(
  overrides: Partial<YouTrackIssueNode> & Pick<YouTrackIssueNode, "id" | "key" | "summary">,
): YouTrackIssueNode {
  return {
    parentId: null,
    childIds: [],
    childCount: 0,
    childrenVisibility: "complete",
    issueTypeName: null,
    statusName: null,
    estimateMinutes: null,
    spentMinutes: null,
    ...overrides,
  };
}

describe("normalizeIssueHours", () => {
  it("uses spent time for на проверке QA", () => {
    const result = normalizeIssueHours(
      issueNode({
        id: "1",
        key: "REQ-1",
        summary: "QA",
        statusName: "на проверке QA",
        spentMinutes: 120,
        estimateMinutes: 240,
      }),
    );

    expect(result.hoursSource).toBe("spent");
    expect(result.normalizedMinutes).toBe(120);
    expect(result.blocked).toBe(false);
  });

  it("uses spent time for сделана and утверждена", () => {
    expect(
      normalizeIssueHours(
        issueNode({
          id: "2",
          key: "REQ-2",
          summary: "Done",
          statusName: "сделана",
          spentMinutes: 60,
        }),
      ).hoursSource,
    ).toBe("spent");

    expect(
      normalizeIssueHours(
        issueNode({
          id: "3",
          key: "REQ-3",
          summary: "Approved",
          statusName: "утверждена",
          spentMinutes: 30,
        }),
      ).hoursSource,
    ).toBe("spent");
  });

  it("uses estimate for зарегистрирована, открыта, в работе and код ревью", () => {
    const statuses = ["зарегистрирована", "открыта", "в работе", "код ревью"];

    for (const statusName of statuses) {
      const result = normalizeIssueHours(
        issueNode({
          id: statusName,
          key: `REQ-${statusName}`,
          summary: statusName,
          statusName,
          estimateMinutes: 90,
          spentMinutes: 30,
        }),
      );

      expect(result.hoursSource).toBe("estimate");
      expect(result.normalizedMinutes).toBe(90);
      expect(result.blocked).toBe(false);
    }
  });

  it("falls back to estimate for unexpected status", () => {
    const result = normalizeIssueHours(
      issueNode({
        id: "4",
        key: "REQ-4",
        summary: "Unexpected",
        statusName: "unexpected status",
        estimateMinutes: 45,
      }),
    );

    expect(result.hoursSource).toBe("estimate");
    expect(result.normalizedMinutes).toBe(45);
    expect(result.blocked).toBe(false);
  });

  it("blocks when estimate is required but missing estimate", () => {
    const result = normalizeIssueHours(
      issueNode({
        id: "5",
        key: "REQ-5",
        summary: "Missing estimate",
        statusName: "в работе",
      }),
    );

    expect(result.hoursSource).toBe("estimate");
    expect(result.normalizedMinutes).toBeNull();
    expect(result.blocked).toBe(true);
    expect(result.problem?.code).toBe("MISSING_ESTIMATE");
  });

  it("ignores own time for issues of type Группа задач", () => {
    const result = normalizeIssueHours(
      issueNode({
        id: "6",
        key: "REQ-6",
        summary: "Task group",
        issueTypeName: "Группа задач",
        statusName: "в работе",
        estimateMinutes: 180,
      }),
    );

    expect(result.hoursSource).toBe("estimate");
    expect(result.normalizedMinutes).toBe(0);
    expect(result.blocked).toBe(false);
    expect(result.problem).toBeNull();
  });
});
