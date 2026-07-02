import type { Clinician } from "@/types";

import { serverApiFetch } from "@/lib/api-client-server";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import { currentClinician } from "@/mock";

interface AuthMeResponse {
  user: { email: string; name: string; role: string };
  clinician: Clinician;
  clinicId: string | null;
}

export async function getCurrentClinician(): Promise<Clinician> {
  if (!USE_API) {
    return currentClinician;
  }

  const data = await serverApiFetch<AuthMeResponse>(API_ENDPOINTS.authMe);
  return data.clinician;
}
