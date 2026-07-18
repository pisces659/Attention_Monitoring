"use client";

import { useEffect, useMemo, useState } from "react";

import AnalyticsFooterRow from "@/components/dashboard/AnalyticsFooterRow";
import LatestSessionPanel from "@/components/dashboard/LatestSessionPanel";
import { Select } from "@/components/ui/select";
import type { DashboardSessionDetail } from "@/mock/patient-dashboard";

interface DashboardSessionSectionProps {
  sessions: DashboardSessionDetail[];
}

function buildSessionLabel(detail: DashboardSessionDetail) {
  const displayId = detail.session.sessionDisplayId;
  const base = `${detail.dateLabel} · ${detail.timeLabel}`;
  return displayId ? `${displayId} — ${base}` : base;
}

export default function DashboardSessionSection({
  sessions,
}: DashboardSessionSectionProps) {
  const [selectedSessionId, setSelectedSessionId] = useState(
    () => sessions[0]?.sessionId ?? ""
  );

  useEffect(() => {
    if (!sessions.some((detail) => detail.sessionId === selectedSessionId)) {
      setSelectedSessionId(sessions[0]?.sessionId ?? "");
    }
  }, [sessions, selectedSessionId]);

  const selectedDetail = useMemo(
    () =>
      sessions.find((detail) => detail.sessionId === selectedSessionId) ??
      sessions[0] ??
      null,
    [selectedSessionId, sessions]
  );

  if (!selectedDetail) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Session Details</h2>
        {sessions.length > 1 ? (
          <div className="flex min-w-[240px] flex-col gap-1 sm:max-w-sm sm:flex-1">
            <label htmlFor="dashboard-session-select" className="text-xs text-slate-500">
              Select session
            </label>
            <Select
              id="dashboard-session-select"
              value={selectedSessionId}
              onChange={(event) => setSelectedSessionId(event.target.value)}
              className="rounded-lg border-slate-200 bg-white"
            >
              {sessions.map((detail) => (
                <option key={detail.sessionId} value={detail.sessionId}>
                  {buildSessionLabel(detail)}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            {buildSessionLabel(selectedDetail)}
          </p>
        )}
      </div>

      <LatestSessionPanel
        session={selectedDetail.session}
        heading={`Session (${selectedDetail.dateLabel})`}
      />

      <AnalyticsFooterRow analytics={selectedDetail.analytics} />
    </div>
  );
}
