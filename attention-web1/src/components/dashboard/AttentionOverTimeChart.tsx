"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DualTrendPoint } from "@/mock/patient-dashboard";

interface AttentionOverTimeChartProps {
  data: DualTrendPoint[];
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number;
    color?: string;
  }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const focusEntry = payload.find((entry) => entry.dataKey === "focusTime");
  const driftEntry = payload.find((entry) => entry.dataKey === "attentionDrift");

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="mb-2 font-medium text-slate-900">{label}</p>
      {focusEntry ? (
        <p className="text-[#2563EB]">
          Focus Time (sec): {focusEntry.value}
        </p>
      ) : null}
      {driftEntry ? (
        <p className="text-[#F97316]">
          Attention Drift (count): {driftEntry.value}
        </p>
      ) : null}
    </div>
  );
}

export default function AttentionOverTimeChart({ data }: AttentionOverTimeChartProps) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-100">
      <CardHeader>
        <CardTitle className="text-lg">Attention Over Time</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              label={{
                value: "Focus Time (sec)",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#64748B", fontSize: 11 },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              label={{
                value: "Attention Drift (count)",
                angle: 90,
                position: "insideRight",
                style: { fill: "#64748B", fontSize: 11 },
              }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="focusTime"
              name="Focus Time (sec)"
              stroke="#2563EB"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#2563EB" }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="attentionDrift"
              name="Attention Drift (count)"
              stroke="#F97316"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#F97316" }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
