import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  loading?: boolean;
  /** Tints the icon — useful to signal positive/negative metrics. */
  tone?: "default" | "positive" | "warning" | "negative";
  className?: string;
}

const TONE_STYLES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  negative: "bg-destructive/10 text-destructive",
};

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
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardDescription>{label}</CardDescription>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
          )}
        </div>
        {Icon && (
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              TONE_STYLES[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
      </CardHeader>
      {hint && (
        <CardContent className="text-xs text-muted-foreground">
          {hint}
        </CardContent>
      )}
    </Card>
  );
}
