import { serverApiFetch } from "@/lib/api-client-server";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import type { PatientTimeHistoryDashboard } from "@/mock/patient-dashboard";
import {
  emptyPatientTimeHistoryDashboard,
  patientTimeHistoryDashboard,
} from "@/mock/patient-dashboard";

import { getPatients } from "./patient-service";

export async function getPatientTimeHistoryDashboard(
  patientId?: string
): Promise<PatientTimeHistoryDashboard> {
  if (!USE_API) {
    return patientTimeHistoryDashboard;
  }

  let resolvedPatientId = patientId;
  if (!resolvedPatientId) {
    const patients = await getPatients();
    resolvedPatientId = patients[0]?.id;
  }

  if (!resolvedPatientId) {
    return emptyPatientTimeHistoryDashboard;
  }

  return serverApiFetch<PatientTimeHistoryDashboard>(
    API_ENDPOINTS.patientTimeHistory(resolvedPatientId)
  ).then((dashboard) => {
    if (!dashboard.sessionDetails?.length && dashboard.latestSession.sessionId) {
      return {
        ...dashboard,
        sessionDetails: [
          {
            sessionId: dashboard.latestSession.sessionId,
            dateLabel: dashboard.latestSession.dateLabel,
            timeLabel: "—",
            session: dashboard.latestSession,
            analytics: dashboard.analyticsFooter,
          },
        ],
      };
    }
    return dashboard;
  });
}

export async function getSidebarPatients() {
  if (!USE_API) {
    const { sidebarPatients } = await import("@/mock/patient-dashboard");
    return sidebarPatients;
  }
  return serverApiFetch(API_ENDPOINTS.sidebarPatients);
}
