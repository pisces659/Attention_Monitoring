import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Patient } from "@/types";
import { formatPercent } from "@/lib/format";

interface RecentPatientsPanelProps {
  patients: Patient[];
}

export default function RecentPatientsPanel({
  patients,
}: RecentPatientsPanelProps) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border/60">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Recent Patients</CardTitle>
          <CardDescription>
            Patients with the most recent therapy activity.
          </CardDescription>
        </div>
        <Link
          href="/patients"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#2563EB] hover:underline"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </CardHeader>

      <CardContent className="space-y-3">
        {patients.map((patient) => (
          <Link
            key={patient.id}
            href={`/patients/${patient.id}`}
            className="flex items-center gap-4 rounded-xl border border-border/60 p-4 transition-colors hover:bg-muted/40"
          >
            <Avatar size="lg">
              <AvatarFallback className="bg-slate-900 text-white">
                {patient.avatarInitials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {patient.diagnosis}
              </p>
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">
                {formatPercent(patient.averageAttention)}
              </p>
              <p className="text-xs text-muted-foreground">
                {patient.lastSessionLabel}
              </p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
