import { createServerFn } from "@tanstack/react-start";

import { CURRENT_ACTOR } from "@/lib/constants";
import type { Level, MaterialStatus, ProjectDraft, Stage } from "@/lib/types";
import {
  appendLog,
  checkEligibility,
  createBatch,
  createProject,
  getProjectById,
  listBatches,
  listProjectSummaries,
  updateMaterialStatus,
  updateProjectStage,
} from "@/db/queries.server";

export const listProjectsFn = createServerFn({ method: "GET" }).handler(async () => {
  return listProjectSummaries();
});

export const getProjectFn = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    return getProjectById(data.id);
  });

export const setMaterialStatusFn = createServerFn({ method: "POST" })
  .validator((input: { projectId: string; materialId: number; status: MaterialStatus }) => input)
  .handler(async ({ data }) => {
    updateMaterialStatus(data.materialId, data.status);
    appendLog(
      data.projectId,
      CURRENT_ACTOR,
      data.status === "已提交" ? "确认材料提交" : "退回材料",
      `材料编号 ${data.materialId}`,
    );
    return getProjectById(data.projectId);
  });

export const advanceStageFn = createServerFn({ method: "POST" })
  .validator((input: { projectId: string; stage: Stage }) => input)
  .handler(async ({ data }) => {
    updateProjectStage(data.projectId, data.stage);
    appendLog(data.projectId, CURRENT_ACTOR, "推进课题阶段", `阶段更新为「${data.stage}」`);
    return getProjectById(data.projectId);
  });

/** 导出一题一档：返回可序列化的完整档案对象。 */
export const exportProjectFn = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const project = getProjectById(data.id);
    if (!project) return null;
    appendLog(project.id, CURRENT_ACTOR, "导出一题一档", "生成课题全过程档案");
    return {
      exportedAt: new Date().toISOString(),
      exportedBy: CURRENT_ACTOR,
      project,
    };
  });

// ---------------------------------------------------------------- 申报批次

export const listBatchesFn = createServerFn({ method: "GET" }).handler(async () => {
  return listBatches();
});

export const createBatchFn = createServerFn({ method: "POST" })
  .validator((input: { name: string; year: number; level: Level }) => input)
  .handler(async ({ data }) => {
    createBatch(data);
    return listBatches();
  });

// ---------------------------------------------------------------- 课题申报

/** 申报资格校验，返回逐项结果。 */
export const checkEligibilityFn = createServerFn({ method: "POST" })
  .validator((input: ProjectDraft) => input)
  .handler(async ({ data }) => {
    return checkEligibility(data);
  });

/** 提交课题申报，落库并返回新课题 id。 */
export const createProjectFn = createServerFn({ method: "POST" })
  .validator((input: ProjectDraft) => input)
  .handler(async ({ data }) => {
    const blocking = checkEligibility(data).filter((item) => !item.ok && item.blocking);
    if (blocking.length > 0) {
      throw new Error(blocking.map((item) => item.detail).join("；"));
    }
    return createProject(data);
  });
