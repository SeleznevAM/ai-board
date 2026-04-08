import { describe, expect, it } from "vitest";

import {
  calculateAverageRate,
  normalizeAssigneeKey,
  resolveAssigneeDirectoryMatch,
} from "./assigneeDirectory";
import type { AssigneeDirectoryEntry } from "./types";

const entries: AssigneeDirectoryEntry[] = [
  {
    assigneeKey: "anna",
    assigneeLabel: "Anna Ivanova",
    role: "backend",
    hourlyRate: 2000,
  },
  {
    assigneeKey: "boris",
    assigneeLabel: "Boris Petrov",
    role: "frontend",
    hourlyRate: 3000,
  },
];

describe("normalizeAssigneeKey", () => {
  it("prefers id, then login, then display name", () => {
    expect(
      normalizeAssigneeKey({
        id: "USR-1",
        login: "anna",
        displayName: "Anna Ivanova",
      }),
    ).toBe("usr-1");

    expect(
      normalizeAssigneeKey({
        id: null,
        login: "anna",
        displayName: "Anna Ivanova",
      }),
    ).toBe("anna");
  });
});

describe("calculateAverageRate", () => {
  it("returns the average rate from valid positive entries", () => {
    expect(calculateAverageRate(entries)).toBe(2500);
  });

  it("ignores invalid rates when calculating average rate", () => {
    expect(
      calculateAverageRate([
        ...entries,
        {
          assigneeKey: "invalid",
          assigneeLabel: "Invalid",
          role: "qa",
          hourlyRate: 0,
        },
      ]),
    ).toBe(2500);
  });
});

describe("resolveAssigneeDirectoryMatch", () => {
  it("matches by normalized login", () => {
    expect(
      resolveAssigneeDirectoryMatch(
        {
          id: null,
          login: "Anna",
          displayName: "Anna Ivanova",
        },
        entries,
      ),
    ).toEqual({
      status: "matched",
      assigneeKey: "anna",
      assigneeLabel: "Anna Ivanova",
      role: "backend",
      hourlyRate: 2000,
      warning: null,
    });
  });

  it("uses average rate for unmapped assignee", () => {
    expect(
      resolveAssigneeDirectoryMatch(
        {
          id: null,
          login: "new-person",
          displayName: "New Person",
        },
        entries,
      ),
    ).toEqual({
      status: "fallback",
      assigneeKey: "new-person",
      assigneeLabel: "New Person",
      role: "unmapped",
      hourlyRate: 2500,
      warning: "UNMAPPED_ASSIGNEE",
    });
  });

  it("uses average rate for missing assignee", () => {
    expect(resolveAssigneeDirectoryMatch(null, entries)).toEqual({
      status: "fallback",
      assigneeKey: null,
      assigneeLabel: "Unassigned issue",
      role: "unmapped",
      hourlyRate: 2500,
      warning: "MISSING_ASSIGNEE",
    });
  });

  it("returns null fallback when no valid average rate exists", () => {
    expect(
      resolveAssigneeDirectoryMatch(
        {
          id: null,
          login: "ghost",
          displayName: "Ghost",
        },
        [
          {
            assigneeKey: "ghost",
            assigneeLabel: "Ghost",
            role: "qa",
            hourlyRate: 0,
          },
        ],
      ),
    ).toEqual({
      status: "fallback",
      assigneeKey: "ghost",
      assigneeLabel: "Ghost",
      role: "unmapped",
      hourlyRate: null,
      warning: "UNMAPPED_ASSIGNEE",
    });
  });
});
