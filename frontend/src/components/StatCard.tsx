import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  loading?: boolean;
  tone?: "default" | "positive" | "warning" | "negative";
  className?: string;
}
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  loading,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn("surface-card min-w-0 rounded-lg border bg-card p-5", className)}
      aria-busy={loading}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="metric-label text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <Icon
            className="h-4 w-4 shrink-0 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        )}
      </div>
      {loading ? (
        <Skeleton className="my-4 h-9 w-3/4" />
      ) : (
        <p
          className={cn(
            "mb-3 mt-4 break-words text-[clamp(1.35rem,2.2vw,1.85rem)] font-semibold leading-tight tracking-tight tabular-nums",
            tone === "positive" && "text-primary",
            tone === "negative" && "text-destructive",
          )}
        >
          {value}
        </p>
      )}
      {hint && (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
