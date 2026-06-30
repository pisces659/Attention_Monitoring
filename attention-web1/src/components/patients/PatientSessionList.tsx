import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Session } from "@/types";

import { SessionStatusBadge } from "@/components/dashboard/SessionStatusBadge";

interface PatientSessionListProps {
  sessions: Session[];
}

export default function PatientSessionList({
  sessions,
}: PatientSessionListProps) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <CardTitle>Session History</CardTitle>
        <CardDescription>
          Attention and speech outcomes across all recorded therapy sessions.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 pb-2">
        {sessions.length === 0 ? (
          <p className="px-6 pb-4 text-sm text-muted-foreground">
            No sessions recorded for this patient yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Session</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Attention</th>
                  <th className="px-4 py-3 font-medium">Speech</th>
                  <th className="px-4 py-3 font-medium">Blinks</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="border-b border-border/60 last:border-b-0"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {session.id}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {session.dateLabel}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {session.durationMinutes} min
                    </td>
                    <td className="px-4 py-4 tabular-nums text-foreground">
                      {session.attentionScore > 0
                        ? `${session.attentionScore}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-foreground">
                      {session.speechScore > 0 ? `${session.speechScore}%` : "—"}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-muted-foreground">
                      {session.blinkCount > 0 ? session.blinkCount : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <SessionStatusBadge status={session.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
