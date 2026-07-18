export interface StimulusFocusArea {
  id: string;
  label: string;
  startMs: number;
  endMs: number;
  keywords: string[];
  prompt: string;
}

export type StimulusAnalysisStatus =
  | "completed"
  | "pending"
  | "manual"
  | "failed";

export interface StimulusVideoItem {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  keywords: string[];
  focusAreas: StimulusFocusArea[];
  durationMs?: number;
  isDefault?: boolean;
  isBuiltin?: boolean;
  analysisStatus?: StimulusAnalysisStatus;
}

export const BUILTIN_STIMULUS_ID = "builtin-identification";

export const DEFAULT_STIMULUS_KEYWORDS = [
  "red",
  "square",
  "elephant",
  "green",
  "star",
];
