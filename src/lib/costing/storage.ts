import type { AssigneeDirectoryEntry } from "./types";

const ASSIGNEE_DIRECTORY_STORAGE_KEY = "board-ai.assignee-directory.v1";

function normalizeEntry(entry: Partial<AssigneeDirectoryEntry>): AssigneeDirectoryEntry | null {
  const assigneeKey = entry.assigneeKey?.trim();
  const assigneeLabel = entry.assigneeLabel?.trim();
  const hourlyRate = Number(entry.hourlyRate);

  if (!assigneeKey || !assigneeLabel || !Number.isFinite(hourlyRate) || hourlyRate <= 0) {
    return null;
  }

  if (!entry.role) {
    return null;
  }

  return {
    assigneeKey,
    assigneeLabel,
    role: entry.role,
    hourlyRate,
  };
}

export function loadAssigneeDirectory(): AssigneeDirectoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(ASSIGNEE_DIRECTORY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AssigneeDirectoryEntry>[];
    return parsed
      .map((entry) => normalizeEntry(entry))
      .filter((entry): entry is AssigneeDirectoryEntry => entry !== null);
  } catch {
    return [];
  }
}

export function saveAssigneeDirectory(entries: readonly AssigneeDirectoryEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ASSIGNEE_DIRECTORY_STORAGE_KEY, JSON.stringify(entries));
}
