import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExpenseCategory } from "@/types/expense";

// Cor fixa para cada categoria, escolhida para ficar legível tanto no
// tema claro quanto no escuro. Usada em badges, gráficos e tabelas.
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  housing: "#6366f1", // indigo
  food: "#f97316", // laranja
  transport: "#06b6d4", // ciano
  health: "#ef4444", // vermelho
  education: "#8b5cf6", // violeta
  entertainment: "#ec4899", // rosa
  utilities: "#0ea5e9", // azul
  shopping: "#f59e0b", // âmbar
  savings: "#10b981", // verde
  other: "#64748b", // cinza
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
  const label =
    CATEGORY_LABELS[category as ExpenseCategory] ?? category;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5", className)}
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
      {label}
    </Badge>
  );
}
