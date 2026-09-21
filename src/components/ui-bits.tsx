import type { ReactNode } from "react";
import { STAGES, riskLabel, type Risk, type Stage } from "@/lib/types";

export function RiskDot({ risk }: { risk: Risk }) {
  const cls =
    risk === "red"
      ? "bg-destructive"
      : risk === "amber"
        ? "bg-warn"
        : "bg-ok";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${cls}`} />
      {riskLabel[risk]}
    </span>
  );
}

export function Tag({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "accent" | "ok" | "warn" | "danger";
}) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/20 text-accent-foreground",
    ok: "bg-ok/15 text-ok",
    warn: "bg-warn/25 text-warn-foreground",
    danger: "bg-destructive/12 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function StageTrack({ current }: { current: Stage }) {
  const idx = STAGES.indexOf(current);
  return (
    <ol className="flex flex-wrap items-center gap-1">
      {STAGES.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <li key={s} className="flex items-center gap-1">
            <span
              className={`rounded px-2 py-1 text-xs ${
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </span>
            {i < STAGES.length - 1 ? (
              <span
                className={`h-px w-4 ${done ? "bg-primary/40" : "bg-border"}`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="card-surface px-4 py-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1.5 font-display text-2xl font-semibold">{value}</div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card-surface">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
