"use client";

import { Bell, LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_COOKIE } from "@/lib/auth";
import { currentClinician } from "@/mock";

export default function Header() {
  const router = useRouter();

  function handleLogout() {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search patients, sessions..."
          className="h-10 border-border bg-muted/40 pl-10"
          aria-label="Search patients and sessions"
        />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-[#2563EB] ring-2 ring-card" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label="Sign out"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
        </Button>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {currentClinician.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentClinician.title}
            </p>
          </div>

          <Avatar size="lg">
            <AvatarFallback className="bg-slate-900 text-white">
              {currentClinician.avatarInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
