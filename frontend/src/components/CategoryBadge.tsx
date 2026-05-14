import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExpenseCategory } from "@/types/expense";

/**
 * Stable color per category. Hand-picked for legibility in both light and
 * dark modes and consistent across the dashboard, charts, and tables.
 */
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  housing: "#6366f1", // indigo
  food: "#f97316", // orange
  transport: "#06b6d4", // cyan
  health: "#ef4444", // red
  education: "#8b5cf6", // violet
  entertainment: "#ec4899", // pink
  utilities: "#0ea5e9", // sky
  shopping: "#f59e0b", // amber
  savings: "#10b981", // emerald
  other: "#64748b", // slate
};

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const color =
    CATEGORY_COLORS[category as ExpenseCategory] ?? CATEGORY_COLORS.other;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 capitalize", className)}
      style={{
        borderColor: `${color}40`,
        backgroundColor: `${color}14`,
        color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {category}
    </Badge>
  );
}
