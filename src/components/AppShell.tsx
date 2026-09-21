import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "管理工作台", desc: "总览与预警" },
  { to: "/projects", label: "课题库", desc: "全生命周期" },
  { to: "/review", label: "申报与评审", desc: "审查 · 专家" },
  { to: "/analytics", label: "统计分析", desc: "立项 · 选题" },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex">
        <div className="px-2">
          <div className="font-display text-lg leading-tight font-semibold">
            教科研智能管理
          </div>
          <div className="mt-1 text-xs text-sidebar-foreground/60">
            AI 赋能平台 · 原型演示
          </div>
        </div>

        <nav className="mt-8 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="block rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent font-medium" }}
            >
              <span className="block">{item.label}</span>
              <span className="block text-[11px] text-sidebar-foreground/55">
                {item.desc}
              </span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-md border border-sidebar-border px-3 py-3 text-xs text-sidebar-foreground/70">
          <div className="text-sidebar-foreground">徐敏</div>
          <div>科研管理部门 · 专员</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-card px-6 py-5">
          <div>
            <h1 className="font-display text-xl font-semibold">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 py-2 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground"
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
