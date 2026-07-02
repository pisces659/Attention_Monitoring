"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  UserPlus,
  Users,
  Video,
} from "lucide-react";

import Logo from "./Logo";
import { Input } from "@/components/ui/input";
import { sidebarPatients as mockSidebarPatients } from "@/mock/patient-dashboard";
import type { PatientSidebarItem } from "@/mock/patient-dashboard";
import { USE_API } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { fetchSidebarPatientsClient } from "@/services/client-data-service";

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePatientId = searchParams.get("patientId");

  const [patients, setPatients] = useState<PatientSidebarItem[]>(
    USE_API ? [] : mockSidebarPatients
  );
  const [query, setQuery] = useState("");
  const [expandedClinics, setExpandedClinics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!USE_API) {
      setPatients(mockSidebarPatients);
      return;
    }

    let active = true;

    function loadPatients() {
      fetchSidebarPatientsClient()
        .then((data) => {
          if (!active) {
            return;
          }
          setPatients(data);
          const clinicNames = [...new Set(data.map((patient) => patient.clinic))];
          setExpandedClinics((current) => {
            const next = { ...current };
            for (const clinic of clinicNames) {
              next[clinic] = current[clinic] ?? true;
            }
            return next;
          });
        })
        .catch(() => {
          if (active) {
            setPatients([]);
          }
        });
    }

    loadPatients();
    window.addEventListener("patients-updated", loadPatients);

    return () => {
      active = false;
      window.removeEventListener("patients-updated", loadPatients);
    };
  }, [pathname]);

  const filteredPatients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return patients;
    }
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(normalized) ||
        patient.displayId.toLowerCase().includes(normalized)
    );
  }, [patients, query]);

  const clinics = useMemo(() => {
    const groups = new Map<string, PatientSidebarItem[]>();

    for (const patient of filteredPatients) {
      const current = groups.get(patient.clinic) ?? [];
      current.push(patient);
      groups.set(patient.clinic, current);
    }

    return Array.from(groups.entries());
  }, [filteredPatients]);

  const defaultPatientId = patients[0]?.id;

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col bg-[#0B172A] text-white xl:flex">
      <Logo />

      <div className="border-b border-white/10 px-4 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search patient..."
            className="h-10 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-4 text-sm font-semibold text-white">
          <Users className="size-4 text-[#60A5FA]" />
          Patients
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-2 pb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            All Patients ({patients.length})
          </p>

          {clinics.length === 0 ? (
            <p className="px-2 text-sm text-slate-400">
              No patients yet. Add one from the Patients page.
            </p>
          ) : null}

          {clinics.map(([clinic, clinicPatients]) => {
            const expanded = expandedClinics[clinic] ?? true;

            return (
              <div key={clinic} className="mb-3">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedClinics((current) => ({
                      ...current,
                      [clinic]: !expanded,
                    }))
                  }
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-300 hover:bg-white/5"
                >
                  {expanded ? (
                    <ChevronDown className="size-4 shrink-0" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0" />
                  )}
                  {clinic}
                </button>

                {expanded ? (
                  <div className="mt-1 space-y-1">
                    {clinicPatients.map((patient) => {
                      const selected =
                        pathname === "/dashboard" &&
                        (activePatientId
                          ? patient.id === activePatientId
                          : patient.id === defaultPatientId);

                      return (
                        <Link
                          key={patient.id}
                          href={`/dashboard?patientId=${patient.id}`}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                            selected
                              ? "bg-[#0052CC] text-white shadow-lg shadow-blue-900/30"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                            {patient.avatarInitials}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {patient.displayId} - {patient.name}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Quick actions
        </p>
        <div className="mb-3 space-y-1">
          <Link
            href="/patients"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <UserPlus className="size-4 text-[#60A5FA]" />
            Add patient
          </Link>
          <Link
            href="/sessions/new"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Video className="size-4 text-[#60A5FA]" />
            New session
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Building2 className="size-4 text-[#60A5FA]" />
            Clinic & doctors
          </Link>
        </div>

        <p className="mb-3 px-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {USE_API ? "Live API data" : "Demo mock data"}
        </p>
        <Link
          href="/reports"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/reports")
              ? "bg-white/10 text-white"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          )}
        >
          <FileText className="size-4" />
          Reports
        </Link>
      </div>
    </aside>
  );
}
