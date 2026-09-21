import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Progress, RiskDot, SectionCard, StageTrack, Tag } from "@/components/ui-bits";
import { getProject } from "@/lib/mock-data";

export const Route = createFileRoute("/projects/$projectId")({
  loader: ({ params }) => {
    const project = getProject(params.projectId);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "课题不存在" }, { name: "robots", content: "noindex" }],
      };
    }
    const { project } = loaderData;
    const desc = `${project.level} · ${project.stage}阶段 · 负责人${project.leader}。一题一档：过程材料、专家意见、经费与操作留痕。`;
    return {
      meta: [
        { title: `${project.title} · 一题一档` },
        { name: "description", content: desc },
        { property: "og:title", content: project.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProjectDetail,
});

const tabs = ["过程管理", "材料档案", "专家与评审", "经费", "操作留痕"] as const;

function ProjectDetail() {
  const { project: p } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof tabs)[number]>("过程管理");

  return (
    <AppShell
      title={p.title}
      subtitle={`${p.code} · ${p.batch} · 负责人 ${p.leader}（${p.unit}）`}
      actions={
        <>
          <Link
            to="/projects"
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
          >
            返回课题库
          </Link>
          <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
            导出一题一档
          </button>
        </>
      }
    >
      <div className="card-surface px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="accent">{p.level}</Tag>
          <Tag>{p.subject}</Tag>
          <Tag tone="primary">{p.stage}阶段</Tag>
          <RiskDot risk={p.risk} />
          <span className="ml-auto text-xs text-muted-foreground">
            下一节点：{p.nextDue}
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{p.abstract}</p>
        <div className="mt-4">
          <StageTrack current={p.stage} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
          <div>
            <div className="mb-1 text-xs text-muted-foreground">
              经费使用 {Math.round((p.budget.used / p.budget.total) * 100)}%
            </div>
            <Progress value={(p.budget.used / p.budget.total) * 100} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              tab === t
                ? "border-primary font-medium text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {tab === "过程管理" ? (
            <>
              <SectionCard title="阶段任务清单">
                <ul className="divide-y divide-border text-sm">
                  {[
                    { t: "回看课题目标与研究问题", o: p.leader, d: "每月 1 次", s: "已完成" },
                    { t: "提交研究反思日志", o: p.members[1] ?? p.leader, d: "每两周", s: "进行中" },
                    { t: "课堂数据采集（不少于 10 节）", o: p.leader, d: p.nextDue, s: "进行中" },
                    { t: "阶段报告初稿", o: p.leader, d: p.nextDue, s: "未开始" },
                  ].map((x) => (
                    <li key={x.t} className="flex flex-wrap items-center gap-2 py-3">
                      <span className="min-w-0 flex-1">{x.t}</span>
                      <span className="text-xs text-muted-foreground">
                        {x.o} · {x.d}
                      </span>
                      <Tag tone={x.s === "已完成" ? "ok" : x.s === "进行中" ? "warn" : "muted"}>
                        {x.s}
                      </Tag>
                    </li>
                  ))}
                </ul>
              </SectionCard>
              <SectionCard title="过程性数据与反思">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { k: "课堂观察", v: "12 节" },
                    { k: "反思日志", v: "27 篇" },
                    { k: "问卷 / 访谈", v: "4 套" },
                  ].map((x) => (
                    <div key={x.k} className="rounded-md bg-muted px-3 py-3">
                      <div className="text-xs text-muted-foreground">{x.k}</div>
                      <div className="mt-1 font-display text-lg">{x.v}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  过程数据将自动汇总为中期 / 结题报告初稿，需负责人人工复核后提交。
                </p>
              </SectionCard>
            </>
          ) : null}

          {tab === "材料档案" ? (
            <SectionCard title="佐证材料（按阶段）">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2">材料名称</th>
                    <th>阶段</th>
                    <th>责任人</th>
                    <th>提交时间</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {p.materials.map((m) => (
                    <tr key={m.name} className="border-b border-border/70">
                      <td className="py-2.5">{m.name}</td>
                      <td className="text-xs text-muted-foreground">{m.stage}</td>
                      <td className="text-xs text-muted-foreground">{m.owner}</td>
                      <td className="text-xs text-muted-foreground">{m.date ?? "—"}</td>
                      <td>
                        <Tag
                          tone={
                            m.status === "已提交"
                              ? "ok"
                              : m.status === "已退回"
                                ? "danger"
                                : "warn"
                          }
                        >
                          {m.status}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          ) : null}

          {tab === "专家与评审" ? (
            <SectionCard title="专家意见与整改闭环">
              {p.reviews?.length ? (
                <ul className="space-y-3">
                  {p.reviews.map((r) => (
                    <li key={r.expert} className="rounded-md border border-border px-3 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{r.expert}</span>
                        <Tag tone="primary">{r.score} 分</Tag>
                        <span className="ml-auto text-xs text-muted-foreground">待整改复核</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">该课题暂无评审记录。</p>
              )}
            </SectionCard>
          ) : null}

          {tab === "经费" ? (
            <SectionCard title="经费使用">
              <div className="text-sm">
                预算 ¥{p.budget.total.toLocaleString()} · 已使用 ¥
                {p.budget.used.toLocaleString()} · 结余 ¥
                {(p.budget.total - p.budget.used).toLocaleString()}
              </div>
              <div className="mt-3">
                <Progress value={(p.budget.used / p.budget.total) * 100} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                经费明细需附发票编号，审核不通过将退回责任人重新提交。
              </p>
            </SectionCard>
          ) : null}

          {tab === "操作留痕" ? (
            <SectionCard title="全过程留痕（不可篡改）">
              <ol className="space-y-4">
                {p.logs.map((l) => (
                  <li key={l.time} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/50" />
                    <div>
                      <div className="text-sm">
                        {l.actor} · {l.action}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {l.time}
                        {l.note ? ` · ${l.note}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </SectionCard>
          ) : null}
        </div>

        <div className="space-y-4">
          <SectionCard title="课题组">
            <ul className="space-y-2 text-sm">
              {p.members.map((m, i) => (
                <li key={m} className="flex items-center justify-between">
                  <span>{m}</span>
                  <span className="text-xs text-muted-foreground">
                    {i === 0 ? "负责人" : "成员"}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="合规检测">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                查重率 <Tag tone="ok">8.6%</Tag>
              </li>
              <li className="flex items-center justify-between">
                AIGC 比例 <Tag tone="warn">21%</Tag>
              </li>
              <li className="flex items-center justify-between">
                AI 使用声明 <Tag tone="ok">已填写</Tag>
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              结题提交前将强制重新检测，超阈值自动拦截。
            </p>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
