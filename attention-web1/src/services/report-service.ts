import { serverApiFetch } from "@/lib/api-client-server";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import { patients, reports as mockReports, sessions, speechWords } from "@/mock";
import type { Report, SessionReport } from "@/types";

import { buildAnalyticsFromFrames, loadSampleSessionFrames } from "./csv-parser";

export async function getReports(): Promise<Report[]> {
  if (!USE_API) {
    return [...mockReports].sort((left, right) =>
      right.date.localeCompare(left.date)
    );
  }
  return serverApiFetch<Report[]>(API_ENDPOINTS.reports);
}

export async function getReportById(
  reportId: string
): Promise<Report | undefined> {
  if (!USE_API) {
    return mockReports.find((report) => report.id === reportId);
  }
  const reports = await getReports();
  return reports.find((report) => report.id === reportId);
}

export async function getReportBySessionId(
  sessionId: string
): Promise<Report | undefined> {
  if (!USE_API) {
    return mockReports.find((report) => report.sessionId === sessionId);
  }
  const reports = await getReports();
  return reports.find((report) => report.sessionId === sessionId);
}

export async function getReportsByPatientId(
  patientId: string
): Promise<Report[]> {
  if (!USE_API) {
    return mockReports
      .filter((report) => report.patientId === patientId)
      .sort((left, right) => right.date.localeCompare(left.date));
  }
  const reports = await getReports();
  return reports.filter((report) => report.patientId === patientId);
}

export async function getSessionReport(
  reportId: string
): Promise<SessionReport | null> {
  if (!USE_API) {
    return getMockSessionReport(reportId);
  }

  try {
    return await serverApiFetch<SessionReport>(API_ENDPOINTS.reportFull(reportId));
  } catch {
    return null;
  }
}

function getMockSessionReport(reportId: string): SessionReport | null {
  const report = mockReports.find((item) => item.id === reportId);
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

export async function getCompletedSessions(): Promise<
  import("@/types").Session[]
> {
  if (!USE_API) {
    return sessions
      .filter((session) => session.status === "completed")
      .sort((left, right) => right.date.localeCompare(left.date));
  }
  const { getCompletedSessions: getCompleted } = await import("./session-service");
  return getCompleted();
}
