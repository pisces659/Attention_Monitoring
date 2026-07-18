import type { DonutSegment, TrendPoint } from "@/types";

export interface PatientSidebarItem {
  id: string;
  displayId: string;
  name: string;
  clinic: string;
  avatarInitials: string;
}

export interface PatientSummaryMetric {
  id: string;
  label: string;
  value: string;
  subtext?: string;
  icon: "sessions" | "focus" | "drift" | "longest" | "responses";
  tone: "blue" | "green" | "orange" | "purple" | "rose";
}

export interface SessionHistoryRow {
  id: string;
  displayId?: string;
  reportId?: string | null;
  date: string;
  time: string;
  expectedWord: string;
  focusTime: string;
  drifts: number;
  result: "correct" | "incorrect";
  resultLabel?: string;
}

export interface DualTrendPoint {
  label: string;
  focusTime: number;
  attentionDrift: number;
}

export interface SpeechWordMatch {
  expectedWord: string;
  detectedWord: string | null;
  confidence: number;
  responseTime: string;
  found?: boolean;
  inTimeWindow?: boolean;
  timingConfidence?: number;
  expectedWindowStart?: number;
  expectedWindowEnd?: number;
}

export interface SpeechOtherWord {
  word: string;
  confidence: number;
}

export interface LatestSessionData {
  sessionId?: string | null;
  sessionDisplayId?: string;
  reportId?: string | null;
  dateLabel: string;
  attentionStatus: string;
  ear: string;
  blink: string;
  yaw: string;
  pitch: string;
  totalTimeSeconds: number;
  focusDistribution: DonutSegment[];
  focusTime: string;
  attentionDrifts: number;
  longestFocus: string;
  expectedWord: string;
  expectedWords?: string[];
  detectedWord: string;
  confidence: number | null;
  responseTime: string;
  speechMatches?: SpeechWordMatch[];
  speechOtherWords?: SpeechOtherWord[];
  speechAvailable?: boolean;
  doctorNotes?: string;
  rawVideoFileName?: string;
  annotatedVideoFileName?: string;
  rawVideoUrl?: string;
  annotatedVideoUrl?: string;
}

export interface AnalyticsFooterData {
  gazeHeatmap: number[][];
  gazeDistribution: DonutSegment[];
  totalBlinks: number;
  blinkRate: string;
  headStabilityScore: number;
  headMovementLevel: string;
  headMovementTrend: TrendPoint[];
  engagementScore: number;
  engagementLabel: string;
}

export interface DashboardSessionDetail {
  sessionId: string;
  dateLabel: string;
  timeLabel: string;
  session: LatestSessionData;
  analytics: AnalyticsFooterData;
}

export interface PatientTimeHistoryDashboard {
  patient: {
    id?: string;
    displayId: string;
    name: string;
    age: number;
    gender: string;
  };
  dateRangeLabel: string;
  summaryMetrics: PatientSummaryMetric[];
  attentionOverTime: DualTrendPoint[];
  sessionHistory: SessionHistoryRow[];
  sessionDetails: DashboardSessionDetail[];
  latestSession: LatestSessionData;
  analyticsFooter: AnalyticsFooterData;
}

export const sidebarPatients: PatientSidebarItem[] = [
  { id: "pat-001", displayId: "P001", name: "Omar Ali", clinic: "Clinic - A", avatarInitials: "OA" },
  { id: "pat-007", displayId: "P002", name: "Aisha Khan", clinic: "Clinic - A", avatarInitials: "AK" },
  { id: "pat-004", displayId: "P003", name: "Ethan Brooks", clinic: "Clinic - A", avatarInitials: "EB" },
  { id: "pat-001", displayId: "P004", name: "Riya Singh", clinic: "Clinic - B", avatarInitials: "RS" },
  { id: "pat-008", displayId: "P005", name: "Noah Williams", clinic: "Clinic - B", avatarInitials: "NW" },
  { id: "pat-003", displayId: "P006", name: "Zara Ahmed", clinic: "Clinic - B", avatarInitials: "ZA" },
];

export const patientTimeHistoryDashboard: PatientTimeHistoryDashboard = {
  patient: {
    displayId: "P004",
    name: "Riya Singh",
    age: 6,
    gender: "Female",
  },
  dateRangeLabel: "01 May 2025 - 21 May 2025",
  summaryMetrics: [
    { id: "sessions", label: "Total Sessions", value: "8", icon: "sessions", tone: "blue" },
    { id: "focus", label: "Avg Focus Time", value: "18.7 sec", icon: "focus", tone: "green" },
    { id: "drift", label: "Avg Attention Drift", value: "3.2", icon: "drift", tone: "orange" },
    { id: "longest", label: "Avg Longest Focus", value: "9.4 sec", icon: "longest", tone: "purple" },
    { id: "responses", label: "Correct Responses", value: "75%", subtext: "6/8 Sessions", icon: "responses", tone: "rose" },
  ],
  attentionOverTime: [
    { label: "May 01", focusTime: 12, attentionDrift: 5 },
    { label: "May 05", focusTime: 15, attentionDrift: 4 },
    { label: "May 08", focusTime: 18, attentionDrift: 3 },
    { label: "May 12", focusTime: 14, attentionDrift: 6 },
    { label: "May 15", focusTime: 20, attentionDrift: 2 },
    { label: "May 18", focusTime: 17, attentionDrift: 3 },
    { label: "May 21", focusTime: 19, attentionDrift: 2 },
  ],
  sessionHistory: [
    { id: "s1", date: "21 May 2025", time: "10:32 AM", expectedWord: "Dog", focusTime: "19.3 sec", drifts: 2, result: "correct" },
    { id: "s2", date: "18 May 2025", time: "11:05 AM", expectedWord: "Cat", focusTime: "17.1 sec", drifts: 3, result: "correct" },
    { id: "s3", date: "15 May 2025", time: "09:48 AM", expectedWord: "Ball", focusTime: "20.4 sec", drifts: 2, result: "correct" },
    { id: "s4", date: "12 May 2025", time: "10:15 AM", expectedWord: "Fish", focusTime: "14.2 sec", drifts: 5, result: "incorrect" },
    { id: "s5", date: "08 May 2025", time: "11:30 AM", expectedWord: "Bird", focusTime: "18.0 sec", drifts: 3, result: "correct" },
  ],
  latestSession: {
    sessionId: "s1",
    dateLabel: "21 May 2025",
    attentionStatus: "Focused",
    ear: "0.23",
    blink: "No",
    yaw: "-2.1°",
    pitch: "1.3°",
    totalTimeSeconds: 45,
    focusDistribution: [
      { name: "Focused", value: 67, color: "#22C55E" },
      { name: "Looking Away", value: 19, color: "#F59E0B" },
      { name: "Eyes Closed", value: 7, color: "#EF4444" },
      { name: "Blink", value: 7, color: "#8B5CF6" },
    ],
    focusTime: "19.3 sec",
    attentionDrifts: 2,
    longestFocus: "9.8 sec",
    expectedWord: "Dog",
    expectedWords: ["Dog"],
    detectedWord: "Dog",
    confidence: 100,
    responseTime: "10.51 sec",
    speechMatches: [
      {
        expectedWord: "Dog",
        detectedWord: "Dog",
        confidence: 100,
        responseTime: "10.5s",
        found: true,
      },
    ],
    speechOtherWords: [],
    speechAvailable: true,
  },
  sessionDetails: [
    {
      sessionId: "s1",
      dateLabel: "21 May 2025",
      timeLabel: "10:32 AM",
      session: {
        sessionId: "s1",
        dateLabel: "21 May 2025",
        attentionStatus: "Focused",
        ear: "0.23",
        blink: "No",
        yaw: "-2.1°",
        pitch: "1.3°",
        totalTimeSeconds: 45,
        focusDistribution: [
          { name: "Focused", value: 67, color: "#22C55E" },
          { name: "Looking Away", value: 19, color: "#F59E0B" },
          { name: "Eyes Closed", value: 7, color: "#EF4444" },
          { name: "Blink", value: 7, color: "#8B5CF6" },
        ],
        focusTime: "19.3 sec",
        attentionDrifts: 2,
        longestFocus: "9.8 sec",
        expectedWord: "Dog",
        expectedWords: ["Dog"],
        detectedWord: "Dog",
        confidence: 100,
        responseTime: "10.51 sec",
        speechMatches: [
          {
            expectedWord: "Dog",
            detectedWord: "Dog",
            confidence: 100,
            responseTime: "10.5s",
            found: true,
          },
        ],
        speechOtherWords: [],
        speechAvailable: true,
      },
      analytics: {
        gazeHeatmap: [
          [10, 25, 40, 55, 70, 55, 40, 25],
          [15, 35, 60, 80, 95, 80, 60, 35],
          [20, 45, 75, 100, 100, 75, 45, 20],
          [15, 35, 60, 85, 90, 85, 60, 35],
          [10, 25, 40, 55, 70, 55, 40, 25],
        ],
        gazeDistribution: [
          { name: "Center", value: 62, color: "#2563EB" },
          { name: "Up", value: 16, color: "#22C55E" },
          { name: "Down", value: 12, color: "#F59E0B" },
          { name: "Left", value: 6, color: "#8B5CF6" },
          { name: "Right", value: 4, color: "#EC4899" },
        ],
        totalBlinks: 12,
        blinkRate: "15/min",
        headStabilityScore: 92,
        headMovementLevel: "Low",
        headMovementTrend: [
          { label: "0s", value: 88 },
          { label: "10s", value: 91 },
          { label: "20s", value: 94 },
          { label: "30s", value: 92 },
          { label: "40s", value: 93 },
        ],
        engagementScore: 81,
        engagementLabel: "Good",
      },
    },
    {
      sessionId: "s2",
      dateLabel: "18 May 2025",
      timeLabel: "11:05 AM",
      session: {
        sessionId: "s2",
        dateLabel: "18 May 2025",
        attentionStatus: "Looking Right",
        ear: "0.21",
        blink: "No",
        yaw: "4.2°",
        pitch: "0.8°",
        totalTimeSeconds: 38,
        focusDistribution: [
          { name: "Focused", value: 54, color: "#22C55E" },
          { name: "Looking Away", value: 28, color: "#F59E0B" },
          { name: "Blink", value: 10, color: "#8B5CF6" },
          { name: "Eyes Closed", value: 8, color: "#EF4444" },
        ],
        focusTime: "17.1 sec",
        attentionDrifts: 3,
        longestFocus: "8.2 sec",
        expectedWord: "Cat",
        expectedWords: ["Cat"],
        detectedWord: "Cat",
        confidence: 92,
        responseTime: "8.2 sec",
        speechMatches: [
          {
            expectedWord: "Cat",
            detectedWord: "Cat",
            confidence: 92,
            responseTime: "8.2s",
            found: true,
          },
        ],
        speechOtherWords: [],
        speechAvailable: true,
      },
      analytics: {
        gazeHeatmap: [
          [8, 20, 35, 50, 65, 50, 35, 20],
          [12, 30, 55, 75, 88, 75, 55, 30],
          [18, 40, 68, 92, 95, 92, 68, 40],
          [12, 30, 55, 78, 85, 78, 55, 30],
          [8, 20, 35, 50, 65, 50, 35, 20],
        ],
        gazeDistribution: [
          { name: "Center", value: 48, color: "#2563EB" },
          { name: "Right", value: 22, color: "#EC4899" },
          { name: "Up", value: 14, color: "#22C55E" },
          { name: "Down", value: 10, color: "#F59E0B" },
          { name: "Left", value: 6, color: "#8B5CF6" },
        ],
        totalBlinks: 10,
        blinkRate: "16/min",
        headStabilityScore: 86,
        headMovementLevel: "Low",
        headMovementTrend: [
          { label: "0s", value: 82 },
          { label: "10s", value: 85 },
          { label: "20s", value: 88 },
          { label: "30s", value: 84 },
        ],
        engagementScore: 72,
        engagementLabel: "Good",
      },
    },
  ],
  analyticsFooter: {
    gazeHeatmap: [
      [10, 25, 40, 55, 70, 55, 40, 25],
      [15, 35, 60, 80, 95, 80, 60, 35],
      [20, 45, 75, 100, 100, 75, 45, 20],
      [15, 35, 60, 85, 90, 85, 60, 35],
      [10, 25, 40, 55, 70, 55, 40, 25],
    ],
    gazeDistribution: [
      { name: "Center", value: 62, color: "#2563EB" },
      { name: "Up", value: 16, color: "#22C55E" },
      { name: "Down", value: 12, color: "#F59E0B" },
      { name: "Left", value: 6, color: "#8B5CF6" },
      { name: "Right", value: 4, color: "#EC4899" },
    ],
    totalBlinks: 12,
    blinkRate: "15/min",
    headStabilityScore: 92,
    headMovementLevel: "Low",
    headMovementTrend: [
      { label: "0s", value: 88 },
      { label: "10s", value: 91 },
      { label: "20s", value: 94 },
      { label: "30s", value: 92 },
      { label: "40s", value: 93 },
    ],
    engagementScore: 81,
    engagementLabel: "Good",
  },
};

export const emptyPatientTimeHistoryDashboard: PatientTimeHistoryDashboard = {
  patient: {
    displayId: "—",
    name: "No patients yet",
    age: 0,
    gender: "—",
  },
  dateRangeLabel: "No sessions yet",
  summaryMetrics: [],
  attentionOverTime: [],
  sessionHistory: [],
  sessionDetails: [],
  latestSession: {
    dateLabel: "—",
    attentionStatus: "—",
    ear: "—",
    blink: "—",
    yaw: "—",
    pitch: "—",
    totalTimeSeconds: 0,
    focusDistribution: [],
    focusTime: "—",
    attentionDrifts: 0,
    longestFocus: "—",
    expectedWord: "—",
    expectedWords: [],
    detectedWord: "—",
    confidence: 0,
    responseTime: "—",
    speechMatches: [],
    speechOtherWords: [],
    speechAvailable: false,
  },
  analyticsFooter: {
    gazeHeatmap: [],
    gazeDistribution: [],
    totalBlinks: 0,
    blinkRate: "0/min",
    headStabilityScore: 0,
    headMovementLevel: "—",
    headMovementTrend: [],
    engagementScore: 0,
    engagementLabel: "—",
  },
};
