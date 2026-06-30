import { Play, Video } from "lucide-react";

import { cn } from "@/lib/utils";

interface VideoPlaceholderProps {
  title: string;
  subtitle?: string;
  variant?: "original" | "annotated";
  className?: string;
}

export default function VideoPlaceholder({
  title,
  subtitle,
  variant = "original",
  className,
}: VideoPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-slate-950 text-white",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.25),transparent_55%)]" />
      <div className="relative flex flex-col items-center gap-3 px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-white/10 backdrop-blur">
          {variant === "annotated" ? (
            <Video className="size-6" />
          ) : (
            <Play className="size-6" />
          )}
        </div>
        <div>
          <p className="font-medium">{title}</p>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
