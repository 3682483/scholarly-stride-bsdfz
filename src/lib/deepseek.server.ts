/**
 * DeepSeek 大模型接入（服务端专用）。
 *
 * 通过 .env 或进程环境变量配置：
 *   DEEPSEEK_API_KEY   必填，未配置时自动降级为「本地规则预审」
 *   DEEPSEEK_BASE_URL  可选，默认 https://api.deepseek.com
 *   DEEPSEEK_MODEL     可选，默认 deepseek-chat
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { AiConclusion, AiPreReviewResult, CheckItem, Project } from "@/lib/types";

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";
const TIMEOUT_MS = 45_000;

let dotEnvCache: Record<string, string> | null = null;

function readDotEnv(): Record<string, string> {
  if (dotEnvCache) return dotEnvCache;
  const out: Record<string, string> = {};
  try {
    const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      const quoted =
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"));
      if (quoted) value = value.slice(1, -1);
      out[key] = value;
    }
  } catch {
    // 未提供 .env 文件时忽略
  }
  dotEnvCache = out;
  return out;
}

function readEnv(key: string): string | undefined {
  const fromProcess = process.env[key];
  if (fromProcess && fromProcess.trim()) return fromProcess.trim();
  const fromFile = readDotEnv()[key];
  return fromFile && fromFile.trim() ? fromFile.trim() : undefined;
}

/** 返回当前 AI 接入配置状态（不暴露密钥）。 */
export function getAiProviderInfo(): { configured: boolean; model: string; baseUrl: string } {
  return {
    configured: Boolean(readEnv("DEEPSEEK_API_KEY")),
    model: readEnv("DEEPSEEK_MODEL") ?? DEFAULT_MODEL,
    baseUrl: readEnv("DEEPSEEK_BASE_URL") ?? DEFAULT_BASE_URL,
  };
}

function buildReviewContext(project: Project, checks: CheckItem[], stage: string): string {
  const lines: string[] = [];
  lines.push(`【审核环节】${stage}`);
  lines.push(`【课题名称】${project.title}`);
  lines.push(`【课题编号】${project.code}（${project.id}）`);
  lines.push(`【层级 / 学科】${project.level} / ${project.subject}`);
  lines.push(`【申报批次】${project.batch}`);
  lines.push(`【负责人】${project.leader}（${project.unit}）`);
  lines.push(`【当前阶段】${project.stage}`);
  lines.push(`【研究进度】${project.progress}% 【材料完整率】${project.completeness}%`);
  lines.push(`【查重率】${project.plagiarismRate === null ? "未检测" : `${project.plagiarismRate}%`}`);
  lines.push(`【AIGC 比例】${project.aigcRate === null ? "未检测" : `${project.aigcRate}%`}`);
  lines.push(`【研究摘要】${project.abstract}`);
  lines.push(`【形式审查清单】`);
  for (const c of checks) lines.push(`  · ${c.name}：${c.ok ? "通过" : "未通过"}`);
  lines.push(`【材料清单】`);
  for (const m of project.materials) {
    lines.push(`  · ${m.name}（${m.stage}｜${m.status}｜责任人 ${m.owner}）`);
  }
  if (project.reviews.length > 0) {
    lines.push(`【专家评审意见】`);
    for (const r of project.reviews) lines.push(`  · ${r.expert}：${r.score} 分，${r.comment}`);
  } else {
    lines.push(`【专家评审意见】暂无`);
  }
  if (project.members.length > 0) {
    lines.push(`【课题组】${project.members.join("、")}`);
  }
  return lines.join("\n");
}

function buildSystemPrompt(stage: string): string {
  return [
    `你是教科研课题管理平台的评审专家，负责「${stage}」环节的预审。`,
    "请基于给定的课题材料做专业、审慎的预审，不得编造材料中未提供的信息；信息不足时应如实指出。",
    "结论口径：材料齐全、合规、无学术诚信问题 → pass；存在需补充或修改的问题 → revise；存在实质性缺陷或违规 → reject。",
    "只输出 JSON，不要输出任何解释文字，格式为：",
    '{"conclusion":"pass|revise|reject","score":0到100的整数,"summary":"不超过60字的结论","risks":["风险点"],"suggestions":["修改建议"]}',
  ].join("\n");
}

function normalizeConclusion(value: unknown): AiConclusion {
  const s = String(value ?? "").toLowerCase();
  if (s.includes("reject") || s.includes("不通过") || s.includes("拒绝") || s.includes("驳回")) {
    return "reject";
  }
  if (s.includes("revise") || s.includes("修改") || s.includes("整改") || s.includes("补充")) {
    return "revise";
  }
  if (s.includes("pass") || s.includes("通过")) return "pass";
  return "revise";
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => String(x).trim()).filter(Boolean);
}

function coerceResult(raw: unknown): Omit<AiPreReviewResult, "provider" | "model"> {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const scoreNum = Number(obj["score"]);
  const score = Number.isFinite(scoreNum) ? Math.max(0, Math.min(100, Math.round(scoreNum))) : 60;
  return {
    conclusion: normalizeConclusion(obj["conclusion"]),
    score,
    summary: String(obj["summary"] ?? "").trim() || "模型未给出明确结论。",
    risks: toStringList(obj["risks"]),
    suggestions: toStringList(obj["suggestions"]),
  };
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** 调用 DeepSeek Chat Completions。 */
async function callDeepSeek(
  context: string,
  stage: string,
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<Omit<AiPreReviewResult, "provider" | "model">> {
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt(stage) },
        { role: "user", content: context },
      ],
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      stream: false,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`DeepSeek 接口返回 ${response.status}：${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek 返回内容为空");

  const parsed = extractJson(content);
  if (!parsed) throw new Error("DeepSeek 返回内容不是合法 JSON");

  return coerceResult(parsed);
}

// ---------------------------------------------------------------- 本地规则预审（无 Key 时兜底）

export function heuristicPreReview(
  project: Project,
  checks: CheckItem[],
  stage: string,
): AiPreReviewResult {
  const risks: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const failedChecks = checks.filter((c) => !c.ok);
  if (failedChecks.length > 0) {
    score -= failedChecks.length * 10;
    risks.push(
      `形式审查有 ${failedChecks.length} 项未通过：${failedChecks.map((c) => c.name).join("、")}`,
    );
    suggestions.push("请先完成形式审查未通过项的整改，并补充相应佐证材料。");
  }

  if (project.completeness < 90) {
    score -= 10;
    risks.push(`材料完整率仅 ${project.completeness}%，低于 90% 要求`);
    suggestions.push("补齐缺失材料（阶段报告、佐证清单、经费明细等）后再提交复审。");
  }

  const pending = project.materials.filter((m) => m.status !== "已提交");
  if (pending.length > 0) {
    score -= pending.length * 5;
    risks.push(
      `有 ${pending.length} 份材料未提交或已退回：${pending.map((m) => m.name).join("、")}`,
    );
  }

  const plagiarism = project.plagiarismRate;
  if (plagiarism !== null && plagiarism >= 20) {
    score -= 20;
    risks.push(`查重率 ${plagiarism}% 超过 20% 阈值`);
    suggestions.push("需修改后复检查重，并附最新查重报告。");
  } else if (plagiarism !== null && plagiarism >= 10) {
    score -= 5;
    risks.push(`查重率 ${plagiarism}% 偏高，建议进一步降重`);
  }

  const aigc = project.aigcRate;
  if (aigc !== null && aigc >= 30) {
    score -= 20;
    risks.push(`AIGC 比例 ${aigc}% 超过 30% 阈值`);
    suggestions.push("说明 AI 使用环节、补充人工撰写内容，并完善 AI 使用声明。");
  } else if (aigc !== null && aigc >= 20) {
    score -= 5;
    risks.push(`AIGC 比例 ${aigc}% 接近阈值，需注意合规边界`);
  }

  if (project.reviews.length > 0) {
    const avg = Math.round(
      project.reviews.reduce((sum, r) => sum + r.score, 0) / project.reviews.length,
    );
    if (avg < 80) {
      score -= 10;
      risks.push(`专家平均评分 ${avg} 分，低于 80 分参考线`);
    }
  } else if (stage !== "形式审查") {
    risks.push("尚未获得专家评分，评审结论依据不足");
    suggestions.push("完成专家评审与意见汇总后再进入本环节人工复审。");
  }

  score = Math.max(0, Math.min(100, score));
  const conclusion: AiConclusion = score >= 85 ? "pass" : score >= 70 ? "revise" : "reject";

  const summary =
    conclusion === "pass"
      ? `材料齐全、合规性良好（${score} 分），建议通过并进入下一环节。`
      : conclusion === "revise"
        ? `存在 ${risks.length} 项需关注问题（${score} 分），建议修改后复审。`
        : `存在实质性缺陷（${score} 分），建议不通过并退回整改。`;

  if (risks.length === 0) suggestions.push("未发现明显风险，可按正常流程推进。");

  return {
    provider: "heuristic",
    model: "local-rule-engine",
    conclusion,
    score,
    summary,
    risks,
    suggestions,
  };
}

/** 执行 AI 预审：优先调用 DeepSeek，未配置密钥时降级为本地规则预审。 */
export async function runAiPreReview(
  project: Project,
  checks: CheckItem[],
  stage: string,
): Promise<AiPreReviewResult> {
  const apiKey = readEnv("DEEPSEEK_API_KEY");
  if (!apiKey) {
    return heuristicPreReview(project, checks, stage);
  }

  const baseUrl = readEnv("DEEPSEEK_BASE_URL") ?? DEFAULT_BASE_URL;
  const model = readEnv("DEEPSEEK_MODEL") ?? DEFAULT_MODEL;
  const context = buildReviewContext(project, checks, stage);

  try {
    const result = await callDeepSeek(context, stage, apiKey, baseUrl, model);
    return { provider: "deepseek", model, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    throw new Error(`AI 预审调用失败：${message}`);
  }
}
