import type { AppSettings } from "@/types";

export const defaultSettings: AppSettings = {
  clinicName: "NeuroLens Cognitive Clinic",
  timezone: "America/New_York",
  emailNotifications: true,
  sessionReminders: true,
  autoGenerateReports: true,
  defaultSessionDuration: 45,
  language: "English (US)",
};
