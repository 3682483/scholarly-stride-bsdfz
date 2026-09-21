export type Stage =
  | "申报"
  | "评审"
  | "立项"
  | "开题"
  | "中期"
  | "结题"
  | "归档";

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

export type Material = {
  name: string;
  stage: Stage;
  status: "已提交" | "待提交" | "已退回";
  date?: string;
  owner: string;
};

export type LogEntry = {
  time: string;
  actor: string;
  action: string;
  note?: string;
};

export type Project = {
  id: string;
  code: string;
  title: string;
  leader: string;
  unit: string;
  subject: string;
  level: "国家级" | "市级" | "区级" | "校级";
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
  reviews?: { expert: string; score: number; comment: string }[];
};

export const projects: Project[] = [
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
    batch: "2026年度校级课题（申报中）",
    stage: "评审",
    risk: "green",
    progress: 12,
    completeness: 100,
    members: ["叶今朝", "宋亦凡"],
    budget: { total: 12000, used: 0 },
    nextDue: "2026-09-26 专家评审截止",
    lastUpdate: "2026-09-19",
    abstract:
      "研究AI写作反馈在校本英语写作教学中的使用边界与效果，形成人机协同的反馈流程与规范。",
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
    materials: [
      { name: "开题报告", stage: "开题", status: "已提交", date: "2025-09-12", owner: "范知秋" },
      { name: "课例集（阶段稿）", stage: "中期", status: "已提交", date: "2026-06-30", owner: "杜维" },
      { name: "中期研究报告", stage: "中期", status: "待提交", owner: "范知秋" },
    ],
    logs: [
      { time: "2026-09-15 07:00", actor: "系统", action: "黄色预警", note: "超过 75 天未更新过程材料" },
    ],
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
    materials: [
      { name: "结题报告", stage: "结题", status: "已提交", date: "2025-12-20", owner: "邓寒" },
      { name: "结题证书", stage: "归档", status: "已提交", date: "2026-01-12", owner: "科研处" },
      { name: "一题一档（打包）", stage: "归档", status: "已提交", date: "2026-01-12", owner: "系统" },
    ],
    logs: [{ time: "2026-01-12 16:00", actor: "系统", action: "自动归档", note: "生成一题一档压缩包" }],
  },
];

export const riskLabel: Record<Risk, string> = {
  green: "正常",
  amber: "关注",
  red: "预警",
};

export const alerts = [
  {
    projectId: "KT2023008",
    level: "red" as Risk,
    title: "结题材料缺失 4 项，距截止 7 天",
    owner: "许承业",
  },
  {
    projectId: "KT2025031",
    level: "amber" as Risk,
    title: "过程材料 75 天未更新",
    owner: "范知秋",
  },
  {
    projectId: "KT2024001",
    level: "amber" as Risk,
    title: "经费明细被退回，待重新提交",
    owner: "郭菲",
  },
];

export function getProject(id: string) {
  return projects.find((p) => p.id === id);
}
