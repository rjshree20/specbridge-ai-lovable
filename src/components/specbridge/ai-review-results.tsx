import { AlertTriangle, ChevronDown, HelpCircle, Loader2, MessageSquareText, Sparkles } from "lucide-react";

import type { AiConfidence, AiReview, AiSuggestedFinding, ReviewedRuleFinding } from "@/lib/ai-review";

export type AiReviewState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "completed"; review: AiReview }
  | { status: "unavailable"; message: string; detail?: string };

const categoryLabel = { ambiguity: "Ambiguity", missing_logic: "Missing logic", undefined_inputs: "Undefined inputs" } as const;

function Confidence({ value }: { value: AiConfidence | null }) {
  return (
    <span className="font-mono text-[10px] uppercase text-muted-foreground">
      AI confidence: {value ?? "none"} <span className="normal-case">(uncalibrated)</span>
    </span>
  );
}

function Evidence({ text }: { text: string | null }) {
  return text ? (
    <blockquote className="border-l-2 border-primary/50 bg-background px-3 py-2 text-xs italic leading-5 text-foreground">“{text}”</blockquote>
  ) : (
    <p className="text-xs text-muted-foreground">No direct quotation — this concerns missing information.</p>
  );
}

function ReviewedCard({ item }: { item: ReviewedRuleFinding }) {
  return (
    <article className="space-y-2 rounded-md border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase text-muted-foreground">
        <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-secondary-foreground">{item.finding.ruleId}</span>
        <span>{categoryLabel[item.finding.category]}</span>
        <span>· Severity {item.finding.severity}</span>
        <span>· Rule strength {item.finding.detectionStrength}</span>
      </div>
      <h4 className="text-sm font-semibold text-foreground">{item.finding.title}</h4>
      <p className="text-xs leading-5 text-muted-foreground"><strong className="text-foreground">AI assessment:</strong> {item.reason}</p>
      {item.whyItMatters && <p className="text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Why it matters:</strong> {item.whyItMatters}</p>}
      <Evidence text={item.finding.evidence} />
      <Confidence value={item.aiConfidence} />
    </article>
  );
}

function SuggestionCard({ item }: { item: AiSuggestedFinding }) {
  return (
    <article className="space-y-2 rounded-md border border-accent/40 bg-card p-3">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase text-muted-foreground">
        <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 text-accent">AI-suggested</span>
        <span>{categoryLabel[item.category]}</span>
        <span>· Severity {item.severity}</span>
      </div>
      <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
      <p className="text-xs leading-5 text-muted-foreground">{item.explanation}</p>
      <p className="text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Why it matters:</strong> {item.whyItMatters}</p>
      <Evidence text={item.evidence} />
      <p className="text-xs leading-5 text-foreground"><strong>Suggested clarification:</strong> {item.suggestedClarification}</p>
      <Confidence value={item.aiConfidence} />
    </article>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title} · {count}</h3>
      {children}
    </div>
  );
}

export function AiReviewResults({ state }: { state: AiReviewState }) {
  if (state.status === "idle") return null;
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-5" aria-labelledby="ai-review-title" aria-live="polite">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs uppercase text-primary"><Sparkles size={15} aria-hidden="true" /> AI review</p>
          <h2 id="ai-review-title" className="mt-1 text-lg font-semibold text-foreground">Reviewed findings</h2>
        </div>
        <span className="rounded-sm border border-border bg-card px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
          {state.status === "pending" ? "Pending" : state.status === "completed" ? "Completed" : "Unavailable"}
        </span>
      </header>

      {state.status === "pending" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Reviewing rule candidates with AI…
        </p>
      )}

      {state.status === "unavailable" && (
        <div className="flex items-start gap-2.5 border border-destructive/40 bg-card px-3 py-3 text-sm" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-medium text-foreground">{state.message}</p>
            {state.detail && <p className="mt-1 text-xs text-muted-foreground">{state.detail}</p>}
          </div>
        </div>
      )}

      {state.status === "completed" && <CompletedReview review={state.review} />}
    </section>
  );
}

function CompletedReview({ review }: { review: AiReview }) {
  const supported = review.reviewedFindings.filter((f) => f.verdict === "supported");
  const uncertain = review.reviewedFindings.filter((f) => f.verdict === "uncertain");
  const dismissed = review.reviewedFindings.filter((f) => f.verdict === "dismissed");
  return (
    <>
      {review.reviewedFindings.length === 0 && review.newSuggestions.length === 0 && (
        <p className="text-sm text-muted-foreground">The AI found no rule candidates to review and no additional important gaps.</p>
      )}
      <Group title="AI-supported findings" count={supported.length}>{supported.map((f) => <ReviewedCard key={f.finding.id} item={f} />)}</Group>
      <Group title="Uncertain — needs more context" count={uncertain.length}>{uncertain.map((f) => <ReviewedCard key={f.finding.id} item={f} />)}</Group>
      <Group title="New AI suggestions" count={review.newSuggestions.length}>{review.newSuggestions.map((s) => <SuggestionCard key={s.id} item={s} />)}</Group>
      {dismissed.length > 0 && (
        <details className="group rounded-md border border-border bg-card">
          <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dismissed candidates · {dismissed.length}
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="space-y-2 p-3 pt-0">{dismissed.map((f) => <ReviewedCard key={f.finding.id} item={f} />)}</div>
        </details>
      )}

      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <MessageSquareText size={14} aria-hidden="true" /> Engineering clarification questions
        </h3>
        {review.questions.map((q) => (
          <article key={q.priority} className="flex gap-3 rounded-md border border-border bg-card p-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary font-mono text-[11px] text-primary-foreground">{q.priority}</span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{q.question}</p>
              <p className="text-xs leading-5 text-muted-foreground">{q.whyItMatters}</p>
            </div>
          </article>
        ))}
        {review.noFurtherQuestionsNote && <p className="text-xs text-muted-foreground">{review.noFurtherQuestionsNote}</p>}
      </div>

      <footer className="flex items-start gap-2 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">
        <HelpCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        AI confidence is the model's own uncalibrated assessment, not a statistical probability. AI-supported findings may still be wrong; rule detection strength is reported separately. Quotations were checked to appear word-for-word in your input{review.rejectedItems > 0 ? `; ${review.rejectedItems} AI item(s) failed checks and were discarded` : ""}.
      </footer>
    </>
  );
}
