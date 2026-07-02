import Link from "next/link";
import { PlayCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionHistoryRow } from "@/mock/patient-dashboard";
import { cn } from "@/lib/utils";

interface SessionHistoryTableProps {
  sessions: SessionHistoryRow[];
}

export default function SessionHistoryTable({ sessions }: SessionHistoryTableProps) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-100">
      <CardHeader>
        <CardTitle className="text-lg">Session History</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Time</th>
              <th className="pb-3 font-medium">Attention</th>
              <th className="pb-3 font-medium">Focus Time</th>
              <th className="pb-3 font-medium">Drifts</th>
              <th className="pb-3 font-medium">Focus Level</th>
              <th className="pb-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr
                key={session.id}
                className="border-b border-slate-50 last:border-0"
              >
                <td className="py-3.5 text-slate-700">{session.date}</td>
                <td className="py-3.5 text-slate-700">{session.time}</td>
                <td className="py-3.5 font-medium text-slate-900">
                  {session.expectedWord}
                </td>
                <td className="py-3.5 text-slate-700">{session.focusTime}</td>
                <td className="py-3.5 text-slate-700">{session.drifts}</td>
                <td className="py-3.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                      session.result === "correct"
                        ? "bg-[#DCFCE7] text-[#15803D]"
                        : "bg-[#FEE2E2] text-[#B91C1C]"
                    )}
                  >
                    {session.resultLabel ??
                      (session.result === "correct" ? "Focused" : "Low attention")}
                  </span>
                </td>
                <td className="py-3.5 text-right">
                  <Link
                    href={
                      session.reportId
                        ? `/reports/${session.reportId}`
                        : `/sessions/${session.id}`
                    }
                    className="inline-flex items-center text-[#0052CC] hover:text-[#0047B3]"
                    aria-label={`View session from ${session.date}`}
                  >
                    <PlayCircle className="size-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
