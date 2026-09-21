import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Progress, RiskDot, StageTrack, Tag } from "@/components/ui-bits";
import { STAGES, projects } from "@/lib/mock-data";

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
  component: ProjectList,
});

const levels = ["全部", "国家级", "市级", "区级", "校级"] as const;

function ProjectList() {
  const [stage, setStage] = useState<string>("全部");
  const [level, setLevel] = useState<string>("全部");
  const [q, setQ] = useState("");

  const list = projects.filter(
    (p) =>
      (stage === "全部" || p.stage === stage) &&
      (level === "全部" || p.level === level) &&
      (q.trim() === "" ||
        p.title.includes(q.trim()) ||
        p.leader.includes(q.trim()) ||
        p.code.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <AppShell
      title="课题库"
      subtitle="申报 → 评审 → 立项 → 开题 → 中期 → 结题 → 归档"
      actions={
        <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
          新建申报批次
        </button>
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
        <span className="ml-auto text-xs text-muted-foreground">
          共 {list.length} 项
        </span>
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
                <div className="mb-1 text-xs text-muted-foreground">
                  研究进度 {p.progress}%
                </div>
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
    </AppShell>
  );
}
