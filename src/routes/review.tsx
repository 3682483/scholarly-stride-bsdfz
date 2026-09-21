import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionCard, Tag } from "@/components/ui-bits";
import { projects } from "@/lib/mock-data";

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
  component: ReviewPage,
});

const checks = [
  { name: "负责人职称符合要求", ok: true },
  { name: "在研课题不超过 2 项（限项）", ok: true },
  { name: "申报书字数 ≥ 5000 字", ok: true },
  { name: "参考文献格式规范", ok: false },
  { name: "签字盖章页齐全", ok: true },
  { name: "查重率 < 20%", ok: true },
  { name: "AIGC 比例 < 30%", ok: false },
];

export function ReviewPage() {
  const candidates = projects.filter((p) => p.stage === "评审" || p.stage === "申报");
  const [selected, setSelected] = useState(candidates[0]?.id ?? "");
  const current = candidates.find((c) => c.id === selected);

  return (
    <AppShell
      title="申报与评审"
      subtitle="2026 年度校级课题第二批 · 申报 24 项，通过形式审查 21 项"
      actions={
        <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
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
                  onClick={() => setSelected(c.id)}
                  className={`w-full rounded-md border px-3 py-2.5 text-left text-sm ${
                    selected === c.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <span className="block">{c.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {c.leader} · {c.level} · {c.code}
                  </span>
                </button>
              </li>
            ))}
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
            <ul className="divide-y divide-border text-sm">
              {checks.map((c) => (
                <li key={c.name} className="flex items-center gap-2 py-2.5">
                  <span className="flex-1">{c.name}</span>
                  <Tag tone={c.ok ? "ok" : "danger"}>{c.ok ? "通过" : "需修改"}</Tag>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                通过并进入评审
              </button>
              <button className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
                退回修改
              </button>
            </div>
          </SectionCard>

          <SectionCard title="专家评审">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { n: "陈立群", f: "课程与教学论", s: "已评 82 分", t: "ok" as const },
                { n: "吴海若", f: "教育测量与评价", s: "待评审", t: "warn" as const },
                { n: "沈砚", f: "学科教育（英语）", s: "已回避", t: "muted" as const },
              ].map((e) => (
                <div key={e.n} className="rounded-md border border-border px-3 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{e.n}</span>
                    <Tag tone={e.t}>{e.s}</Tag>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{e.f}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              匿名评审已开启：专家不可见申报人信息，评分与意见全程留痕。
            </p>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
