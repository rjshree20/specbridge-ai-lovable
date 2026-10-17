import { AlertTriangle, ArrowUpRight, CheckCircle2, FileSearch2, ShieldCheck } from "lucide-react";

import type { PrdAnalysis } from "@/lib/prd-analyzer";
import type { FindingCategory, PrdFinding } from "@/lib/prd-analyzer";

const categoryDetails: Array<{ key: FindingCategory; label: string }> = [
  { key: "ambiguity", label: "Ambiguity" },
  { key: "missing_logic", label: "Missing logic" },
  { key: "undefined_inputs", label: "Undefined inputs" },
];

function formatMethod(method: string) {
  return method.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function AnalysisResults({
  analysis,
  error,
}: {
  analysis: PrdAnalysis | null;
  error?: string | null;
}) {
  const findings: PrdFinding[] = analysis?.findings ?? [];
  const groupedFindings = new Map<FindingCategory, PrdFinding[]>();
  for (const finding of findings) {
    const items = groupedFindings.get(finding.category) ?? [];
    items.push(finding);
    groupedFindings.set(finding.category, items);
  }

  return (
    <section className="flex flex-col gap-5" aria-labelledby="analysis-results-title" aria-live="polite">
      <header className="flex items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-xs uppercase text-primary">
            <FileSearch2 size={15} aria-hidden="true" /> Rule review
          </p>
          <h2 id="analysis-results-title" className="mt-1 text-lg font-semibold text-foreground">
            Potential gaps to review
          </h2>
          <p className="mt-1 max-w-sm text-sm leading-5 text-muted-foreground">
            Rule-based candidates are not confirmed defects.
          </p>
        </div>
        <div className="grid size-14 shrink-0 place-content-center rounded-md border border-border bg-card text-center" aria-label={`${findings.length} potential review candidates`}>
          <span className="font-display text-xl font-bold leading-5 text-primary">{analysis ? findings.length : "—"}</span>
          <span className="mt-1 font-mono text-[9px] uppercase text-muted-foreground">candidates</span>
        </div>
      </header>

      {!analysis && !error ? (
        <div className="flex min-h-56 flex-col items-center justify-center border-y border-border px-5 py-10 text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-full border border-border bg-background text-muted-foreground">
            <ShieldCheck size={21} aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Your review will appear here</h3>
          <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
            Run a validated PRD through the deterministic rule set to review potential gaps.
          </p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : findings.length === 0 ? (
        <div className="flex min-h-56 items-center gap-3 border-y border-border px-4 py-8" role="status">
          <CheckCircle2 className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">No potential gaps detected by the current rule set.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-border pb-3 text-xs text-muted-foreground" aria-label="Candidates by severity">
            {(["high", "medium", "low"] as const).map((severity) => (
              <span key={severity} className="capitalize">
                <strong className="text-foreground">{findings.filter((finding) => finding.severity === severity).length}</strong> {severity}
              </span>
            ))}
          </div>

          {categoryDetails.map(({ key, label }) => {
            const items = groupedFindings.get(key);
            if (!items?.length) return null;
            return (
              <section key={key} aria-labelledby={`analysis-group-${key}`}>
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                  <h3 id={`analysis-group-${key}`} className="text-sm font-semibold text-foreground">{label}</h3>
                  <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((finding) => (
                    <article key={finding.id} className="border border-border bg-card p-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-sm border border-border px-2 py-1 font-medium capitalize text-foreground">{finding.severity}</span>
                        <code className="font-mono text-primary">{finding.ruleId}</code>
                        <span className="ml-auto inline-flex items-center gap-1 text-right text-[10px] text-muted-foreground">
                          <ShieldCheck size={12} aria-hidden="true" /> Rule-based candidate — awaiting AI review
                        </span>
                      </div>
                      <h4 className="mt-3 text-sm font-semibold text-foreground">{finding.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{finding.description}</p>
                      {finding.evidence !== null && (
                        <div className="mt-4 border-l-2 border-primary pl-3">
                          <span className="font-mono text-[10px] uppercase text-muted-foreground">Exact supporting evidence</span>
                          <blockquote className="mt-1 break-words text-sm italic leading-6 text-foreground">{finding.evidence}</blockquote>
                        </div>
                      )}
                      <div className="mt-4 flex gap-2 text-sm leading-6 text-muted-foreground">
                        <ArrowUpRight className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                        <p><span className="font-medium text-foreground">Suggested clarification:</span> {finding.suggestedClarification}</p>
                      </div>
                      <footer className="mt-4 flex flex-wrap justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><AlertTriangle size={13} aria-hidden="true" /> {formatMethod(finding.detectionMethod)}</span>
                        <span>Detection strength: <strong className="text-foreground">{finding.detectionStrength}</strong></span>
                      </footer>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
          <p className="flex items-start gap-2 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> Findings are deterministic rule matches, not confirmed defects; review them in context before handoff.
          </p>
        </>
      )}
    </section>
  );
}