import type { Report } from "@/types";

export const reports: Report[] = [
  {
    id: "rep-001",
    sessionId: "sess-1025",
    patientId: "pat-001",
    patientName: "Riya Patel",
    title: "Visual Search Attention Assessment",
    date: "2026-06-30T09:30:00.000Z",
    dateLabel: "Jun 30, 2026, 9:30 AM",
    attentionScore: 88,
    speechScore: 81,
    summary:
      "Patient demonstrated strong sustained attention during structured visual search tasks with stable screen engagement.",
    recommendations: [
      "Continue current visual attention protocol for two more sessions.",
      "Introduce mild distractor stimuli in the next block.",
      "Review speech clarity during rapid naming tasks.",
    ],
  },
  {
    id: "rep-002",
    sessionId: "sess-1023",
    patientId: "pat-003",
    patientName: "Sofia Chen",
    title: "Phoneme Repetition Session Report",
    date: "2026-06-29T16:00:00.000Z",
    dateLabel: "Jun 29, 2026, 4:00 PM",
    attentionScore: 91,
    speechScore: 86,
    summary:
      "Excellent attention stability with high pronunciation accuracy across repeated phoneme drills.",
    recommendations: [
      "Advance to multisyllabic word repetition.",
      "Maintain session length at 45–50 minutes.",
    ],
  },
  {
    id: "rep-003",
    sessionId: "sess-1022",
    patientId: "pat-004",
    patientName: "Ethan Brooks",
    title: "Sustained Attention Monitoring",
    date: "2026-06-29T14:30:00.000Z",
    dateLabel: "Jun 29, 2026, 2:30 PM",
    attentionScore: 63,
    speechScore: 69,
    summary:
      "Attention declined during the second half of the session with increased gaze-away events.",
    recommendations: [
      "Reduce block length to 8 minutes with movement breaks.",
      "Use visual anchor cues during digit span tasks.",
      "Schedule follow-up in one week.",
    ],
  },
  {
    id: "rep-004",
    sessionId: "sess-1018",
    patientId: "pat-007",
    patientName: "Aisha Khan",
    title: "Reading Fluency Assessment",
    date: "2026-06-28T10:30:00.000Z",
    dateLabel: "Jun 28, 2026, 10:30 AM",
    attentionScore: 82,
    speechScore: 84,
    summary:
      "Stable screen engagement during reading tasks with improving word accuracy over session duration.",
    recommendations: [
      "Continue paired reading exercises twice weekly.",
      "Track eye gaze stability during paragraph reading.",
    ],
  },
  {
    id: "rep-005",
    sessionId: "sess-1015",
    patientId: "pat-010",
    patientName: "Kai Tanaka",
    title: "Executive Function Task Review",
    date: "2026-06-26T14:15:00.000Z",
    dateLabel: "Jun 26, 2026, 2:15 PM",
    attentionScore: 80,
    speechScore: 83,
    summary:
      "Task-switching latency improved with consistent focus recovery between cognitive blocks.",
    recommendations: [
      "Increase task-switching complexity gradually.",
      "Compare against prior session rep-005 baseline in two weeks.",
    ],
  },
];
