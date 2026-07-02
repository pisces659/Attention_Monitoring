import fs from "node:fs";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node analyze-csv.mjs <path-to-csv>");
  process.exit(1);
}

const content = fs.readFileSync(csvPath, "utf-8");
const lines = content.trim().split(/\r?\n/);
const [, ...rows] = lines;

function parseBoolean(value) {
  return value.trim().toLowerCase() === "true";
}

const frames = rows.filter(Boolean).map((row) => {
  const c = row.split(",");
  return {
    frame: Number(c[0]),
    time: Number(c[1]),
    faceDetected: parseBoolean(c[2]),
    leftIrisX: Number(c[3]),
    leftIrisY: Number(c[4]),
    rightIrisX: Number(c[5]),
    rightIrisY: Number(c[6]),
    ear: Number(c[7]),
    blink: parseBoolean(c[8]),
    totalBlinks: Number(c[9]),
    yaw: Number(c[10]),
    pitch: Number(c[11]),
    roll: Number(c[12]),
    horizontalGaze: c[13]?.trim() ?? "Center",
    verticalGaze: c[14]?.trim() ?? "Center",
    onScreen: parseBoolean(c[15] ?? "false"),
    horizontalRatio: Number(c[16]),
    verticalRatio: Number(c[17]),
    attentionState: c[18]?.trim() ?? "Unknown",
  };
});

const isFocused = (s) => s.toLowerCase() === "focused";
const isDistracted = (s) => {
  const n = s.toLowerCase();
  return n.includes("looking") || n.includes("away") || n === "distracted";
};

const secondsPerFrame =
  frames.length > 1 ? frames.at(-1).time / frames.length : 0.06;
const durationSeconds = frames.at(-1)?.time ?? 0;

function countBy(keyFn) {
  const map = {};
  for (const f of frames) {
    const k = keyFn(f);
    map[k] = (map[k] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(map).sort((a, b) => b[1] - a[1])
  );
}

function pct(count) {
  return frames.length ? Number(((count / frames.length) * 100).toFixed(1)) : 0;
}

function avg(nums) {
  return nums.length
    ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2))
    : 0;
}

function longestRun(predicate) {
  let current = 0;
  let longest = 0;
  for (const f of frames) {
    if (predicate(f)) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return Number((longest * secondsPerFrame).toFixed(2));
}

function avgFocusDuration() {
  let current = 0;
  let totalSec = 0;
  let runs = 0;
  for (const f of frames) {
    if (isFocused(f.attentionState)) current += 1;
    else if (current > 0) {
      totalSec += current * secondsPerFrame;
      runs += 1;
      current = 0;
    }
  }
  if (current > 0) {
    totalSec += current * secondsPerFrame;
    runs += 1;
  }
  return runs ? Number((totalSec / runs).toFixed(2)) : 0;
}

function attentionShifts() {
  let shifts = 0;
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].attentionState !== frames[i - 1].attentionState) shifts += 1;
  }
  return shifts;
}

const focusedFrames = frames.filter((f) => isFocused(f.attentionState)).length;
const distractedFrames = frames.filter((f) => isDistracted(f.attentionState)).length;
const blinkFrames = frames.filter((f) => f.blink).length;
const onScreenFrames = frames.filter((f) => f.onScreen).length;
const faceDetectedFrames = frames.filter((f) => f.faceDetected).length;
const eyesClosedFrames = frames.filter(
  (f) => f.attentionState.toLowerCase() === "eyes closed"
).length;
const blinkStateFrames = frames.filter(
  (f) => f.attentionState.toLowerCase() === "blink"
).length;

const lastFrame = frames.at(-1);
const totalBlinks = lastFrame?.totalBlinks ?? 0;

const gazeCombined = countBy(
  (f) => `${f.horizontalGaze} / ${f.verticalGaze}`
);
const attentionStates = countBy((f) => f.attentionState);

const horizontalGaze = countBy((f) => f.horizontalGaze);
const verticalGaze = countBy((f) => f.verticalGaze);

const yawValues = frames.map((f) => f.yaw);
const pitchValues = frames.map((f) => f.pitch);
const rollValues = frames.map((f) => f.roll);
const earValues = frames.map((f) => f.ear);

const headStability = Number(
  (100 - Math.min(100, avg(yawValues.map(Math.abs)) * 5)).toFixed(1)
);

const report = {
  source: {
    csvPath,
    totalRows: frames.length,
    videoDurationFromCsvSeconds: durationSeconds,
    secondsPerFrame: Number(secondsPerFrame.toFixed(4)),
    estimatedFps: Number((1 / secondsPerFrame).toFixed(1)),
  },
  rawCsvColumns: [
    "Frame",
    "Time",
    "FaceDetected",
    "LeftIrisX",
    "LeftIrisY",
    "RightIrisX",
    "RightIrisY",
    "EAR",
    "Blink",
    "TotalBlinks",
    "Yaw",
    "Pitch",
    "Roll",
    "HorizontalGaze",
    "VerticalGaze",
    "OnScreen",
    "HorizontalRatio",
    "VerticalRatio",
    "AttentionState",
  ],
  pythonPipelineSummary: {
    FocusedFrames: focusedFrames,
    AwayFrames: frames.length - focusedFrames - eyesClosedFrames,
    ClosedFrames: eyesClosedFrames,
  },
  attentionMetrics: {
    overallAttentionPercent: Math.round((focusedFrames / frames.length) * 100),
    focusedDurationSeconds: Number((focusedFrames * secondsPerFrame).toFixed(1)),
    distractedDurationSeconds: Number(
      (distractedFrames * secondsPerFrame).toFixed(1)
    ),
    attentionShifts: attentionShifts(),
    averageFocusDurationSeconds: avgFocusDuration(),
    longestFocusDurationSeconds: longestRun((f) => isFocused(f.attentionState)),
    longestDistractionDurationSeconds: longestRun((f) =>
      isDistracted(f.attentionState)
    ),
    eyesClosedDurationSeconds: Number(
      (eyesClosedFrames * secondsPerFrame).toFixed(1)
    ),
    blinkFrameCount: blinkFrames,
    blinkStateFrameCount: blinkStateFrames,
    blinkCount: totalBlinks,
    averageBlinkRatePerMin:
      durationSeconds === 0
        ? 0
        : Number(((totalBlinks / durationSeconds) * 60).toFixed(1)),
    screenEngagementPercent: Math.round((onScreenFrames / frames.length) * 100),
    faceDetectionRatePercent: Math.round(
      (faceDetectedFrames / frames.length) * 100
    ),
  },
  attentionStateDistribution: Object.fromEntries(
    Object.entries(attentionStates).map(([state, count]) => [
      state,
      { frames: count, percent: pct(count), seconds: Number((count * secondsPerFrame).toFixed(2)) },
    ])
  ),
  gazeDistribution: {
    horizontal: Object.fromEntries(
      Object.entries(horizontalGaze).map(([k, v]) => [k, { frames: v, percent: pct(v) }])
    ),
    vertical: Object.fromEntries(
      Object.entries(verticalGaze).map(([k, v]) => [k, { frames: v, percent: pct(v) }])
    ),
    combined: Object.fromEntries(
      Object.entries(gazeCombined).map(([k, v]) => [k, { frames: v, percent: pct(v) }])
    ),
  },
  headPose: {
    yaw: { avg: avg(yawValues), min: Number(Math.min(...yawValues).toFixed(2)), max: Number(Math.max(...yawValues).toFixed(2)) },
    pitch: { avg: avg(pitchValues), min: Number(Math.min(...pitchValues).toFixed(2)), max: Number(Math.max(...pitchValues).toFixed(2)) },
    roll: { avg: avg(rollValues), min: Number(Math.min(...rollValues).toFixed(2)), max: Number(Math.max(...rollValues).toFixed(2)) },
    estimatedStabilityScorePercent: headStability,
  },
  eyeMetrics: {
    ear: { avg: avg(earValues), min: Number(Math.min(...earValues).toFixed(4)), max: Number(Math.max(...earValues).toFixed(4)) },
    blinkEvents: frames.filter((f) => f.blink).map((f) => ({ frame: f.frame, timeSec: f.time, ear: f.ear })),
  },
  latestFrameSnapshot: {
    frame: lastFrame.frame,
    timeSec: lastFrame.time,
    attentionState: lastFrame.attentionState,
    ear: lastFrame.ear,
    blink: lastFrame.blink,
    totalBlinks: lastFrame.totalBlinks,
    yaw: Number(lastFrame.yaw.toFixed(2)),
    pitch: Number(lastFrame.pitch.toFixed(2)),
    horizontalGaze: lastFrame.horizontalGaze,
    verticalGaze: lastFrame.verticalGaze,
    onScreen: lastFrame.onScreen,
  },
  notInCsv: {
    speechMetrics: "Not produced by Python pipeline CSV — requires separate speech analysis",
    expectedWord: "Not in CSV",
    detectedWord: "Not in CSV",
    confidence: "Not in CSV",
    responseTime: "Not in CSV",
  },
};

console.log(JSON.stringify(report, null, 2));
