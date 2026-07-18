import fs from "node:fs";
import path from "node:path";

import type {
  AnalyticsSummary,
  AttentionMetrics,
  CsvSessionMetrics,
  DonutSegment,
  HeatmapCell,
  SessionFrame,
  SpeechMetrics,
  TrendPoint,
} from "@/types";

function parseBoolean(value: string): boolean {
  return value.trim().toLowerCase() === "true";
}

export function parseSessionCsv(content: string): SessionFrame[] {
  const lines = content.trim().split(/\r?\n/);
  const [, ...rows] = lines;

  return rows.filter(Boolean).map((row) => {
    const columns = row.split(",");

    return {
      frame: Number(columns[0]),
      time: Number(columns[1]),
      faceDetected: parseBoolean(columns[2]),
      ear: Number(columns[7]),
      blink: parseBoolean(columns[8]),
      totalBlinks: Number(columns[9]),
      yaw: Number(columns[10]),
      pitch: Number(columns[11]),
      roll: Number(columns[12]),
      horizontalGaze: columns[13]?.trim() ?? "Center",
      verticalGaze: columns[14]?.trim() ?? "Center",
      onScreen: parseBoolean(columns[15] ?? "false"),
      horizontalRatio: Number(columns[16]),
      verticalRatio: Number(columns[17]),
      attentionState: columns[18]?.trim() ?? "Unknown",
    };
  });
}

function isFocusedState(state: string): boolean {
  return state.toLowerCase() === "focused";
}

function isDistractedState(state: string): boolean {
  const normalized = state.toLowerCase();
  return (
    normalized.includes("looking") ||
    normalized.includes("away") ||
    normalized === "distracted"
  );
}

function bucketTimeline(
  frames: SessionFrame[],
  bucketSizeSeconds: number,
  valueSelector: (bucketFrames: SessionFrame[]) => number
): TrendPoint[] {
  const buckets = new Map<number, SessionFrame[]>();

  for (const frame of frames) {
    const bucket =
      Math.floor(frame.time / bucketSizeSeconds) * bucketSizeSeconds;
    const current = buckets.get(bucket) ?? [];
    current.push(frame);
    buckets.set(bucket, current);
  }

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left - right)
    .map(([seconds, bucketFrames]) => ({
      label: `${seconds}s`,
      value: valueSelector(bucketFrames),
    }));
}

function getSecondsPerFrame(frames: SessionFrame[]): number {
  return frames.length > 1 ? frames.at(-1)!.time / frames.length : 0.06;
}

function calculateAverageFocusDuration(frames: SessionFrame[]): number {
  const secondsPerFrame = getSecondsPerFrame(frames);
  let currentRun = 0;
  let totalFocusedSeconds = 0;
  let focusedRuns = 0;

  for (const frame of frames) {
    if (isFocusedState(frame.attentionState)) {
      currentRun += 1;
    } else if (currentRun > 0) {
      totalFocusedSeconds += currentRun * secondsPerFrame;
      focusedRuns += 1;
      currentRun = 0;
    }
  }

  if (currentRun > 0) {
    totalFocusedSeconds += currentRun * secondsPerFrame;
    focusedRuns += 1;
  }

  return focusedRuns === 0
    ? 0
    : Number((totalFocusedSeconds / focusedRuns).toFixed(1));
}

function calculateLongestFocusDuration(frames: SessionFrame[]): number {
  const secondsPerFrame = getSecondsPerFrame(frames);
  let currentRun = 0;
  let longest = 0;

  for (const frame of frames) {
    if (isFocusedState(frame.attentionState)) {
      currentRun += 1;
      longest = Math.max(longest, currentRun);
    } else {
      currentRun = 0;
    }
  }

  return Number((longest * secondsPerFrame).toFixed(1));
}

function calculateLongestDistractionDuration(frames: SessionFrame[]): number {
  const secondsPerFrame = getSecondsPerFrame(frames);
  let currentRun = 0;
  let longest = 0;

  for (const frame of frames) {
    if (isDistractedState(frame.attentionState)) {
      currentRun += 1;
      longest = Math.max(longest, currentRun);
    } else {
      currentRun = 0;
    }
  }

  return Number((longest * secondsPerFrame).toFixed(1));
}

function countAttentionShifts(frames: SessionFrame[]): number {
  let shifts = 0;

  for (let index = 1; index < frames.length; index += 1) {
    if (frames[index].attentionState !== frames[index - 1].attentionState) {
      shifts += 1;
    }
  }

  return shifts;
}

function buildFocusDistribution(frames: SessionFrame[]): DonutSegment[] {
  let focused = 0;
  let distracted = 0;
  let other = 0;

  for (const frame of frames) {
    if (isFocusedState(frame.attentionState)) {
      focused += 1;
    } else if (isDistractedState(frame.attentionState)) {
      distracted += 1;
    } else {
      other += 1;
    }
  }

  return [
    { name: "Focused", value: focused, color: "#22C55E" },
    { name: "Distracted", value: distracted, color: "#EF4444" },
    { name: "Other", value: other, color: "#F59E0B" },
  ];
}

function attentionStateToGazeZone(state: string): string {
  return state;
}

const GAZE_ZONE_GRID: Record<string, [number, number]> = {
  Focused: [3, 3],
  "Looking Up": [0, 3],
  "Looking Down": [7, 3],
  "Looking Left": [1, 1],
  "Looking Right": [1, 6],
  Closed: [3, 3],
  "Eyes Closed": [3, 3],
  Blink: [3, 3],
};

function buildGazeHeatmap(frames: SessionFrame[]): HeatmapCell[] {
  const gridSize = 8;
  const matrix = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => 0)
  );

  for (const frame of frames) {
    const zone = attentionStateToGazeZone(frame.attentionState);
    if (zone === "No Face") {
      continue;
    }
    const [row, col] = GAZE_ZONE_GRID[zone] ?? [3, 3];
    matrix[row][col] += 1;
  }

  const cells: HeatmapCell[] = [];
  const flatMax = Math.max(...matrix.flat(), 1);

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      cells.push({
        x,
        y,
        intensity: Math.round((matrix[y][x] / flatMax) * 100),
      });
    }
  }

  return cells;
}

function buildGazeDistribution(frames: SessionFrame[]): DonutSegment[] {
  const counts = new Map<string, number>();
  for (const frame of frames) {
    const zone = attentionStateToGazeZone(frame.attentionState);
    counts.set(zone, (counts.get(zone) ?? 0) + 1);
  }

  const colors: Record<string, string> = {
    Focused: "#22C55E",
    "Looking Up": "#F59E0B",
    "Looking Down": "#F97316",
    "Looking Left": "#8B5CF6",
    "Looking Right": "#EC4899",
    "Eyes Closed": "#EF4444",
    Blink: "#6366F1",
    "No Face": "#94A3B8",
    Closed: "#EF4444",
  };

  const total = frames.length || 1;
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: colors[name] ?? "#94A3B8",
    }));
}

function buildAttentionMetrics(frames: SessionFrame[]): AttentionMetrics {
  const secondsPerFrame = getSecondsPerFrame(frames);
  const totalFrames = frames.length;
  const focusedFrames = frames.filter((frame) =>
    isFocusedState(frame.attentionState)
  ).length;
  const distractedFrames = frames.filter((frame) =>
    isDistractedState(frame.attentionState)
  ).length;
  const onScreenFrames = frames.filter((frame) => frame.onScreen).length;
  const blinkFrames = frames.filter((frame) => frame.blink).length;
  const lastFrame = frames.at(-1);
  const durationSeconds = lastFrame?.time ?? 0;

  return {
    overallAttentionPercent:
      totalFrames === 0 ? 0 : Math.round((focusedFrames / totalFrames) * 100),
    focusedDurationSeconds: Number(
      (focusedFrames * secondsPerFrame).toFixed(1)
    ),
    distractedDurationSeconds: Number(
      (distractedFrames * secondsPerFrame).toFixed(1)
    ),
    attentionShifts: countAttentionShifts(frames),
    averageFocusDurationSeconds: calculateAverageFocusDuration(frames),
    longestFocusDurationSeconds: calculateLongestFocusDuration(frames),
    eyesClosedDurationSeconds: Number((blinkFrames * secondsPerFrame).toFixed(1)),
    blinkCount: lastFrame?.totalBlinks ?? 0,
    averageBlinkRate:
      durationSeconds === 0
        ? 0
        : Number(
            (((lastFrame?.totalBlinks ?? 0) / durationSeconds) * 60).toFixed(1)
          ),
    screenEngagementPercent:
      totalFrames === 0 ? 0 : Math.round((onScreenFrames / totalFrames) * 100),
  };
}

export function calculateCsvMetrics(frames: SessionFrame[]): CsvSessionMetrics {
  const metrics = buildAttentionMetrics(frames);

  return {
    totalFrames: frames.length,
    focusedFrames: frames.filter((frame) => isFocusedState(frame.attentionState))
      .length,
    attentionPercent: metrics.overallAttentionPercent,
    totalBlinks: metrics.blinkCount,
    durationSeconds: frames.at(-1)?.time ?? 0,
    averageFocusDurationSeconds: metrics.averageFocusDurationSeconds,
    attentionTimeline: bucketTimeline(frames, 2, (bucketFrames) => {
      const focused = bucketFrames.filter((frame) =>
        isFocusedState(frame.attentionState)
      ).length;
      return Math.round((focused / bucketFrames.length) * 100);
    }),
  };
}

export function buildAnalyticsFromFrames(frames: SessionFrame[]): AnalyticsSummary {
  const metrics = buildAttentionMetrics(frames);
  const speechMetrics: SpeechMetrics = {
    speechScore: 78,
    pronunciationAccuracy: 81,
    completionPercent: 92,
    correctCount: 14,
    partialCount: 3,
    incorrectCount: 2,
    timeline: bucketTimeline(frames, 3, (bucketFrames) => {
      const onScreen = bucketFrames.filter((frame) => frame.onScreen).length;
      return Math.round((onScreen / bucketFrames.length) * 100);
    }),
  };

  return {
    attentionTimeline: bucketTimeline(frames, 2, (bucketFrames) => {
      const focused = bucketFrames.filter((frame) =>
        isFocusedState(frame.attentionState)
      ).length;
      return Math.round((focused / bucketFrames.length) * 100);
    }),
    blinkTimeline: bucketTimeline(frames, 2, (bucketFrames) =>
      bucketFrames.filter((frame) => frame.blink).length
    ),
    headPoseTimeline: bucketTimeline(frames, 2, (bucketFrames) => {
      const avgYaw =
        bucketFrames.reduce((sum, frame) => sum + Math.abs(frame.yaw), 0) /
        bucketFrames.length;
      return Number(avgYaw.toFixed(1));
    }),
    speechAccuracyTimeline: speechMetrics.timeline,
    wordAccuracyTimeline: bucketTimeline(frames, 3, (bucketFrames) => {
      const onScreen = bucketFrames.filter((frame) => frame.onScreen).length;
      return Math.min(
        95,
        70 + Math.round((onScreen / bucketFrames.length) * 25)
      );
    }),
    focusDistribution: buildFocusDistribution(frames),
    blinkBars: bucketTimeline(frames, 2, (bucketFrames) => {
      const last = bucketFrames.at(-1);
      return last?.totalBlinks ?? 0;
    }),
    gazeHeatmap: buildGazeHeatmap(frames),
    metrics,
    speechMetrics,
    focusedTimeSeconds: metrics.focusedDurationSeconds,
    distractedTimeSeconds: metrics.distractedDurationSeconds,
    longestFocusDurationSeconds: metrics.longestFocusDurationSeconds,
    longestDistractionDurationSeconds: calculateLongestDistractionDuration(frames),
  };
}

export function loadSampleSessionFrames(): SessionFrame[] {
  const csvPath = path.join(process.cwd(), "sample-data", "sample-session.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  return parseSessionCsv(content);
}

export function loadSampleSessionMetrics(): CsvSessionMetrics {
  return calculateCsvMetrics(loadSampleSessionFrames());
}

export function loadSampleAnalytics(): AnalyticsSummary {
  return buildAnalyticsFromFrames(loadSampleSessionFrames());
}
