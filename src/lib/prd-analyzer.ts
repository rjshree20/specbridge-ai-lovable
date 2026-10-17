import { validatePrdForm, type PrdFormValues } from "@/lib/prd-validation";

export type FindingCategory = "ambiguity" | "missing_logic" | "undefined_inputs";
export type FindingSeverity = "high" | "medium" | "low";
export type DetectionStrength = "High" | "Medium" | "Low";

export type PrdFinding = {
  id: string;
  ruleId: `R${string}`;
  category: FindingCategory;
  title: string;
  description: string;
  evidence: string | null;
  suggestedClarification: string;
  severity: FindingSeverity;
  detectionMethod: string;
  detectionStrength: DetectionStrength;
  status: "needs_ai_review";
};

export type PrdAnalysis = {
  findings: PrdFinding[];
  rulesEvaluated: 10;
  candidatesSuppressed: number;
  candidatesDeduplicated: number;
};

export class InvalidPrdInputError extends Error {
  readonly fieldErrors: ReturnType<typeof validatePrdForm>;

  constructor(fieldErrors: ReturnType<typeof validatePrdForm>) {
    super("The PRD form is invalid.");
    this.name = "InvalidPrdInputError";
    this.fieldErrors = fieldErrors;
  }
}

type Candidate = Omit<PrdFinding, "id" | "status">;
type SourceSentence = { field: keyof PrdFormValues; text: string };

const fieldsInOrder: Array<keyof PrdFormValues> = [
  "featureTitle",
  "productName",
  "featureDescription",
  "targetUsers",
  "prdContent",
  "acceptanceCriteria",
];
const rolePattern = /\b(?:administrator|admin|moderator|registered customer|customer|buyer|seller|vendor|merchant|account owner|team member|member|employee|manager|operator|patient|student|teacher|parent|guest|subscriber|agent|support representative)\b/i;
const genericActorPattern = /\b(?:user|users|person|people|they)\b(?![- ]friendly)/i;
const vaguePattern = /\b(?:fast|quick(?:ly)?|easy|easily|user[- ]friendly|appropriate|seamless)\b/i;
const measurablePattern = /\b\d+(?:\.\d+)?\s*(?:ms|milliseconds?|seconds?|secs?|minutes?|mins?|hours?|days?|characters?|steps?|attempts?|items?|records?|requests?)\b|\b(?:within|under|over|at least|at most|no more than|less than|greater than|up to)\s+\d+\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:seconds?|minutes?|hours?|days?|characters?|steps?|attempts?|items?)\b/i;
const conditionPattern = /\b(?:if|when|unless|in the event that)\b/i;
const outcomePattern = /\b(?:then|show(?:s|n)?|display(?:s|ed)?|return(?:s|ed)?|send(?:s|ing|t)?|notif(?:y|ies|ied)|retry|allow(?:s|ed)?|block(?:s|ed)?|reject(?:s|ed)?|redirect(?:s|ed)?|provide(?:s|d)?|store(?:s|d)?|save(?:s|d)?|log(?:s|ged)?|stop(?:s|ped)?|cancel(?:s|led|ed)?|reset(?:s)?|prompt(?:s|ed)?|will|should|must|can|receive(?:s|d)?|flag(?:s|ged)?|open(?:s|ed)?|close(?:s|d)?|create(?:s|d)?|update(?:s|d)?|delete(?:s|d)?|process(?:es|ed)?|continue(?:s|d)?|remove(?:s|d)?|navigate(?:s|d)?|validate(?:s|d)?|succeed(?:s|ed)?|fail(?:s|ed|s|ure)?|appear(?:s|ed)?|switch(?:es|ed)?|generate(?:s|d)?|render(?:s|ed)?|record(?:s|ed)?|start(?:s|ed)?|complete(?:s|d)?|confirm(?:s|ed)?|include(?:s|d)?|preserve(?:s|d)?|expire(?:s|d)?|result(?:s)?|trigger(?:s|ed)?|mark(?:s|ed)?)\b/i;
const failurePattern = /\b(?:fail(?:s|ed|ure)?|errors?|invalid|unavailable|timeout|timed out|declined|rejected|retry|retries|unable to|cannot|could not|expired|already[- ]used|no records?|no data|not found|unknown|replacement)\b/i;
// Output/report statements describe generated values, not user-entered inputs.
const outputSentencePattern = /\b(?:export|report|csv|file|output|download)\b.{0,60}\b(?:contains?|includes?|columns?|lists?)\b|\b(?:generates?|generated|calculated|derived|computed|is named|are named)\b/i;
const observablePattern = /\b(?:contains?|includes?|generates?|displays?|shows?|is named|are named|redirected|sees|downloadable|receives?)\b/i;
const generationFailurePattern = /\b(?:export|generation|download)\b.{0,60}\b(?:fails?|failed|failure|errors?|timeout)\b|\b(?:fails?|failure|errors?)\b.{0,60}\b(?:export|generat|download)/i;
const successPattern = /\b(?:success(?:ful(?:ly)?)?|completed?|confirmation|confirmed|saved|sent|received|created|updated|deleted|redirected|available|shown|displayed|result(?:s)? in|ends? with|download(?:ed)?)\b/i;
const actions = [
  { name: "password reset", pattern: /\b(?:password reset|reset(?:s|ting)? (?:the |a |their )?password)\b/i, related: /\b(?:passwords?|reset|recovery|links?|accounts?|delivery|emails?)\b/i, clarification: "Define responses for unknown accounts, expired reset links, and delivery failures, including safe messaging and retry behavior." },
  { name: "payment", pattern: /\b(?:payment|checkout|purchase|pay(?:s|ing)? for)\b/i, related: /\b(?:payment|checkout|purchase|pay|processor|order)\b/i, clarification: "Define responses for declined payments and processor timeouts, retry behavior, and whether the order remains unchanged." },
  { name: "upload", pattern: /\b(?:upload(?:s|ing)?|attach(?:es|ing)?)\b/i, related: /\b(?:upload|attach|file|attachment)\b/i, clarification: "Define responses for unsupported or oversized files and interrupted uploads, including whether partial uploads are removed." },
  { name: "form submission", pattern: /\b(?:submit(?:s|ting)? (?:the |a )?(?:form|request|application)|form submission)\b/i, related: /\b(?:form|submit|submission|request|application)\b/i, clarification: "Define field-level and submission failure behavior, the messages shown, and whether entered values are preserved." },
  { name: "export", pattern: /\b(?:export(?:s|ing)?|download(?:s|ing)?)\b/i, related: /\b(?:exports?|downloads?|files?|reports?|csv|records?|data)\b/i, clarification: "Define what the user sees if the export fails, including retry behavior and whether a partial file is retained." },
  { name: "action", pattern: /\b(?:invite|invitation|delete|remove|save|create|update)\b/i, related: /\b(?:invite|invitation|delete|remove|save|create|update)\b/i, clarification: "Define what the user sees if this action fails, including retry behavior and whether partial changes are retained." },
];
const inputKinds = [
  { name: "email address", mention: /\bemail(?: address)?s?\b/i, constraint: /\b(?:valid email|email format|email address.{0,45}(?:format|valid|max|min|length|unique|domain|required|optional)|email.{0,45}(?:format|valid|max|min|length|unique|domain|required|optional))\b/i },
  { name: "password", mention: /\bpasswords?\b/i, constraint: /\bpassword.{0,60}(?:minimum|maximum|min(?:imum)?|max(?:imum)?|length|characters?|uppercase|lowercase|digit|special character|symbol|required|optional|at least|at most|no more than)\b|\b(?:minimum|maximum|min(?:imum)?|max(?:imum)?|at least|at most)\b.{0,35}\bpassword\b/i },
  { name: "phone number", mention: /\bphone numbers?\b|\bmobile numbers?\b/i, constraint: /\b(?:phone|mobile number).{0,55}(?:format|country code|digits?|length|valid|international|required|optional)\b/i },
  { name: "amount", mention: /\b(?:amount|price|total|balance)s?\b/i, constraint: /\b(?:amount|price|total|balance).{0,55}(?:minimum|maximum|min|max|range|currency|decimal|positive|greater than|less than|at least|at most|no more than)\b/i },
  { name: "quantity", mention: /\bquantit(?:y|ies)\b/i, constraint: /\bquantity.{0,55}(?:minimum|maximum|min|max|range|positive|integer|at least|at most|no more than)\b/i },
  { name: "date", mention: /\bdates?\b/i, constraint: /\bdate.{0,55}(?:format|range|timezone|time zone|before|after|future|past|valid|required|optional)\b/i },
  { name: "file", mention: /\bfiles?\b|\battachments?\b/i, constraint: /\b(?:file|attachment).{0,55}(?:type|extension|size|maximum|minimum|limit|format|dimensions?|megabytes?|mb\b|kilobytes?|kb\b)\b/i },
  { name: "username", mention: /\busernames?\b/i, constraint: /\busername.{0,55}(?:minimum|maximum|min|max|length|characters?|allowed|unique|format|at least|at most)\b/i },
  { name: "verification code", mention: /\b(?:verification|authentication|one[- ]time) codes?\b/i, constraint: /\b(?:verification|authentication|one[- ]time) code.{0,55}(?:length|digits?|expires?|expiration|attempts?|format|valid|single use)\b/i },
  { name: "postal code", mention: /\bpostal codes?\b|\bzip codes?\b/i, constraint: /\b(?:postal|zip) code.{0,55}(?:format|length|characters?|country|valid|required|optional)\b/i },
  { name: "search query", mention: /\bsearch queries\b|\bsearch query\b|\bsearch term\b/i, constraint: /\bsearch (?:query|term).{0,55}(?:minimum|maximum|min|max|length|characters?|limit|empty|required|optional)\b/i },
];
const acceptancePattern = /\b(?:acceptance criteria|success criteria|testable criteria|given\b.{0,200}\bwhen\b.{0,200}\bthen\b)\b/i;
const explicitSuccessPattern = /\b(?:must|should|shall|will)\s+(?:show|display|return|send|save|create|update|delete|redirect|confirm|provide|allow|mark|generate|open|close|include|contain|preserve|receive|result in|complete)\b/i;
const formPattern = /\b(?:form|forms|registration|sign[- ]?up|checkout form|data entry|input fields?)\b/i;
const validationPattern = /\b(?:validat(?:e|es|ed|ion|ing)|required field|invalid input|valid format|allowed characters|must contain|must be (?:a|an|at least|no more than)|length limit|format requirement|field constraints?)\b/i;

function sentencesOf(values: PrdFormValues): SourceSentence[] {
  return fieldsInOrder.flatMap((field) => {
    const value = values[field];
    return value.split(/(?<=[.!?])\s+|\n+/).map((text) => ({ field, text: text.trim() })).filter(({ text }) => text.length > 0);
  });
}

function sourceText(values: PrdFormValues): string {
  return fieldsInOrder.map((field) => values[field]).filter(Boolean).join("\n");
}

function runRules(values: PrdFormValues): { candidates: Candidate[]; suppressed: number } {
  const allText = sourceText(values);
  const sentences = sentencesOf(values);
  const candidates: Candidate[] = [];
  let suppressed = 0;
  const add = (candidate: Candidate) => candidates.push(candidate);

  // R001: A role in any submitted field, especially Target Users, defines the actor.
  const actorMatch = allText.match(genericActorPattern)?.[0];
  if (actorMatch) {
    if (values.targetUsers.trim() && rolePattern.test(values.targetUsers) || rolePattern.test(allText)) suppressed += 1;
    else add({ ruleId: "R001", category: "undefined_inputs", title: "The user role is not defined", description: "The specification refers to a generic user, but does not identify the role or audience for this behavior.", evidence: actorMatch, suggestedClarification: "Specify which user role performs this action and any role-specific access or permissions.", severity: "medium", detectionMethod: "generic_actor_without_defined_role", detectionStrength: "Medium" });
  }

  // R002: The measurable threshold must appear in the same sentence as the vague term.
  const vagueSentences = sentences.filter(({ text }) => vaguePattern.test(text) && !measurablePattern.test(text));
  const vagueSuppressed = sentences.filter(({ text }) => vaguePattern.test(text) && measurablePattern.test(text)).length;
  suppressed += vagueSuppressed + Math.max(0, vagueSentences.length - 1);
  if (vagueSentences.length) add({ ruleId: "R002", category: "ambiguity", title: "A subjective quality needs a measurable definition", description: "The specification uses subjective language without a measurable criterion in the same statement.", evidence: vagueSentences[0]?.text ?? null, suggestedClarification: "Define an observable threshold or testable outcome for this quality.", severity: "medium", detectionMethod: "vague_term_without_nearby_measure", detectionStrength: "Medium" });

  // R003: A conditional must state an identifiable outcome after its trigger.
  const incompleteCondition = sentences.find(({ text }) => {
    if (!conditionPattern.test(text)) return false;
    const comma = text.indexOf(",");
    const response = comma >= 0 ? text.slice(comma + 1) : text;
    return !/\bthen\b/i.test(response) && !outcomePattern.test(response);
  });
  if (incompleteCondition) add({ ruleId: "R003", category: "missing_logic", title: "A stated condition has no defined outcome", description: "A conditional trigger is stated, but the specification does not describe the resulting system or user behavior.", evidence: incompleteCondition.text, suggestedClarification: "Describe the expected system response, resulting state, and user-visible feedback for this condition.", severity: "high", detectionMethod: "conditional_sentence_without_recognized_outcome", detectionStrength: "Medium" });

  // R004: Failure handling must relate to the same action, not an unrelated feature.
  const relevantAction = actions.map((action) => ({ action, sentence: sentences.find(({ text }) => action.pattern.test(text)) })).find(({ sentence }) => sentence);
  if (relevantAction?.sentence) {
    const hasRelatedFailure = sentences.some(({ text }) => relevantAction.action.related.test(text) && failurePattern.test(text));
    const isExport = relevantAction.action.name === "export";
    if (hasRelatedFailure && isExport && !sentences.some(({ text }) => generationFailurePattern.test(text))) {
      add({ ruleId: "R004", category: "missing_logic", title: "Export failure handling is partially specified", description: "Empty-data behavior is defined, but no behavior was recognized for an export that fails while generating or downloading the file.", evidence: relevantAction.sentence.text.match(relevantAction.action.pattern)?.[0] ?? null, suggestedClarification: "State what the user sees if file generation or download fails, and whether they can retry.", severity: "low", detectionMethod: "export_with_partial_failure_behavior", detectionStrength: "Low" });
    } else if (hasRelatedFailure) suppressed += 1;
    else add({ ruleId: "R004", category: "missing_logic", title: "Failure behavior is not specified", description: `The requirement includes “${relevantAction.action.name}” but no related failure or recovery path was recognized.`, evidence: relevantAction.sentence.text.match(relevantAction.action.pattern)?.[0] ?? null, suggestedClarification: relevantAction.action.clarification, severity: "high", detectionMethod: "recognized_action_without_related_failure_behavior", detectionStrength: "Medium" });
  }

  // R005: Only recognized, domain-relevant input fields are checked for constraints.
  const unconstrained = inputKinds.filter(({ name, mention, constraint }) => {
    let mentioned = sentences.some(({ text }) => mention.test(text) && !outputSentencePattern.test(text));
    if (mentioned && name === "email address" && /\b(?:registered|existing) (?:account|user|customer)|\bregistered account owner\b/i.test(allText)) {
      // Email used only to look up an existing account: standard format validation applies and is not implementation-critical.
      mentioned = /\b(?:new|change|update|add)\w* (?:their |the |an |a )?email\b/i.test(allText);
    }
    if (mentioned && name === "password") {
      const passwordIsOnlyForReset = /\b(?:password reset|reset(?:ting)? (?:the |a |their )?password)\b/i.test(allText)
        && !/\b(?:new password|password field|password (?:must|should|needs to|length|requirements?))\b/i.test(allText);
      if (passwordIsOnlyForReset) mentioned = false;
    }
    const defined = fieldsInOrder.some((field) => constraint.test(values[field]));
    if (mentioned && defined) suppressed += 1;
    return mentioned && !defined;
  });
  if (unconstrained.length) {
    const first = unconstrained[0];
    const evidence = first ? sentences.find(({ text }) => first.mention.test(text) && !outputSentencePattern.test(text))?.text.match(first.mention)?.[0] ?? null : null;
    add({ ruleId: "R005", category: "undefined_inputs", title: "Input constraints are unspecified", description: `The specification mentions ${unconstrained.map(({ name }) => name).join(", ")}, but no applicable format, range, or length constraints were recognized.`, evidence, suggestedClarification: "Specify accepted formats, minimum and maximum values or lengths, and any required or optional behavior for these inputs.", severity: "medium", detectionMethod: "recognized_input_without_field_constraint", detectionStrength: "Medium" });
  }

  // R006: Completion signals suppress only actions in their own sentence.
  const requestedActionPattern = /\b(?:can|will|must|should|may|is able to)\s+(?:request|submit|save|create|update|delete|reset|upload|invite|search|export|download|purchase|pay|change|add|remove|verify|select|send|cancel|open|close)\b/i;
  const actionEntries = sentences.flatMap(({ text }) => {
    const match = requestedActionPattern.exec(text);
    if (!match || match.index === undefined) return [];
    return [{ text, action: match[0], absoluteIndex: allText.indexOf(text) + match.index }];
  });
  const actionWithoutOutcome = actionEntries.find(({ action, absoluteIndex }) => {
    if (successPattern.test(allText.slice(absoluteIndex, absoluteIndex + 220))) return false;
    const verb = action.split(/\s+/).pop() ?? "";
    const stem = new RegExp(`\\b${verb.slice(0, Math.max(4, verb.length - 1))}`, "i");
    return !sentences.some(({ text }) => stem.test(text) && successPattern.test(text));
  });
  if (actionWithoutOutcome) add({ ruleId: "R006", category: "missing_logic", title: "The completion outcome is unclear", description: "The specification allows an action but does not state how completion is confirmed or what resulting state is expected.", evidence: actionWithoutOutcome.action, suggestedClarification: "State the successful end state and how the user or downstream system can confirm the action completed.", severity: "medium", detectionMethod: "recognized_user_action_without_nearby_success_signal", detectionStrength: "Medium" });
  else if (actionEntries.length) suppressed += 1;

  // R007: Compare numeric lower/upper bounds only within a single statement and measure.
  const conflictSentence = sentences.find(({ text }) => {
    const lower = [...text.matchAll(/\b(?:at least|minimum(?: of)?|no fewer than|greater than or equal to|over|above|more than)\s*(\d+)\s*([a-z%]+)/gi)];
    const upper = [...text.matchAll(/\b(?:at most|maximum(?: of)?|no more than|less than or equal to|under|below|less than|up to)\s*(\d+)\s*([a-z%]+)/gi)];
    return lower.some((minimum) => upper.some((maximum) => {
      const minMeasure = (minimum[2] ?? "").toLowerCase().replace(/s$/, "");
      const maxMeasure = (maximum[2] ?? "").toLowerCase().replace(/s$/, "");
      const hasNamedMeasure = /\b(?:password|age|amount|quantity|size|limit|duration)\b/i.test(text);
      return minMeasure === maxMeasure && (hasNamedMeasure || /\b(?:characters?|attempts?|times?|days?|hours?|minutes?|seconds?|items?|records?|requests?|users?|steps?|years?|bytes?|kb|mb|gb|percent|%)\b/i.test(text)) && Number(minimum[1]) > Number(maximum[1]);
    }));
  });
  if (conflictSentence) add({ ruleId: "R007", category: "ambiguity", title: "Numeric limits conflict in the same requirement", description: "A lower numeric bound is greater than an upper bound for what appears to be the same measure.", evidence: conflictSentence.text, suggestedClarification: "Reconcile the minimum and maximum values and state the intended inclusive or exclusive boundary.", severity: "high", detectionMethod: "same_statement_lower_bound_exceeds_upper_bound", detectionStrength: "High" });

  // R008: Recovery links need both a lifetime and reuse policy.
  const recoveryLinkPattern = /\b(?:password[- ]reset|reset|verification|verify|account activation)[- ]?(?:email )?(?:link|url)s?\b|\b(?:password reset|verification) links?\b/i;
  const linkMatch = allText.match(recoveryLinkPattern)?.[0];
  if (linkMatch) {
    const expiry = /\b(?:expires?|expiration|expiry|valid for|valid until|expiration time)\b/i.test(allText);
    const reuse = /\b(?:single[- ]use|one[- ]time|only be used once|cannot be reused|can't be reused|reus(?:e|able)|used more than once|multiple uses?)\b/i.test(allText);
    const missing: string[] = [];
    if (!expiry) missing.push("expiration");
    if (!reuse) missing.push("reuse");
    if (!missing.length) suppressed += 1;
    else add({ ruleId: "R008", category: "undefined_inputs", title: "Recovery-link lifecycle is incomplete", description: `A password-reset or verification link is specified, but its ${missing.join(" and ")} behavior is not defined.`, evidence: linkMatch, suggestedClarification: "Define how long each link remains valid and whether it can be used once or multiple times, including what happens after expiration.", severity: "high", detectionMethod: "recovery_link_without_expiry_or_reuse_policy", detectionStrength: "High" });
  }

  // R009: A named form needs explicitly stated validation behavior.
  const formMatch = allText.match(formPattern)?.[0];
  if (formMatch) {
    if (validationPattern.test(allText)) suppressed += 1;
    else add({ ruleId: "R009", category: "undefined_inputs", title: "Form validation behavior is not described", description: "A form or data-entry surface is mentioned, but no field-validation or invalid-submission requirements were recognized.", evidence: formMatch, suggestedClarification: "Specify required fields, how formats and values are validated, when errors appear, and whether invalid submissions are blocked.", severity: "medium", detectionMethod: "form_or_data_entry_without_validation_requirements", detectionStrength: "Medium" });
  }

  // R010: Missing criteria is a low-severity advisory; explicit success behavior is enough to suppress it.
  if (values.acceptanceCriteria.trim() || acceptancePattern.test(allText) || explicitSuccessPattern.test(allText) || sentences.filter(({ text }) => observablePattern.test(text)).length >= 2) suppressed += 1;
  else add({ ruleId: "R010", category: "missing_logic", title: "Acceptance criteria are not specified", description: "No acceptance criteria or explicit success conditions were found. This is an advisory, not an implementation blocker.", evidence: null, suggestedClarification: "Add one or more observable acceptance criteria that describe the expected behavior and result.", severity: "low", detectionMethod: "no_acceptance_criteria_or_explicit_success_condition", detectionStrength: "Low" });

  return { candidates, suppressed };
}

/** Runs the ten explainable rules in the browser after shared form validation; it makes no network or AI calls. */
export function analyzePrd(values: PrdFormValues): PrdAnalysis {
  const errors = validatePrdForm(values);
  if (Object.keys(errors).length > 0) throw new InvalidPrdInputError(errors);

  const { candidates, suppressed } = runRules(values);
  const seen = new Set<string>();
  let candidatesDeduplicated = 0;
  const unique = candidates.filter((candidate) => {
    const key = `${candidate.ruleId}:${candidate.category}`;
    if (seen.has(key)) {
      candidatesDeduplicated += 1;
      return false;
    }
    seen.add(key);
    return true;
  });
  const severityRank: Record<FindingSeverity, number> = { high: 0, medium: 1, low: 2 };
  const findings = unique
    .sort((left, right) => severityRank[left.severity] - severityRank[right.severity] || left.ruleId.localeCompare(right.ruleId))
    .slice(0, 7)
    .map((candidate) => ({ ...candidate, id: candidate.ruleId, status: "needs_ai_review" as const }));

  return { findings, rulesEvaluated: 10, candidatesSuppressed: suppressed, candidatesDeduplicated };
}