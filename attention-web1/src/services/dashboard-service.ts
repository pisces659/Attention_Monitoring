import { patients, sessions } from "@/mock";
import type { DashboardSummary, Patient, Session, TrendPoint } from "@/types";

import { loadSampleSessionMetrics } from "./csv-parser";
import { getPatients as getPatientsFromApi } from "./patient-service";
import { getAllSessions } from "./session-service";
import { USE_API } from "@/lib/api-config";

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  );
}

function buildSpeechTrend(sessionList: Session[]): TrendPoint[] {
  const completedSessions = sessionList
    .filter((session) => session.status === "completed")
    .slice(0, 7)
    .reverse();

  return completedSessions.map((session) => ({
    label: session.dateLabel.replace(", 2026", ""),
    value: session.speechScore,
  }));
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const sessionList = USE_API ? await getAllSessions() : sessions;
  const patientList = USE_API ? await getPatientsFromApi() : patients;

  const csvMetrics = loadSampleSessionMetrics();
  const completedSessions = sessionList.filter(
    (session) => session.status === "completed"
  );
  const recentSessions = [...sessionList]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 6);
  const recentPatients = [...patientList]
    .sort((left, right) =>
      right.lastSessionDate.localeCompare(left.lastSessionDate)
    )
    .slice(0, 5);

  const attentionAverage = average(
    completedSessions.map((session) => session.attentionScore)
  );
  const speechAverage = average(
    completedSessions.map((session) => session.speechScore)
  );
  const averageBlinkCount = average(
    completedSessions.map((session) => session.blinkCount)
  );

  return {
    metrics: [
      {
        id: "metric-patients",
        title: "Total Patients",
        value: String(patientList.length),
        change: 12,
        changeLabel: "vs last month",
        icon: "patients",
      },
      {
        id: "metric-sessions",
        title: "Sessions Completed",
        value: String(completedSessions.length),
        change: 8,
        changeLabel: "vs last week",
        icon: "sessions",
      },
      {
        id: "metric-attention",
        title: "Average Attention",
        value: `${csvMetrics.attentionPercent}%`,
        change: 4.2,
        changeLabel: "from assessment data",
        icon: "attention",
      },
      {
        id: "metric-speech",
        title: "Speech Accuracy",
        value: `${speechAverage}%`,
        change: -1.5,
        changeLabel: "vs last week",
        icon: "speech",
      },
      {
        id: "metric-focus",
        title: "Average Focus",
        value: `${csvMetrics.averageFocusDurationSeconds}s`,
        change: 6,
        changeLabel: "from assessment data",
        icon: "focus",
      },
      {
        id: "metric-blink",
        title: "Average Blink Count",
        value: String(averageBlinkCount),
        change: 2,
        changeLabel: "vs last week",
        icon: "blink",
      },
    ],
    recentSessions,
    recentPatients,
    weeklyAttentionAverage: attentionAverage,
    weeklySpeechAverage: speechAverage,
    attentionTrend: csvMetrics.attentionTimeline,
    speechTrend: buildSpeechTrend(sessionList),
  };
}

export async function getPatients(): Promise<Patient[]> {
  return getPatientsFromApi();
}

export async function getPatientById(
  patientId: string
): Promise<Patient | undefined> {
  const { getPatientById: getById } = await import("./patient-service");
  return getById(patientId);
}

export async function getSessionsByPatientId(
  patientId: string
): Promise<Session[]> {
  const { getSessionsByPatientId: getByPatient } = await import(
    "./session-service"
  );
  return getByPatient(patientId);
}

export async function getRecentSessions(limit = 6): Promise<Session[]> {
  const sessionList = USE_API ? await getAllSessions() : sessions;
  return [...sessionList]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, limit);
}
