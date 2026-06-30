"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DonutSegment } from "@/types";

interface DonutChartProps {
  title: string;
  description?: string;
  data: DonutSegment[];
}

export default function DonutChart({
  title,
  description,
  data,
}: DonutChartProps) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((segment) => (
                <Cell key={segment.name} fill={segment.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs">
          {data.map((segment) => (
            <div key={segment.name} className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              {segment.name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
