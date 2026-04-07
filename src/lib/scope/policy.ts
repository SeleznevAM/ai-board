export type ScopeHierarchyMode = "subtasks-only";

export type ScopeLinkTreatment = {
  readonly supported: readonly ["parent", "subtask"];
  readonly ignored: "non-hierarchical links are ignored";
};

export type ScopeVisibilityContract = {
  readonly rootIssueAccess: "current-user";
  readonly partialScopeBehavior: "partial visibility blocks successful results";
  readonly missingRootModes: readonly [
    "ROOT_ISSUE_NOT_FOUND",
    "ROOT_ISSUE_FORBIDDEN",
    "PARTIAL_SCOPE_FORBIDDEN",
  ];
};

export type ScopeSingleNodeRule = {
  readonly behavior: "root issue without children remains valid";
  readonly result: "one-node tree";
};

export type ScopePolicy = {
  readonly version: "phase-one";
  readonly hierarchyMode: ScopeHierarchyMode;
  readonly summary: string;
  readonly scopeSource: string;
  readonly linkTreatment: ScopeLinkTreatment;
  readonly visibility: ScopeVisibilityContract;
  readonly singleNode: ScopeSingleNodeRule;
  readonly notes: readonly string[];
};

export const SCOPE_POLICY: ScopePolicy = {
  version: "phase-one",
  hierarchyMode: "subtasks-only",
  summary:
    "Phase one supports only parent/subtask traversal and treats incomplete visibility as a blocking state.",
  scopeSource: "Only parent/subtask hierarchy is supported.",
  linkTreatment: {
    supported: ["parent", "subtask"],
    ignored: "non-hierarchical links are ignored",
  },
  visibility: {
    rootIssueAccess: "current-user",
    partialScopeBehavior: "partial visibility blocks successful results",
    missingRootModes: [
      "ROOT_ISSUE_NOT_FOUND",
      "ROOT_ISSUE_FORBIDDEN",
      "PARTIAL_SCOPE_FORBIDDEN",
    ],
  },
  singleNode: {
    behavior: "root issue without children remains valid",
    result: "one-node tree",
  },
  notes: [
    "Phase one keeps the supported scope intentionally narrow to avoid treating arbitrary links as requirement structure.",
    "A successful scope result is valid only when the current user can read the complete supported hierarchy.",
    "Non-hierarchical links are ignored and never included in the phase-one tree.",
  ],
};
