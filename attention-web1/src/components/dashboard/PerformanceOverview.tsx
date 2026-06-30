import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PerformanceBarProps {
  label: string;
  value: number;
  tone: "attention" | "speech";
}

function PerformanceBar({ label, value, tone }: PerformanceBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">
          {value}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            tone === "attention" ? "bg-[#2563EB]" : "bg-violet-600"
          )}
          style={{ width: `${value}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${value}%`}
        />
      </div>
    </div>
  );
}

interface PerformanceOverviewProps {
  attentionAverage: number;
  speechAverage: number;
}

export default function PerformanceOverview({
  attentionAverage,
  speechAverage,
}: PerformanceOverviewProps) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <CardTitle>Weekly Performance</CardTitle>
        <CardDescription>
          Aggregate attention and speech clarity scores for the current week.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <PerformanceBar
          label="Attention score"
          value={attentionAverage}
          tone="attention"
        />
        <PerformanceBar
          label="Speech clarity"
          value={speechAverage}
          tone="speech"
        />

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl bg-[#2563EB]/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#2563EB]">
              Focused sessions
            </p>
            <p className="mt-2 font-heading text-2xl font-semibold text-blue-950">
              68%
            </p>
          </div>
          <div className="rounded-xl bg-violet-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
              Avg. session length
            </p>
            <p className="mt-2 font-heading text-2xl font-semibold text-violet-950">
              41 min
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
