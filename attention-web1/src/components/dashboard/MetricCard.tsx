import {
  Brain,
  Eye,
  Mic,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardMetric } from "@/types";
import { cn } from "@/lib/utils";

const iconMap = {
  patients: Users,
  sessions: Video,
  attention: Brain,
  speech: Mic,
  focus: Target,
  blink: Eye,
} as const;

interface MetricCardProps {
  metric: DashboardMetric;
}

export default function MetricCard({ metric }: MetricCardProps) {
  const Icon = iconMap[metric.icon];
  const isPositive = metric.change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border/60">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {metric.title}
          </CardTitle>
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#2563EB]/10 text-[#2563EB]">
            <Icon className="size-4" strokeWidth={2} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          {metric.value}
        </p>

        <div className="flex items-center gap-2">
          <Badge
            variant={isPositive ? "secondary" : "outline"}
            className={cn(
              "gap-1 font-normal",
              isPositive
                ? "bg-emerald-50 text-[#22C55E]"
                : "bg-amber-50 text-[#F59E0B]"
            )}
          >
            <TrendIcon className="size-3" />
            {isPositive ? "+" : ""}
            {metric.change}%
          </Badge>
          <span className="text-xs text-muted-foreground">
            {metric.changeLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
