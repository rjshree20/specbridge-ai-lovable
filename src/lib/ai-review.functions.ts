import { createServerFn } from "@tanstack/react-start";

import type { AiReviewResponse } from "@/lib/ai-review";

// Input is validated (limits, form rules) inside runAiReview on the server.
export const reviewPrdWithAi = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }): Promise<AiReviewResponse> => {
    const { getRequestIP } = await import("@tanstack/react-start/server");
    const { runAiReview } = await import("@/lib/ai-review.server");
    const clientKey = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    return runAiReview(data, { clientKey });
  });
