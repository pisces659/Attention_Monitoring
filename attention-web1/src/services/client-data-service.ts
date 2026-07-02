import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import type { PatientSidebarItem } from "@/mock/patient-dashboard";
import { completedSessionOptions } from "@/mock/session-options";
import { sessions } from "@/mock";
import type { Patient, Session } from "@/types";

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  diagnosis?: string;
  notes?: string;
}

export interface SessionOption {
  id: string;
  label: string;
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  return apiFetch<Patient>(API_ENDPOINTS.patients, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchSidebarPatientsClient(): Promise<PatientSidebarItem[]> {
  if (!USE_API) {
    const { sidebarPatients } = await import("@/mock/patient-dashboard");
    return sidebarPatients;
  }

  try {
    return await apiFetch<PatientSidebarItem[]>(API_ENDPOINTS.sidebarPatients);
  } catch {
    const [patients, clinic] = await Promise.all([
      apiFetch<Patient[]>(API_ENDPOINTS.patients),
      apiFetch<{ name: string }>(API_ENDPOINTS.currentClinic).catch(() => ({
        name: "Clinic",
      })),
    ]);

    return patients.map((patient) => ({
      id: patient.id,
      displayId: patient.displayId || "",
      name: `${patient.firstName} ${patient.lastName}`,
      clinic: clinic.name || "My clinic",
      avatarInitials:
        patient.avatarInitials ||
        `${patient.firstName[0] ?? ""}${patient.lastName[0] ?? ""}`.toUpperCase(),
    }));
  }
}

export async function fetchCompletedSessionOptions(): Promise<SessionOption[]> {
  if (!USE_API) {
    return completedSessionOptions;
  }

  const allSessions = await apiFetch<Session[]>(API_ENDPOINTS.sessions);
  return allSessions
    .filter((session) => session.status === "completed")
    .map((session) => ({
      id: session.id,
      label: `${session.displayId || session.id} • ${session.patientName} • ${session.dateLabel}`,
    }));
}

export async function fetchAllSessionsClient(): Promise<Session[]> {
  if (!USE_API) {
    return sessions;
  }

  return apiFetch<Session[]>(API_ENDPOINTS.sessions);
}
