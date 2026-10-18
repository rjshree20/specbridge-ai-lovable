import { createServerFn } from "@tanstack/react-start";
import type { AiReview } from "@/lib/ai-review";
import type { PrdFormValues } from "@/lib/prd-validation";

export const savePrdAnalysis = createServerFn({ method: "POST" })
  .inputValidator((data: { values: PrdFormValues; aiReview: AiReview | null }) => data)
  .handler(async ({ data }) => {
    const { storeAnalysis } = await import("@/lib/analysis-history.server");
    return storeAnalysis(data);
  });

export const fetchAnalysisHistory = createServerFn({ method: "GET" }).handler(async () => {
  const { listAnalyses } = await import("@/lib/analysis-history.server");
  return listAnalyses();
});

export const fetchSavedAnalysis = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { getAnalysis } = await import("@/lib/analysis-history.server");
    return getAnalysis(data.id);
  });

export const fetchDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const { getDashboardSummary } = await import("@/lib/analysis-history.server");
  return getDashboardSummary();
});
