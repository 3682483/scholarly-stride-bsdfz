/**
 * 初始种子数据（服务端专用）。仅在数据库为空时写入一次。
 */
import type { ExpertStatus, Level, MaterialStatus, Stage, Risk } from "@/lib/types";

export type SeedMaterial = {
  name: string;
  stage: Stage;
  status: MaterialStatus;
  date?: string;
  owner: string;
};

export type SeedLog = {
  time: string;
  actor: string;
  action: string;
  note?: string;
};

export type SeedReview = {
  expert: string;
  score: number;
  comment: string;
  status?: string;
};

export type SeedProject = {
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
  applyYear: number;
  plagiarismRate?: number;
  aigcRate?: number;
  materials: SeedMaterial[];
  logs: SeedLog[];
  reviews?: SeedReview[];
  reviewDecision?: "passed" | "returned";
  reviewReason?: string;
  reviewAt?: string;
};

export const seedProjects: SeedProject[] = [
  {
    id: "KT2024001",
    code: "SH-2024-A017",
    title: "基于双新背景的高中语文大单元教学评价体系构建研究",
    leader: "周雅琴",
    unit: "语文教研组",
    subject: "语文",
    level: "市级",
    batch: "2024年度市级重点课题",
    stage: "中期",
    risk: "amber",
    progress: 62,
    completeness: 83,
    members: ["周雅琴", "李文博", "沈亦然", "郭菲"],
    budget: { total: 80000, used: 41200 },
    nextDue: "2026-10-15 中期报告",
    lastUpdate: "2026-09-02",
    abstract:
      "围绕新课程新教材实施，研究大单元教学的目标设计、任务链与表现性评价工具，形成可推广的评价量表与课例集。",
    applyYear: 2024,
    plagiarismRate: 8.6,
    aigcRate: 21,
    materials: [
      { name: "申报书（终稿）", stage: "申报", status: "已提交", date: "2024-03-11", owner: "周雅琴" },
      { name: "立项通知书", stage: "立项", status: "已提交", date: "2024-05-20", owner: "科研处" },
      { name: "开题报告", stage: "开题", status: "已提交", date: "2024-06-28", owner: "周雅琴" },
      { name: "开题专家意见", stage: "开题", status: "已提交", date: "2024-06-28", owner: "陈立群" },
      { name: "中期研究报告", stage: "中期", status: "待提交", owner: "周雅琴" },
      { name: "课堂观察记录（12节）", stage: "中期", status: "已提交", date: "2026-08-19", owner: "李文博" },
      { name: "经费使用明细", stage: "中期", status: "已退回", date: "2026-08-25", owner: "郭菲" },
    ],
    logs: [
      { time: "2026-09-02 09:14", actor: "周雅琴", action: "上传过程材料", note: "第12节课堂观察记录" },
      { time: "2026-08-25 16:40", actor: "科研处 · 徐敏", action: "退回材料", note: "经费明细缺少发票编号" },
      { time: "2026-08-12 10:02", actor: "陈立群（专家）", action: "线上批注", note: "建议补充评价量表信效度检验" },
      { time: "2026-06-28 14:30", actor: "系统", action: "开题通过", note: "专家组一致通过" },
    ],
    reviews: [
      { expert: "陈立群", score: 88, comment: "问题聚焦，方法可行，建议细化评价工具编制过程。" },
      { expert: "吴海若", score: 84, comment: "样本量偏小，需扩展至跨年级验证。" },
    ],
  },
  {
    id: "KT2025014",
    code: "QU-2025-B043",
    title: "初中数学项目化学习中学生高阶思维发展的课堂证据研究",
    leader: "马承宇",
    unit: "数学教研组",
    subject: "数学",
    level: "区级",
    batch: "2025年度区级一般课题",
    stage: "开题",
    risk: "green",
    progress: 28,
    completeness: 95,
    members: ["马承宇", "钱睿", "白露"],
    budget: { total: 30000, used: 6400 },
    nextDue: "2026-09-30 开题材料归档",
    lastUpdate: "2026-09-16",
    abstract:
      "以项目化学习课堂为场景，采集师生对话与任务成果，建立高阶思维表现的课堂证据编码框架。",
    applyYear: 2025,
    plagiarismRate: 7.2,
    aigcRate: 12,
    materials: [
      { name: "申报书（终稿）", stage: "申报", status: "已提交", date: "2025-04-08", owner: "马承宇" },
      { name: "立项任务书", stage: "立项", status: "已提交", date: "2025-06-02", owner: "科研处" },
      { name: "开题报告", stage: "开题", status: "已提交", date: "2026-09-10", owner: "马承宇" },
      { name: "开题论证纪要", stage: "开题", status: "待提交", owner: "科研处" },
    ],
    logs: [
      { time: "2026-09-16 08:50", actor: "马承宇", action: "提交开题报告修订稿" },
      { time: "2026-09-10 15:20", actor: "科研处 · 徐敏", action: "安排开题论证会", note: "9月24日 14:00 学术报告厅" },
    ],
  },
  {
    id: "KT2023008",
    code: "GJ-2023-C002",
    title: "县域普通高中拔尖创新人才早期培养路径的实践研究",
    leader: "许承业",
    unit: "教育发展与创新研究院",
    subject: "综合",
    level: "国家级",
    batch: "2023年度国家级规划课题",
    stage: "结题",
    risk: "red",
    progress: 91,
    completeness: 71,
    members: ["许承业", "周雅琴", "邓寒", "田小满", "秦岭"],
    budget: { total: 200000, used: 178500 },
    nextDue: "2026-09-25 结题材料截止",
    lastUpdate: "2026-07-21",
    abstract:
      "探索县域高中拔尖创新人才识别、课程供给、导师制与高校衔接的一体化培养路径，形成区域可复制方案。",
    applyYear: 2023,
    plagiarismRate: 11.4,
    aigcRate: 24,
    materials: [
      { name: "结题研究报告", stage: "结题", status: "待提交", owner: "许承业" },
      { name: "成果佐证清单", stage: "结题", status: "待提交", owner: "邓寒" },
      { name: "查重报告", stage: "结题", status: "待提交", owner: "系统" },
      { name: "AIGC检测报告", stage: "结题", status: "待提交", owner: "系统" },
      { name: "中期检查报告", stage: "中期", status: "已提交", date: "2025-05-18", owner: "许承业" },
    ],
    logs: [
      { time: "2026-09-18 07:00", actor: "系统", action: "红色预警", note: "距结题截止 7 天，材料完整率 71%" },
      { time: "2026-07-21 11:15", actor: "许承业", action: "上传成果目录" },
    ],
  },
  {
    id: "KT2026022",
    code: "XX-2026-D118",
    title: "人工智能辅助下的英语写作反馈机制校本实践",
    leader: "叶今朝",
    unit: "英语教研组",
    subject: "英语",
    level: "校级",
    batch: "2026年度校级课题第二批",
    stage: "申报",
    risk: "green",
    progress: 12,
    completeness: 100,
    members: ["叶今朝", "宋亦凡"],
    budget: { total: 12000, used: 0 },
    nextDue: "2026-09-26 专家评审截止",
    lastUpdate: "2026-09-19",
    abstract:
      "研究AI写作反馈在校本英语写作教学中的使用边界与效果，形成人机协同的反馈流程与规范。",
    applyYear: 2026,
    plagiarismRate: 6.2,
    aigcRate: 27,
    materials: [
      { name: "申报书", stage: "申报", status: "已提交", date: "2026-09-08", owner: "叶今朝" },
      { name: "资格校验单", stage: "申报", status: "已提交", date: "2026-09-09", owner: "系统" },
      { name: "形式审查清单", stage: "申报", status: "已提交", date: "2026-09-12", owner: "科研处" },
    ],
    logs: [
      { time: "2026-09-19 13:05", actor: "科研处 · 徐敏", action: "分配评审专家", note: "陈立群、吴海若" },
      { time: "2026-09-12 09:30", actor: "系统", action: "形式审查通过", note: "字数、参考文献、签章齐全" },
    ],
    reviews: [{ expert: "陈立群", score: 82, comment: "校本性强，需明确AI使用合规边界。" }],
  },
  {
    id: "KT2026023",
    code: "XX-2026-D119",
    title: "小学科学跨学科主题学习的课例开发与形成性评价研究",
    leader: "范知秋",
    unit: "科学教研组",
    subject: "科学",
    level: "校级",
    batch: "2026年度校级课题第二批",
    stage: "申报",
    risk: "amber",
    progress: 8,
    completeness: 92,
    members: ["范知秋", "杜维", "汪清"],
    budget: { total: 15000, used: 0 },
    nextDue: "2026-09-28 形式审查截止",
    lastUpdate: "2026-09-20",
    abstract:
      "围绕跨学科主题学习开发课例并建立形成性评价工具，沉淀可复用的课例库与课堂证据。",
    applyYear: 2026,
    plagiarismRate: 9.1,
    aigcRate: 18,
    materials: [
      { name: "申报书", stage: "申报", status: "已提交", date: "2026-09-14", owner: "范知秋" },
      { name: "资格校验单", stage: "申报", status: "已提交", date: "2026-09-15", owner: "系统" },
      { name: "查重报告", stage: "申报", status: "已提交", date: "2026-09-16", owner: "系统" },
    ],
    logs: [{ time: "2026-09-20 10:12", actor: "范知秋", action: "提交申报材料" }],
  },
  {
    id: "KT2025031",
    code: "QU-2025-B079",
    title: "小学科学跨学科主题学习的课例开发与评价研究",
    leader: "范知秋",
    unit: "科学教研组",
    subject: "科学",
    level: "区级",
    batch: "2025年度区级一般课题",
    stage: "中期",
    risk: "amber",
    progress: 55,
    completeness: 76,
    members: ["范知秋", "杜维"],
    budget: { total: 25000, used: 9800 },
    nextDue: "2026-10-20 中期检查",
    lastUpdate: "2026-06-30",
    abstract: "开发跨学科主题课例并建立配套评价工具，沉淀可复用的课例库与反思记录。",
    applyYear: 2025,
    plagiarismRate: 8.9,
    aigcRate: 19,
    materials: [
      { name: "开题报告", stage: "开题", status: "已提交", date: "2025-09-12", owner: "范知秋" },
      { name: "课例集（阶段稿）", stage: "中期", status: "已提交", date: "2026-06-30", owner: "杜维" },
      { name: "中期研究报告", stage: "中期", status: "待提交", owner: "范知秋" },
    ],
    logs: [{ time: "2026-09-15 07:00", actor: "系统", action: "黄色预警", note: "超过 75 天未更新过程材料" }],
  },
  {
    id: "KT2022005",
    code: "SH-2022-A004",
    title: "学校课程图谱建设与五年规划衔接机制研究",
    leader: "邓寒",
    unit: "课程教学部",
    subject: "综合",
    level: "市级",
    batch: "2022年度市级一般课题",
    stage: "归档",
    risk: "green",
    progress: 100,
    completeness: 100,
    members: ["邓寒", "秦岭"],
    budget: { total: 60000, used: 59300 },
    nextDue: "已完成",
    lastUpdate: "2026-01-12",
    abstract: "构建学校课程图谱，并与五年规划目标、年度任务、部门责任形成衔接机制。",
    applyYear: 2022,
    plagiarismRate: 5.4,
    aigcRate: 9,
    materials: [
      { name: "结题报告", stage: "结题", status: "已提交", date: "2025-12-20", owner: "邓寒" },
      { name: "结题证书", stage: "归档", status: "已提交", date: "2026-01-12", owner: "科研处" },
      { name: "一题一档（打包）", stage: "归档", status: "已提交", date: "2026-01-12", owner: "系统" },
    ],
    logs: [{ time: "2026-01-12 16:00", actor: "系统", action: "自动归档", note: "生成一题一档压缩包" }],
  },
];

export const seedBatches = [
  { id: "B2026-2", name: "2026年度校级课题第二批", year: 2026, level: "校级" as Level, status: "申报评审中", applyCount: 24, passCount: 21 },
  { id: "B2026-1", name: "2026年度校级课题第一批", year: 2026, level: "校级" as Level, status: "已立项", applyCount: 19, passCount: 16 },
  { id: "B2025-1", name: "2025年度区级一般课题", year: 2025, level: "区级" as Level, status: "已立项", applyCount: 58, passCount: 29 },
  { id: "B2024-1", name: "2024年度市级重点课题", year: 2024, level: "市级" as Level, status: "已立项", applyCount: 51, passCount: 24 },
  { id: "B2023-1", name: "2023年度国家级规划课题", year: 2023, level: "国家级" as Level, status: "已结题", applyCount: 44, passCount: 19 },
  { id: "B2022-1", name: "2022年度市级一般课题", year: 2022, level: "市级" as Level, status: "已归档", applyCount: 38, passCount: 14 },
];

export const seedExperts: { id: string; name: string; field: string; status: ExpertStatus; available: string | null }[] = [
  { id: "E001", name: "陈立群", field: "课程与教学论", status: "已评", available: "周二、周四下午" },
  { id: "E002", name: "吴海若", field: "教育测量与评价", status: "待评审", available: "周三全天" },
  { id: "E003", name: "沈砚", field: "学科教育（英语）", status: "已回避", available: null },
  { id: "E004", name: "郑澜", field: "教育技术学", status: "待评审", available: "周一、周五上午" },
  { id: "E005", name: "何思远", field: "教师专业发展", status: "待评审", available: "周四下午" },
];

export const seedChecks = [
  { name: "负责人职称符合要求", ok: 1 },
  { name: "在研课题不超过 2 项（限项）", ok: 1 },
  { name: "申报书字数 ≥ 5000 字", ok: 1 },
  { name: "参考文献格式规范", ok: 0 },
  { name: "签字盖章页齐全", ok: 1 },
  { name: "查重率 < 20%", ok: 1 },
  { name: "AIGC 比例 < 30%", ok: 0 },
];

export const seedTodos = [
  { title: "形式审查：AI辅助英语写作反馈机制", due: "今日截止", done: 0 },
  { title: "分配评审专家：2026校级第二批（3项）", due: "9月26日", done: 0 },
  { title: "复核退回材料：经费使用明细", due: "待提交", done: 0 },
  { title: "排期开题论证会：初中数学项目化学习", due: "9月24日", done: 0 },
  { title: "催办结题材料：县域拔尖创新人才", due: "逾期风险", done: 0 },
];

export const seedPolicies = [
  {
    title: "关于组织申报 2026 年度校级教育科研课题的通知",
    level: "校级" as Level,
    category: "申报指南",
    publishDate: "2026-09-01",
    summary: "明确本年度校级课题申报方向、名额分配、材料要求与时间节点，重点支持 AI 赋能教学与跨学科主题学习。",
  },
  {
    title: "市教育科学规划课题管理办法（试行）",
    level: "市级" as Level,
    category: "管理办法",
    publishDate: "2026-06-18",
    summary: "规范市级课题申报、评审、中期检查、结题与经费使用流程，强化过程性材料与学术诚信要求。",
  },
  {
    title: "新时代基础教育科研高质量发展指导意见",
    level: "国家级" as Level,
    category: "政策文件",
    publishDate: "2026-03-05",
    summary: "提出以真实问题为导向、以证据链为支撑的科研范式转型要求，强调成果转化与教师专业发展。",
  },
  {
    title: "关于加强学术诚信与 AIGC 使用规范的提示",
    level: "区级" as Level,
    category: "学术诚信",
    publishDate: "2026-08-12",
    summary: "要求申报与结题前完成查重与 AIGC 检测，AI 生成内容需人工复核并留痕，AIGC 比例原则上不超过 30%。",
  },
  {
    title: "2026 年度区级课题中期检查工作安排",
    level: "区级" as Level,
    category: "过程管理",
    publishDate: "2026-09-10",
    summary: "公布中期检查时间表、材料清单与评价要点，未按时提交过程材料的课题将纳入预警管理。",
  },
];

export const seedAlerts = [
  { projectId: "KT2023008", level: "red" as Risk, title: "结题材料缺失 4 项，距截止 7 天", owner: "许承业" },
  { projectId: "KT2025031", level: "amber" as Risk, title: "过程材料 75 天未更新", owner: "范知秋" },
  { projectId: "KT2024001", level: "amber" as Risk, title: "经费明细被退回，待重新提交", owner: "郭菲" },
];

export type SeedUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  unit: string;
  subject: string | null;
  title: string;
  roleId: string;
  status: "active" | "disabled";
  lastLogin: string | null;
};

export const seedUsers: SeedUser[] = [
  {
    id: "U0001",
    name: "王砚舟",
    username: "admin",
    email: "admin@school.edu.cn",
    phone: "13800000001",
    unit: "信息化办公室",
    subject: null,
    title: "高级工程师",
    roleId: "super_admin",
    status: "active",
    lastLogin: "2026-09-21 08:30",
  },
  {
    id: "U0002",
    name: "徐敏",
    username: "xumin",
    email: "xumin@school.edu.cn",
    phone: "13800000002",
    unit: "科研处",
    subject: null,
    title: "助理研究员",
    roleId: "research_admin",
    status: "active",
    lastLogin: "2026-09-20 16:05",
  },
  {
    id: "U0003",
    name: "邓寒",
    username: "denghan",
    email: "denghan@school.edu.cn",
    phone: "13800000003",
    unit: "课程教学部",
    subject: "综合",
    title: "高级教师",
    roleId: "leader",
    status: "active",
    lastLogin: "2026-09-19 09:12",
  },
  {
    id: "U0004",
    name: "周雅琴",
    username: "zhouyq",
    email: "zhouyq@school.edu.cn",
    phone: "13800000004",
    unit: "语文教研组",
    subject: "语文",
    title: "中学高级",
    roleId: "principal",
    status: "active",
    lastLogin: "2026-09-02 09:14",
  },
  {
    id: "U0005",
    name: "许承业",
    username: "xuchy",
    email: "xuchy@school.edu.cn",
    phone: "13800000005",
    unit: "教育发展与创新研究院",
    subject: "综合",
    title: "研究员",
    roleId: "principal",
    status: "active",
    lastLogin: "2026-07-21 11:15",
  },
  {
    id: "U0006",
    name: "马承宇",
    username: "machengyu",
    email: "machengyu@school.edu.cn",
    phone: "13800000006",
    unit: "数学教研组",
    subject: "数学",
    title: "中学一级",
    roleId: "principal",
    status: "active",
    lastLogin: "2026-09-16 08:50",
  },
  {
    id: "U0007",
    name: "陈立群",
    username: "chenlq",
    email: "chenlq@univ.edu.cn",
    phone: "13800000007",
    unit: "课程与教学论",
    subject: "综合",
    title: "教授",
    roleId: "expert",
    status: "active",
    lastLogin: "2026-09-19 13:05",
  },
  {
    id: "U0008",
    name: "吴海若",
    username: "wuhr",
    email: "wuhr@univ.edu.cn",
    phone: "13800000008",
    unit: "教育测量与评价",
    subject: "综合",
    title: "副教授",
    roleId: "expert",
    status: "active",
    lastLogin: null,
  },
  {
    id: "U0009",
    name: "叶今朝",
    username: "yejz",
    email: "yejz@school.edu.cn",
    phone: "13800000009",
    unit: "英语教研组",
    subject: "英语",
    title: "中学一级",
    roleId: "teacher",
    status: "active",
    lastLogin: "2026-09-19 13:02",
  },
  {
    id: "U0010",
    name: "范知秋",
    username: "fanzq",
    email: "fanzq@school.edu.cn",
    phone: "13800000010",
    unit: "科学教研组",
    subject: "科学",
    title: "中学二级",
    roleId: "teacher",
    status: "disabled",
    lastLogin: "2026-06-30 10:00",
  },
];

/** 原型阶段默认登录用户（总管理员）。 */
export const DEFAULT_CURRENT_USER_ID = "U0001";
