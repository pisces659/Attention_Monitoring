import { sessions } from "@/mock";
import type { Session } from "@/types";

export function getAllSessions(): Session[] {
  return [...sessions].sort((left, right) =>
    right.date.localeCompare(left.date)
  );
}

export function getSessionById(sessionId: string): Session | undefined {
  return sessions.find((session) => session.id === sessionId);
}

export function getSessionsByPatientId(patientId: string): Session[] {
  return sessions
    .filter((session) => session.patientId === patientId)
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function getCompletedSessions(): Session[] {
  return getAllSessions().filter((session) => session.status === "completed");
}

export function getProcessingSessions(): Session[] {
  return getAllSessions().filter(
    (session) => session.status === "processing" || session.status === "in-progress"
  );
}
