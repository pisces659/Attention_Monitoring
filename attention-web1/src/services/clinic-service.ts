import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import type { Clinic } from "@/types";

export async function getCurrentClinicClient(): Promise<Clinic | null> {
  if (!USE_API) {
    return null;
  }

  try {
    return await apiFetch<Clinic>(API_ENDPOINTS.currentClinic);
  } catch {
    return null;
  }
}

export async function createClinicClient(
  name: string,
  address = "",
  phone = ""
): Promise<Clinic> {
  return apiFetch<Clinic>(API_ENDPOINTS.clinics, {
    method: "POST",
    body: JSON.stringify({ name, address, phone }),
  });
}
