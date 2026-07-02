import { resolveMediaUrl } from "@/lib/api-config";
import { cn } from "@/lib/utils";

interface SessionVideoPlayerProps {
  src?: string | null;
  fallbackSrc?: string | null;
  title: string;
  fileName?: string;
  className?: string;
}

export default function SessionVideoPlayer({
  src,
  fallbackSrc,
  title,
  fileName,
  className,
}: SessionVideoPlayerProps) {
  const videoSrc = resolveMediaUrl(src) ?? resolveMediaUrl(fallbackSrc);

  if (!videoSrc) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500",
          className
        )}
      >
        <div>
          <p className="font-medium text-slate-700">{title}</p>
          <p className="mt-1">No video uploaded for this session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="overflow-hidden rounded-2xl bg-black">
        <video
          src={videoSrc}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black object-contain"
        >
          Your browser does not support video playback.
        </video>
      </div>
      {fileName ? (
        <p className="text-xs text-slate-500">
          {title}: {fileName}
        </p>
      ) : null}
    </div>
  );
}
