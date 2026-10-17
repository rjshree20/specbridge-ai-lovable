import { describe, expect, it } from "vitest";

import {
  initialPrdFormValues,
  validatePrdForm,
} from "@/lib/prd-validation";

describe("PRD form validation", () => {
  it("requires a feature title, feature description, and PRD content", () => {
    const errors = validatePrdForm({
      ...initialPrdFormValues,
      featureTitle: "   ",
      featureDescription: "",
      prdContent: "",
    });

    expect(errors.featureTitle).toBe("Enter a feature title.");
    expect(errors.featureDescription).toBe("Add a short description of the feature.");
    expect(errors.prdContent).toBe("Paste the PRD content to continue.");
  });

  it("does not require optional product, audience, or acceptance criteria", () => {
    const errors = validatePrdForm({
      ...initialPrdFormValues,
      featureTitle: "Synthetic sample feature",
      featureDescription: "A synthetic test description.",
      prdContent: "x".repeat(100),
    });

    expect(errors).toEqual({});
  });

  it("rejects PRD content shorter than 100 characters", () => {
    const errors = validatePrdForm({
      ...initialPrdFormValues,
      featureTitle: "Synthetic sample feature",
      featureDescription: "A synthetic test description.",
      prdContent: "x".repeat(99),
    });

    expect(errors.prdContent).toBe("Add at least 100 characters to the PRD content.");
  });

  it("accepts exactly 100 characters", () => {
    const errors = validatePrdForm({
      ...initialPrdFormValues,
      featureTitle: "Synthetic sample feature",
      featureDescription: "A synthetic test description.",
      prdContent: "x".repeat(100),
    });

    expect(errors).toEqual({});
  });

  it("accepts exactly 20,000 characters", () => {
    const errors = validatePrdForm({
      ...initialPrdFormValues,
      featureTitle: "Synthetic sample feature",
      featureDescription: "A synthetic test description.",
      prdContent: "x".repeat(20_000),
    });

    expect(errors).toEqual({});
  });

  it("rejects PRD content over 20,000 characters", () => {
    const errors = validatePrdForm({
      ...initialPrdFormValues,
      featureTitle: "Synthetic sample feature",
      featureDescription: "A synthetic test description.",
      prdContent: "x".repeat(20_001),
    });

    expect(errors.prdContent).toBe("PRD content must be 20,000 characters or fewer.");
  });

  it("counts whitespace toward the 20,000 character maximum", () => {
    const errors = validatePrdForm({
      ...initialPrdFormValues,
      featureTitle: "Synthetic sample feature",
      featureDescription: "A synthetic test description.",
      prdContent: `${"x".repeat(100)}${" ".repeat(19_901)}`,
    });

    expect(errors.prdContent).toBe("PRD content must be 20,000 characters or fewer.");
  });
});