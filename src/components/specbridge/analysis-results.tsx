import { ArrowUpRight, FileSearch2, ShieldCheck } from "lucide-react";

export type FindingCategory = "ambiguity" | "missing_logic" | "undefined_inputs";
export type FindingSeverity = "high" | "medium" | "low";
export type DetectionStrength = "High" | "Medium" | "Low";

export type AnalysisFinding = {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  evidence: string;
  suggestedClarification: string;
  detectionStrength: DetectionStrength;
};

const categoryLabels: Record<FindingCategory, string> = {
  ambiguity: "Ambiguity",
  missing_logic: "Missing logic",
  undefined_inputs: "Undefined inputs",
};

export function AnalysisResults({ findings }: { findings: AnalysisFinding[] }) {
  return (
    <section
      className="flex flex-col gap-5"
      aria-labelledby="analysis-results-title"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
          <FileSearch2 size={19} aria-hidden="true" />
        </div>
        <div>
          <p className="font-mono text-xs uppercase text-muted-foreground">Engineering handoff</p>
          <h2 id="analysis-results-title" className="text-lg font-semibold text-foreground">
            Review results
          </h2>
        </div>
      </div>

      {findings.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center border-y border-border px-5 py-10 text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-full border border-border bg-background text-muted-foreground">
            <ShieldCheck size={21} aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Your review will appear here</h3>
          <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
            Findings will include their category, severity, supporting text, and a question to bring to your team.
          </p>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            Analysis is not connected yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {findings.map((finding) => (
            <article key={finding.id} className="border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-sm bg-secondary px-2 py-1 font-medium text-secondary-foreground">
                  {categoryLabels[finding.category]}
                </span>
                <span className="rounded-sm border border-border px-2 py-1 text-muted-foreground">
                  {finding.severity} severity
                </span>
                <span className="ml-auto text-muted-foreground">
                  {finding.detectionStrength} strength
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{finding.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{finding.description}</p>
              <blockquote className="mt-4 border-l-2 border-primary pl-3 text-sm italic leading-6 text-foreground">
                {finding.evidence}
              </blockquote>
              <div className="mt-4 flex gap-2 text-sm leading-6 text-muted-foreground">
                <ArrowUpRight className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                <p>{finding.suggestedClarification}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}