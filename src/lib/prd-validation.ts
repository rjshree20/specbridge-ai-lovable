import { z } from "zod";

export const prdFormFields = [
  "featureTitle",
  "productName",
  "featureDescription",
  "targetUsers",
  "prdContent",
  "acceptanceCriteria",
] as const;

export const initialPrdFormValues = {
  featureTitle: "",
  productName: "",
  featureDescription: "",
  targetUsers: "",
  prdContent: "",
  acceptanceCriteria: "",
};

export type PrdFormValues = typeof initialPrdFormValues;
export type PrdFieldErrors = Partial<Record<keyof PrdFormValues, string>>;

export const prdFormSchema = z.object({
  featureTitle: z.string().trim().min(1, "Enter a feature title."),
  productName: z.string(),
  featureDescription: z
    .string()
    .trim()
    .min(1, "Add a short description of the feature."),
  targetUsers: z.string(),
  prdContent: z
    .string()
    .refine((value) => value.length <= 20_000, {
      message: "PRD content must be 20,000 characters or fewer.",
    })
    .refine((value) => value.trim().length > 0, {
      message: "Paste the PRD content to continue.",
    })
    .refine((value) => value.trim().length >= 100, {
      message: "Add at least 100 characters to the PRD content.",
    }),
  acceptanceCriteria: z.string(),
});

export function validatePrdForm(values: PrdFormValues): PrdFieldErrors {
  const parsed = prdFormSchema.safeParse(values);
  if (parsed.success) return {};

  const errors: PrdFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && prdFormFields.includes(field as (typeof prdFormFields)[number])) {
      errors[field as keyof PrdFormValues] ??= issue.message;
    }
  }
  return errors;
}