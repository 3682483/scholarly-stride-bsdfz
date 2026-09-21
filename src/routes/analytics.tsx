import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Progress, SectionCard, Stat, Tag } from "@/components/ui-bits";
import { projects } from "@/lib/mock-data";

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
  component: Analytics,
});

const years = [
  { y: "2022", apply: 38, approve: 14 },
  { y: "2023", apply: 44, approve: 19 },
  { y: "2024", apply: 51, approve: 24 },
  { y: "2025", apply: 58, approve: 29 },
  { y: "2026", apply: 63, approve: 33 },
];

const subjects = [
  { s: "语文", n: 12 },
  { s: "数学", n: 10 },
  { s: "英语", n: 7 },
  { s: "科学", n: 6 },
  { s: "综合", n: 9 },
  { s: "艺体", n: 3 },
];

export function Analytics() {
  const max = Math.max(...years.map((y) => y.apply));
  const maxSub = Math.max(...subjects.map((s) => s.n));

  return (
    <AppShell title="统计分析" subtitle="立项分析 · 选题分析 · 过程监控">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="本年度立项" value={33} hint="同比 +13.8%" />
        <Stat label="立项率" value="52.4%" hint="申报 63 项" />
        <Stat label="按时结题率" value="88%" hint="目标 ≥90%" />
        <Stat label="过程材料按时率" value="91%" hint="目标 ≥90%" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <SectionCard title="历年申报与立项趋势">
          <div className="flex h-52 items-end gap-5">
            {years.map((y) => (
              <div key={y.y} className="flex flex-1 flex-col items-center gap-2">
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
                <span className="text-xs text-muted-foreground">{y.y}</span>
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
              <li key={s.s}>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{s.s}</span>
                  <span>{s.n} 项</span>
                </div>
                <Progress value={(s.n / maxSub) * 100} />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="选题分析">
          <div className="space-y-3 text-sm">
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">热点选题</div>
              <div className="flex flex-wrap gap-1.5">
                {["大单元教学", "项目化学习", "表现性评价", "AI辅助教学", "跨学科主题"].map(
                  (t) => (
                    <Tag key={t} tone="primary">
                      {t}
                    </Tag>
                  ),
                )}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">空白 / 低竞争方向</div>
              <div className="flex flex-wrap gap-1.5">
                {["县域教师专业发展", "劳动教育评价", "家校协同机制", "特殊需要学生支持"].map(
                  (t) => (
                    <Tag key={t} tone="accent">
                      {t}
                    </Tag>
                  ),
                )}
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
            {projects
              .filter((p) => p.stage !== "归档")
              .map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      p.risk === "red"
                        ? "bg-destructive"
                        : p.risk === "amber"
                          ? "bg-warn"
                          : "bg-ok"
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate">{p.title}</span>
                  <span className="text-xs text-muted-foreground">
                    完整率 {p.completeness}%
                  </span>
                </li>
              ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
