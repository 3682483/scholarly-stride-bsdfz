import { createServerFn } from "@tanstack/react-start";

import { CURRENT_ACTOR } from "@/lib/constants";
import type { CheckItem, Expert, ProjectSummary } from "@/lib/types";
import {
  assignExperts,
  getAssignedExpertIds,
  listChecks,
  listExperts,
  listReviewCandidates,
  setCheckResult,
} from "@/db/queries.server";

export type ReviewBoard = {
  candidates: ProjectSummary[];
  checks: CheckItem[];
  experts: Expert[];
  assignments: Record<string, string[]>;
};

function buildBoard(): ReviewBoard {
  const candidates = listReviewCandidates();
  const assignments: Record<string, string[]> = {};
  for (const c of candidates) {
    assignments[c.id] = getAssignedExpertIds(c.id);
  }
  return {
    candidates,
    checks: listChecks(),
    experts: listExperts(),
    assignments,
  };
}

export const getReviewBoardFn = createServerFn({ method: "GET" }).handler(async () => {
  return buildBoard();
});

export const assignExpertsFn = createServerFn({ method: "POST" })
  .validator((input: { projectId: string; expertIds: string[] }) => input)
  .handler(async ({ data }) => {
    assignExperts(data.projectId, data.expertIds, CURRENT_ACTOR);
    return buildBoard();
  });

export const setCheckResultFn = createServerFn({ method: "POST" })
  .validator((input: { checkId: number; ok: boolean }) => input)
  .handler(async ({ data }) => {
    setCheckResult(data.checkId, data.ok);
    return buildBoard();
  });
