import { sessions } from "./sessions";

export const completedSessionOptions = sessions
  .filter((session) => session.status === "completed")
  .map((session) => ({
    id: session.id,
    label: `${session.patientName} • ${session.dateLabel}`,
  }));
