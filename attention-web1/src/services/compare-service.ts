import {
  analyticsSnapshot,
  sampleAttentionTimeline,
  sampleAttentionTimelineB,
} from "@/mock/analytics-snapshot";
import { sessions } from "@/mock";
import type { SessionComparison } from "@/types";

export function compareSessions(
  sessionIdA: string,
  sessionIdB: string
): SessionComparison | null {
  const sessionA = sessions.find((session) => session.id === sessionIdA);
  const sessionB = sessions.find((session) => session.id === sessionIdB);

  if (!sessionA || !sessionB) {
    return null;
  }

  const attentionDelta = sessionA.attentionScore - sessionB.attentionScore;
  const speechDelta = sessionA.speechScore - sessionB.speechScore;
  const blinkDelta = sessionA.blinkCount - sessionB.blinkCount;
  const improvementPercent = Math.max(
    0,
    Math.round((attentionDelta + speechDelta) / 2)
  );
  const regressionPercent = Math.max(
    0,
    Math.round((-attentionDelta + -speechDelta) / 2)
  );

  return {
    sessionA,
    sessionB,
    attentionDelta,
    speechDelta,
    blinkDelta,
    focusDurationDelta: Number(
      (analyticsSnapshot.averageFocusDurationSeconds * 0.15).toFixed(1)
    ),
    eyeContactDelta: analyticsSnapshot.screenEngagementPercent - 75,
    headPoseDelta: analyticsSnapshot.headPoseLatest,
    improvementPercent,
    regressionPercent,
    attentionTrendA: sampleAttentionTimeline,
    attentionTrendB: sampleAttentionTimelineB,
  };
}
