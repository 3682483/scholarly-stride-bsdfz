/**
 * 数据访问层（服务端专用）：把 SQLite 行映射为领域对象，并封装所有写操作。
 */
import { getDb, nowStamp } from "./client.server";
import type {
  AiConclusion,
  AiReview,
  Alert,
  AnalyticsSubject,
  AnalyticsYear,
  Batch,
  CheckItem,
  DashboardData,
  EligibilityItem,
  Expert,
  HumanReview,
  Level,
  LogEntry,
  Material,
  MaterialStatus,
  Policy,
  Project,
  ProjectDraft,
  ProjectSummary,
  ReviewDecision,
  ReviewRecord,
  ReviewRecords,
  Risk,
  Stage,
  Todo,
} from "@/lib/types";

type ProjectRow = {
  id: string;
  code: string;
  title: string;
  leader: string;
  unit: string;
  subject: string;
  level: string;
  batch: string;
  stage: string;
  risk: string;
  progress: number;
  completeness: number;
  budget_total: number;
  budget_used: number;
  next_due: string;
  last_update: string;
  abstract: string;
  review_decision: string | null;
  review_reason: string | null;
  review_at: string | null;
  apply_year: number;
  plagiarism_rate: number | null;
  aigc_rate: number | null;
  member_count?: number;
};

function mapSummary(r: ProjectRow): ProjectSummary {
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    leader: r.leader,
    unit: r.unit,
    subject: r.subject,
    level: r.level as Level,
    batch: r.batch,
    stage: r.stage as Stage,
    risk: r.risk as Risk,
    progress: r.progress,
    completeness: r.completeness,
    members: [],
    budget: { total: r.budget_total, used: r.budget_used },
    nextDue: r.next_due,
    lastUpdate: r.last_update,
    abstract: r.abstract,
    reviewDecision: (r.review_decision as ReviewDecision | null) ?? null,
    reviewReason: r.review_reason,
    reviewAt: r.review_at,
    applyYear: r.apply_year,
    plagiarismRate: r.plagiarism_rate,
    aigcRate: r.aigc_rate,
    memberCount: r.member_count ?? 0,
  };
}

const PROJECT_COLUMNS = `
  p.id, p.code, p.title, p.leader, p.unit, p.subject, p.level, p.batch, p.stage, p.risk,
  p.progress, p.completeness, p.budget_total, p.budget_used, p.next_due, p.last_update,
  p.abstract, p.review_decision, p.review_reason, p.review_at, p.apply_year,
  p.plagiarism_rate, p.aigc_rate`;

// ---------------------------------------------------------------- 课题

export function listProjectSummaries(): ProjectSummary[] {
  const rows = getDb()
    .prepare(
      `SELECT ${PROJECT_COLUMNS},
              (SELECT COUNT(*) FROM project_members m WHERE m.project_id = p.id) AS member_count
       FROM projects p
       ORDER BY p.apply_year DESC, p.id`,
    )
    .all() as ProjectRow[];
  return rows.map(mapSummary);
}

export function getProjectById(id: string): Project | null {
  const db = getDb();
  const row = db.prepare(`SELECT ${PROJECT_COLUMNS} FROM projects p WHERE p.id = ?`).get(id) as
    | ProjectRow
    | undefined;
  if (!row) return null;

  const members = db
    .prepare(`SELECT name FROM project_members WHERE project_id = ? ORDER BY sort_order`)
    .all(id) as { name: string }[];

  const materials = db
    .prepare(
      `SELECT id, name, stage, status, submit_date, owner
       FROM materials WHERE project_id = ? ORDER BY sort_order, id`,
    )
    .all(id) as {
    id: number;
    name: string;
    stage: string;
    status: string;
    submit_date: string | null;
    owner: string;
  }[];

  const logs = db
    .prepare(`SELECT id, time, actor, action, note FROM logs WHERE project_id = ? ORDER BY time DESC, id DESC`)
    .all(id) as { id: number; time: string; actor: string; action: string; note: string | null }[];

  const reviews = db
    .prepare(`SELECT id, expert, score, comment, status FROM reviews WHERE project_id = ? ORDER BY id`)
    .all(id) as { id: number; expert: string; score: number; comment: string; status: string }[];

  const summary = mapSummary(row);
  return {
    ...summary,
    members: members.map((m) => m.name),
    materials: materials.map<Material>((m) => ({
      id: m.id,
      name: m.name,
      stage: m.stage as Stage,
      status: m.status as MaterialStatus,
      date: m.submit_date,
      owner: m.owner,
    })),
    logs: logs.map<LogEntry>((l) => ({
      id: l.id,
      time: l.time,
      actor: l.actor,
      action: l.action,
      note: l.note,
    })),
    reviews: reviews.map<ReviewRecord>((r) => ({
      id: r.id,
      expert: r.expert,
      score: r.score,
      comment: r.comment,
      status: r.status,
    })),
  };
}

export function appendLog(projectId: string, actor: string, action: string, note?: string): void {
  getDb()
    .prepare(`INSERT INTO logs (project_id, time, actor, action, note) VALUES (?, ?, ?, ?, ?)`)
    .run(projectId, nowStamp(), actor, action, note ?? null);
}

/** 更新课题阶段，用于「通过并进入评审」「立项」等流转。 */
export function updateProjectStage(projectId: string, stage: Stage): void {
  getDb()
    .prepare(`UPDATE projects SET stage = ?, last_update = ? WHERE id = ?`)
    .run(stage, new Date().toISOString().slice(0, 10), projectId);
}

export function updateMaterialStatus(materialId: number, status: MaterialStatus): void {
  const date = status === "已提交" ? new Date().toISOString().slice(0, 10) : null;
  getDb()
    .prepare(`UPDATE materials SET status = ?, submit_date = COALESCE(?, submit_date) WHERE id = ?`)
    .run(status, date, materialId);
}

// ---------------------------------------------------------------- 形式审查 / 评审

export function listChecks(): CheckItem[] {
  const rows = getDb()
    .prepare(`SELECT id, name, ok FROM review_checks ORDER BY sort_order, id`)
    .all() as { id: number; name: string; ok: number }[];
  return rows.map((r) => ({ id: r.id, name: r.name, ok: r.ok === 1 }));
}

export function setCheckResult(id: number, ok: boolean): CheckItem | null {
  getDb().prepare(`UPDATE review_checks SET ok = ? WHERE id = ?`).run(ok ? 1 : 0, id);
  const row = getDb().prepare(`SELECT id, name, ok FROM review_checks WHERE id = ?`).get(id) as
    | { id: number; name: string; ok: number }
    | undefined;
  return row ? { id: row.id, name: row.name, ok: row.ok === 1 } : null;
}

export function listReviewCandidates(): ProjectSummary[] {
  const rows = getDb()
    .prepare(
      `SELECT ${PROJECT_COLUMNS},
              (SELECT COUNT(*) FROM project_members m WHERE m.project_id = p.id) AS member_count
       FROM projects p
       WHERE p.stage IN ('申报', '评审') AND p.review_decision IS NULL
       ORDER BY p.apply_year DESC, p.id`,
    )
    .all() as ProjectRow[];
  return rows.map(mapSummary);
}

export function listExperts(): Expert[] {
  const rows = getDb()
    .prepare(`SELECT id, name, field, status, available FROM experts ORDER BY id`)
    .all() as { id: string; name: string; field: string; status: string; available: string | null }[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    field: r.field,
    status: r.status as Expert["status"],
    available: r.available,
  }));
}

export function submitReviewDecision(
  projectId: string,
  decision: ReviewDecision,
  reason: string,
  actor: string,
): void {
  const db = getDb();
  const at = nowStamp();
  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE projects
       SET review_decision = ?, review_reason = ?, review_at = ?, stage = ?, last_update = ?
       WHERE id = ?`,
    ).run(
      decision,
      reason || null,
      at,
      decision === "passed" ? "评审" : "申报",
      at.slice(0, 10),
      projectId,
    );

    if (decision === "passed") {
      db.prepare(
        `INSERT INTO materials (project_id, name, stage, status, submit_date, owner, sort_order)
         VALUES (?, ?, '申报', '已提交', ?, '科研处', 99)`,
      ).run(projectId, "形式审查清单", at.slice(0, 10));
      db.prepare(`INSERT INTO logs (project_id, time, actor, action, note) VALUES (?, ?, ?, ?, ?)`).run(
        projectId,
        at,
        actor,
        "形式审查通过并进入评审",
        reason || null,
      );
    } else {
      db.prepare(`INSERT INTO logs (project_id, time, actor, action, note) VALUES (?, ?, ?, ?, ?)`).run(
        projectId,
        at,
        actor,
        "形式审查退回修改",
        reason,
      );
    }
  });
  tx();
}

export function getAssignedExpertIds(projectId: string): string[] {
  const rows = getDb()
    .prepare(`SELECT expert_id FROM assignments WHERE project_id = ?`)
    .all(projectId) as { expert_id: string }[];
  return rows.map((r) => r.expert_id);
}

export function assignExperts(projectId: string, expertIds: string[], actor: string): void {
  const db = getDb();
  const at = nowStamp();
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM assignments WHERE project_id = ?`).run(projectId);
    const insert = db.prepare(
      `INSERT OR IGNORE INTO assignments (project_id, expert_id, assigned_at) VALUES (?, ?, ?)`,
    );
    for (const id of expertIds) insert.run(projectId, id, at);

    const names = expertIds.length
      ? (db
          .prepare(
            `SELECT name FROM experts WHERE id IN (${expertIds.map(() => "?").join(",")})`,
          )
          .all(...expertIds) as { name: string }[])
          .map((r) => r.name)
          .join("、")
      : "无";

    db.prepare(`INSERT INTO logs (project_id, time, actor, action, note) VALUES (?, ?, ?, ?, ?)`).run(
      projectId,
      at,
      actor,
      "分配评审专家",
      names,
    );
  });
  tx();
}

// ---------------------------------------------------------------- 批次

export function listBatches(): Batch[] {
  const rows = getDb()
    .prepare(`SELECT id, name, year, level, status, apply_count, pass_count FROM batches ORDER BY year DESC, id DESC`)
    .all() as {
    id: string;
    name: string;
    year: number;
    level: string;
    status: string;
    apply_count: number;
    pass_count: number;
  }[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    year: r.year,
    level: r.level as Level,
    status: r.status,
    applyCount: r.apply_count,
    passCount: r.pass_count,
  }));
}

export function createBatch(input: { name: string; year: number; level: Level }): Batch {
  const db = getDb();
  const id = `B${input.year}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  db.prepare(
    `INSERT INTO batches (id, name, year, level, status, apply_count, pass_count)
     VALUES (?, ?, ?, ?, '申报中', 0, 0)`,
  ).run(id, input.name, input.year, input.level);
  return { id, name: input.name, year: input.year, level: input.level, status: "申报中", applyCount: 0, passCount: 0 };
}

// ---------------------------------------------------------------- 待办 / 预警 / 政策

export function listTodos(): Todo[] {
  const rows = getDb().prepare(`SELECT id, title, due, done FROM todos ORDER BY id`).all() as {
    id: number;
    title: string;
    due: string;
    done: number;
  }[];
  return rows.map((r) => ({ id: r.id, title: r.title, due: r.due, done: r.done === 1 }));
}

export function toggleTodo(id: number, done: boolean): Todo | null {
  const db = getDb();
  db.prepare(`UPDATE todos SET done = ? WHERE id = ?`).run(done ? 1 : 0, id);
  const row = db.prepare(`SELECT id, title, due, done FROM todos WHERE id = ?`).get(id) as
    | { id: number; title: string; due: string; done: number }
    | undefined;
  return row ? { id: row.id, title: row.title, due: row.due, done: row.done === 1 } : null;
}

export function listAlerts(): (Alert & { projectTitle: string })[] {
  const rows = getDb()
    .prepare(
      `SELECT a.id, a.project_id, a.level, a.title, a.owner, p.title AS project_title
       FROM alerts a LEFT JOIN projects p ON p.id = a.project_id
       ORDER BY CASE a.level WHEN 'red' THEN 0 WHEN 'amber' THEN 1 ELSE 2 END, a.id`,
    )
    .all() as {
    id: number;
    project_id: string;
    level: string;
    title: string;
    owner: string;
    project_title: string | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    level: r.level as Risk,
    title: r.title,
    owner: r.owner,
    projectTitle: r.project_title ?? "未知课题",
  }));
}

export function listPolicies(): Policy[] {
  const rows = getDb()
    .prepare(`SELECT id, title, level, category, publish_date, summary FROM policies ORDER BY publish_date DESC, id DESC`)
    .all() as {
    id: number;
    title: string;
    level: string;
    category: string;
    publish_date: string;
    summary: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    level: r.level as Level,
    category: r.category,
    publishDate: r.publish_date,
    summary: r.summary,
  }));
}

// ---------------------------------------------------------------- 工作台 / 统计

export function getDashboardData(): DashboardData {
  const projects = listProjectSummaries();
  const active = projects.filter((p) => p.stage !== "归档");
  const alerts = listAlerts();

  const avgCompleteness = active.length
    ? Math.round(active.reduce((s, p) => s + p.completeness, 0) / active.length)
    : 0;

  const upcoming = active
    .slice()
    .sort((a, b) => a.completeness - b.completeness)
    .slice(0, 6);

  return {
    activeCount: active.length,
    totalCount: projects.length,
    avgCompleteness,
    alertCount: alerts.length,
    redCount: alerts.filter((a) => a.level === "red").length,
    amberCount: alerts.filter((a) => a.level === "amber").length,
    alerts,
    upcoming,
    todos: listTodos(),
  };
}

export function getAnalytics() {
  const db = getDb();

  const years = (
    db
      .prepare(
        `SELECT CAST(year AS TEXT) AS year, SUM(apply_count) AS apply, SUM(pass_count) AS approve
         FROM batches GROUP BY year ORDER BY year`,
      )
      .all() as { year: string; apply: number; approve: number }[]
  ).map<AnalyticsYear>((r) => ({ year: r.year, apply: r.apply, approve: r.approve }));

  const subjects = (
    db
      .prepare(
        `SELECT subject, COUNT(*) AS count FROM projects GROUP BY subject ORDER BY count DESC, subject`,
      )
      .all() as { subject: string; count: number }[]
  ).map<AnalyticsSubject>((r) => ({ subject: r.subject, count: r.count }));

  const latest = [...years].sort((a, b) => Number(b.year) - Number(a.year))[0];
  const approvalRate = latest && latest.apply > 0 ? Math.round((latest.approve / latest.apply) * 100) : 0;

  const active = listProjectSummaries().filter((p) => p.stage !== "归档");
  const materialRow = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status = '已提交' THEN 1 ELSE 0 END) AS submitted,
         COUNT(*) AS total
       FROM materials`,
    )
    .get() as { submitted: number | null; total: number };
  const materialRate =
    materialRow.total > 0 ? Math.round(((materialRow.submitted ?? 0) / materialRow.total) * 100) : 0;

  const avgCompleteness = active.length
    ? Math.round(active.reduce((s, p) => s + p.completeness, 0) / active.length)
    : 0;

  const monitored = active
    .slice()
    .sort((a, b) => a.completeness - b.completeness)
    .map((p) => ({ id: p.id, title: p.title, risk: p.risk, completeness: p.completeness }));

  return {
    years,
    subjects,
    stats: {
      currentYearApproved: latest?.approve ?? 0,
      approvalRate,
      materialRate,
      avgCompleteness,
    },
    monitored,
  };
}

// ---------------------------------------------------------------- 课题申报（D01 / D02 / D03）

const LEVEL_CODE: Record<Level, string> = {
  国家级: "GJ",
  市级: "SH",
  区级: "QU",
  校级: "XX",
};

/** 申报资格校验（对应形式审查前置校验）。 */
export function checkEligibility(draft: ProjectDraft): EligibilityItem[] {
  const db = getDb();
  const title = draft.title.trim();
  const abstract = draft.abstract.trim();
  const leader = draft.leader.trim();

  const active = db
    .prepare(`SELECT COUNT(*) AS c FROM projects WHERE leader = ? AND stage NOT IN ('归档')`)
    .get(leader) as { c: number };

  const dup = db
    .prepare(`SELECT COUNT(*) AS c FROM projects WHERE batch = ? AND title = ?`)
    .get(draft.batch, title) as { c: number };

  const memberTotal = new Set([leader, ...draft.members.map((m) => m.trim())].filter(Boolean)).size;

  return [
    {
      name: "课题名称不少于 8 字",
      ok: title.length >= 8,
      detail: `当前 ${title.length} 字`,
      blocking: false,
    },
    {
      name: "研究摘要不少于 100 字",
      ok: abstract.length >= 100,
      detail: `当前 ${abstract.length} 字`,
      blocking: false,
    },
    {
      name: "在研课题不超过 2 项（限项）",
      ok: active.c < 2,
      detail: `「${leader || "未填写"}」当前在研 ${active.c} 项`,
      blocking: true,
    },
    {
      name: "同批次无重复选题",
      ok: dup.c === 0,
      detail: dup.c === 0 ? "未发现重复选题" : "该批次已存在同名课题",
      blocking: true,
    },
    {
      name: "申请经费合理（> 0）",
      ok: draft.budgetTotal > 0,
      detail: draft.budgetTotal > 0 ? `¥${draft.budgetTotal.toLocaleString()}` : "未填写",
      blocking: false,
    },
    {
      name: "课题组人员配置完整（≥ 2 人）",
      ok: memberTotal >= 2,
      detail: `共 ${memberTotal} 人`,
      blocking: false,
    },
  ];
}

/** 新建课题申报，返回新课题 id。 */
export function createProject(draft: ProjectDraft): string {
  const db = getDb();
  const year = draft.applyYear;

  const existing = db.prepare(`SELECT id FROM projects WHERE id LIKE ?`).all(`KT${year}%`) as {
    id: string;
  }[];
  let maxSeq = 0;
  for (const r of existing) {
    const n = Number(r.id.slice(6));
    if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
  }
  const seq = String(maxSeq + 1).padStart(3, "0");
  const id = `KT${year}${seq}`;
  const code = `${LEVEL_CODE[draft.level]}-${year}-D${seq}`;

  const today = new Date().toISOString().slice(0, 10);
  const leader = draft.leader.trim();
  const members = [leader, ...draft.members.map((m) => m.trim()).filter((m) => m && m !== leader)];
  const abstract = draft.abstract.trim();

  const completeness = Math.min(
    100,
    40 +
      (abstract.length >= 100 ? 20 : 0) +
      (draft.budgetTotal > 0 ? 20 : 0) +
      (members.length > 1 ? 20 : 0),
  );

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO projects (
         id, code, title, leader, unit, subject, level, batch, stage, risk,
         progress, completeness, budget_total, budget_used, next_due, last_update,
         abstract, review_decision, review_reason, review_at, apply_year,
         plagiarism_rate, aigc_rate, created_at
       ) VALUES (
         @id, @code, @title, @leader, @unit, @subject, @level, @batch, '申报', 'green',
         5, @completeness, @budgetTotal, 0, '待形式审查', @lastUpdate,
         @abstract, NULL, NULL, NULL, @applyYear, NULL, NULL, @createdAt
       )`,
    ).run({
      id,
      code,
      title: draft.title.trim(),
      leader,
      unit: draft.unit.trim() || "未填写",
      subject: draft.subject,
      level: draft.level,
      batch: draft.batch,
      completeness,
      budgetTotal: draft.budgetTotal,
      lastUpdate: today,
      abstract,
      applyYear: year,
      createdAt: nowStamp(),
    });

    const insertMember = db.prepare(
      `INSERT INTO project_members (project_id, name, role, sort_order) VALUES (?, ?, ?, ?)`,
    );
    members.forEach((name, i) => insertMember.run(id, name, i === 0 ? "负责人" : "成员", i));

    const insertMaterial = db.prepare(
      `INSERT INTO materials (project_id, name, stage, status, submit_date, owner, sort_order)
       VALUES (?, ?, '申报', '已提交', ?, ?, ?)`,
    );
    insertMaterial.run(id, "申报书", today, leader, 0);
    insertMaterial.run(id, "资格校验单", today, "系统", 1);

    db.prepare(`INSERT INTO logs (project_id, time, actor, action, note) VALUES (?, ?, ?, ?, ?)`).run(
      id,
      nowStamp(),
      leader,
      "提交课题申报",
      `申报批次：${draft.batch}`,
    );
  });
  tx();

  return id;
}

// ---------------------------------------------------------------- AI 预审 / 人工复审记录

type AiReviewRow = {
  id: number;
  project_id: string;
  stage: string;
  provider: string;
  model: string;
  conclusion: string;
  score: number;
  summary: string;
  risks: string;
  suggestions: string;
  created_at: string;
  created_by: string;
};

function parseStringList(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

function mapAiReview(r: AiReviewRow): AiReview {
  return {
    id: r.id,
    projectId: r.project_id,
    stage: r.stage,
    provider: r.provider,
    model: r.model,
    conclusion: r.conclusion as AiConclusion,
    score: r.score,
    summary: r.summary,
    risks: parseStringList(r.risks),
    suggestions: parseStringList(r.suggestions),
    createdAt: r.created_at,
    createdBy: r.created_by,
  };
}

export function insertAiReview(input: Omit<AiReview, "id">): AiReview {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO ai_reviews
         (project_id, stage, provider, model, conclusion, score, summary, risks, suggestions, created_at, created_by)
       VALUES
         (@projectId, @stage, @provider, @model, @conclusion, @score, @summary, @risks, @suggestions, @createdAt, @createdBy)`,
    )
    .run({
      projectId: input.projectId,
      stage: input.stage,
      provider: input.provider,
      model: input.model,
      conclusion: input.conclusion,
      score: input.score,
      summary: input.summary,
      risks: JSON.stringify(input.risks),
      suggestions: JSON.stringify(input.suggestions),
      createdAt: input.createdAt,
      createdBy: input.createdBy,
    });
  const row = db
    .prepare(`SELECT * FROM ai_reviews WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as AiReviewRow;
  return mapAiReview(row);
}

export function listAiReviews(projectId: string, stage: string): AiReview[] {
  const rows = getDb()
    .prepare(`SELECT * FROM ai_reviews WHERE project_id = ? AND stage = ? ORDER BY id DESC`)
    .all(projectId, stage) as AiReviewRow[];
  return rows.map(mapAiReview);
}

export function latestAiReview(projectId: string, stage: string): AiReview | null {
  const row = getDb()
    .prepare(`SELECT * FROM ai_reviews WHERE project_id = ? AND stage = ? ORDER BY id DESC LIMIT 1`)
    .get(projectId, stage) as AiReviewRow | undefined;
  return row ? mapAiReview(row) : null;
}

type HumanReviewRow = {
  id: number;
  project_id: string;
  stage: string;
  ai_review_id: number | null;
  decision: string;
  agrees_with_ai: number;
  comment: string;
  reviewer: string;
  created_at: string;
};

function mapHumanReview(r: HumanReviewRow): HumanReview {
  return {
    id: r.id,
    projectId: r.project_id,
    stage: r.stage,
    aiReviewId: r.ai_review_id,
    decision: r.decision as ReviewDecision,
    agreesWithAi: r.agrees_with_ai === 1,
    comment: r.comment,
    reviewer: r.reviewer,
    createdAt: r.created_at,
  };
}

export function insertHumanReview(input: Omit<HumanReview, "id">): HumanReview {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO human_reviews
         (project_id, stage, ai_review_id, decision, agrees_with_ai, comment, reviewer, created_at)
       VALUES
         (@projectId, @stage, @aiReviewId, @decision, @agreesWithAi, @comment, @reviewer, @createdAt)`,
    )
    .run({
      projectId: input.projectId,
      stage: input.stage,
      aiReviewId: input.aiReviewId,
      decision: input.decision,
      agreesWithAi: input.agreesWithAi ? 1 : 0,
      comment: input.comment,
      reviewer: input.reviewer,
      createdAt: input.createdAt,
    });
  const row = db
    .prepare(`SELECT * FROM human_reviews WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as HumanReviewRow;
  return mapHumanReview(row);
}

export function listHumanReviews(projectId: string, stage: string): HumanReview[] {
  const rows = getDb()
    .prepare(`SELECT * FROM human_reviews WHERE project_id = ? AND stage = ? ORDER BY id DESC`)
    .all(projectId, stage) as HumanReviewRow[];
  return rows.map(mapHumanReview);
}

export function getReviewRecords(projectId: string, stage: string): ReviewRecords {
  return {
    ai: listAiReviews(projectId, stage),
    human: listHumanReviews(projectId, stage),
  };
}
