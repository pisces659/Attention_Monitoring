import type { HeatmapCell } from "@/types";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface GazeHeatmapProps {
  title: string;
  description?: string;
  data: HeatmapCell[];
}

export default function GazeHeatmap({
  title,
  description,
  data,
}: GazeHeatmapProps) {
  const gridSize = 8;

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {data.map((cell) => (
            <div
              key={`${cell.x}-${cell.y}`}
              className={cn("aspect-square rounded-sm")}
              style={{
                backgroundColor: `rgba(37, 99, 235, ${cell.intensity / 100})`,
              }}
              title={`Intensity ${cell.intensity}%`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
