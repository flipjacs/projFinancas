import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/components/CategoryBadge";
import { EmptyState } from "@/components/EmptyState";
import type { CategoryTotal } from "@/types/balance";
import type { ExpenseCategory } from "@/types/expense";
import { formatCurrency } from "@/utils/format";
export function ExpensesByCategoryChart({ data }: { data: CategoryTotal[] }) {
  const rows = data
    .map((row) => ({
      name: CATEGORY_LABELS[row.category as ExpenseCategory] ?? row.category,
      category: row.category as ExpenseCategory,
      value: Number(row.total),
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (!rows.length)
    return (
      <EmptyState
        icon={PieIcon}
        title="Nenhum gasto neste mês"
        description="Adicione seu primeiro gasto para ver a distribuição."
      />
    );
  return (
    <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
      <div className="relative h-56 min-w-0" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              innerRadius="70%"
              outerRadius="90%"
              paddingAngle={3}
              stroke="none"
              isAnimationActive={false}
            >
              {rows.map((row) => (
                <Cell
                  key={row.category}
                  fill={CATEGORY_COLORS[row.category] ?? CATEGORY_COLORS.other}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 6,
                fontSize: 12,
                color: "hsl(var(--foreground))",
              }}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total do mês</span>
          <span className="mt-1 text-lg font-semibold tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
      <ul className="space-y-4">
        {rows.map((row) => (
          <li key={row.category} className="flex items-start gap-2.5 text-xs">
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-sm"
              style={{ background: CATEGORY_COLORS[row.category] }}
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-1 flex-wrap justify-between gap-1">
              <span className="text-muted-foreground">{row.name}</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(row.value)}{" "}
                <span className="ml-1 font-normal text-muted-foreground">
                  {Math.round((row.value / total) * 100)}%
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
