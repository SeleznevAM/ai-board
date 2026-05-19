import { describe, expect, it } from "vitest";

import { __private__ } from "./client";

describe("normalizeSubtasks", () => {
  it("returns subtasks when the API payload already contains an array", () => {
    expect(
      __private__.normalizeSubtasks([
        {
          id: "1-2",
          idReadable: "REQ-2",
        },
      ]),
    ).toEqual([
      {
        id: "1-2",
        idReadable: "REQ-2",
      },
    ]);
  });

  it("returns subtasks when YouTrack wraps them in an issues collection", () => {
    expect(
      __private__.normalizeSubtasks({
        issues: [
          {
            id: "1-2",
            idReadable: "REQ-2",
          },
        ],
      }),
    ).toEqual([
      {
        id: "1-2",
        idReadable: "REQ-2",
      },
    ]);
  });

  it("returns an empty array for unsupported or missing subtask shapes", () => {
    expect(__private__.normalizeSubtasks(null)).toEqual([]);
    expect(__private__.normalizeSubtasks({})).toEqual([]);
  });
});

describe("extractAssignee", () => {
  it("extracts assignee identity from the исполнител field", () => {
    expect(
      __private__.extractAssignee([
        {
          name: "Исполнитель",
          value: {
            id: "1-1",
            login: "anna",
            fullName: "Anna Ivanova",
          },
        },
      ]),
    ).toEqual({
      id: "1-1",
      login: "anna",
      displayName: "Anna Ivanova",
    });
  });

  it("returns null when no assignee field is present", () => {
    expect(__private__.extractAssignee(null)).toBeNull();
  });
});

describe("extractIssueTypeName", () => {
  it("extracts issue type name from the type field", () => {
    expect(
      __private__.extractIssueTypeName([
        {
          name: "Тип задачи",
          value: {
            name: "Группа задач",
          },
        },
      ]),
    ).toBe("Группа задач");
  });

  it("returns null when no type field is present", () => {
    expect(__private__.extractIssueTypeName(null)).toBeNull();
  });
});
