import { createServerFn } from "@tanstack/react-start";

import { PERMISSION_LABELS } from "@/lib/permissions";
import type { CheckItem, Expert, ReviewQueueItem } from "@/lib/types";
import {
  assignExperts,
  getAssignedExpertIds,
  getCurrentActor,
  getCurrentUser,
  listChecks,
  listExperts,
  listReviewQueue,
  reopenReview,
  setCheckResult,
} from "@/db/queries.server";

function assertPermission(permission: string): void {
  const user = getCurrentUser();
  if (!user?.permissions.includes(permission)) {
    throw new Error(
      `无权限执行该操作（需要「${PERMISSION_LABELS[permission] ?? permission}」权限）`,
    );
  }
}

export type ReviewBoard = {
  queue: ReviewQueueItem[];
  checks: CheckItem[];
  experts: Expert[];
  assignments: Record<string, string[]>;
};

function buildBoard(): ReviewBoard {
  const queue = listReviewQueue();
  const assignments: Record<string, string[]> = {};
  for (const item of queue) {
    assignments[item.id] = getAssignedExpertIds(item.id);
  }
  return {
    queue,
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
    assignExperts(data.projectId, data.expertIds, getCurrentActor());
    return buildBoard();
  });

export const setCheckResultFn = createServerFn({ method: "POST" })
  .validator((input: { checkId: number; ok: boolean }) => input)
  .handler(async ({ data }) => {
    setCheckResult(data.checkId, data.ok);
    return buildBoard();
  });

/** 撤回已出的形式审查结论，课题重新进入待审查队列。 */
export const reopenReviewFn = createServerFn({ method: "POST" })
  .validator((input: { projectId: string }) => input)
  .handler(async ({ data }) => {
    assertPermission("review:form");
    reopenReview(data.projectId, getCurrentActor());
    return buildBoard();
  });
