import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Target,
  TrendingUp,
} from "lucide-react";

import type { PatientSummaryMetric } from "@/mock/patient-dashboard";
import { cn } from "@/lib/utils";

const iconMap = {
  sessions: ClipboardList,
  focus: Target,
  drift: TrendingUp,
  longest: Clock3,
  responses: CheckCircle2,
};

const toneStyles = {
  blue: "bg-[#E8F1FF] text-[#0052CC]",
  green: "bg-[#E8F8EF] text-[#16A34A]",
  orange: "bg-[#FFF4E8] text-[#EA580C]",
  purple: "bg-[#F3EEFF] text-[#7C3AED]",
  rose: "bg-[#FEECEC] text-[#DC2626]",
};

interface SummaryMetricCardsProps {
  metrics: PatientSummaryMetric[];
}

export default function SummaryMetricCards({ metrics }: SummaryMetricCardsProps) {
  return (
    <section
      aria-label="Summary metrics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      {metrics.map((metric) => {
        const Icon = iconMap[metric.icon];

        return (
          <div
            key={metric.id}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div
              className={cn(
                "mb-4 inline-flex size-11 items-center justify-center rounded-xl",
                toneStyles[metric.tone]
              )}
            >
              <Icon className="size-5" />
            </div>
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{metric.value}</p>
            {metric.subtext ? (
              <p className="mt-1 text-xs text-slate-400">{metric.subtext}</p>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
