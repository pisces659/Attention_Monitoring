import Link from "next/link";
import { Calendar, ChevronRight, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Patient } from "@/types";
import { formatPercent } from "@/lib/format";

interface PatientCardProps {
  patient: Patient;
}

export default function PatientCard({ patient }: PatientCardProps) {
  return (
    <Link
      href={`/patients/${patient.id}`}
      className="group block rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#2563EB]/30 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <Avatar size="lg">
          <AvatarFallback className="bg-slate-900 text-white">
            {patient.avatarInitials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {patient.firstName} {patient.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{patient.id}</p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#2563EB]" />
          </div>

          <p className="mt-3 line-clamp-2 text-sm text-foreground/80">
            {patient.diagnosis}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1 font-normal">
              <UserRound className="size-3" />
              Age {patient.age}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {patient.gender}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 text-sm">
            <div>
              <p className="text-muted-foreground">Attention avg.</p>
              <p className="font-semibold text-foreground">
                {formatPercent(patient.averageAttention)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Speech avg.</p>
              <p className="font-semibold text-foreground">
                {formatPercent(patient.averageSpeech)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>{patient.sessionCount} sessions</span>
            <span>•</span>
            <span>Last visit {patient.lastSessionLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
