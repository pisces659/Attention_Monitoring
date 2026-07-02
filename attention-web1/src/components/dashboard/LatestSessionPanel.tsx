"use client";

import Link from "next/link";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import SessionVideoPlayer from "@/components/common/SessionVideoPlayer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LatestSessionData } from "@/mock/patient-dashboard";

interface LatestSessionPanelProps {
  session: LatestSessionData;
}

export default function LatestSessionPanel({ session }: LatestSessionPanelProps) {
  const reportHref = session.reportId
    ? `/reports/${session.reportId}`
    : session.sessionId
      ? `/sessions/${session.sessionId}`
      : "/sessions";
  const speechAvailable = session.speechAvailable ?? false;

  return (
    <section aria-label="Latest session details" className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">
        Latest Session ({session.dateLabel})
      </h2>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Session Video</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="relative">
              <SessionVideoPlayer
                src={session.annotatedVideoUrl}
                fallbackSrc={session.rawVideoUrl}
                title="Annotated video"
                fileName={
                  session.annotatedVideoFileName || session.rawVideoFileName
                }
              />

              <div className="pointer-events-none absolute top-3 left-3 rounded-lg bg-black/70 px-3 py-2 text-xs text-white backdrop-blur-sm">
                <p>
                  Attention:{" "}
                  <span className="font-semibold text-[#4ADE80]">
                    {session.attentionStatus}
                  </span>
                </p>
                <p>EAR: {session.ear}</p>
                <p>Blink: {session.blink}</p>
                <p>Yaw: {session.yaw}</p>
                <p>Pitch: {session.pitch}</p>
              </div>
            </div>

            {(session.annotatedVideoFileName ||
              session.rawVideoFileName ||
              session.doctorNotes) && (
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                {session.annotatedVideoFileName ? (
                  <p>
                    <span className="font-medium text-slate-700">Annotated:</span>{" "}
                    {session.annotatedVideoFileName}
                  </p>
                ) : null}
                {session.rawVideoFileName ? (
                  <p>
                    <span className="font-medium text-slate-700">Raw video:</span>{" "}
                    {session.rawVideoFileName}
                  </p>
                ) : null}
                {session.doctorNotes ? (
                  <p>
                    <span className="font-medium text-slate-700">Notes:</span>{" "}
                    {session.doctorNotes}
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Attention Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={session.focusDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    {session.focusDistribution.map((segment) => (
                      <Cell key={segment.name} fill={segment.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-slate-500">Total Time</p>
                <p className="text-lg font-bold text-slate-900">
                  {session.totalTimeSeconds.toFixed(1)} sec
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-600">
              {session.focusDistribution.map((segment) => (
                <div key={segment.name} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  {segment.name} ({segment.value}%)
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                <p className="text-[11px] text-slate-500">Focus Time</p>
                <p className="text-sm font-semibold text-slate-900">
                  {session.focusTime}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                <p className="text-[11px] text-slate-500">Attention Drifts</p>
                <p className="text-sm font-semibold text-slate-900">
                  {session.attentionDrifts}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                <p className="text-[11px] text-slate-500">Longest Focus</p>
                <p className="text-sm font-semibold text-slate-900">
                  {session.longestFocus}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Speech Assessment</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col">
            {speechAvailable ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Expected Word</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {session.expectedWord}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#E8F1FF] p-3">
                    <p className="text-xs text-[#0052CC]">Detected</p>
                    <p className="mt-1 text-lg font-semibold text-[#0052CC]">
                      {session.detectedWord}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Confidence</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {session.confidence ?? 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Response Time</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {session.responseTime}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-slate-600">
                Speech word data is not included in the current CSV export.
                Attention, blink, gaze, and head-pose metrics are computed from
                the uploaded frame data.
              </p>
            )}

            <Button
              asChild
              className="mt-auto w-full bg-[#0052CC] hover:bg-[#0047B3]"
            >
              <Link href={reportHref}>View Session Report</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
