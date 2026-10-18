// Platform-neutral AI review contract: request limits, model-output schema and
// output validation. Used by the browser (types), the server and unit tests.
import { z } from "zod";

import type { FindingCategory, FindingSeverity, PrdFinding } from "@/lib/prd-analyzer";
import { prdFormFields, validatePrdForm, type PrdFormValues } from "@/lib/prd-validation";

export const AI_REVIEW_UNAVAILABLE_MESSAGE = "Rule-based review completed. AI review is temporarily unavailable.";

export const fieldLimits: Record<keyof PrdFormValues, number> = {
  featureTitle: 200,
  productName: 200,
  featureDescription: 2_000,
  targetUsers: 500,
  prdContent: 20_000,
  acceptanceCriteria: 5_000,
};

export const MAX_NEW_SUGGESTIONS = 3;
export const MAX_QUESTIONS = 3;
const MIN_EVIDENCE_LENGTH = 8;
const categories: FindingCategory[] = ["ambiguity", "missing_logic", "undefined_inputs"];
const ruleIds = ["R001", "R002", "R003", "R004", "R005", "R006", "R007", "R008", "R009", "R010"];

export type AiVerdict = "supported" | "dismissed" | "uncertain";
export type AiConfidence = "high" | "medium" | "low";

export type ReviewedRuleFinding = {
  finding: PrdFinding;
  verdict: AiVerdict;
  aiConfidence: AiConfidence | null;
  reason: string;
  whyItMatters: string | null;
  origin: "deterministic_rule";
};

export type AiSuggestedFinding = {
  id: string;
  category: FindingCategory;
  title: string;
  explanation: string;
  evidence: string | null;
  whyItMatters: string;
  suggestedClarification: string;
  severity: FindingSeverity;
  aiConfidence: AiConfidence;
  origin: "ai_suggested";
};

export type EngineeringQuestion = { priority: number; question: string; whyItMatters: string };

export type AiReview = {
  model: string;
  reviewedFindings: ReviewedRuleFinding[];
  newSuggestions: AiSuggestedFinding[];
  questions: EngineeringQuestion[];
  noFurtherQuestionsNote: string | null;
  rejectedItems: number;
};

export type AiReviewErrorCode =
  | "invalid_input"
  | "missing_configuration"
  | "authentication_failed"
  | "rate_limited"
  | "credits_exhausted"
  | "timeout"
  | "malformed_output"
  | "empty_response"
  | "provider_error";

export type AiReviewResponse =
  | { ok: true; review: AiReview }
  | { ok: false; code: AiReviewErrorCode; message: string };

export class AiReviewError extends Error {
  constructor(readonly code: AiReviewErrorCode, message: string) {
    super(message);
    this.name = "AiReviewError";
  }
}

// ---------- Request ----------
const valuesSchema = z.object(
  Object.fromEntries(prdFormFields.map((f) => [f, z.string().max(fieldLimits[f])])) as Record<
    keyof PrdFormValues,
    z.ZodString
  >,
).strict();

export const aiReviewRequestSchema = z
  .object({
    values: valuesSchema,
    clientFindingIds: z.array(z.string().max(60)).max(10),
  })
  .strict();

export type AiReviewRequest = z.infer<typeof aiReviewRequestSchema>;

export function parseAiReviewRequest(input: unknown): AiReviewRequest {
  const parsed = aiReviewRequestSchema.safeParse(input);
  if (!parsed.success) throw new AiReviewError("invalid_input", "The submitted PRD is malformed or too large.");
  if (Object.keys(validatePrdForm(parsed.data.values)).length > 0) {
    throw new AiReviewError("invalid_input", "The submitted PRD does not meet the form requirements.");
  }
  return parsed.data;
}

// ---------- Model output (strict JSON schema sent to the model) ----------
const str = { type: "string" };
const nullableStr = { type: ["string", "null"] };
const confidenceEnum = { type: "string", enum: ["high", "medium", "low"] };

export const modelOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["verdicts", "newSuggestions", "questions", "noFurtherQuestionsNote"],
  properties: {
    verdicts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["findingId", "verdict", "confidence", "reason", "whyItMatters"],
        properties: {
          findingId: str,
          verdict: { type: "string", enum: ["supported", "dismissed", "uncertain"] },
          confidence: confidenceEnum,
          reason: str,
          whyItMatters: nullableStr,
        },
      },
    },
    newSuggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "category", "title", "explanation", "evidence", "whyItMatters",
          "suggestedClarification", "severity", "confidence", "relatedRuleId",
        ],
        properties: {
          category: { type: "string", enum: categories },
          title: str,
          explanation: str,
          evidence: nullableStr,
          whyItMatters: str,
          suggestedClarification: str,
          severity: { type: "string", enum: ["high", "medium", "low"] },
          confidence: confidenceEnum,
          relatedRuleId: nullableStr,
        },
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["priority", "question", "whyItMatters"],
        properties: { priority: { type: "integer" }, question: str, whyItMatters: str },
      },
    },
    noFurtherQuestionsNote: nullableStr,
  },
} as const;

// Loose parse; individual items are validated below so one bad item is dropped, not the whole review.
const text = (max: number) => z.string().trim().min(1).max(max);
const rawOutputSchema = z.object({
  verdicts: z.array(z.unknown()).max(20),
  newSuggestions: z.array(z.unknown()).max(10),
  questions: z.array(z.unknown()).max(10),
  noFurtherQuestionsNote: z.string().max(500).nullable(),
});
const verdictSchema = z.object({
  findingId: z.string(),
  verdict: z.enum(["supported", "dismissed", "uncertain"]),
  confidence: z.enum(["high", "medium", "low"]),
  reason: text(600),
  whyItMatters: z.string().max(600).nullable(),
});
const suggestionSchema = z.object({
  category: z.enum(["ambiguity", "missing_logic", "undefined_inputs"]),
  title: text(160),
  explanation: text(600),
  evidence: z.string().max(600).nullable(),
  whyItMatters: text(600),
  suggestedClarification: text(600),
  severity: z.enum(["high", "medium", "low"]),
  confidence: z.enum(["high", "medium", "low"]),
  relatedRuleId: z.string().nullable(),
});
const questionSchema = z.object({ priority: z.number().int(), question: text(400), whyItMatters: text(600) });

const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function evidenceAppearsInInput(evidence: string, values: PrdFormValues) {
  if (evidence.trim().length < MIN_EVIDENCE_LENGTH) return false;
  return prdFormFields.some((field) => values[field].includes(evidence));
}

export function validateModelOutput(
  rawText: string,
  ctx: { values: PrdFormValues; ruleFindings: PrdFinding[]; model: string },
): AiReview {
  if (!rawText || !rawText.trim()) throw new AiReviewError("empty_response", "The AI returned an empty response.");
  let json: unknown;
  try {
    json = JSON.parse(rawText.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new AiReviewError("malformed_output", "The AI response was not valid JSON.");
  }
  const parsed = rawOutputSchema.safeParse(json);
  if (!parsed.success) throw new AiReviewError("malformed_output", "The AI response did not match the expected format.");
  let rejected = 0;

  // Verdicts: only for findings the trusted server engine produced; first verdict wins.
  const verdicts = new Map<string, z.infer<typeof verdictSchema>>();
  for (const item of parsed.data.verdicts) {
    const v = verdictSchema.safeParse(item);
    if (!v.success || !ctx.ruleFindings.some((f) => f.id === v.data.findingId) || verdicts.has(v.data.findingId)) {
      rejected++;
      continue;
    }
    verdicts.set(v.data.findingId, v.data);
  }
  const reviewedFindings: ReviewedRuleFinding[] = ctx.ruleFindings.map((finding) => {
    const v = verdicts.get(finding.id);
    return v
      ? { finding, verdict: v.verdict, aiConfidence: v.confidence, reason: v.reason, whyItMatters: v.whyItMatters, origin: "deterministic_rule" }
      : { finding, verdict: "uncertain", aiConfidence: null, reason: "The AI did not return a verdict for this candidate.", whyItMatters: null, origin: "deterministic_rule" };
  });

  // New suggestions: valid category, exact evidence, no duplicates, no re-raising rules that did not fire.
  const firedRules = new Set(ctx.ruleFindings.map((f) => f.ruleId));
  const seenTitles = new Set(ctx.ruleFindings.map((f) => normalize(f.title)));
  const seenEvidence = new Set(ctx.ruleFindings.flatMap((f) => (f.evidence ? [f.evidence] : [])));
  const newSuggestions: AiSuggestedFinding[] = [];
  for (const item of parsed.data.newSuggestions) {
    const s = suggestionSchema.safeParse(item);
    if (!s.success) { rejected++; continue; }
    const d = s.data;
    const evidence = d.evidence && d.evidence.trim() ? d.evidence : null;
    const related = d.relatedRuleId?.trim().toUpperCase() || null;
    const invalid =
      (evidence !== null && !evidenceAppearsInInput(evidence, ctx.values)) ||
      (related !== null && ruleIds.includes(related) && !firedRules.has(related as PrdFinding["ruleId"])) ||
      (related !== null && firedRules.has(related as PrdFinding["ruleId"])) ||
      seenTitles.has(normalize(d.title)) ||
      (evidence !== null && seenEvidence.has(evidence));
    if (invalid || newSuggestions.length >= MAX_NEW_SUGGESTIONS) { rejected++; continue; }
    seenTitles.add(normalize(d.title));
    if (evidence) seenEvidence.add(evidence);
    newSuggestions.push({
      id: `AI-${newSuggestions.length + 1}`,
      category: d.category,
      title: d.title,
      explanation: d.explanation,
      evidence,
      whyItMatters: d.whyItMatters,
      suggestedClarification: d.suggestedClarification,
      severity: d.severity,
      aiConfidence: d.confidence,
      origin: "ai_suggested",
    });
  }

  const questions: EngineeringQuestion[] = [];
  const seenQuestions = new Set<string>();
  for (const item of parsed.data.questions) {
    const q = questionSchema.safeParse(item);
    if (!q.success || seenQuestions.has(normalize(q.data.question)) || questions.length >= MAX_QUESTIONS) { rejected++; continue; }
    seenQuestions.add(normalize(q.data.question));
    questions.push(q.data);
  }
  questions.sort((a, b) => a.priority - b.priority);
  questions.forEach((q, i) => (q.priority = i + 1));

  return {
    model: ctx.model,
    reviewedFindings,
    newSuggestions,
    questions,
    noFurtherQuestionsNote:
      questions.length < 2
        ? parsed.data.noFurtherQuestionsNote?.trim() || "No additional engineering clarification was identified as necessary."
        : null,
    rejectedItems: rejected,
  };
}
