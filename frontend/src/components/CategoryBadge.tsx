import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExpenseCategory } from "@/types/expense";

// Semantic palette with separate light values and unchanged dark colors.
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  housing: "var(--category-housing)",
  food: "var(--category-food)",
  transport: "var(--category-transport)",
  health: "var(--category-health)",
  education: "var(--category-education)",
  entertainment: "var(--category-entertainment)",
  utilities: "var(--category-utilities)",
  shopping: "var(--category-shopping)",
  savings: "var(--category-savings)",
  other: "var(--category-other)",
};

// Os valores em inglês continuam no backend (housing, food, etc.) — só
// traduzimos o rótulo que aparece para o usuário.
export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  housing: "Moradia",
  food: "Alimentação",
  transport: "Transporte",
  health: "Saúde",
  education: "Educação",
  entertainment: "Lazer",
  utilities: "Contas",
  shopping: "Compras",
  savings: "Poupança",
  other: "Outros",
};

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const color =
    CATEGORY_COLORS[category as ExpenseCategory] ?? CATEGORY_COLORS.other;
  const label = CATEGORY_LABELS[category as ExpenseCategory] ?? category;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5", className)}
      style={{
        borderColor: `color-mix(in srgb, ${color} 25.098%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 7.843%, transparent)`,
        color: "hsl(var(--foreground))",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </Badge>
  );
}
