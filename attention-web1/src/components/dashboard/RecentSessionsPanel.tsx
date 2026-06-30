import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Session } from "@/types";
import { cn } from "@/lib/utils";

import {
  AttentionLevelLabel,
  SessionStatusBadge,
} from "./SessionStatusBadge";

function ScoreCell({
  value,
  status,
}: {
  value: number;
  status: Session["status"];
}) {
  if (status === "scheduled" || status === "processing") {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        value >= 85
          ? "text-[#22C55E]"
          : value >= 70
            ? "text-[#F59E0B]"
            : "text-[#EF4444]"
      )}
    >
      {value}%
    </span>
  );
}

interface RecentSessionsPanelProps {
  sessions: Session[];
}

export default function RecentSessionsPanel({
  sessions,
}: RecentSessionsPanelProps) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
        <CardDescription>
          Latest attention and speech assessments across your patient panel.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 pb-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Attention</th>
                <th className="px-4 py-3 font-medium">Speech</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {session.patientName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.patientId}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {session.dateLabel}
                  </td>
                  <td className="px-4 py-4 tabular-nums text-muted-foreground">
                    {session.status === "scheduled"
                      ? `${session.durationMinutes} min planned`
                      : `${session.durationMinutes} min`}
                  </td>
                  <td className="px-4 py-4">
                    <ScoreCell
                      value={session.attentionScore}
                      status={session.status}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <ScoreCell
                      value={session.speechScore}
                      status={session.status}
                    />
                  </td>
                  <td className="px-4 py-4">
                    {session.status === "scheduled" ||
                    session.status === "processing" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <AttentionLevelLabel level={session.attentionLevel} />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <SessionStatusBadge status={session.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
