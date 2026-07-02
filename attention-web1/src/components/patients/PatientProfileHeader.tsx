import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Patient } from "@/types";
import { formatDate, formatPercent, getPatientFullName } from "@/lib/format";

interface PatientProfileHeaderProps {
  patient: Patient;
}

export default function PatientProfileHeader({
  patient,
}: PatientProfileHeaderProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <Avatar className="size-20">
          <AvatarFallback className="bg-slate-900 text-xl text-white">
            {patient.avatarInitials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium text-[#2563EB]">
              {patient.displayId || "—"}
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              {getPatientFullName(patient)}
            </h1>
            <p className="mt-1 text-muted-foreground">{patient.diagnosis}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Age {patient.age}</Badge>
            <Badge variant="outline">{patient.gender}</Badge>
            <Badge variant="outline">{patient.sessionCount} sessions</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:min-w-[280px]">
          <div className="rounded-xl bg-[#2563EB]/5 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Attention
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatPercent(patient.averageAttention)}
            </p>
          </div>
          <div className="rounded-xl bg-violet-50 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Speech
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatPercent(patient.averageSpeech)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 border-t border-border/60 pt-6 md:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Assigned doctor</p>
          <p className="font-medium text-foreground">{patient.doctor}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Created</p>
          <p className="font-medium text-foreground">
            {formatDate(patient.createdDate)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Last session</p>
          <p className="font-medium text-foreground">
            {patient.lastSessionLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
