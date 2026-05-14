import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CATEGORY_COLORS } from "@/components/CategoryBadge";
import { EmptyState } from "@/components/EmptyState";
import { PieChart as PieIcon } from "lucide-react";
import type { CategoryTotal } from "@/types/balance";
import type { ExpenseCategory } from "@/types/expense";
import { formatCurrency } from "@/utils/format";

interface Props {
  data: CategoryTotal[];
}

export function ExpensesByCategoryChart({ data }: Props) {
  const chartData = useMemo(
    () =>
      data
        .map((row) => ({
          name: row.category,
          value: Number(row.total),
        }))
        .filter((row) => row.value > 0)
        .sort((a, b) => b.value - a.value),
    [data],
  );

  if (chartData.length === 0) {
    return (
      <EmptyState
        icon={PieIcon}
        title="No spending yet this month"
        description="Add an expense to see your category breakdown."
      />
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            stroke="none"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={
                  CATEGORY_COLORS[entry.name as ExpenseCategory] ??
                  CATEGORY_COLORS.other
                }
              />
            ))}
          </Pie>
          <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
              color: "hsl(var(--popover-foreground))",
            }}
            formatter={(value) => [formatCurrency(Number(value)), "Total"]}
            labelFormatter={(label) => String(label)}
          />
          <Legend
            verticalAlign="bottom"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, textTransform: "capitalize" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
