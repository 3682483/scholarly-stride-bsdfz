import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ReviewWorkflow } from "@/components/ReviewWorkflow";
import { SectionCard, Tag } from "@/components/ui-bits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { assignExpertsFn, getReviewBoardFn, setCheckResultFn } from "@/api/review";

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

export function ReviewPage() {
  const board = Route.useLoaderData();
  const router = useRouter();
  const { candidates, checks, experts, assignments } = board;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [chosenExperts, setChosenExperts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const current = candidates.find((c) => c.id === selectedId) ?? candidates[0];
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
      subtitle={`2026 年度校级课题第二批 · 待审查 ${candidates.length} 项`}
      actions={
        <button
          onClick={openAssign}
          disabled={!current}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          批量分配专家
        </button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="待审查申报">
          <ul className="space-y-2">
            {candidates.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full rounded-md border px-3 py-2.5 text-left text-sm ${
                    current?.id === c.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1">{c.title}</span>
                    {(assignments[c.id] ?? []).length > 0 ? (
                      <Tag tone="primary">已分配 {assignments[c.id]?.length}</Tag>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {c.leader} · {c.level} · {c.code}
                  </span>
                </button>
              </li>
            ))}
            {candidates.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted-foreground">
                本批次申报已全部完成形式审查。
              </li>
            ) : null}
          </ul>
        </SectionCard>

        <div className="space-y-4 xl:col-span-2">
          <SectionCard
            title="形式审查清单"
            action={
              current ? (
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: current.id }}
                  className="text-xs text-primary"
                >
                  查看课题档案
                </Link>
              ) : null
            }
          >
            {current ? (
              <>
                <ul className="divide-y divide-border text-sm">
                  {checks.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 py-2.5">
                      <span className="flex-1">{c.name}</span>
                      <Tag tone={c.ok ? "ok" : "danger"}>{c.ok ? "通过" : "需修改"}</Tag>
                      <button
                        onClick={() => toggleCheck(c.id, !c.ok)}
                        className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary"
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
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                本批次申报已全部完成形式审查。
              </p>
            )}
          </SectionCard>

          <SectionCard title="专家评审">
            <div className="grid gap-3 sm:grid-cols-2">
              {experts.map((e) => {
                const assigned = current ? currentAssignments.includes(e.id) : false;
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
                        tone={e.status === "已评" ? "ok" : e.status === "待评审" ? "warn" : "muted"}
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
        </div>
      </div>

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
