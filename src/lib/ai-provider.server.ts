// Provider adapter. All gateway-specific request logic lives here so a different
// provider (e.g. a direct OpenAI key when hosted on Replit) can be swapped in.
import { createOpenAI } from "@ai-sdk/openai";
import { jsonSchema, Output, streamText } from "ai";

import { AiReviewError } from "@/lib/ai-review";

export type StructuredCompletionRequest = {
  instructions: string;
  prompt: string;
  schema: Record<string, unknown>;
  maxOutputTokens: number;
};

export interface AiTextProvider {
  readonly name: string;
  readonly model: string;
  complete(request: StructuredCompletionRequest): Promise<string>;
}

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
export const DEFAULT_REVIEW_MODEL = "openai/gpt-6-astra";

export function createLovableGatewayProvider(model = DEFAULT_REVIEW_MODEL): AiTextProvider {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiReviewError("missing_configuration", "The AI gateway is not configured.");
  return {
    name: "lovable-ai-gateway",
    model,
    async complete(request) {
      const provider = createOpenAI({
        baseURL: GATEWAY_URL,
        apiKey,
        headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      });
      let streamError: unknown;
      const result = streamText({
        model: provider.responses(model),
        instructions: request.instructions,
        prompt: request.prompt,
        output: Output.object({ schema: jsonSchema(request.schema) }),
        maxOutputTokens: request.maxOutputTokens,
        maxRetries: 1,
        onError: ({ error }) => {
          streamError = error;
        },
        providerOptions: {
          openai: {
            store: false,
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      let text: string;
      try {
        text = await result.text;
      } catch (error) {
        throw classifyProviderError(streamError ?? error);
      }
      if (streamError) throw classifyProviderError(streamError);
      return text;
    },
  };
}

export function classifyProviderError(error: unknown): AiReviewError {
  if (error instanceof AiReviewError) return error;
  const e = error as { statusCode?: number; name?: string; message?: string; lastError?: unknown };
  if (e?.lastError) return classifyProviderError(e.lastError);
  const status = e?.statusCode;
  if (status === 401 || status === 403) return new AiReviewError("authentication_failed", "The AI provider rejected the request credentials.");
  if (status === 402) return new AiReviewError("credits_exhausted", "AI credits are exhausted for this workspace.");
  if (status === 429) return new AiReviewError("rate_limited", "The AI provider is rate limiting requests.");
  if (status === 408 || status === 504 || e?.name === "AbortError" || e?.name === "TimeoutError" || /timed? ?out/i.test(e?.message ?? "")) {
    return new AiReviewError("timeout", "The AI request timed out.");
  }
  return new AiReviewError("provider_error", "The AI provider returned an error.");
}
