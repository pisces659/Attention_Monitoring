"use client";

import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
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
import type { AnalyticsFooterData } from "@/mock/patient-dashboard";

interface AnalyticsFooterRowProps {
  analytics: AnalyticsFooterData;
}

function heatColor(value: number) {
  const intensity = value / 100;
  const red = Math.round(255 * intensity);
  const green = Math.round(120 * (1 - intensity));
  const blue = Math.round(255 * (1 - intensity));
  return `rgb(${red}, ${green}, ${blue})`;
}

export default function AnalyticsFooterRow({ analytics }: AnalyticsFooterRowProps) {
  return (
    <section
      aria-label="Session analytics"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
    >
      <Card className="border-0 shadow-sm ring-1 ring-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Gaze Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1">
            {analytics.gazeHeatmap.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="grid grid-cols-8 gap-1">
                {row.map((value, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="aspect-square rounded-sm"
                    style={{ backgroundColor: heatColor(value) }}
                    title={`Intensity ${value}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Gaze Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.gazeDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={38}
                  outerRadius={58}
                  paddingAngle={2}
                >
                  {analytics.gazeDistribution.map((segment) => (
                    <Cell key={segment.name} fill={segment.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1 text-xs text-slate-600">
            {analytics.gazeDistribution.map((segment) => (
              <div key={segment.name} className="flex justify-between">
                <span>{segment.name}</span>
                <span className="font-medium">{segment.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Blink Analysis</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col justify-center gap-4">
          <div>
            <p className="text-xs text-slate-500">Total Blinks</p>
            <p className="text-3xl font-bold text-slate-900">
              {analytics.totalBlinks}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Blink Rate</p>
            <p className="text-xl font-semibold text-slate-900">
              {analytics.blinkRate}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Head Movement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500">Stability Score</p>
              <p className="text-2xl font-bold text-slate-900">
                {analytics.headStabilityScore}%
              </p>
            </div>
            <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-xs font-semibold text-[#15803D]">
              {analytics.headMovementLevel}
            </span>
          </div>
          <div className="h-[90px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.headMovementTrend}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 10 }}
                />
                <YAxis hide domain={[80, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Engagement Score</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="relative size-28">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#0052CC"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(analytics.engagementScore / 100) * 301.59} 301.59`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-slate-900">
                {analytics.engagementScore}%
              </p>
              <p className="text-xs text-slate-500">{analytics.engagementLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
