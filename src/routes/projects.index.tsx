import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Progress, RiskDot, StageTrack, Tag } from "@/components/ui-bits";
import { useAuth } from "@/lib/auth";
import { STAGES, type EligibilityItem, type Level, type ProjectDraft } from "@/lib/types";
import {
  checkEligibilityFn,
  createBatchFn,
  createProjectFn,
  listBatchesFn,
  listProjectsFn,
} from "@/api/projects";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "课题库 · 全生命周期管理" },
      {
        name: "description",
        content: "按阶段、层级、学科筛选课题，查看进度、材料完整率与风险灯，一题一档可追溯。",
      },
      { property: "og:title", content: "课题库 · 全生命周期管理" },
      {
        property: "og:description",
        content: "按阶段、层级、学科筛选课题，查看进度、材料完整率与风险灯。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    const [projects, batches] = await Promise.all([listProjectsFn(), listBatchesFn()]);
    return { projects, batches };
  },
  component: ProjectList,
});

const levels = ["全部", "国家级", "市级", "区级", "校级"] as const;
const batchLevels: Level[] = ["国家级", "市级", "区级", "校级"];
const subjectOptions = ["语文", "数学", "英语", "科学", "综合", "艺体", "道德与法治", "体育与健康"];

type ApplyForm = {
  title: string;
  leader: string;
  unit: string;
  subject: string;
  level: Level;
  batch: string;
  members: string;
  budgetTotal: string;
  applyYear: string;
  abstract: string;
};

const emptyForm = (level: Level, batch: string): ApplyForm => ({
  title: "",
  leader: "",
  unit: "",
  subject: "语文",
  level,
  batch,
  members: "",
  budgetTotal: "15000",
  applyYear: String(new Date().getFullYear()),
  abstract: "",
});

function ProjectList() {
  const { projects, batches } = Route.useLoaderData();
  const router = useRouter();
  const { can } = useAuth();
  const [stage, setStage] = useState<string>("全部");
  const [level, setLevel] = useState<string>("全部");
  const [q, setQ] = useState("");

  // 新建申报批次
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [batchYear, setBatchYear] = useState("2026");
  const [batchLevel, setBatchLevel] = useState<Level>("校级");

  // 课题申报
  const [applyOpen, setApplyOpen] = useState(false);
  const [form, setForm] = useState<ApplyForm>(() => emptyForm("校级", ""));
  const [eligibility, setEligibility] = useState<EligibilityItem[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const list = projects.filter(
    (p) =>
      (stage === "全部" || p.stage === stage) &&
      (level === "全部" || p.level === level) &&
      (q.trim() === "" ||
        p.title.includes(q.trim()) ||
        p.leader.includes(q.trim()) ||
        p.code.toLowerCase().includes(q.trim().toLowerCase())),
  );

  const batchOptions = batches.filter((b) => b.level === form.level);

  const setField = <K extends keyof ApplyForm>(key: K, value: ApplyForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const changeLevel = (lvl: Level) => {
    const opts = batches.filter((b) => b.level === lvl);
    setForm((prev) => ({ ...prev, level: lvl, batch: opts[0]?.name ?? "" }));
  };

  const openApply = () => {
    const lvl: Level = "校级";
    const opts = batches.filter((b) => b.level === lvl);
    setForm(emptyForm(lvl, opts[0]?.name ?? ""));
    setEligibility(null);
    setApplyOpen(true);
  };

  const buildDraft = (): ProjectDraft => ({
    title: form.title.trim(),
    leader: form.leader.trim(),
    unit: form.unit.trim(),
    subject: form.subject,
    level: form.level,
    batch: form.batch,
    abstract: form.abstract.trim(),
    members: form.members
      .split(/[,，、;；\s]+/)
      .map((m) => m.trim())
      .filter(Boolean),
    budgetTotal: Number(form.budgetTotal) || 0,
    applyYear: Number(form.applyYear) || new Date().getFullYear(),
  });

  const runCheck = async () => {
    setChecking(true);
    try {
      setEligibility(await checkEligibilityFn({ data: buildDraft() }));
    } catch {
      toast.error("资格校验失败，请稍后重试");
    } finally {
      setChecking(false);
    }
  };

  const submitApply = async () => {
    const draft = buildDraft();
    if (!draft.title) {
      toast.error("请填写课题名称");
      return;
    }
    if (!draft.leader) {
      toast.error("请填写课题负责人");
      return;
    }
    if (!draft.batch) {
      toast.error("请选择申报批次（可先在「新建申报批次」中创建）");
      return;
    }
    if (!draft.abstract) {
      toast.error("请填写研究摘要");
      return;
    }

    setSubmitting(true);
    try {
      const id = await createProjectFn({ data: draft });
      toast.success(`课题申报已提交（编号 ${id}）`, {
        description: "已进入形式审查环节，可在「申报与评审」中查看。",
      });
      setApplyOpen(false);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "提交失败，请检查资格校验结果");
    } finally {
      setSubmitting(false);
    }
  };

  const submitBatch = async () => {
    const name = batchName.trim();
    const year = Number(batchYear);
    if (!name) {
      toast.error("请填写批次名称");
      return;
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      toast.error("请填写有效的年份");
      return;
    }

    setSaving(true);
    try {
      await createBatchFn({ data: { name, year, level: batchLevel } });
      toast.success(`申报批次「${name}」已创建`);
      setBatchOpen(false);
      setBatchName("");
      await router.invalidate();
    } catch {
      toast.error("创建批次失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="课题库"
      subtitle="申报 → 评审 → 立项 → 开题 → 中期 → 结题 → 归档"
      actions={
        <>
          <button
            onClick={() => setBatchOpen(true)}
            disabled={!can("batch:create")}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            新建申报批次
          </button>
          <button
            onClick={openApply}
            disabled={!can("project:create")}
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            申报课题
          </button>
        </>
      }
    >
      <div className="card-surface mb-4 flex flex-wrap items-center gap-3 px-4 py-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索课题名称 / 负责人 / 编号"
          className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
        />
        <div className="flex flex-wrap gap-1">
          {["全部", ...STAGES].map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`rounded px-2.5 py-1 text-xs ${
                stage === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
        >
          {levels.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">共 {list.length} 项</span>
      </div>

      <div className="space-y-3">
        {list.map((p) => (
          <Link
            key={p.id}
            to="/projects/$projectId"
            params={{ projectId: p.id }}
            className="card-surface block px-4 py-4 transition-colors hover:border-primary/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="accent">{p.level}</Tag>
              <Tag>{p.subject}</Tag>
              <span className="text-xs text-muted-foreground">{p.code}</span>
              <span className="ml-auto">
                <RiskDot risk={p.risk} />
              </span>
            </div>
            <h3 className="mt-2 text-base font-medium">{p.title}</h3>
            <div className="mt-1 text-xs text-muted-foreground">
              负责人 {p.leader} · {p.unit} · {p.batch}
            </div>
            <div className="mt-3">
              <StageTrack current={p.stage} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <div className="mb-1 text-xs text-muted-foreground">研究进度 {p.progress}%</div>
                <Progress value={p.progress} />
              </div>
              <div>
                <div className="mb-1 text-xs text-muted-foreground">
                  材料完整率 {p.completeness}%
                </div>
                <Progress value={p.completeness} />
              </div>
              <div className="text-xs text-muted-foreground sm:text-right">
                下一节点：{p.nextDue}
                <br />
                最近更新：{p.lastUpdate}
              </div>
            </div>
          </Link>
        ))}
        {list.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            没有匹配的课题，试试调整筛选条件。
          </p>
        ) : null}
      </div>

      {/* ============================ 申报课题 ============================ */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>课题申报</DialogTitle>
            <DialogDescription>
              填写申报信息并通过资格校验后提交，提交后进入形式审查环节。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="mb-1.5 text-xs text-muted-foreground">课题名称 *</div>
              <Input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="例如：AI 辅助下的小学数学个性化作业设计研究"
              />
            </div>

            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">课题负责人 *</div>
              <Input
                value={form.leader}
                onChange={(e) => setField("leader", e.target.value)}
                placeholder="姓名"
              />
            </div>

            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">所属单位 / 教研组</div>
              <Input
                value={form.unit}
                onChange={(e) => setField("unit", e.target.value)}
                placeholder="例如：数学教研组"
              />
            </div>

            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">学科</div>
              <select
                value={form.subject}
                onChange={(e) => setField("subject", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {subjectOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">课题层级</div>
              <select
                value={form.level}
                onChange={(e) => changeLevel(e.target.value as Level)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {batchLevels.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <div className="mb-1.5 text-xs text-muted-foreground">申报批次 *</div>
              <select
                value={form.batch}
                onChange={(e) => setField("batch", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">请选择批次</option>
                {batchOptions.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
              {batchOptions.length === 0 ? (
                <p className="mt-1 text-xs text-warn-foreground">
                  当前层级暂无批次，请先点击右上角「新建申报批次」。
                </p>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <div className="mb-1.5 text-xs text-muted-foreground">
                课题组成员（用逗号分隔，不含负责人）
              </div>
              <Input
                value={form.members}
                onChange={(e) => setField("members", e.target.value)}
                placeholder="例如：钱睿，白露"
              />
            </div>

            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">申请经费（元）</div>
              <Input
                value={form.budgetTotal}
                onChange={(e) => setField("budgetTotal", e.target.value)}
                inputMode="numeric"
              />
            </div>

            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">申报年度</div>
              <Input
                value={form.applyYear}
                onChange={(e) => setField("applyYear", e.target.value)}
                inputMode="numeric"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="mb-1.5 text-xs text-muted-foreground">研究摘要 / 研究内容 *</div>
              <Textarea
                value={form.abstract}
                onChange={(e) => setField("abstract", e.target.value)}
                placeholder="简述研究问题、目标、方法与预期成果（建议不少于 100 字）"
                className="min-h-[120px]"
              />
              <div className="mt-1 text-right text-xs text-muted-foreground">
                {form.abstract.trim().length} 字
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">申报资格校验</span>
              <button
                type="button"
                onClick={runCheck}
                disabled={checking}
                className="rounded border border-border px-2.5 py-1 text-xs hover:bg-secondary disabled:opacity-50"
              >
                {checking ? "校验中…" : "运行校验"}
              </button>
            </div>
            {eligibility ? (
              <ul className="mt-2 space-y-1.5 text-xs">
                {eligibility.map((item) => (
                  <li key={item.name} className="flex items-center gap-2">
                    <span
                      className={
                        item.ok
                          ? "text-ok"
                          : item.blocking
                            ? "text-destructive"
                            : "text-warn-foreground"
                      }
                    >
                      {item.ok ? "✓" : "✕"}
                    </span>
                    <span className="min-w-0 flex-1">{item.name}</span>
                    <span className="text-muted-foreground">{item.detail}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                尚未校验。建议先运行校验，避免提交时被限项或重复选题拦截。
              </p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setApplyOpen(false)}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={submitApply}
              disabled={submitting}
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "提交中…" : "提交申报"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================ 新建申报批次 ============================ */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建申报批次</DialogTitle>
            <DialogDescription>创建后即可在该批次下申报课题。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">批次名称</div>
              <Input
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="例如：2026 年度校级课题第三批"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 text-xs text-muted-foreground">年度</div>
                <Input
                  value={batchYear}
                  onChange={(e) => setBatchYear(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div>
                <div className="mb-1.5 text-xs text-muted-foreground">层级</div>
                <select
                  value={batchLevel}
                  onChange={(e) => setBatchLevel(e.target.value as Level)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {batchLevels.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setBatchOpen(false)}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={submitBatch}
              disabled={saving}
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "创建中…" : "创建批次"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
