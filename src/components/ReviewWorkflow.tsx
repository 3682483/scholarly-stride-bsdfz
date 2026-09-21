import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Tag } from "@/components/ui-bits";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { aiPreReviewFn, humanReReviewFn, listReviewRecordsFn } from "@/api/ai";
import { useAuth } from "@/lib/auth";
import type { AiConclusion, AiReview, HumanReview } from "@/lib/types";

const conclusionMeta: Record<AiConclusion, { label: string; tone: "ok" | "warn" | "danger" }> = {
  pass: { label: "建议通过", tone: "ok" },
  revise: { label: "建议修改", tone: "warn" },
  reject: { label: "建议不通过", tone: "danger" },
};

type Props = {
  projectId: string;
  /** 审核环节名称，如 形式审查 / 材料审核 / 评审汇总 / 中期检查 */
  stage: string;
  /** 作出人工复审结论所需权限（如 review:form / material:manage / stage:advance） */
  decidePermission: string;
  /** 通过前需要二次确认的提示（例如形式审查仍有未通过项） */
  passWarning?: string;
  /** 复审完成后的回调，通常用于刷新页面数据 */
  onDone?: () => void | Promise<void>;
  /** 只读模式：仅展示历史记录，不提供复审操作（用于已出结论的课题） */
  readOnly?: boolean;
  className?: string;
};

/**
 * 审核环节通用组件：先由 AI 预审给出初步结论，再由人工复审确认或修正。
 * 所有预审与复审记录均落库留痕。
 */
export function ReviewWorkflow({
  projectId,
  stage,
  decidePermission,
  passWarning,
  onDone,
  readOnly = false,
  className,
}: Props) {
  const { can } = useAuth();
  const canRunAi = can("ai:review");
  const canDecide = can(decidePermission) && !readOnly;
  const [aiReviews, setAiReviews] = useState<AiReview[]>([]);
  const [humanReviews, setHumanReviews] = useState<HumanReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const records = await listReviewRecordsFn({ data: { projectId, stage } });
      setAiReviews(records.ai);
      setHumanReviews(records.human);
    } catch {
      // 读取失败不阻断页面其它功能
    } finally {
      setLoading(false);
    }
  }, [projectId, stage]);

  useEffect(() => {
    void load();
  }, [load]);

  const latestAi = aiReviews[0];

  const runAi = async () => {
    setRunning(true);
    try {
      const review = await aiPreReviewFn({ data: { projectId, stage } });
      setAiReviews((prev) => [review, ...prev]);
      toast.success(`AI 预审完成（${review.provider === "deepseek" ? "DeepSeek" : "本地规则"}）`, {
        description: review.summary,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI 预审失败");
    } finally {
      setRunning(false);
    }
  };

  const submitHuman = async (decision: "passed" | "returned") => {
    if (decision === "returned" && !comment.trim()) {
      toast.error("退回时请填写复审意见");
      return;
    }
    setSubmitting(true);
    try {
      const records = await humanReReviewFn({
        data: { projectId, stage, decision, comment: comment.trim() },
      });
      setAiReviews(records.ai);
      setHumanReviews(records.human);
      setComment("");
      toast.success(decision === "passed" ? "人工复审已完成：通过" : "人工复审已完成：退回");
      await onDone?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "提交复审失败");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const onPassClick = () => {
    if (passWarning) {
      setConfirmOpen(true);
      return;
    }
    void submitHuman("passed");
  };

  return (
    <div className={className ?? "space-y-3"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">AI 预审 · 人工复审</div>
        {canRunAi ? (
          <button
            type="button"
            onClick={runAi}
            disabled={running}
            className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "预审中…" : "AI 预审"}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">当前角色无 AI 预审权限</span>
        )}
      </div>

      {loading ? (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">读取审核记录…</p>
      ) : latestAi ? (
        <div className="rounded-md border border-border px-3 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Tag tone={conclusionMeta[latestAi.conclusion].tone}>
              {conclusionMeta[latestAi.conclusion].label}
            </Tag>
            <Tag tone="muted">{latestAi.score} 分</Tag>
            <Tag tone={latestAi.provider === "deepseek" ? "primary" : "accent"}>
              {latestAi.provider === "deepseek" ? `DeepSeek · ${latestAi.model}` : "本地规则预审"}
            </Tag>
            <span className="ml-auto text-xs text-muted-foreground">{latestAi.createdAt}</span>
          </div>
          <p className="mt-2 text-sm">{latestAi.summary}</p>

          {latestAi.risks.length > 0 ? (
            <div className="mt-2.5">
              <div className="text-xs text-muted-foreground">风险点</div>
              <ul className="mt-1 space-y-1 text-xs">
                {latestAi.risks.map((risk) => (
                  <li key={risk} className="flex gap-1.5">
                    <span className="text-destructive">·</span>
                    <span className="min-w-0 flex-1">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {latestAi.suggestions.length > 0 ? (
            <div className="mt-2.5">
              <div className="text-xs text-muted-foreground">修改建议</div>
              <ul className="mt-1 space-y-1 text-xs">
                {latestAi.suggestions.map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <span className="text-primary">·</span>
                    <span className="min-w-0 flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          尚未进行 AI 预审。点击「AI 预审」生成初步结论与风险提示，再由人工复审确认。
        </p>
      )}

      <div className="rounded-md border border-dashed border-border px-3 py-3">
        <div className="text-xs font-semibold">人工复审</div>
        <p className="mt-1 text-xs text-muted-foreground">
          审核人对 AI 预审结论进行确认或修正，最终结论以人工复审为准，并全程留痕。
        </p>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="复审意见（退回时必填；与 AI 结论不一致时建议说明理由）"
          className="mt-2 min-h-[72px]"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPassClick}
            disabled={submitting || !canDecide}
            className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            复审通过
          </button>
          <button
            type="button"
            onClick={() => void submitHuman("returned")}
            disabled={submitting || !canDecide}
            className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            复审退回
          </button>
          {readOnly ? (
            <span className="text-xs text-muted-foreground">该课题已出审查结论，此处仅展示历史记录</span>
          ) : !canDecide ? (
            <span className="text-xs text-muted-foreground">当前角色无该环节复审权限</span>
          ) : null}
          {latestAi ? (
            <span className="text-xs text-muted-foreground">
              当前 AI 结论：{conclusionMeta[latestAi.conclusion].label}
            </span>
          ) : null}
        </div>
      </div>

      {humanReviews.length > 0 ? (
        <div>
          <div className="text-xs text-muted-foreground">复审记录</div>
          <ul className="mt-1.5 space-y-1.5 text-xs">
            {humanReviews.map((record) => (
              <li key={record.id} className="flex flex-wrap items-center gap-2">
                <Tag tone={record.decision === "passed" ? "ok" : "danger"}>
                  {record.decision === "passed" ? "通过" : "退回"}
                </Tag>
                <Tag tone={record.agreesWithAi ? "muted" : "warn"}>
                  {record.agreesWithAi ? "与 AI 一致" : "与 AI 不一致"}
                </Tag>
                <span className="text-muted-foreground">
                  {record.reviewer} · {record.createdAt}
                </span>
                {record.comment ? (
                  <span className="min-w-0 flex-1 text-muted-foreground">{record.comment}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认通过？</AlertDialogTitle>
            <AlertDialogDescription>{passWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submitHuman("passed")}>
              确认通过
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
