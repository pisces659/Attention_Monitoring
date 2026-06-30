import { patients, sessions } from "@/mock";
import type { DashboardSummary, Patient, Session, TrendPoint } from "@/types";

import { loadSampleSessionMetrics } from "./csv-parser";

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  );
}

function buildSpeechTrend(): TrendPoint[] {
  const completedSessions = sessions
    .filter((session) => session.status === "completed")
    .slice(0, 7)
    .reverse();

  return completedSessions.map((session) => ({
    label: session.dateLabel.replace(", 2026", ""),
    value: session.speechScore,
  }));
}

export function getDashboardSummary(): DashboardSummary {
  const csvMetrics = loadSampleSessionMetrics();
  const completedSessions = sessions.filter(
    (session) => session.status === "completed"
  );
  const recentSessions = [...sessions]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 6);
  const recentPatients = [...patients]
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
  const averageSessionMinutes = average(
    completedSessions.map((session) => session.durationMinutes)
  );
  const averageBlinkCount = average(
    completedSessions.map((session) => session.blinkCount)
  );

  return {
    metrics: [
      {
        id: "metric-patients",
        title: "Total Patients",
        value: String(patients.length),
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
        changeLabel: "from sample CSV",
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
        changeLabel: "from sample CSV",
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
    speechTrend: buildSpeechTrend(),
  };
}

export function getPatients(): Patient[] {
  return [...patients].sort((left, right) =>
    left.lastName.localeCompare(right.lastName)
  );
}

export function getPatientById(patientId: string): Patient | undefined {
  return patients.find((patient) => patient.id === patientId);
}

export function getSessionsByPatientId(patientId: string): Session[] {
  return sessions
    .filter((session) => session.patientId === patientId)
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function getRecentSessions(limit = 6): Session[] {
  return [...sessions]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, limit);
}
