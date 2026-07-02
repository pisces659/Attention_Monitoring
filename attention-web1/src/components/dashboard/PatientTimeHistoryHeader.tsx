import Link from "next/link";
import { CalendarDays, Filter, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PatientTimeHistoryDashboard } from "@/mock/patient-dashboard";

interface PatientTimeHistoryHeaderProps {
  patient: PatientTimeHistoryDashboard["patient"];
  dateRangeLabel: string;
}

export default function PatientTimeHistoryHeader({
  patient,
  dateRangeLabel,
}: PatientTimeHistoryHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Patient Time History
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <span>
            <span className="font-medium text-slate-900">ID:</span>{" "}
            {patient.displayId}
          </span>
          <span>
            <span className="font-medium text-slate-900">Name:</span>{" "}
            {patient.name}
          </span>
          <span>
            <span className="font-medium text-slate-900">Age:</span>{" "}
            {patient.age} Years
          </span>
          <span>
            <span className="font-medium text-slate-900">Gender:</span>{" "}
            {patient.gender}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          className="h-10 gap-2 border-slate-200 bg-white text-slate-700"
        >
          <CalendarDays className="size-4" />
          {dateRangeLabel}
        </Button>
        <Button
          variant="outline"
          className="h-10 gap-2 border-slate-200 bg-white text-slate-700"
        >
          <Filter className="size-4" />
          Filter
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 gap-2 border-slate-200 bg-white text-slate-700"
        >
          <Link href="/patients">
            <Plus className="size-4" />
            Add Patient
          </Link>
        </Button>
        <Button
          asChild
          className="h-10 gap-2 bg-[#0052CC] text-white hover:bg-[#0047B3]"
        >
          <Link href="/sessions/new">
            <Plus className="size-4" />
            New Session
          </Link>
        </Button>
      </div>
    </div>
  );
}
