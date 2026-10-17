import { describe, expect, it, vi } from "vitest";

import { initialPrdFormValues, type PrdFormValues } from "@/lib/prd-validation";
import { analyzePrd, InvalidPrdInputError } from "@/lib/prd-analyzer";

const neutralPrd = "This feature supports an internal workflow for reviewing structured requirements and documenting intended product behavior for delivery.";

function validInput(overrides: Partial<PrdFormValues> = {}): PrdFormValues {
  const suppliedPrd = overrides.prdContent ?? neutralPrd;
  const prdContent = suppliedPrd.trim().length >= 100
    ? suppliedPrd
    : `${suppliedPrd}\n${neutralPrd}`;
  return {
    ...initialPrdFormValues,
    featureTitle: "Synthetic workflow",
    featureDescription: "A synthetic test feature for evaluating requirement clarity.",
    ...overrides,
    prdContent,
  };
}

function rulesFor(input: PrdFormValues): string[] {
  return analyzePrd(input).findings.map(({ ruleId }) => ruleId);
}

describe("deterministic PRD analysis", () => {
  it("flags incomplete password-reset requirements and cites source text exactly", () => {
    const input = validInput({
      targetUsers: "Account owners",
      prdContent: "The account owner requests a password reset. The system sends a password-reset link to the account owner.",
      acceptanceCriteria: "Given a verified account, when password reset is requested, then a reset link is sent.",
    });

    const result = analyzePrd(input);
    const failure = result.findings.find(({ ruleId }) => ruleId === "R004");
    const lifecycle = result.findings.find(({ ruleId }) => ruleId === "R008");
    expect(failure?.evidence).toBe("password reset");
    expect(lifecycle?.evidence).toBe("password-reset link");
    expect(lifecycle?.status).toBe("needs_ai_review");
  });

  it("suppresses password-reset warnings when related failure and link lifecycle behavior are specified", () => {
    const input = validInput({
      targetUsers: "Account owners",
      prdContent: "The account owner requests a password reset. A password-reset link expires after 30 minutes and can only be used once. If email delivery fails, the system displays an error and allows retry. When the new password is saved successfully, the system confirms completion.",
      acceptanceCriteria: "Given an account owner, when reset succeeds, then a confirmation is displayed.",
    });

    const result = analyzePrd(input);
    expect(result.findings.some(({ ruleId }) => ruleId === "R004" || ruleId === "R008")).toBe(false);
    expect(result.findings.some(({ ruleId }) => ruleId === "R004" || ruleId === "R008")).toBe(false);
  });

  it("does not let unrelated CSV export failure text suppress a password-reset warning", () => {
    const input = validInput({
      targetUsers: "Account owners",
      prdContent: "The account owner requests a password reset. The reporting administrator can export a CSV file. If the CSV export fails, show a retry message.",
      acceptanceCriteria: "Given a reporting administrator, when CSV export succeeds, then a file is downloaded.",
    });
    expect(rulesFor(input)).toContain("R004");
  });

  it("flags a vague phrase without a measurable criterion", () => {
    const input = validInput({ prdContent: "The account owner expects the dashboard to load quickly." });
    expect(rulesFor(input)).toContain("R002");
  });

  it("suppresses a vague phrase when the same statement contains a measurable criterion", () => {
    const input = validInput({ prdContent: "The dashboard must load quickly within 2 seconds." });
    expect(rulesFor(input)).not.toContain("R002");
  });

  it("detects contradictory bounds only when they share a measure", () => {
    const contradiction = validInput({ prdContent: "Passwords must be at least 12 characters and no more than 8 characters." });
    const unrelated = validInput({ prdContent: "At least 12 accounts are supported and no more than 8 payment attempts are allowed." });
    expect(rulesFor(contradiction)).toContain("R007");
    expect(rulesFor(unrelated)).not.toContain("R007");
  });

  it("suppresses missing detail when target audience, failure, and successful outcome are specified", () => {
    const input = validInput({
      targetUsers: "Registered customers",
      prdContent: "Registered customers submit the request form. The form validates required fields. If submission fails, show an error and preserve entered values. On success, the system displays a confirmation.",
      acceptanceCriteria: "Given a registered customer, when the form is submitted, then confirmation is displayed.",
    });
    const rules = rulesFor(input);
    expect(rules).not.toContain("R001");
    expect(rules).not.toContain("R004");
    expect(rules).not.toContain("R006");
    expect(rules).not.toContain("R009");
    expect(rules).not.toContain("R010");
  });

  it("deduplicates rule identifiers and prioritizes at most seven findings", () => {
    const input = validInput({
      prdContent: "Users can request a password reset. It should be easy and seamless. If the email is invalid. The password-reset link appears in a form. Passwords must be at least 12 characters and no more than 8 characters. The system supports an email address, phone number, amount, quantity, date, file, username, verification code, postal code, and search query. The user can export the data.",
    });
    const result = analyzePrd(input);
    const ids = result.findings.map(({ id }) => id);
    expect(result.findings.length).toBeLessThanOrEqual(7);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.findings[0]?.severity).toBe("high");
    expect(result.rulesEvaluated).toBe(10);
  });

  it("allows zero findings when the reviewed specification is sufficiently explicit", () => {
    const input = validInput({
      targetUsers: "Registered customers",
      prdContent: "Registered customers can submit the form. The form validates required fields and blocks invalid submissions. The form requires a valid email address format. If form submission fails, the system shows an error and allows retry. On success, the system displays a confirmation.",
      acceptanceCriteria: "Given a registered customer, when the form is submitted, then the confirmation is displayed.",
    });
    expect(analyzePrd(input).findings).toEqual([]);
  });

  it("rejects invalid form input before evaluating rules", () => {
    expect(() => analyzePrd({ ...initialPrdFormValues, prdContent: "too short" })).toThrow(InvalidPrdInputError);
  });

  it("uses exact source evidence and null evidence only for absence-based advisory findings", () => {
    const source = "The interface should feel user-friendly for registered customers.";
    const finding = analyzePrd(validInput({ prdContent: source, targetUsers: "Registered customers" })).findings.find(({ ruleId }) => ruleId === "R002");
    const absenceFinding = analyzePrd(validInput()).findings.find(({ ruleId }) => ruleId === "R010");
    expect(finding?.evidence).toBe(source);
    expect(absenceFinding?.evidence).toBeNull();
  });

  it("returns identical findings for identical input and makes no AI/network calls", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const input = validInput({ prdContent: "The user can request a password reset. The password-reset link is sent." });
    const first = analyzePrd(input);
    const second = analyzePrd(input);
    expect(first).toEqual(second);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("flags incomplete conditions but accepts conditions with explicit outcomes", () => {
    const incomplete = validInput({ prdContent: "If the account is locked." });
    const complete = validInput({ prdContent: "If the account is locked, then show a message and block sign-in." });
    expect(rulesFor(incomplete)).toContain("R003");
    expect(rulesFor(complete)).not.toContain("R003");
  });
});