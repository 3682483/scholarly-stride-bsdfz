import { createServerFn } from "@tanstack/react-start";

import { CURRENT_ACTOR } from "@/lib/constants";
import { getAiProviderInfo, runAiPreReview } from "@/lib/deepseek.server";
import type { ReviewDecision } from "@/lib/types";
import { nowStamp } from "@/db/client.server";
import {
  appendLog,
  getProjectById,
  getReviewRecords,
  insertAiReview,
  insertHumanReview,
  latestAiReview,
  listChecks,
  submitReviewDecision,
} from "@/db/queries.server";

/** 当前 AI 接入配置状态。 */
export const getAiStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  return getAiProviderInfo();
});

/** 查询某审核环节的 AI 预审与人工复审记录。 */
export const listReviewRecordsFn = createServerFn({ method: "GET" })
  .validator((input: { projectId: string; stage: string }) => input)
  .handler(async ({ data }) => {
    return getReviewRecords(data.projectId, data.stage);
  });

/** 执行一次 AI 预审并留档。 */
export const aiPreReviewFn = createServerFn({ method: "POST" })
  .validator((input: { projectId: string; stage: string }) => input)
  .handler(async ({ data }) => {
    const project = getProjectById(data.projectId);
    if (!project) throw new Error("课题不存在");

    const checks = listChecks();
    const result = await runAiPreReview(project, checks, data.stage);

    return insertAiReview({
      ...result,
      projectId: data.projectId,
      stage: data.stage,
      createdAt: nowStamp(),
      createdBy: "AI 预审助手",
    });
  });

/** 人工复审：确认或修正 AI 预审结论，并留档。 */
export const humanReReviewFn = createServerFn({ method: "POST" })
  .validator(
    (input: { projectId: string; stage: string; decision: ReviewDecision; comment: string }) =>
      input,
  )
  .handler(async ({ data }) => {
    const project = getProjectById(data.projectId);
    if (!project) throw new Error("课题不存在");

    const latest = latestAiReview(data.projectId, data.stage);
    const agreesWithAi =
      latest === null
        ? false
        : (latest.conclusion === "pass" && data.decision === "passed") ||
          (latest.conclusion !== "pass" && data.decision === "returned");

    insertHumanReview({
      projectId: data.projectId,
      stage: data.stage,
      aiReviewId: latest?.id ?? null,
      decision: data.decision,
      agreesWithAi,
      comment: data.comment,
      reviewer: CURRENT_ACTOR,
      createdAt: nowStamp(),
    });

    if (data.stage === "形式审查") {
      // 复用既有形式审查流转：更新课题状态、补材料、写操作留痕
      submitReviewDecision(data.projectId, data.decision, data.comment, CURRENT_ACTOR);
    } else {
      const verdict = data.decision === "passed" ? "通过" : "退回";
      appendLog(
        data.projectId,
        CURRENT_ACTOR,
        `人工复审（${data.stage}）`,
        `${verdict}${data.comment ? `：${data.comment}` : ""}`,
      );
    }

    return getReviewRecords(data.projectId, data.stage);
  });
