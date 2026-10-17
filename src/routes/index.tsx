import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sun,
} from "lucide-react";

import { AnalysisResults } from "@/components/specbridge/analysis-results";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  initialPrdFormValues,
  validatePrdForm,
  type PrdFieldErrors,
  type PrdFormValues,
} from "@/lib/prd-validation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpecBridge AI — PRD Review Workspace" },
      {
        name: "description",
        content:
          "Prepare product requirements for engineering handoff in the SpecBridge AI PRD review workspace.",
      },
      { property: "og:title", content: "SpecBridge AI — PRD Review Workspace" },
      {
        property: "og:description",
        content:
          "A structured checkpoint for preparing clear product requirements before engineering handoff.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SpecBridgeWorkspace,
});

function SpecBridgeWorkspace() {
  const [values, setValues] = useState<PrdFormValues>({ ...initialPrdFormValues });
  const [errors, setErrors] = useState<PrdFieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const prdLength = values.prdContent.length;

  function updateField(field: keyof PrdFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSubmitted(false);
  }

  function clearForm() {
    setValues({ ...initialPrdFormValues });
    setErrors({});
    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validatePrdForm(values);
    setErrors(validationErrors);
    setSubmitted(false);

    if (Object.keys(validationErrors).length > 0) {
      const firstInvalid = Object.keys(validationErrors)[0];
      if (firstInvalid) document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSubmitted(true);
  }

  const fields = [
    {
      id: "featureTitle",
      label: "Feature title",
      required: true,
      placeholder: "e.g. Saved payment methods",
    },
    {
      id: "productName",
      label: "Product name",
      required: false,
      placeholder: "e.g. Merchant Portal",
    },
  ] as const;

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        <aside className="workspace-sidebar" aria-label="Main navigation">
          <a className="workspace-brand" href="#main-content" aria-label="SpecBridge AI home">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <FileCheck2 size={19} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-base font-bold leading-5">SpecBridge AI</span>
              <span className="block font-mono text-[10px] uppercase leading-4 text-sidebar-foreground/70">
                Product workspace
              </span>
            </span>
          </a>

          <div className="workspace-nav-label">Workspace</div>
          <nav className="workspace-nav" aria-label="Workspace">
            <a className="workspace-nav-item workspace-nav-active" href="#main-content" aria-current="page">
              <ClipboardList size={17} aria-hidden="true" />
              <span>New Analysis</span>
            </a>
            <span className="workspace-nav-item workspace-nav-disabled" aria-disabled="true">
              <FileText size={17} aria-hidden="true" />
              <span>Analysis History</span>
              <span className="workspace-soon">Coming soon</span>
            </span>
            <span className="workspace-nav-item workspace-nav-disabled" aria-disabled="true">
              <LayoutDashboard size={17} aria-hidden="true" />
              <span>Admin Dashboard</span>
              <span className="workspace-soon">Coming soon</span>
            </span>
          </nav>

          <div className="workspace-sidebar-bottom">
            <div className="border-t border-sidebar-foreground/15 px-3 py-5 text-xs leading-5 text-sidebar-foreground/75">
              <strong className="mb-1 block font-medium text-sidebar-foreground">
                Built for the handoff moment.
              </strong>
              A clear checkpoint between product intent and engineering work.
            </div>
            <div className="flex items-center gap-2.5 border-t border-sidebar-foreground/15 px-3 pt-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-foreground/10 font-mono text-[10px] text-sidebar-foreground">
                SB
              </span>
              <span className="text-xs text-sidebar-foreground">
                Product workspace
                <span className="block text-[11px] text-sidebar-foreground/65">Input checkpoint</span>
              </span>
            </div>
          </div>
        </aside>

        <div className="workspace-main">
          <header className="workspace-topbar">
            <nav className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={13} aria-hidden="true" />
              <span className="truncate font-medium text-foreground">New Analysis</span>
            </nav>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <LockKeyhole size={13} aria-hidden="true" />
                Structured input only
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-md bg-card"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                onClick={() => setDarkMode((mode) => !mode)}
              >
                {darkMode ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
              </Button>
            </div>
          </header>

          <main id="main-content" className="workspace-content">
            <section className="workspace-intro" aria-labelledby="page-title">
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase text-primary">Product → Engineering · 01</p>
                <h1 id="page-title" className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                  Start with a clear spec.
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Add feature context and your PRD to prepare for a more confident engineering handoff.
                </p>
              </div>
              <div className="mt-1 inline-flex w-fit shrink-0 items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase text-muted-foreground sm:mb-1">
                <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">1</span>
                Requirement review
              </div>
            </section>

            <div className="workspace-grid">
              <section className="min-w-0 overflow-hidden rounded-md border border-border bg-card" aria-labelledby="form-title">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                      <FileText size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h2 id="form-title" className="text-sm font-semibold text-foreground">Feature specification</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">Add the essentials. Context is optional.</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    <span className="text-accent">*</span> Required
                  </span>
                </div>

                <form className="space-y-5 p-4 sm:p-6" onSubmit={handleSubmit} noValidate>
                  {submitted && (
                    <div className="flex items-start gap-2.5 border border-primary/30 bg-secondary px-3 py-3 text-sm text-secondary-foreground" role="status">
                      <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <p>
                        <strong className="font-semibold">Your PRD passed validation.</strong>{" "}
                        Analysis is not connected yet, so no findings have been generated.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-4">
                    {fields.map((field) => (
                      <div className="min-w-0 space-y-2" key={field.id}>
                        <label className="text-xs font-semibold text-foreground" htmlFor={field.id}>
                          {field.label}{" "}
                          {field.required ? <span className="text-accent">*</span> : <span className="font-normal text-muted-foreground">Optional</span>}
                        </label>
                        <Input
                          id={field.id}
                          value={values[field.id]}
                          placeholder={field.placeholder}
                          autoComplete="off"
                          aria-invalid={Boolean(errors[field.id])}
                          aria-describedby={errors[field.id] ? `${field.id}-error` : undefined}
                          onChange={(event) => updateField(field.id, event.target.value)}
                          className={errors[field.id] ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {errors[field.id] && <p className="text-xs text-destructive" id={`${field.id}-error`}>{errors[field.id]}</p>}
                      </div>
                    ))}

                    <div className="min-w-0 space-y-2 sm:col-span-2">
                      <label className="text-xs font-semibold text-foreground" htmlFor="featureDescription">
                        Feature description <span className="text-accent">*</span>
                      </label>
                      <Textarea
                        id="featureDescription"
                        value={values.featureDescription}
                        onChange={(event) => updateField("featureDescription", event.target.value)}
                        placeholder="Describe the capability, the problem it addresses, and its intended outcome."
                        aria-invalid={Boolean(errors.featureDescription)}
                        aria-describedby={errors.featureDescription ? "featureDescription-error" : undefined}
                        className={`min-h-24 resize-y ${errors.featureDescription ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {errors.featureDescription && <p className="text-xs text-destructive" id="featureDescription-error">{errors.featureDescription}</p>}
                    </div>

                    <div className="min-w-0 space-y-2 sm:col-span-2">
                      <label className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-foreground" htmlFor="targetUsers">
                        Target users <span className="font-normal text-muted-foreground">Optional</span>
                      </label>
                      <Input
                        id="targetUsers"
                        value={values.targetUsers}
                        onChange={(event) => updateField("targetUsers", event.target.value)}
                        placeholder="e.g. Registered customers managing shared accounts"
                      />
                    </div>

                    <div className="min-w-0 space-y-2 sm:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-foreground" htmlFor="prdContent">
                          PRD content <span className="text-accent">*</span>
                        </label>
                        <span className="font-mono text-[10px] text-muted-foreground" aria-live="polite">
                          {prdLength.toLocaleString()} / 20,000 characters
                        </span>
                      </div>
                      <Textarea
                        id="prdContent"
                        value={values.prdContent}
                        onChange={(event) => updateField("prdContent", event.target.value)}
                        placeholder="Paste the product requirements for this feature here…"
                        maxLength={20_000}
                        aria-invalid={Boolean(errors.prdContent)}
                        aria-describedby={errors.prdContent ? "prdContent-error prdContent-hint" : "prdContent-hint"}
                        className={`min-h-56 resize-y leading-6 ${errors.prdContent ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                        {errors.prdContent ? (
                          <p className="text-xs text-destructive" id="prdContent-error">{errors.prdContent}</p>
                        ) : <span />}
                        <p id="prdContent-hint" className="ml-auto text-right text-[11px] text-muted-foreground">
                          100–20,000 characters
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-2 sm:col-span-2">
                      <label className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-foreground" htmlFor="acceptanceCriteria">
                        Acceptance criteria <span className="font-normal text-muted-foreground">Optional</span>
                      </label>
                      <Textarea
                        id="acceptanceCriteria"
                        value={values.acceptanceCriteria}
                        onChange={(event) => updateField("acceptanceCriteria", event.target.value)}
                        placeholder="Add the conditions that define a successful outcome."
                        className="min-h-24 resize-y"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <Button type="button" variant="ghost" onClick={clearForm} className="w-full sm:w-auto">
                      <RotateCcw aria-hidden="true" />
                      Clear form
                    </Button>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
                      Analyze PRD
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </div>
                </form>
              </section>

              <aside className="min-w-0 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0" aria-label="PRD analysis results">
                <AnalysisResults findings={[]} />
              </aside>
            </div>

            <footer className="mt-9 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} aria-hidden="true" />
                A structured input checkpoint for product teams
              </span>
              <span>No reports are saved in this milestone</span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}