import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import { patientOptions } from "@/mock/patient-options";
import type { Patient, Session, SessionKind } from "@/types";

export interface PatientOption {
  id: string;
  label: string;
}

export interface CreateSessionInput {
  patientId: string;
  doctorNotes: string;
  sessionKind: SessionKind;
  sessionAt: string;
}

export async function fetchPatientOptions(): Promise<PatientOption[]> {
  if (!USE_API) {
    return patientOptions;
  }

  const patients = await apiFetch<Patient[]>(API_ENDPOINTS.patients);
  return patients.map((patient) => ({
    id: patient.id,
    label: `${patient.firstName} ${patient.lastName} (${patient.displayId || patient.id})`,
  }));
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  return apiFetch<Session>(API_ENDPOINTS.sessions, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface SessionUploadFiles {
  rawVideo?: File;
  annotatedVideo?: File;
  csvFile: File;
}

export async function uploadSessionFiles(
  sessionId: string,
  files: SessionUploadFiles
): Promise<Session> {
  const formData = new FormData();
  formData.append("csv_file", files.csvFile);
  if (files.rawVideo) {
    formData.append("raw_video", files.rawVideo);
  }
  if (files.annotatedVideo) {
    formData.append("annotated_video", files.annotatedVideo);
  }

  return apiFetch<Session>(API_ENDPOINTS.sessionUpload(sessionId), {
    method: "POST",
    body: formData,
  });
}

export async function createAndUploadSession(
  input: CreateSessionInput,
  files: SessionUploadFiles
): Promise<Session> {
  const session = await createSession(input);
  return uploadSessionFiles(session.id, files);
}

export function toDatetimeLocalValue(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function datetimeLocalToIso(value: string): string {
  return new Date(value).toISOString();
}
