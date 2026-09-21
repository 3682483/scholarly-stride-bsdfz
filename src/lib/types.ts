/**
 * 领域类型定义（同构：服务端与客户端共用）。
 * 对应的数据库表结构见 src/db/schema.server.ts。
 */

export type Stage = "申报" | "评审" | "立项" | "开题" | "中期" | "结题" | "归档";

export const STAGES: Stage[] = [
  "申报",
  "评审",
  "立项",
  "开题",
  "中期",
  "结题",
  "归档",
];

export type Risk = "green" | "amber" | "red";

export const riskLabel: Record<Risk, string> = {
  green: "正常",
  amber: "关注",
  red: "预警",
};

export type Level = "国家级" | "市级" | "区级" | "校级";

export type MaterialStatus = "已提交" | "待提交" | "已退回";

export type ReviewDecision = "passed" | "returned";

export type Material = {
  id: number;
  name: string;
  stage: Stage;
  status: MaterialStatus;
  date: string | null;
  owner: string;
};

export type LogEntry = {
  id: number;
  time: string;
  actor: string;
  action: string;
  note: string | null;
};

export type ReviewRecord = {
  id: number;
  expert: string;
  score: number;
  comment: string;
  status: string;
};

export type Project = {
  id: string;
  code: string;
  title: string;
  leader: string;
  unit: string;
  subject: string;
  level: Level;
  batch: string;
  stage: Stage;
  risk: Risk;
  progress: number;
  completeness: number;
  members: string[];
  budget: { total: number; used: number };
  nextDue: string;
  lastUpdate: string;
  abstract: string;
  materials: Material[];
  logs: LogEntry[];
  reviews: ReviewRecord[];
  reviewDecision: ReviewDecision | null;
  reviewReason: string | null;
  reviewAt: string | null;
  applyYear: number;
  plagiarismRate: number | null;
  aigcRate: number | null;
};

/** 列表场景使用的轻量课题结构（不含材料 / 日志 / 评审明细）。 */
export type ProjectSummary = Omit<Project, "materials" | "logs" | "reviews"> & {
  memberCount: number;
};

export type ExpertStatus = "已评" | "待评审" | "已回避";

export type Expert = {
  id: string;
  name: string;
  field: string;
  status: ExpertStatus;
  available: string | null;
};

export type CheckItem = {
  id: number;
  name: string;
  ok: boolean;
};

export type Alert = {
  id: number;
  projectId: string;
  level: Risk;
  title: string;
  owner: string;
};

export type Batch = {
  id: string;
  name: string;
  year: number;
  level: Level;
  status: string;
  applyCount: number;
  passCount: number;
};

export type Todo = {
  id: number;
  title: string;
  due: string;
  done: boolean;
};

export type Policy = {
  id: number;
  title: string;
  level: Level;
  category: string;
  publishDate: string;
  summary: string;
};

export type AnalyticsYear = { year: string; apply: number; approve: number };

export type AnalyticsSubject = { subject: string; count: number };

export type DashboardData = {
  activeCount: number;
  totalCount: number;
  avgCompleteness: number;
  alertCount: number;
  redCount: number;
  amberCount: number;
  alerts: (Alert & { projectTitle: string })[];
  upcoming: ProjectSummary[];
  todos: Todo[];
};

/** 课题申报表单数据（D01/D03）。 */
export type ProjectDraft = {
  title: string;
  leader: string;
  unit: string;
  subject: string;
  level: Level;
  batch: string;
  abstract: string;
  /** 除负责人外的课题组成员 */
  members: string[];
  budgetTotal: number;
  applyYear: number;
};

/** 申报资格校验结果项（D02）。 */
export type EligibilityItem = {
  name: string;
  ok: boolean;
  detail: string;
  /** 不满足时是否阻止提交 */
  blocking: boolean;
};

/** 形式审查队列中的课题状态。 */
export type ReviewQueueStatus = "pending" | "passed" | "returned";

/** 形式审查队列条目（含审查进度与辅助信息）。 */
export type ReviewQueueItem = {
  id: string;
  code: string;
  title: string;
  leader: string;
  unit: string;
  subject: string;
  level: Level;
  batch: string;
  stage: Stage;
  risk: Risk;
  completeness: number;
  lastUpdate: string;
  applyYear: number;
  reviewDecision: ReviewDecision | null;
  reviewReason: string | null;
  reviewAt: string | null;
  /** 已分配专家数 */
  assignedCount: number;
  /** 未提交或已退回的材料数 */
  pendingMaterials: number;
  /** 形式审查环节最近一次 AI 预审结论 */
  aiConclusion: AiConclusion | null;
  aiScore: number | null;
  aiReviewedAt: string | null;
};

/** AI 预审结论。 */
export type AiConclusion = "pass" | "revise" | "reject";

/** AI 预审记录。 */
export type AiReview = {
  id: number;
  projectId: string;
  stage: string;
  /** deepseek | heuristic */
  provider: string;
  model: string;
  conclusion: AiConclusion;
  score: number;
  summary: string;
  risks: string[];
  suggestions: string[];
  createdAt: string;
  createdBy: string;
};

/** 人工复审记录。 */
export type HumanReview = {
  id: number;
  projectId: string;
  stage: string;
  aiReviewId: number | null;
  decision: ReviewDecision;
  /** 人工结论是否与 AI 预审一致 */
  agreesWithAi: boolean;
  comment: string;
  reviewer: string;
  createdAt: string;
};

/** 某个审核环节的完整记录。 */
export type ReviewRecords = {
  ai: AiReview[];
  human: HumanReview[];
};

/** AI 预审结果（未持久化）。 */
export type AiPreReviewResult = {
  provider: string;
  model: string;
  conclusion: AiConclusion;
  score: number;
  summary: string;
  risks: string[];
  suggestions: string[];
};

// ---------------------------------------------------------------- 用户与角色（RBAC）

export type UserStatus = "active" | "disabled";

/** 角色（含权限集合与关联用户数）。 */
export type Role = {
  id: string;
  name: string;
  description: string;
  /** 内置角色不可删除 */
  system: boolean;
  permissions: string[];
  userCount: number;
};

/** 用户列表项。 */
export type User = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  unit: string;
  subject: string | null;
  title: string | null;
  roleId: string;
  roleName: string;
  status: UserStatus;
  lastLogin: string | null;
  createdAt: string;
};

/** 当前登录用户（含权限集合）。 */
export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  unit: string;
  roleId: string;
  roleName: string;
  permissions: string[];
};

export type CreateUserInput = {
  name: string;
  username: string;
  email: string;
  phone: string;
  unit: string;
  subject: string;
  title: string;
  roleId: string;
  status: UserStatus;
};

export type UpdateUserInput = CreateUserInput & { id: string };

/** 身份切换下拉使用的精简用户信息。 */
export type SwitchableUser = {
  id: string;
  name: string;
  roleName: string;
  unit: string;
};
