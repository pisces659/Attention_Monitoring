import type { AttentionLevel, SessionStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusLabels: Record<SessionStatus, string> = {
  completed: "Completed",
  "in-progress": "In progress",
  scheduled: "Scheduled",
  processing: "Processing",
};

const statusStyles: Record<SessionStatus, string> = {
  completed: "bg-emerald-50 text-[#22C55E] ring-emerald-100",
  "in-progress": "bg-blue-50 text-[#2563EB] ring-blue-100",
  scheduled: "bg-slate-100 text-slate-600 ring-slate-200",
  processing: "bg-amber-50 text-[#F59E0B] ring-amber-100",
};

interface SessionStatusBadgeProps {
  status: SessionStatus;
  className?: string;
}

export function SessionStatusBadge({
  status,
  className,
}: SessionStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

const attentionLabels: Record<AttentionLevel, string> = {
  focused: "Focused",
  moderate: "Moderate",
  distracted: "Distracted",
};

const attentionStyles: Record<AttentionLevel, string> = {
  focused: "text-[#22C55E]",
  moderate: "text-[#F59E0B]",
  distracted: "text-[#EF4444]",
};

interface AttentionLevelLabelProps {
  level: AttentionLevel;
}

export function AttentionLevelLabel({ level }: AttentionLevelLabelProps) {
  return (
    <span className={cn("text-sm font-medium", attentionStyles[level])}>
      {attentionLabels[level]}
    </span>
  );
}

export default SessionStatusBadge;
