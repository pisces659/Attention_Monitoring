import { Brain } from "lucide-react";

import { appName, appTagline } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export default function Logo({ className, compact = false }: LogoProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-white/10 px-6 py-5",
        className
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-lg shadow-blue-900/40">
        <Brain className="size-5" strokeWidth={2.25} />
      </div>

      {!compact && (
        <div className="min-w-0">
          <p className="truncate font-heading text-lg font-semibold tracking-tight text-white">
            {appName}
          </p>
          <p className="truncate text-xs text-slate-400">{appTagline}</p>
        </div>
      )}
    </div>
  );
}
