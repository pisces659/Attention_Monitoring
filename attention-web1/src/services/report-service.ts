import { patients, reports, sessions, speechWords } from "@/mock";
import type { Report, Session, SessionReport } from "@/types";

import {
  buildAnalyticsFromFrames,
  loadSampleSessionFrames,
} from "./csv-parser";

export function getReports(): Report[] {
  return [...reports].sort((left, right) => right.date.localeCompare(left.date));
}

export function getReportById(reportId: string): Report | undefined {
  return reports.find((report) => report.id === reportId);
}

export function getReportBySessionId(sessionId: string): Report | undefined {
  return reports.find((report) => report.sessionId === sessionId);
}

export function getReportsByPatientId(patientId: string): Report[] {
  return reports
    .filter((report) => report.patientId === patientId)
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function getSessionReport(reportId: string): SessionReport | null {
  const report = getReportById(reportId);
  if (!report) {
    return null;
  }

  const session = sessions.find((item) => item.id === report.sessionId);
  const patient = patients.find((item) => item.id === report.patientId);

  if (!session || !patient) {
    return null;
  }

  const frames = session.hasCsvOutput ? loadSampleSessionFrames() : [];
  const analytics =
    frames.length > 0 ? buildAnalyticsFromFrames(frames) : null;

  return {
    report,
    session,
    patient,
    attentionMetrics: analytics?.metrics ?? {
      overallAttentionPercent: session.attentionScore,
      focusedDurationSeconds: 0,
      distractedDurationSeconds: 0,
      attentionShifts: 0,
      averageFocusDurationSeconds: 0,
      longestFocusDurationSeconds: 0,
      eyesClosedDurationSeconds: 0,
      blinkCount: session.blinkCount,
      averageBlinkRate: 0,
      screenEngagementPercent: 0,
    },
    speechMetrics: analytics?.speechMetrics ?? {
      speechScore: session.speechScore,
      pronunciationAccuracy: session.speechScore,
      completionPercent: 0,
      correctCount: 0,
      partialCount: 0,
      incorrectCount: 0,
      timeline: [],
    },
    speechWords,
    attentionTimeline: analytics?.attentionTimeline ?? [],
    blinkTimeline: analytics?.blinkTimeline ?? [],
    headPoseTimeline: analytics?.headPoseTimeline ?? [],
    focusDistribution: analytics?.focusDistribution ?? [],
    recommendations: report.recommendations,
  };
}

export function getCompletedSessions(): Session[] {
  return sessions
    .filter((session) => session.status === "completed")
    .sort((left, right) => right.date.localeCompare(left.date));
}
