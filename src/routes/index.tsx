import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RiskDot, SectionCard, Stat, Tag, Progress } from "@/components/ui-bits";
import { alerts, projects, getProject } from "@/lib/mock-data";

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
  component: Dashboard,
});

function Dashboard() {
  const active = projects.filter((p) => p.stage !== "归档");
  const avgComplete = Math.round(
    active.reduce((s, p) => s + p.completeness, 0) / active.length,
  );

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
        <Stat label="在研课题" value={active.length} hint={`累计 ${projects.length} 项，含已归档`} />
        <Stat label="材料完整率" value={`${avgComplete}%`} hint="目标 ≥95%" />
        <Stat label="过程预警" value={alerts.length} hint="1 红 · 2 黄" />
        <Stat label="本周待办" value={5} hint="形式审查 2 · 评审分配 1 · 退回复核 2" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard
            title="过程预警（红黄绿灯）"
            action={<span className="text-xs text-muted-foreground">按紧急度排序</span>}
          >
            <ul className="divide-y divide-border">
              {alerts.map((a) => {
                const p = getProject(a.projectId);
                return (
                  <li key={a.projectId} className="flex flex-wrap items-center gap-3 py-3">
                    <RiskDot risk={a.level} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p?.title}</div>
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
                );
              })}
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
                {active
                  .slice()
                  .sort((a, b) => a.completeness - b.completeness)
                  .map((p) => (
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
            {[
              { t: "形式审查：AI辅助英语写作反馈机制", s: "今日截止" },
              { t: "分配评审专家：2026校级第二批（3项）", s: "9月26日" },
              { t: "复核退回材料：经费使用明细", s: "待提交" },
              { t: "排期开题论证会：初中数学项目化学习", s: "9月24日" },
              { t: "催办结题材料：县域拔尖创新人才", s: "逾期风险" },
            ].map((x) => (
              <label key={x.t} className="flex items-start gap-2 py-2 text-sm">
                <input type="checkbox" className="mt-1 accent-[var(--primary)]" />
                <span className="flex-1">
                  {x.t}
                  <span className="mt-0.5 block text-xs text-muted-foreground">{x.s}</span>
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
