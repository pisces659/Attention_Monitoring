export type SessionStatus =
  | "completed"
  | "failed"
  | "in-progress"
  | "scheduled"
  | "processing";

export type SessionKind = "pre_recorded" | "scheduled";

export type AttentionLevel = "focused" | "moderate" | "distracted";

export type Gender = "Male" | "Female" | "Non-binary";

export type SpeechResult = "correct" | "partial" | "incorrect";

export interface Clinician {
  id: string;
  name: string;
  title: string;
  specialty: string;
  avatarInitials: string;
  email: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  timezone: string;
}

export interface Patient {
  id: string;
  displayId?: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  diagnosis: string;
  doctor: string;
  notes: string;
  createdDate: string;
  avatarInitials: string;
  sessionCount: number;
  lastSessionDate: string;
  lastSessionLabel: string;
  averageAttention: number;
  averageSpeech: number;
}

export interface Session {
  id: string;
  displayId?: string;
  patientId: string;
  patientDisplayId?: string;
  patientName: string;
  date: string;
  dateLabel: string;
  durationMinutes: number;
  attentionScore: number;
  speechScore: number;
  status: SessionStatus;
  sessionKind?: SessionKind;
  sessionAt?: string;
  scheduledAt?: string | null;
  attentionLevel: AttentionLevel;
  blinkCount: number;
  doctorNotes: string;
  hasCsvOutput: boolean;
  videoFileName?: string;
  processedVideoFileName?: string;
  rawVideoUrl?: string;
  annotatedVideoUrl?: string;
  reportId?: string;
}

export interface Report {
  id: string;
  sessionId: string;
  sessionDisplayId?: string;
  patientId: string;
  patientName: string;
  title: string;
  date: string;
  dateLabel: string;
  attentionScore: number;
  speechScore: number;
  summary: string;
  recommendations: string[];
}

export interface SpeechWord {
  recognizedWord: string;
  expectedWord: string;
  confidence: number;
  pronunciationAccuracy: number;
  result: SpeechResult;
  timestamp: string;
}

export interface DashboardMetric {
  id: string;
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon:
    | "patients"
    | "sessions"
    | "attention"
    | "speech"
    | "focus"
    | "blink";
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

export interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  recentSessions: Session[];
  recentPatients: Patient[];
  weeklyAttentionAverage: number;
  weeklySpeechAverage: number;
  attentionTrend: TrendPoint[];
  speechTrend: TrendPoint[];
}

export interface SessionFrame {
  frame: number;
  time: number;
  faceDetected: boolean;
  ear: number;
  blink: boolean;
  totalBlinks: number;
  yaw: number;
  pitch: number;
  roll: number;
  horizontalGaze: string;
  verticalGaze: string;
  onScreen: boolean;
  horizontalRatio: number;
  verticalRatio: number;
  attentionState: string;
}

export interface AttentionMetrics {
  overallAttentionPercent: number;
  focusedDurationSeconds: number;
  distractedDurationSeconds: number;
  attentionShifts: number;
  averageFocusDurationSeconds: number;
  longestFocusDurationSeconds: number;
  eyesClosedDurationSeconds: number;
  blinkCount: number;
  averageBlinkRate: number;
  screenEngagementPercent: number;
}

export interface SpeechMetrics {
  speechScore: number;
  pronunciationAccuracy: number;
  completionPercent: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  timeline: TrendPoint[];
}

export interface CsvSessionMetrics {
  totalFrames: number;
  focusedFrames: number;
  attentionPercent: number;
  totalBlinks: number;
  durationSeconds: number;
  averageFocusDurationSeconds: number;
  attentionTimeline: TrendPoint[];
}

export interface AnalyticsSummary {
  attentionTimeline: TrendPoint[];
  blinkTimeline: TrendPoint[];
  headPoseTimeline: TrendPoint[];
  speechAccuracyTimeline: TrendPoint[];
  wordAccuracyTimeline: TrendPoint[];
  focusDistribution: DonutSegment[];
  blinkBars: TrendPoint[];
  gazeHeatmap: HeatmapCell[];
  metrics: AttentionMetrics;
  speechMetrics: SpeechMetrics;
  focusedTimeSeconds: number;
  distractedTimeSeconds: number;
  longestFocusDurationSeconds: number;
  longestDistractionDurationSeconds: number;
}

export interface SessionReport {
  report: Report;
  session: Session;
  patient: Patient;
  attentionMetrics: AttentionMetrics;
  speechMetrics: SpeechMetrics;
  speechWords: SpeechWord[];
  attentionTimeline: TrendPoint[];
  blinkTimeline: TrendPoint[];
  headPoseTimeline: TrendPoint[];
  focusDistribution: DonutSegment[];
  recommendations: string[];
}

export interface SessionComparison {
  sessionA: Session;
  sessionB: Session;
  attentionDelta: number;
  speechDelta: number;
  blinkDelta: number;
  focusDurationDelta: number;
  eyeContactDelta: number;
  headPoseDelta: number;
  improvementPercent: number;
  regressionPercent: number;
  attentionTrendA: TrendPoint[];
  attentionTrendB: TrendPoint[];
}

export interface AppSettings {
  clinicName: string;
  timezone: string;
  emailNotifications: boolean;
  sessionReminders: boolean;
  autoGenerateReports: boolean;
  defaultSessionDuration: number;
  language: string;
}

export interface AuthUser {
  email: string;
  name: string;
  role: string;
}
