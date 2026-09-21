import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RiskDot, SectionCard, Stat, Tag, Progress } from "@/components/ui-bits";
import { getDashboardFn, toggleTodoFn } from "@/api/dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "管理工作台 · 教科研智能管理与AI赋能平台" },
      {
        name: "description",
        content: "科研管理部门工作台：在研课题态势、过程预警、待办审核与材料完整率一屏掌握。",
      },
      { property: "og:title", content: "管理工作台 · 教科研智能管理平台" },
      {
        property: "og:description",
        content: "在研课题态势、过程预警、待办审核与材料完整率一屏掌握。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => await getDashboardFn(),
  component: Dashboard,
});

function Dashboard() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [pendingTodo, setPendingTodo] = useState<number | null>(null);

  const pendingCount = data.todos.filter((t) => !t.done).length;

  const handleToggle = async (id: number, done: boolean) => {
    setPendingTodo(id);
    try {
      await toggleTodoFn({ data: { id, done } });
      await router.invalidate();
    } catch {
      toast.error("更新待办失败，请稍后重试");
    } finally {
      setPendingTodo(null);
    }
  };

  return (
    <AppShell
      title="管理工作台"
      subtitle="2026 学年 · 科研管理部门视角"
      actions={
        <Link
          to="/projects"
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
        >
          进入课题库
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="在研课题"
          value={data.activeCount}
          hint={`累计 ${data.totalCount} 项，含已归档`}
        />
        <Stat label="材料完整率" value={`${data.avgCompleteness}%`} hint="目标 ≥95%" />
        <Stat
          label="过程预警"
          value={data.alertCount}
          hint={`${data.redCount} 红 · ${data.amberCount} 黄`}
        />
        <Stat label="待办事项" value={pendingCount} hint={`共 ${data.todos.length} 项`} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard
            title="过程预警（红黄绿灯）"
            action={<span className="text-xs text-muted-foreground">按紧急度排序</span>}
          >
            <ul className="divide-y divide-border">
              {data.alerts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <RiskDot risk={a.level} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.projectTitle}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {a.title} · 责任人 {a.owner}
                    </div>
                  </div>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: a.projectId }}
                    className="rounded border border-border px-2.5 py-1 text-xs hover:bg-secondary"
                  >
                    处理
                  </Link>
                </li>
              ))}
              {data.alerts.length === 0 ? (
                <li className="py-6 text-center text-sm text-muted-foreground">当前没有预警课题。</li>
              ) : null}
            </ul>
          </SectionCard>

          <div className="mt-4">
            <SectionCard
              title="临近节点"
              action={
                <Link to="/projects" className="text-xs text-primary">
                  全部课题
                </Link>
              }
            >
              <ul className="space-y-3">
                {data.upcoming.map((p) => (
                  <li key={p.id} className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag tone="primary">{p.stage}</Tag>
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: p.id }}
                        className="min-w-0 flex-1 truncate text-sm hover:underline"
                      >
                        {p.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">{p.nextDue}</span>
                    </div>
                    <Progress value={p.completeness} />
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-4">
          <SectionCard title="我的待办">
            {data.todos.map((x) => (
              <label
                key={x.id}
                className={`flex items-start gap-2 py-2 text-sm ${
                  pendingTodo === x.id ? "opacity-60" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={x.done}
                  disabled={pendingTodo === x.id}
                  onChange={(e) => handleToggle(x.id, e.target.checked)}
                  className="mt-1 accent-[var(--primary)]"
                />
                <span className="flex-1">
                  <span className={x.done ? "text-muted-foreground line-through" : ""}>{x.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{x.due}</span>
                </span>
              </label>
            ))}
          </SectionCard>

          <SectionCard title="合规提示">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>· 申报与结题前强制查重与 AIGC 检测</li>
              <li>· AI 仅提供框架与素材，关键段落需人工撰写</li>
              <li>· 所有 AI 使用记录与人工修改均留痕可审计</li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
