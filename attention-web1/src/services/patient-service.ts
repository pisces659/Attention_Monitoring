import { serverApiFetch } from "@/lib/api-client-server";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import { patients } from "@/mock";
import type { Patient } from "@/types";

export async function getPatients(): Promise<Patient[]> {
  if (!USE_API) {
    return patients;
  }
  return serverApiFetch<Patient[]>(API_ENDPOINTS.patients);
}

export async function getPatientById(patientId: string): Promise<Patient | undefined> {
  if (!USE_API) {
    return patients.find((patient) => patient.id === patientId);
  }

  try {
    return await serverApiFetch<Patient>(API_ENDPOINTS.patient(patientId));
  } catch {
    return undefined;
  }
}
