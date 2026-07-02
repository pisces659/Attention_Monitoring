import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import type { Clinician } from "@/types";

export interface CreateDoctorInput {
  fullName: string;
  email: string;
  title?: string;
  specialization?: string;
}

export async function listDoctorsClient(): Promise<Clinician[]> {
  if (!USE_API) {
    return [];
  }

  return apiFetch<Clinician[]>(API_ENDPOINTS.doctors);
}

export async function createDoctorClient(
  input: CreateDoctorInput
): Promise<Clinician> {
  return apiFetch<Clinician>(API_ENDPOINTS.doctors, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
