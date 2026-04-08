"use client";

import { useEffect, useState, type FormEvent } from "react";

import { loadAssigneeDirectory, saveAssigneeDirectory } from "../lib/costing/storage";
import { DIRECTION_KEYS, type AssigneeDirectoryEntry, type DirectionKey } from "../lib/costing/types";

type DraftEntry = {
  assigneeKey: string;
  assigneeLabel: string;
  role: DirectionKey;
  hourlyRate: string;
};

const emptyDraft: DraftEntry = {
  assigneeKey: "",
  assigneeLabel: "",
  role: "backend",
  hourlyRate: "",
};

function toDraft(entry: AssigneeDirectoryEntry): DraftEntry {
  return {
    assigneeKey: entry.assigneeKey,
    assigneeLabel: entry.assigneeLabel,
    role: entry.role,
    hourlyRate: String(entry.hourlyRate),
  };
}

function toEntry(draft: DraftEntry): AssigneeDirectoryEntry | null {
  const hourlyRate = Number(draft.hourlyRate);
  if (!draft.assigneeKey.trim() || !draft.assigneeLabel.trim() || !Number.isFinite(hourlyRate) || hourlyRate <= 0) {
    return null;
  }

  return {
    assigneeKey: draft.assigneeKey.trim(),
    assigneeLabel: draft.assigneeLabel.trim(),
    role: draft.role,
    hourlyRate,
  };
}

export function AssigneeDirectoryForm() {
  const [entries, setEntries] = useState<AssigneeDirectoryEntry[]>([]);
  const [draft, setDraft] = useState<DraftEntry>(emptyDraft);

  useEffect(() => {
    setEntries(loadAssigneeDirectory());
  }, []);

  function persist(nextEntries: AssigneeDirectoryEntry[]) {
    setEntries(nextEntries);
    saveAssigneeDirectory(nextEntries);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry = toEntry(draft);
    if (!entry) {
      return;
    }

    const nextEntries = entries.some((existing) => existing.assigneeKey === entry.assigneeKey)
      ? entries.map((existing) => (existing.assigneeKey === entry.assigneeKey ? entry : existing))
      : [...entries, entry];

    persist(nextEntries);
    setDraft(emptyDraft);
  }

  function handleEdit(entry: AssigneeDirectoryEntry) {
    setDraft(toDraft(entry));
  }

  function handleDelete(assigneeKey: string) {
    persist(entries.filter((entry) => entry.assigneeKey !== assigneeKey));
  }

  return (
    <section
      style={{
        display: "grid",
        gap: "20px",
      }}
    >
      <div style={{ display: "grid", gap: "8px" }}>
        <h1 style={{ margin: 0 }}>Assignee Directory</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Map the YouTrack assignee value to one role and one personal hourly rate. Saved in this browser via localStorage.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "12px",
          padding: "20px",
          borderRadius: "20px",
          border: "1px solid rgba(75, 49, 11, 0.16)",
          background: "rgba(255, 252, 247, 0.94)",
        }}
      >
        <label style={{ display: "grid", gap: "6px" }}>
          Assignee key
          <input
            value={draft.assigneeKey}
            onChange={(event) => setDraft((current) => ({ ...current, assigneeKey: event.target.value }))}
            placeholder="anna"
            style={{ borderRadius: "12px", border: "1px solid rgba(75, 49, 11, 0.24)", padding: "10px 12px", font: "inherit" }}
          />
        </label>

        <label style={{ display: "grid", gap: "6px" }}>
          Assignee label
          <input
            value={draft.assigneeLabel}
            onChange={(event) => setDraft((current) => ({ ...current, assigneeLabel: event.target.value }))}
            placeholder="Anna Ivanova"
            style={{ borderRadius: "12px", border: "1px solid rgba(75, 49, 11, 0.24)", padding: "10px 12px", font: "inherit" }}
          />
        </label>

        <label style={{ display: "grid", gap: "6px" }}>
          Role
          <select
            value={draft.role}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                role: event.target.value as DirectionKey,
              }))
            }
            style={{ borderRadius: "12px", border: "1px solid rgba(75, 49, 11, 0.24)", padding: "10px 12px", font: "inherit" }}
          >
            {DIRECTION_KEYS.map((direction) => (
              <option key={direction} value={direction}>
                {direction}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: "6px" }}>
          Hourly rate
          <input
            value={draft.hourlyRate}
            onChange={(event) => setDraft((current) => ({ ...current, hourlyRate: event.target.value }))}
            placeholder="2500"
            inputMode="decimal"
            style={{ borderRadius: "12px", border: "1px solid rgba(75, 49, 11, 0.24)", padding: "10px 12px", font: "inherit" }}
          />
        </label>

        <button
          type="submit"
          style={{
            width: "fit-content",
            borderRadius: "999px",
            border: "none",
            padding: "12px 18px",
            font: "inherit",
            fontWeight: 700,
            background: "#5e4112",
            color: "#fff7ea",
            cursor: "pointer",
          }}
        >
          Save assignee
        </button>
      </form>

      <div
        style={{
          display: "grid",
          gap: "12px",
        }}
      >
        {entries.length === 0 ? (
          <p style={{ margin: 0 }}>No assignee mappings yet.</p>
        ) : (
          entries.map((entry) => (
            <article
              key={entry.assigneeKey}
              style={{
                display: "grid",
                gap: "8px",
                padding: "16px",
                borderRadius: "18px",
                border: "1px solid rgba(75, 49, 11, 0.16)",
                background: "rgba(255, 252, 247, 0.94)",
              }}
            >
              <div style={{ fontWeight: 700 }}>{entry.assigneeLabel}</div>
              <div>Key: {entry.assigneeKey}</div>
              <div>Role: {entry.role}</div>
              <div>Hourly rate: {entry.hourlyRate}</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => handleEdit(entry)}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid rgba(75, 49, 11, 0.2)",
                    padding: "8px 12px",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.assigneeKey)}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid rgba(156, 28, 28, 0.2)",
                    padding: "8px 12px",
                    background: "white",
                    color: "#9c1c1c",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
