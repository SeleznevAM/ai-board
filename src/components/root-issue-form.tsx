"use client";

import { useState, type FormEvent } from "react";

import {
  PARTIAL_SCOPE_FORBIDDEN,
  ROOT_ISSUE_FORBIDDEN,
  ROOT_ISSUE_NOT_FOUND,
} from "../lib/youtrack/errors";
import type {
  BlockedSnapshotState,
  ReadyScopeState,
  ScopeResolutionState,
} from "../lib/scope/types";

export type RootIssueFormResult =
  | {
      readonly kind: "success";
      readonly scope: ReadyScopeState;
    }
  | {
      readonly kind: "blocked";
      readonly scope: BlockedSnapshotState;
    }
  | {
      readonly kind: "error";
      readonly code:
        | typeof ROOT_ISSUE_NOT_FOUND
        | typeof ROOT_ISSUE_FORBIDDEN
        | typeof PARTIAL_SCOPE_FORBIDDEN
        | "UNKNOWN_ERROR";
      readonly issueKey: string;
      readonly message: string;
    };

type RootIssueFormProps = {
  readonly onResolved: (result: RootIssueFormResult) => void;
  readonly lastSyncedAt?: string;
  readonly onBeforeSubmit?: () => boolean;
};

function getErrorCode(status: number) {
  if (status === 404) {
    return ROOT_ISSUE_NOT_FOUND;
  }

  if (status === 403) {
    return ROOT_ISSUE_FORBIDDEN;
  }

  if (status === 409) {
    return PARTIAL_SCOPE_FORBIDDEN;
  }

  return "UNKNOWN_ERROR" as const;
}

export function RootIssueForm({
  onResolved,
  lastSyncedAt,
  onBeforeSubmit,
}: RootIssueFormProps) {
  const [rootIssueKey, setRootIssueKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedRootIssue = rootIssueKey.trim();
    if (!normalizedRootIssue) {
      onResolved({
        kind: "error",
        code: "UNKNOWN_ERROR",
        issueKey: "",
        message: "Укажи ключ корневой задачи перед обновлением снимка.",
      });
      return;
    }

    if (onBeforeSubmit && !onBeforeSubmit()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/scope", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rootIssueKey: normalizedRootIssue,
        }),
      });

      const payload = (await response.json()) as ScopeResolutionState & {
        readonly message?: string;
      };

      if (payload.status === "snapshot_blocked") {
        onResolved({
          kind: "blocked",
          scope: payload,
        });
        return;
      }

      if (response.ok && payload.status === "ready") {
        onResolved({
          kind: "success",
          scope: payload,
        });
        return;
      }

      onResolved({
        kind: "error",
        code: getErrorCode(response.status),
        issueKey: normalizedRootIssue,
        message:
          payload.message ??
          "Не удалось получить полное поддерживаемое дерево задач.",
      });
    } catch (error) {
      onResolved({
        kind: "error",
        code: "UNKNOWN_ERROR",
        issueKey: normalizedRootIssue,
        message:
          error instanceof Error
            ? error.message
            : "Непредвиденная ошибка во время запроса дерева задач.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: "16px",
      }}
    >
      <label
        htmlFor="root-issue"
        style={{
          display: "grid",
          gap: "8px",
          fontWeight: 600,
        }}
      >
        Корневая задача
        <input
          id="root-issue"
          name="rootIssueKey"
          value={rootIssueKey}
          onChange={(event) => setRootIssueKey(event.target.value)}
          placeholder="REQ-123"
          autoComplete="off"
          style={{
            borderRadius: "16px",
            border: "1px solid rgba(75, 49, 11, 0.24)",
            padding: "14px 16px",
            font: "inherit",
            background: "rgba(255, 255, 255, 0.9)",
          }}
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: "fit-content",
          borderRadius: "999px",
          border: "none",
          padding: "12px 18px",
          font: "inherit",
          fontWeight: 700,
          cursor: isSubmitting ? "progress" : "pointer",
          background: "#5e4112",
          color: "#fff7ea",
        }}
      >
        {isSubmitting ? "Обновляем снимок..." : "Обновить снимок"}
      </button>

      <p
        style={{
          margin: 0,
          fontSize: "0.95rem",
          color: "#6b5128",
        }}
      >
        Последняя синхронизация:{" "}
        {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Успешных обновлений еще не было"}
      </p>
    </form>
  );
}
