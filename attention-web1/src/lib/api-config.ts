export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const USE_API = process.env.NEXT_PUBLIC_USE_API === "true";

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) {
    return undefined;
  }
  if (path.startsWith("http")) {
    return path;
  }
  return `${API_ORIGIN}${path}`;
}

export const AUTH_TOKEN_COOKIE = "neurolens-token";

export const API_ENDPOINTS = {
  authMe: "/auth/me",
  selectClinic: (clinicId: string) => `/auth/select-clinic/${clinicId}`,
  clinics: "/clinics",
  currentClinic: "/clinics/current",
  doctors: "/doctors",
  patients: "/patients",
  patient: (id: string) => `/patients/${id}`,
  sessions: "/sessions",
  session: (id: string) => `/sessions/${id}`,
  sessionUpload: (id: string) => `/sessions/${id}/upload`,
  reports: "/reports",
  reportFull: (id: string) => `/reports/${id}/full`,
  patientTimeHistory: (patientId: string) =>
    `/dashboard/patient-time-history?patientId=${patientId}`,
  sidebarPatients: "/dashboard/sidebar-patients",
  analyticsSummary: (sessionId?: string) =>
    sessionId
      ? `/analytics/summary?sessionId=${sessionId}`
      : "/analytics/summary",
  compareSessions: (a: string, b: string) => `/sessions/compare?a=${a}&b=${b}`,
  stimulusVideos: "/stimulus-videos",
  stimulusVideo: (id: string) => `/stimulus-videos/${id}`,
} as const;
