/**
 * SQLite 连接管理（服务端专用）。
 * - 首次访问时自动建表
 * - 数据表为空时写入种子数据
 * - 使用 WAL 模式提升并发读性能
 */
import Database from "better-sqlite3";
import type { Database as DatabaseType, Statement } from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { ROLE_DEFS } from "@/lib/permissions";

import { SCHEMA_SQL } from "./schema.server";
import {
  DEFAULT_CURRENT_USER_ID,
  seedAlerts,
  seedBatches,
  seedChecks,
  seedExperts,
  seedPolicies,
  seedProjects,
  seedTodos,
  seedUsers,
} from "./seed-data.server";

let cached: DatabaseType | null = null;

/** 本地时间戳，格式 YYYY-MM-DD HH:mm */
export function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function resolveDbFile(): string {
  const configured = process.env["DATABASE_FILE"];
  if (configured) return resolve(configured);
  return resolve(process.cwd(), "data", "app.db");
}

function createConnection(): DatabaseType {
  const file = resolveDbFile();
  mkdirSync(dirname(file), { recursive: true });

  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  seedAll(db);
  return db;
}

function seedProjectData(db: DatabaseType): void {
  const row = db.prepare("SELECT COUNT(*) AS c FROM projects").get() as { c: number };
  if (row.c > 0) return;

  const insertBatch = db.prepare(
    `INSERT INTO batches (id, name, year, level, status, apply_count, pass_count)
     VALUES (@id, @name, @year, @level, @status, @applyCount, @passCount)`,
  );
  const insertProject = db.prepare(
    `INSERT INTO projects (
       id, code, title, leader, unit, subject, level, batch, stage, risk,
       progress, completeness, budget_total, budget_used, next_due, last_update,
       abstract, review_decision, review_reason, review_at, apply_year,
       plagiarism_rate, aigc_rate, created_at
     ) VALUES (
       @id, @code, @title, @leader, @unit, @subject, @level, @batch, @stage, @risk,
       @progress, @completeness, @budgetTotal, @budgetUsed, @nextDue, @lastUpdate,
       @abstract, @reviewDecision, @reviewReason, @reviewAt, @applyYear,
       @plagiarismRate, @aigcRate, @createdAt
     )`,
  );
  const insertMember = db.prepare(
    `INSERT INTO project_members (project_id, name, role, sort_order)
     VALUES (@projectId, @name, @role, @sortOrder)`,
  );
  const insertMaterial = db.prepare(
    `INSERT INTO materials (project_id, name, stage, status, submit_date, owner, sort_order)
     VALUES (@projectId, @name, @stage, @status, @date, @owner, @sortOrder)`,
  );
  const insertLog = db.prepare(
    `INSERT INTO logs (project_id, time, actor, action, note)
     VALUES (@projectId, @time, @actor, @action, @note)`,
  );
  const insertReview = db.prepare(
    `INSERT INTO reviews (project_id, expert, score, comment, status)
     VALUES (@projectId, @expert, @score, @comment, @status)`,
  );
  const insertExpert = db.prepare(
    `INSERT INTO experts (id, name, field, status, available)
     VALUES (@id, @name, @field, @status, @available)`,
  );
  const insertCheck = db.prepare(
    `INSERT INTO review_checks (name, ok, sort_order) VALUES (@name, @ok, @sortOrder)`,
  );
  const insertTodo = db.prepare(`INSERT INTO todos (title, due, done) VALUES (@title, @due, @done)`);
  const insertPolicy = db.prepare(
    `INSERT INTO policies (title, level, category, publish_date, summary)
     VALUES (@title, @level, @category, @publishDate, @summary)`,
  );
  const insertAlert = db.prepare(
    `INSERT INTO alerts (project_id, level, title, owner, created_at)
     VALUES (@projectId, @level, @title, @owner, @createdAt)`,
  );

  const run = db.transaction(() => {
    const createdAt = nowStamp();

    for (const b of seedBatches) insertBatch.run(b);

    for (const p of seedProjects) {
      insertProject.run({
        id: p.id,
        code: p.code,
        title: p.title,
        leader: p.leader,
        unit: p.unit,
        subject: p.subject,
        level: p.level,
        batch: p.batch,
        stage: p.stage,
        risk: p.risk,
        progress: p.progress,
        completeness: p.completeness,
        budgetTotal: p.budget.total,
        budgetUsed: p.budget.used,
        nextDue: p.nextDue,
        lastUpdate: p.lastUpdate,
        abstract: p.abstract,
        reviewDecision: p.reviewDecision ?? null,
        reviewReason: p.reviewReason ?? null,
        reviewAt: p.reviewAt ?? null,
        applyYear: p.applyYear,
        plagiarismRate: p.plagiarismRate ?? null,
        aigcRate: p.aigcRate ?? null,
        createdAt,
      });

      p.members.forEach((name, i) => {
        insertMember.run({
          projectId: p.id,
          name,
          role: i === 0 ? "负责人" : "成员",
          sortOrder: i,
        });
      });

      p.materials.forEach((m, i) => {
        insertMaterial.run({
          projectId: p.id,
          name: m.name,
          stage: m.stage,
          status: m.status,
          date: m.date ?? null,
          owner: m.owner,
          sortOrder: i,
        });
      });

      for (const l of p.logs) {
        insertLog.run({
          projectId: p.id,
          time: l.time,
          actor: l.actor,
          action: l.action,
          note: l.note ?? null,
        });
      }

      for (const r of p.reviews ?? []) {
        insertReview.run({
          projectId: p.id,
          expert: r.expert,
          score: r.score,
          comment: r.comment,
          status: r.status ?? "待整改复核",
        });
      }
    }

    for (const e of seedExperts) insertExpert.run(e);
    seedChecks.forEach((c, i) => insertCheck.run({ ...c, sortOrder: i }));
    for (const t of seedTodos) insertTodo.run(t);
    for (const p of seedPolicies) insertPolicy.run(p);
    for (const a of seedAlerts) insertAlert.run({ ...a, createdAt });
  });

  run();
}

/**
 * 初始化 RBAC 数据（角色、角色权限、用户、当前登录用户）。
 * 独立判断 roles 是否为空，便于对已有数据库增量补齐。
 */
function seedRbac(db: DatabaseType): void {
  const row = db.prepare("SELECT COUNT(*) AS c FROM roles").get() as { c: number };
  if (row.c > 0) return;

  const insertRole = db.prepare(
    `INSERT INTO roles (id, name, description, is_system, sort_order)
     VALUES (@id, @name, @description, @isSystem, @sortOrder)`,
  );
  const insertRolePermission = db.prepare(
    `INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES (?, ?)`,
  );
  const insertUser = db.prepare(
    `INSERT INTO users
       (id, name, username, email, phone, unit, subject, title, role_id, status, last_login, created_at)
     VALUES
       (@id, @name, @username, @email, @phone, @unit, @subject, @title, @roleId, @status, @lastLogin, @createdAt)`,
  );
  const setState = db.prepare(`INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)`);

  const tx = db.transaction(() => {
    ROLE_DEFS.forEach((role, index) => {
      insertRole.run({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.system ? 1 : 0,
        sortOrder: index,
      });
      for (const permission of role.permissions) {
        insertRolePermission.run(role.id, permission);
      }
    });

    const createdAt = nowStamp();
    for (const user of seedUsers) {
      insertUser.run({ ...user, createdAt });
    }

    setState.run("current_user_id", DEFAULT_CURRENT_USER_ID);
  });
  tx();
}

function seedAll(db: DatabaseType): void {
  seedProjectData(db);
  seedRbac(db);
}

/** 获取（并缓存）数据库连接。 */
export function getDb(): DatabaseType {
  if (!cached) cached = createConnection();
  return cached;
}

export type { DatabaseType, Statement };
