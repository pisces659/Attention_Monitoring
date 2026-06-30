import type { TrendPoint } from "@/types";

export const sampleAttentionTimeline: TrendPoint[] = [
  { label: "0s", value: 0 },
  { label: "2s", value: 0 },
  { label: "4s", value: 0 },
  { label: "6s", value: 0 },
  { label: "8s", value: 0 },
  { label: "10s", value: 50 },
  { label: "12s", value: 100 },
  { label: "14s", value: 100 },
];

export const sampleAttentionTimelineB: TrendPoint[] = sampleAttentionTimeline.map(
  (point) => ({
    ...point,
    value: Math.max(0, point.value - 8),
  })
);

export const analyticsSnapshot = {
  screenEngagementPercent: 78,
  headPoseLatest: 3.6,
  averageFocusDurationSeconds: 2.4,
};
