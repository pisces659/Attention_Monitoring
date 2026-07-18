export type CalibrationPointId =
  | "center"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight";

export interface CalibrationPointDefinition {
  id: CalibrationPointId;
  label: string;
  instruction: string;
  xPercent: number;
  yPercent: number;
}

export interface CalibrationPointCapture {
  id: CalibrationPointId;
  label: string;
  xPercent: number;
  yPercent: number;
  startMs: number;
  endMs: number;
}

export interface SessionCalibration {
  version: 1;
  source: "default" | "session";
  skipped: boolean;
  completed: boolean;
  capturedAt: string;
  pointCaptures: CalibrationPointCapture[];
  /** Ms from recording start when stimulus visuals begin (analysis trim point). */
  stimulusStartMs?: number;
  analysisStartMs?: number;
}

/** Default gaze baseline used for uploads and skipped calibration. */
export const DEFAULT_CALIBRATION_BASELINE = {
  hRatioCenter: 0.5,
  vRatioCenter: 0.5,
  yawNeutral: 0,
  pitchNeutral: 0,
  irisLeftThreshold: 0.38,
  irisRightThreshold: 0.62,
  irisUpThreshold: 0.38,
  irisDownThreshold: 0.62,
  yawLeftThreshold: -15,
  yawRightThreshold: 15,
  pitchUpThreshold: -20,
  pitchDownThreshold: 20,
} as const;

export const CALIBRATION_POINTS: CalibrationPointDefinition[] = [
  {
    id: "center",
    label: "Center",
    instruction: "Look at the center dot",
    xPercent: 50,
    yPercent: 50,
  },
  {
    id: "topLeft",
    label: "Top left",
    instruction: "Look at the top-left dot",
    xPercent: 8,
    yPercent: 8,
  },
  {
    id: "topRight",
    label: "Top right",
    instruction: "Look at the top-right dot",
    xPercent: 92,
    yPercent: 8,
  },
  {
    id: "bottomLeft",
    label: "Bottom left",
    instruction: "Look at the bottom-left dot",
    xPercent: 8,
    yPercent: 92,
  },
  {
    id: "bottomRight",
    label: "Bottom right",
    instruction: "Look at the bottom-right dot",
    xPercent: 92,
    yPercent: 92,
  },
];

export const CALIBRATION_HOLD_MS = 2500;

export function createDefaultSessionCalibration(): SessionCalibration {
  return {
    version: 1,
    source: "default",
    skipped: true,
    completed: false,
    capturedAt: new Date().toISOString(),
    pointCaptures: [],
  };
}

export function createSessionCalibrationFromCaptures(
  pointCaptures: CalibrationPointCapture[],
  skipped: boolean,
  stimulusStartMs?: number
): SessionCalibration {
  const startMs = stimulusStartMs ?? 0;
  return {
    version: 1,
    source: skipped ? "default" : "session",
    skipped,
    completed: !skipped && pointCaptures.length === CALIBRATION_POINTS.length,
    capturedAt: new Date().toISOString(),
    pointCaptures,
    stimulusStartMs: startMs,
    analysisStartMs: startMs,
  };
}

export function withStimulusStart(
  calibration: SessionCalibration,
  stimulusStartMs: number
): SessionCalibration {
  return {
    ...calibration,
    stimulusStartMs,
    analysisStartMs: stimulusStartMs,
  };
}
