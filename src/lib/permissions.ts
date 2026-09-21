/**
 * 角色与权限模型（同构）。
 * 权限以「模块:动作」编码，角色默认权限在此集中定义，后台可在线调整。
 */

export type PermissionItem = {
  code: string;
  label: string;
  description: string;
};

export type PermissionGroup = {
  group: string;
  items: PermissionItem[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: "工作台",
    items: [
      { code: "dashboard:view", label: "查看工作台", description: "查看全局态势、预警与待办" },
    ],
  },
  {
    group: "课题管理",
    items: [
      { code: "project:view", label: "查看课题", description: "查看课题库、课题详情与一题一档" },
      { code: "project:create", label: "申报课题", description: "提交新的课题申报" },
      { code: "project:edit", label: "编辑课题", description: "修改课题基本信息" },
      { code: "project:export", label: "导出档案", description: "导出一题一档压缩档案" },
      { code: "material:manage", label: "材料管理", description: "确认提交 / 退回佐证材料" },
      { code: "stage:advance", label: "阶段推进", description: "推进课题至下一阶段" },
    ],
  },
  {
    group: "申报与评审",
    items: [
      { code: "batch:create", label: "新建申报批次", description: "创建申报批次" },
      { code: "review:form", label: "形式审查", description: "开展形式审查并作出结论" },
      { code: "review:assign", label: "分配评审专家", description: "为课题分配评审专家" },
      { code: "ai:review", label: "AI 预审", description: "使用 AI 预审并做人工复审" },
    ],
  },
  {
    group: "统计与情报",
    items: [
      { code: "analytics:view", label: "查看统计分析", description: "查看立项、学科与过程监控" },
      { code: "policy:view", label: "查看政策库", description: "查看政策文件与前沿情报" },
    ],
  },
  {
    group: "系统管理",
    items: [
      { code: "audit:view", label: "操作留痕", description: "查看全过程操作留痕" },
      { code: "user:manage", label: "用户管理", description: "新增、编辑、启用停用用户" },
      { code: "role:manage", label: "角色权限", description: "配置各角色的权限矩阵" },
    ],
  },
];

export const ALL_PERMISSIONS: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.items.map((i) => i.code),
);

export const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => [i.code, i.label])),
);

export type RoleDef = {
  id: string;
  name: string;
  description: string;
  /** 内置角色不可删除 */
  system: boolean;
  permissions: string[];
};

/** 系统内置的六个角色及其默认权限。 */
export const ROLE_DEFS: RoleDef[] = [
  {
    id: "super_admin",
    name: "总管理员",
    description: "系统最高权限：全部业务操作 + 用户与角色管理",
    system: true,
    permissions: ALL_PERMISSIONS,
  },
  {
    id: "research_admin",
    name: "科研处专员",
    description: "组织申报评审、形式审查、专家分配、过程管理与统计分析",
    system: true,
    permissions: [
      "dashboard:view",
      "project:view",
      "project:create",
      "project:edit",
      "project:export",
      "material:manage",
      "stage:advance",
      "batch:create",
      "review:form",
      "review:assign",
      "ai:review",
      "analytics:view",
      "policy:view",
      "audit:view",
    ],
  },
  {
    id: "leader",
    name: "校领导 / 院领导",
    description: "查看科研态势、规划执行与决策分析（以只读为主）",
    system: true,
    permissions: [
      "dashboard:view",
      "project:view",
      "project:export",
      "analytics:view",
      "policy:view",
      "audit:view",
    ],
  },
  {
    id: "principal",
    name: "课题负责人",
    description: "申报课题、提交过程材料、推进阶段与成果归档",
    system: true,
    permissions: [
      "dashboard:view",
      "project:view",
      "project:create",
      "project:export",
      "material:manage",
      "policy:view",
      "ai:review",
    ],
  },
  {
    id: "expert",
    name: "评审 / 指导专家",
    description: "在线评审、批注与指导，查看被分配的课题",
    system: true,
    permissions: ["dashboard:view", "project:view", "ai:review"],
  },
  {
    id: "teacher",
    name: "教师",
    description: "选题、申报、教学反思与课堂数据采集",
    system: true,
    permissions: ["dashboard:view", "project:view", "project:create", "policy:view"],
  },
];

export const ROLE_NAME: Record<string, string> = Object.fromEntries(
  ROLE_DEFS.map((r) => [r.id, r.name]),
);
