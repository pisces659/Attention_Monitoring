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
  heading?: string;
}

export default function LatestSessionPanel({
  session,
  heading,
}: LatestSessionPanelProps) {
  const reportHref = session.reportId
    ? `/reports/${session.reportId}`
    : session.sessionId
      ? `/sessions/${session.sessionId}`
      : "/sessions";
  const speechAvailable = session.speechAvailable ?? false;
  const speechMatches =
    session.speechMatches ??
    (session.expectedWords?.length
      ? session.expectedWords.map((word) => ({
          expectedWord: word,
          detectedWord: session.detectedWord === "—" || session.detectedWord === "N/A"
            ? null
            : session.detectedWord,
          confidence: session.confidence ?? 0,
          responseTime: session.responseTime,
        }))
      : session.expectedWord && session.expectedWord !== "—" && session.expectedWord !== "N/A"
        ? [
            {
              expectedWord: session.expectedWord,
              detectedWord:
                session.detectedWord === "—" || session.detectedWord === "N/A"
                  ? null
                  : session.detectedWord,
              confidence: session.confidence ?? 0,
              responseTime: session.responseTime,
            },
          ]
        : []);
  const speechOtherWords = session.speechOtherWords ?? [];

  return (
    <section aria-label="Session details" className="space-y-4">
      {heading ? (
        <h3 className="sr-only">{heading}</h3>
      ) : (
        <h2 className="text-lg font-semibold text-slate-900">
          Latest Session ({session.dateLabel})
        </h2>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Session Video</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <SessionVideoPlayer
              src={session.annotatedVideoUrl}
              fallbackSrc={session.rawVideoUrl}
              title="Annotated video"
              fileName={
                session.annotatedVideoFileName || session.rawVideoFileName
              }
            />

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
                {speechMatches.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full min-w-[280px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2 font-medium">Expected</th>
                          <th className="px-3 py-2 font-medium">Detected</th>
                          <th className="px-3 py-2 font-medium">Confidence</th>
                          <th className="px-3 py-2 font-medium">Response</th>
                          <th className="px-3 py-2 font-medium">Timing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {speechMatches.map((match) => (
                          <tr
                            key={match.expectedWord}
                            className="border-b border-slate-100 last:border-b-0"
                          >
                            <td className="px-3 py-2.5 font-medium text-slate-900">
                              {match.expectedWord}
                            </td>
                            <td className="px-3 py-2.5 text-[#0052CC]">
                              {match.detectedWord ?? "—"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-900">
                              {match.confidence}%
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {match.responseTime}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {match.inTimeWindow === true
                                ? "On time"
                                : match.inTimeWindow === false
                                  ? "Late / early"
                                  : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    No expected words were configured for this session.
                  </p>
                )}

                {speechOtherWords.length > 0 ? (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Other detected words
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {speechOtherWords.map((item) => (
                        <span
                          key={item.word}
                          className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200"
                        >
                          {item.word}
                          <span className="ml-1 text-slate-400">
                            ({item.confidence}%)
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
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
