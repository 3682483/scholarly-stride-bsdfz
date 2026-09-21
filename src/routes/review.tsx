import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ReviewWorkflow } from "@/components/ReviewWorkflow";
import { SectionCard, Tag } from "@/components/ui-bits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import type { AiConclusion, ReviewQueueItem, ReviewQueueStatus } from "@/lib/types";
import {
  assignExpertsFn,
  getReviewBoardFn,
  reopenReviewFn,
  setCheckResultFn,
} from "@/api/review";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "申报与评审 · 形式审查与专家分配" },
      {
        name: "description",
        content: "申报批次管理、资格校验与形式审查清单、专家分配与评分汇总，评审全过程留痕。",
      },
      { property: "og:title", content: "申报与评审 · 形式审查与专家分配" },
      {
        property: "og:description",
        content: "资格校验、形式审查清单、专家分配与评分汇总。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => await getReviewBoardFn(),
  component: ReviewPage,
});

const statusMeta: Record<ReviewQueueStatus, { label: string; tone: "warn" | "ok" | "danger" }> = {
  pending: { label: "待审查", tone: "warn" },
  passed: { label: "已通过", tone: "ok" },
  returned: { label: "已退回", tone: "danger" },
};

const aiMeta: Record<AiConclusion, { label: string; tone: "ok" | "warn" | "danger" }> = {
  pass: { label: "AI 建议通过", tone: "ok" },
  revise: { label: "AI 建议修改", tone: "warn" },
  reject: { label: "AI 建议不通过", tone: "danger" },
};

const levels = ["全部", "国家级", "市级", "区级", "校级"];
const sortOptions = [
  { value: "recent", label: "按最近更新" },
  { value: "completeness", label: "按完整率（低→高）" },
  { value: "title", label: "按课题名称" },
];

const statusOf = (item: ReviewQueueItem): ReviewQueueStatus => item.reviewDecision ?? "pending";

export function ReviewPage() {
  const board = Route.useLoaderData();
  const router = useRouter();
  const { queue, checks, experts, assignments } = board;
  const { can } = useAuth();
  const canReview = can("review:form");
  const canAssign = can("review:assign");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<ReviewQueueStatus>("pending");
  const [q, setQ] = useState("");
  const [levelFilter, setLevelFilter] = useState("全部");
  const [sort, setSort] = useState("recent");
  const [assignOpen, setAssignOpen] = useState(false);
  const [chosenExperts, setChosenExperts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopening, setReopening] = useState(false);

  const pending = queue.filter((i) => statusOf(i) === "pending");
  const passed = queue.filter((i) => statusOf(i) === "passed");
  const returned = queue.filter((i) => statusOf(i) === "returned");
  const groups: Record<ReviewQueueStatus, ReviewQueueItem[]> = { pending, passed, returned };

  const keyword = q.trim().toLowerCase();
  const list = groups[tab]
    .filter(
      (i) =>
        (levelFilter === "全部" || i.level === levelFilter) &&
        (keyword === "" ||
          i.title.toLowerCase().includes(keyword) ||
          i.leader.toLowerCase().includes(keyword) ||
          i.code.toLowerCase().includes(keyword)),
    )
    .sort((a, b) => {
      if (sort === "completeness") return a.completeness - b.completeness;
      if (sort === "title") return a.title.localeCompare(b.title, "zh-Hans-CN");
      return b.lastUpdate.localeCompare(a.lastUpdate);
    });

  const current = list.find((i) => i.id === selectedId) ?? list[0] ?? null;
  const isProcessed = current !== null && current.reviewDecision !== null;
  const failed = checks.filter((c) => !c.ok);
  const currentAssignments = current ? (assignments[current.id] ?? []) : [];

  const openAssign = () => {
    if (!current) return;
    setChosenExperts(currentAssignments);
    setAssignOpen(true);
  };

  const saveAssign = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await assignExpertsFn({ data: { projectId: current.id, expertIds: chosenExperts } });
      toast.success(`已为《${current.title}》分配 ${chosenExperts.length} 位评审专家`);
      setAssignOpen(false);
      await router.invalidate();
    } catch {
      toast.error("分配专家失败");
    } finally {
      setBusy(false);
    }
  };

  const handleReopen = async () => {
    if (!current) return;
    setReopening(true);
    try {
      await reopenReviewFn({ data: { projectId: current.id } });
      toast.success(`《${current.title}》已撤回审查结论，重新进入待审查`);
      setReopenOpen(false);
      setSelectedId(null);
      setTab("pending");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "撤回失败");
    } finally {
      setReopening(false);
    }
  };

  const toggleCheck = async (checkId: number, next: boolean) => {
    try {
      await setCheckResultFn({ data: { checkId, ok: next } });
      await router.invalidate();
    } catch {
      toast.error("更新审查结果失败");
    }
  };

  return (
    <AppShell
      title="申报与评审"
      subtitle={`待审查 ${pending.length} 项 · 已通过 ${passed.length} 项 · 已退回 ${returned.length} 项`}
      actions={
        <button
          onClick={openAssign}
          disabled={!current || !canAssign}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          批量分配专家
        </button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="申报审查队列">
          {/* 状态分页 */}
          <div className="flex flex-wrap gap-1">
            {(Object.keys(statusMeta) as ReviewQueueStatus[]).map((key) => {
              const count = groups[key].length;
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setTab(key);
                    setSelectedId(null);
                  }}
                  className={`rounded px-2.5 py-1 text-xs ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {statusMeta[key].label} {count}
                </button>
              );
            })}
          </div>

          {/* 搜索与筛选 */}
          <div className="mt-3 space-y-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索课题名称 / 负责人 / 编号"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
            <div className="flex flex-wrap gap-2">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
              >
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l === "全部" ? "全部层级" : l}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              共 {list.length} 条{list.length !== groups[tab].length ? `（筛选自 ${groups[tab].length} 条）` : ""}
            </div>
          </div>

          {/* 列表 */}
          <ul className="mt-2 space-y-2">
            {list.map((item) => {
              const status = statusOf(item);
              const active = current?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-md border px-3 py-2.5 text-left text-sm ${
                      active ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                    }`}
                  >
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="min-w-0 flex-1 font-medium">{item.title}</span>
                      <Tag tone={statusMeta[status].tone}>{statusMeta[status].label}</Tag>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.leader} · {item.unit} · {item.level} · {item.code}
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1">
                      <Tag tone={item.completeness >= 90 ? "ok" : "warn"}>
                        完整率 {item.completeness}%
                      </Tag>
                      {item.pendingMaterials > 0 ? (
                        <Tag tone="danger">待补材料 {item.pendingMaterials}</Tag>
                      ) : null}
                      {item.aiConclusion ? (
                        <Tag tone={aiMeta[item.aiConclusion].tone}>
                          {aiMeta[item.aiConclusion].label} {item.aiScore ?? "-"} 分
                        </Tag>
                      ) : (
                        <Tag tone="muted">未 AI 预审</Tag>
                      )}
                      {item.assignedCount > 0 ? (
                        <Tag tone="primary">专家 {item.assignedCount}</Tag>
                      ) : null}
                    </span>
                    <span className="mt-1.5 block text-xs text-muted-foreground">
                      {item.reviewAt
                        ? `审查时间 ${item.reviewAt}`
                        : `最近更新 ${item.lastUpdate} · ${item.batch}`}
                    </span>
                  </button>
                </li>
              );
            })}
            {list.length === 0 ? (
              <li className="py-10 text-center text-sm text-muted-foreground">
                {keyword || levelFilter !== "全部"
                  ? "没有匹配的课题，试试调整搜索或筛选条件。"
                  : tab === "pending"
                    ? "当前没有待审查的申报。"
                    : `暂无${statusMeta[tab].label}的课题。`}
              </li>
            ) : null}
          </ul>
        </SectionCard>

        <div className="space-y-4 xl:col-span-2">
          {current ? (
            <>
              {isProcessed ? (
                <SectionCard title="形式审查结论（已归档）">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Tag tone={current.reviewDecision === "passed" ? "ok" : "danger"}>
                      {current.reviewDecision === "passed" ? "形式审查通过，已进入评审" : "形式审查退回修改"}
                    </Tag>
                    <span className="text-xs text-muted-foreground">{current.reviewAt}</span>
                  </div>
                  {current.reviewReason ? (
                    <p className="mt-2 text-sm text-muted-foreground">退回意见：{current.reviewReason}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReopenOpen(true)}
                      disabled={!canReview}
                      className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      撤回并重新审查
                    </button>
                    <span className="text-xs text-muted-foreground">
                      撤回后课题回到「待审查」，原结论与操作留痕仍保留。
                    </span>
                  </div>
                </SectionCard>
              ) : null}

              <SectionCard
                title="形式审查清单"
                action={
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: current.id }}
                    className="text-xs text-primary"
                  >
                    查看课题档案
                  </Link>
                }
              >
                <ul className="divide-y divide-border text-sm">
                  {checks.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 py-2.5">
                      <span className="flex-1">{c.name}</span>
                      <Tag tone={c.ok ? "ok" : "danger"}>{c.ok ? "通过" : "需修改"}</Tag>
                      <button
                        onClick={() => toggleCheck(c.id, !c.ok)}
                        disabled={!canReview || isProcessed}
                        className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {c.ok ? "标记需修改" : "标记通过"}
                      </button>
                    </li>
                  ))}
                </ul>
                {failed.length > 0 ? (
                  <p className="mt-3 text-xs text-destructive">
                    {failed.length} 项未通过：{failed.map((c) => c.name).join("、")}
                  </p>
                ) : null}

                <div className="mt-4 border-t border-border pt-4">
                  <ReviewWorkflow
                    key={current.id}
                    projectId={current.id}
                    stage="形式审查"
                    decidePermission="review:form"
                    readOnly={isProcessed}
                    {...(failed.length > 0
                      ? {
                          passWarning: `形式审查仍有 ${failed.length} 项未通过（${failed
                            .map((c) => c.name)
                            .join("、")}）。确认仍要通过并进入评审吗？该操作将记入操作留痕。`,
                        }
                      : {})}
                    onDone={async () => {
                      setSelectedId(null);
                      await router.invalidate();
                    }}
                  />
                </div>
              </SectionCard>

              <SectionCard title="专家评审">
                <div className="grid gap-3 sm:grid-cols-2">
                  {experts.map((e) => {
                    const assigned = currentAssignments.includes(e.id);
                    return (
                      <div
                        key={e.id}
                        className={`rounded-md border px-3 py-3 ${
                          assigned ? "border-primary/40 bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{e.name}</span>
                          <Tag
                            tone={
                              e.status === "已评" ? "ok" : e.status === "待评审" ? "warn" : "muted"
                            }
                          >
                            {e.status}
                          </Tag>
                          {assigned ? <Tag tone="primary">已分配</Tag> : null}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{e.field}</div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  匿名评审已开启：专家不可见申报人信息，评分与意见全程留痕。
                </p>
              </SectionCard>
            </>
          ) : (
            <SectionCard title="形式审查清单">
              <p className="py-10 text-center text-sm text-muted-foreground">
                {tab === "pending"
                  ? "待审查队列为空，无需处理。"
                  : `请从左侧选择一条${statusMeta[tab].label}的课题查看详情。`}
              </p>
            </SectionCard>
          )}
        </div>
      </div>

      <AlertDialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>撤回形式审查结论？</AlertDialogTitle>
            <AlertDialogDescription>
              《{current?.title}》将重新回到「待审查」队列，可再次开展形式审查。原审查记录与操作留痕会保留。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction disabled={reopening} onClick={() => void handleReopen()}>
              {reopening ? "处理中…" : "确认撤回"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分配评审专家</DialogTitle>
            <DialogDescription>
              {current ? `为《${current.title}》选择评审专家（可多选）。` : ""}
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {experts.map((e) => (
              <li key={e.id}>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
                  <input
                    type="checkbox"
                    className="mt-1 accent-[var(--primary)]"
                    checked={chosenExperts.includes(e.id)}
                    onChange={(ev) =>
                      setChosenExperts((prev) =>
                        ev.target.checked ? [...prev, e.id] : prev.filter((id) => id !== e.id),
                      )
                    }
                  />
                  <span className="flex-1">
                    <span className="font-medium">{e.name}</span>
                    <Tag
                      tone={e.status === "已评" ? "ok" : e.status === "待评审" ? "warn" : "muted"}
                    >
                      {e.status}
                    </Tag>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {e.field}
                      {e.available ? ` · 可指导：${e.available}` : ""}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setAssignOpen(false)}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => void saveAssign()}
              disabled={busy || !current}
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              保存分配
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
