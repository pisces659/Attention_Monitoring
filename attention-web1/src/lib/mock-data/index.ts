export { currentClinician, patients, sessions } from "@/mock";
export type {
  AttentionLevel,
  Clinician,
  DashboardMetric,
  DashboardSummary,
  Patient,
  Session,
  SessionStatus,
} from "@/types";

// Legacy alias used by Sprint 1 components.
export type SessionRecord = import("@/types").Session;
