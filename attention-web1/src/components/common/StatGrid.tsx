import { cn } from "@/lib/utils";

interface StatGridProps {
  items: Array<{ label: string; value: string | number }>;
  className?: string;
}

export default function StatGrid({ items, className }: StatGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-2 font-heading text-2xl font-semibold text-foreground">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
