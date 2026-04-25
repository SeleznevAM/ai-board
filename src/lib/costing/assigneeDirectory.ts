import type { SnapshotIssueAssignee } from "../ingestion/types";
import type { AssigneeDirectoryEntry, AssigneeDirectoryResolution } from "./types";

function normalizeIdentityPart(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function getAssigneeLookupKeys(
  assignee: SnapshotIssueAssignee | null,
): readonly string[] {
  if (!assignee) {
    return [];
  }

  const candidates = [
    normalizeIdentityPart(assignee.login),
    normalizeIdentityPart(assignee.displayName),
    normalizeIdentityPart(assignee.id),
  ];

  return candidates.filter(
    (candidate, index, all): candidate is string =>
      candidate !== null && all.indexOf(candidate) === index,
  );
}

export function normalizeAssigneeKey(assignee: SnapshotIssueAssignee | null): string | null {
  return getAssigneeLookupKeys(assignee)[0] ?? null;
}

function isValidHourlyRate(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function calculateAverageRate(entries: readonly AssigneeDirectoryEntry[]): number | null {
  const validRates = entries
    .map((entry) => entry.hourlyRate)
    .filter((hourlyRate) => isValidHourlyRate(hourlyRate));

  if (validRates.length === 0) {
    return null;
  }

  return validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length;
}

function buildDirectoryIndex(
  entries: readonly AssigneeDirectoryEntry[],
): Map<string, AssigneeDirectoryEntry> {
  const index = new Map<string, AssigneeDirectoryEntry>();

  for (const entry of entries) {
    const normalizedKey = normalizeIdentityPart(entry.assigneeKey);
    if (!normalizedKey) {
      continue;
    }

    if (!index.has(normalizedKey)) {
      index.set(normalizedKey, entry);
    }
  }

  return index;
}

function getAssigneeLabel(assignee: SnapshotIssueAssignee | null): string {
  if (!assignee) {
    return "Unassigned issue";
  }

  return assignee.displayName ?? assignee.login ?? assignee.id ?? "Unknown assignee";
}

export function resolveAssigneeDirectoryMatch(
  assignee: SnapshotIssueAssignee | null,
  entries: readonly AssigneeDirectoryEntry[],
): AssigneeDirectoryResolution {
  const averageRate = calculateAverageRate(entries);
  const normalizedKeys = getAssigneeLookupKeys(assignee);
  const normalizedKey = normalizedKeys[0] ?? null;
  const assigneeLabel = getAssigneeLabel(assignee);
  const directoryIndex = buildDirectoryIndex(entries);

  for (const candidate of normalizedKeys) {
    const match = directoryIndex.get(candidate);
    if (match && isValidHourlyRate(match.hourlyRate)) {
      return {
        status: "matched",
        assigneeKey: match.assigneeKey,
        assigneeLabel: match.assigneeLabel,
        role: match.role,
        hourlyRate: match.hourlyRate,
        warning: null,
      };
    }
  }

  if (!assignee) {
    return {
      status: "fallback",
      assigneeKey: null,
      assigneeLabel,
      role: "unmapped",
      hourlyRate: averageRate,
      warning: "MISSING_ASSIGNEE",
    };
  }

  return {
    status: "fallback",
    assigneeKey: normalizedKey,
    assigneeLabel,
    role: "unmapped",
    hourlyRate: averageRate,
    warning: "UNMAPPED_ASSIGNEE",
  };
}
