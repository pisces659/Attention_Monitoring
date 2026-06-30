"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "./Logo";
import { navigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 flex-col bg-slate-950 text-white lg:flex">
      <Logo />

      <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Main navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-900/30"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              )}
            >
              <Icon className="size-5 shrink-0" strokeWidth={2} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="text-xs leading-relaxed text-slate-500">
          HIPAA-ready monitoring for clinical attention and speech assessment.
        </p>
      </div>
    </aside>
  );
}
