import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import {
  analyticsSnapshot,
  sampleAttentionTimeline,
  sampleAttentionTimelineB,
} from "@/mock/analytics-snapshot";
import { sessions } from "@/mock";
import type { SessionComparison } from "@/types";

export async function compareSessions(
  sessionIdA: string,
  sessionIdB: string
): Promise<SessionComparison | null> {
  if (!USE_API) {
    return compareSessionsMock(sessionIdA, sessionIdB);
  }

  try {
    return await apiFetch<SessionComparison>(
      API_ENDPOINTS.compareSessions(sessionIdA, sessionIdB)
    );
  } catch {
    return null;
  }
}

function compareSessionsMock(
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
