import Link from "next/link";
import { Plus } from "lucide-react";

import PageHeader from "@/components/dashboard/PageHeader";
import { SessionStatusBadge } from "@/components/dashboard/SessionStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllSessions, getReports } from "@/services";

export default async function SessionsPage() {
  const sessions = await getAllSessions();
  const reports = await getReports();
  const reportBySessionId = new Map(
    reports.map((report) => [report.sessionId, report.id])
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeader
          title="Sessions"
          description="Review therapy sessions, monitor processing status, and create new assessments."
        />
        <Button asChild>
          <Link href="/sessions/new">
            <Plus className="size-4" />
            New session
          </Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
          <CardDescription>
            {sessions.length} sessions across the current patient panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Session</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Attention</th>
                  <th className="px-4 py-3 font-medium">Speech</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="border-b border-border/60 last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-6 py-4 font-medium">
                      {session.displayId || session.id}
                    </td>
                    <td className="px-4 py-4">{session.patientName}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {session.dateLabel}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {session.durationMinutes} min
                    </td>
                    <td className="px-4 py-4">
                      {session.attentionScore > 0
                        ? `${session.attentionScore}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-4">
                      {session.speechScore > 0
                        ? `${session.speechScore}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <SessionStatusBadge status={session.status} />
                    </td>
                    <td className="px-6 py-4">
                      {session.status === "processing" ? (
                        <Link
                          href={`/sessions/${session.id}/processing`}
                          className="text-[#2563EB] hover:underline"
                        >
                          View processing
                        </Link>
                      ) : session.status === "completed" ? (
                        <Link
                          href={`/reports/${reportBySessionId.get(session.id) ?? ""}`}
                          className="text-[#2563EB] hover:underline"
                        >
                          View report
                        </Link>
                      ) : session.status === "scheduled" ? (
                        <Link
                          href={`/sessions/${session.id}/upload`}
                          className="text-[#2563EB] hover:underline"
                        >
                          Upload results
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
