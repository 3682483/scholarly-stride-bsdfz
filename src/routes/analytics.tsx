import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Progress, RiskDot, SectionCard, Stat, Tag } from "@/components/ui-bits";
import { getAssetsFn } from "@/api/dashboard";
import { getAnalyticsFn } from "@/api/analytics";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "统计分析 · 立项与选题分析" },
      {
        name: "description",
        content: "历年立项趋势、学科分布、成功率与选题热点空白分析，支撑科研决策与选题引导。",
      },
      { property: "og:title", content: "统计分析 · 立项与选题分析" },
      {
        property: "og:description",
        content: "历年立项趋势、学科分布、成功率与选题热点空白分析。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    const [analytics, assets] = await Promise.all([getAnalyticsFn(), getAssetsFn()]);
    return { ...analytics, batches: assets.batches, policies: assets.policies };
  },
  component: Analytics,
});

export function Analytics() {
  const data = Route.useLoaderData();
  const { years, subjects, stats, monitored, batches, policies } = data;
  const max = Math.max(1, ...years.map((y) => y.apply));
  const maxSub = Math.max(1, ...subjects.map((s) => s.count));

  return (
    <AppShell title="统计分析" subtitle="立项分析 · 选题分析 · 过程监控">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="最新年度立项" value={stats.currentYearApproved} hint="按申报批次统计" />
        <Stat label="立项率" value={`${stats.approvalRate}%`} hint="最新年度批次" />
        <Stat label="过程材料提交率" value={`${stats.materialRate}%`} hint="目标 ≥90%" />
        <Stat label="在研平均完整率" value={`${stats.avgCompleteness}%`} hint="目标 ≥95%" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <SectionCard title="历年申报与立项趋势">
          <div className="flex h-52 items-end gap-5">
            {years.map((y) => (
              <div key={y.year} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end justify-center gap-1">
                  <div
                    className="w-1/3 rounded-t bg-primary/25"
                    style={{ height: `${(y.apply / max) * 100}%` }}
                    title={`申报 ${y.apply}`}
                  />
                  <div
                    className="w-1/3 rounded-t bg-primary"
                    style={{ height: `${(y.approve / max) * 100}%` }}
                    title={`立项 ${y.approve}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{y.year}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm bg-primary/25" />申报
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm bg-primary" />立项
            </span>
          </div>
        </SectionCard>

        <SectionCard title="学科分布">
          <ul className="space-y-3">
            {subjects.map((s) => (
              <li key={s.subject}>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{s.subject}</span>
                  <span>{s.count} 项</span>
                </div>
                <Progress value={(s.count / maxSub) * 100} />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="选题分析">
          <div className="space-y-3 text-sm">
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">热点选题</div>
              <div className="flex flex-wrap gap-1.5">
                {["大单元教学", "项目化学习", "表现性评价", "AI辅助教学", "跨学科主题"].map((t) => (
                  <Tag key={t} tone="primary">
                    {t}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">空白 / 低竞争方向</div>
              <div className="flex flex-wrap gap-1.5">
                {["县域教师专业发展", "劳动教育评价", "家校协同机制", "特殊需要学生支持"].map((t) => (
                  <Tag key={t} tone="accent">
                    {t}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">高重复度提醒</div>
              <div className="flex flex-wrap gap-1.5">
                {["核心素养课堂教学", "作业设计优化"].map((t) => (
                  <Tag key={t} tone="warn">
                    {t}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="在研课题过程监控">
          <ul className="divide-y divide-border text-sm">
            {monitored.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <RiskDot risk={p.risk} />
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  className="min-w-0 flex-1 truncate hover:underline"
                >
                  {p.title}
                </Link>
                <span className="text-xs text-muted-foreground">完整率 {p.completeness}%</span>
              </li>
            ))}
            {monitored.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">暂无在研课题。</li>
            ) : null}
          </ul>
        </SectionCard>

        <SectionCard title="申报批次">
          <ul className="divide-y divide-border text-sm">
            {batches.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <Tag tone="accent">{b.level}</Tag>
                <span className="min-w-0 flex-1 truncate">{b.name}</span>
                <span className="text-xs text-muted-foreground">
                  申报 {b.applyCount} · 通过 {b.passCount}
                </span>
                <Tag tone={b.status.includes("进行") || b.status.includes("申报") ? "warn" : "ok"}>
                  {b.status}
                </Tag>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="政策与前沿情报">
          <ul className="space-y-3 text-sm">
            {policies.map((p) => (
              <li key={p.id} className="rounded-md border border-border px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone="primary">{p.level}</Tag>
                  <Tag>{p.category}</Tag>
                  <span className="ml-auto text-xs text-muted-foreground">{p.publishDate}</span>
                </div>
                <div className="mt-1.5 font-medium">{p.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{p.summary}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
