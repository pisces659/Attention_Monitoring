import { serverApiFetch } from "@/lib/api-client-server";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import { sessions as mockSessions } from "@/mock";
import type { Session } from "@/types";

export async function getAllSessions(): Promise<Session[]> {
  if (!USE_API) {
    return [...mockSessions].sort((left, right) =>
      right.date.localeCompare(left.date)
    );
  }
  return serverApiFetch<Session[]>(API_ENDPOINTS.sessions);
}

export async function getSessionById(
  sessionId: string
): Promise<Session | undefined> {
  if (!USE_API) {
    return mockSessions.find((session) => session.id === sessionId);
  }
  try {
    return await serverApiFetch<Session>(API_ENDPOINTS.session(sessionId));
  } catch {
    return undefined;
  }
}

export async function getSessionsByPatientId(
  patientId: string
): Promise<Session[]> {
  if (!USE_API) {
    return mockSessions
      .filter((session) => session.patientId === patientId)
      .sort((left, right) => right.date.localeCompare(left.date));
  }
  const all = await getAllSessions();
  return all.filter((session) => session.patientId === patientId);
}

export async function getCompletedSessions(): Promise<Session[]> {
  const all = await getAllSessions();
  return all.filter((session) => session.status === "completed");
}

export async function getProcessingSessions(): Promise<Session[]> {
  const all = await getAllSessions();
  return all.filter(
    (session) =>
      session.status === "processing" || session.status === "in-progress"
  );
}
