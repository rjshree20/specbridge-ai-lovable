import { createLovableGatewayProvider, type AiTextProvider } from "@/lib/ai-provider.server";
import {
  AiReviewError,
  modelOutputJsonSchema,
  parseAiReviewRequest,
  validateModelOutput,
  type AiReviewResponse,
} from "@/lib/ai-review";
import { analyzePrd, type PrdFinding } from "@/lib/prd-analyzer";
import type { PrdFormValues } from "@/lib/prd-validation";

const MAX_OUTPUT_TOKENS = 6_000;

// Best-effort throttle per server instance; a shared store is needed for strict limits.
const WINDOW_MS = 60_000;
const PER_CLIENT_LIMIT = 5;
const GLOBAL_LIMIT = 30;
const hits = new Map<string, number[]>();

export function checkRateLimit(clientKey: string, now = Date.now()) {
  const recent = (key: string) => (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  const client = recent(clientKey);
  const all = recent("*");
  if (client.length >= PER_CLIENT_LIMIT || all.length >= GLOBAL_LIMIT) return false;
  hits.set(clientKey, [...client, now]);
  hits.set("*", [...all, now]);
  return true;
}
export function resetRateLimits() {
  hits.clear();
}

const instructions = `You review product requirement documents (PRDs) before engineering handoff.
You receive the submitted PRD fields and candidate gaps produced by deterministic rules R001-R010.
Rules:
- Give one verdict per candidate: "supported" (a meaningful gap given the text), "dismissed" (sufficiently defined, irrelevant or unsupported), or "uncertain" (more context needed).
- Only add a new suggestion when an important implementation requirement is genuinely missing and no rule candidate covers it. Prefer zero suggestions to generic ones. At most 3.
- Set relatedRuleId to the rule id (e.g. "R005") if a new suggestion overlaps any rule's concern, otherwise null.
- Evidence must be copied character-for-character from the submitted fields. If you are describing something absent, use null. Never invent quotations, policies or behaviour.
- Output metrics, report columns or generated file contents are not user input fields.
- Ask 0-3 prioritised questions an engineer would genuinely ask before building, each addressing an unresolved decision not answered in the PRD. If fewer than two genuine questions exist, return fewer and explain in noFurtherQuestionsNote.
- Confidence is your own uncalibrated assessment.`;

function buildPrompt(values: PrdFormValues, findings: PrdFinding[]) {
  const fields = [
    `Feature title: ${values.featureTitle}`,
    `Product name: ${values.productName || "(not provided)"}`,
    `Feature description: ${values.featureDescription}`,
    `Target users: ${values.targetUsers || "(not provided)"}`,
    `PRD content:\n${values.prdContent}`,
    `Acceptance criteria:\n${values.acceptanceCriteria || "(not provided)"}`,
  ].join("\n\n");
  const fired = new Set(findings.map((f) => f.ruleId));
  const candidates = findings.length
    ? findings
        .map((f) => `- id=${f.id} rule=${f.ruleId} category=${f.category} severity=${f.severity}\n  title: ${f.title}\n  explanation: ${f.description}\n  evidence: ${f.evidence === null ? "null" : JSON.stringify(f.evidence)}`)
        .join("\n")
    : "(none — the rules found no candidates)";
  const notFired = ["R001", "R002", "R003", "R004", "R005", "R006", "R007", "R008", "R009", "R010"].filter((r) => !fired.has(r as PrdFinding["ruleId"]));
  return `SUBMITTED PRD FIELDS\n${fields}\n\nRULE CANDIDATES\n${candidates}\n\nRules that evaluated the PRD and found the concern already covered: ${notFired.join(", ") || "none"}. Do not re-raise those concerns.`;
}

export async function runAiReview(
  input: unknown,
  options: { provider?: AiTextProvider; clientKey?: string } = {},
): Promise<AiReviewResponse> {
  try {
    const { values } = parseAiReviewRequest(input);
    if (!checkRateLimit(options.clientKey ?? "anonymous")) {
      throw new AiReviewError("rate_limited", "Too many AI review requests. Please wait a minute.");
    }
    // Trusted recomputation: client-supplied candidates are never used as-is.
    const ruleFindings = analyzePrd(values).findings;
    const provider = options.provider ?? createLovableGatewayProvider();
    const text = await provider.complete({
      instructions,
      prompt: buildPrompt(values, ruleFindings),
      schema: modelOutputJsonSchema as unknown as Record<string, unknown>,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    return { ok: true, review: validateModelOutput(text, { values, ruleFindings, model: provider.model }) };
  } catch (error) {
    const e = error instanceof AiReviewError ? error : new AiReviewError("provider_error", "The AI review failed.");
    if (!(error instanceof AiReviewError)) console.error("AI review failed", error);
    return { ok: false, code: e.code, message: e.message };
  }
}
