/**
 * SQLite 表结构定义（服务端专用）。
 * 采用 IF NOT EXISTS，保证首次启动自动建表。
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS batches (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  year        INTEGER NOT NULL,
  level       TEXT NOT NULL,
  status      TEXT NOT NULL,
  apply_count INTEGER NOT NULL DEFAULT 0,
  pass_count  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  leader          TEXT NOT NULL,
  unit            TEXT NOT NULL,
  subject         TEXT NOT NULL,
  level           TEXT NOT NULL,
  batch           TEXT NOT NULL,
  stage           TEXT NOT NULL,
  risk            TEXT NOT NULL,
  progress        INTEGER NOT NULL DEFAULT 0,
  completeness    INTEGER NOT NULL DEFAULT 0,
  budget_total    INTEGER NOT NULL DEFAULT 0,
  budget_used     INTEGER NOT NULL DEFAULT 0,
  next_due        TEXT NOT NULL,
  last_update     TEXT NOT NULL,
  abstract        TEXT NOT NULL DEFAULT '',
  review_decision TEXT,
  review_reason   TEXT,
  review_at       TEXT,
  apply_year      INTEGER NOT NULL,
  plagiarism_rate REAL,
  aigc_rate       REAL,
  created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT '成员',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS materials (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  stage       TEXT NOT NULL,
  status      TEXT NOT NULL,
  submit_date TEXT,
  owner       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  time       TEXT NOT NULL,
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  note       TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  expert     TEXT NOT NULL,
  score      INTEGER NOT NULL,
  comment    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT '待整改复核'
);

CREATE TABLE IF NOT EXISTS experts (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  field     TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT '待评审',
  available TEXT
);

CREATE TABLE IF NOT EXISTS review_checks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  ok         INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS assignments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  expert_id   TEXT NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL,
  UNIQUE (project_id, expert_id)
);

CREATE TABLE IF NOT EXISTS alerts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  level      TEXT NOT NULL,
  title      TEXT NOT NULL,
  owner      TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todos (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  due   TEXT NOT NULL,
  done  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS policies (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  level        TEXT NOT NULL,
  category     TEXT NOT NULL,
  publish_date TEXT NOT NULL,
  summary      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(stage);
CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_logs_project ON logs(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_project ON reviews(project_id);

-- AI 预审记录（各审核环节）
CREATE TABLE IF NOT EXISTS ai_reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage       TEXT NOT NULL,
  provider    TEXT NOT NULL,
  model       TEXT NOT NULL,
  conclusion  TEXT NOT NULL,
  score       INTEGER NOT NULL,
  summary     TEXT NOT NULL,
  risks       TEXT NOT NULL DEFAULT '[]',
  suggestions TEXT NOT NULL DEFAULT '[]',
  created_at  TEXT NOT NULL,
  created_by  TEXT NOT NULL
);

-- 人工复审记录（对 AI 预审的确认或修正）
CREATE TABLE IF NOT EXISTS human_reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage         TEXT NOT NULL,
  ai_review_id  INTEGER,
  decision      TEXT NOT NULL,
  agrees_with_ai INTEGER NOT NULL DEFAULT 1,
  comment       TEXT NOT NULL DEFAULT '',
  reviewer      TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_reviews_project ON ai_reviews(project_id, stage);
CREATE INDEX IF NOT EXISTS idx_human_reviews_project ON human_reviews(project_id, stage);
`;
