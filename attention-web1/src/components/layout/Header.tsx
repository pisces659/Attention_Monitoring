"use client";

import { Bell, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import { apiFetch } from "@/lib/api-client";
import { currentClinician } from "@/mock";
import { logout } from "@/services/auth-service";
import type { Clinician } from "@/types";

export default function Header() {
  const router = useRouter();
  const [clinician, setClinician] = useState<Clinician>(currentClinician);

  useEffect(() => {
    if (!USE_API) {
      return;
    }

    let active = true;
    apiFetch<{ clinician: Clinician }>(API_ENDPOINTS.authMe)
      .then((data) => {
        if (active && data.clinician) {
          setClinician(data.clinician);
        }
      })
      .catch(() => {
        // Keep mock fallback when auth is unavailable.
      });

    return () => {
      active = false;
    };
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5">
      <Button variant="ghost" size="icon" className="text-slate-600" aria-label="Menu">
        <Menu className="size-5" />
      </Button>

      <div className="flex shrink-0 items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-600"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-semibold text-white">
            3
          </span>
        </Button>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">
              {clinician.name}
            </p>
            <p className="text-xs text-slate-500">{clinician.title}</p>
          </div>

          <Avatar size="lg">
            <AvatarFallback className="bg-[#0052CC] text-white">
              {clinician.avatarInitials}
            </AvatarFallback>
          </Avatar>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-slate-500"
          aria-label="Sign out"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
