import { serverApiFetch } from "@/lib/api-client-server";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import type { AnalyticsSummary } from "@/types";

import { loadSampleAnalytics } from "./csv-parser";

export async function getAnalyticsSummary(
  sessionId?: string
): Promise<AnalyticsSummary> {
  if (!USE_API) {
    return loadSampleAnalytics();
  }
  return serverApiFetch<AnalyticsSummary>(API_ENDPOINTS.analyticsSummary(sessionId));
}
