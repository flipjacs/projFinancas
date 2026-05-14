import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/EmptyState";
import { BarChart3 } from "lucide-react";
import type { MonthlySummary } from "@/types/balance";
import { formatCurrency } from "@/utils/format";

interface Props {
  /** Periods (year/month) requested, in chronological order. */
  periods: { year: number; month: number }[];
  /** Loaded summary for each period in `periods`; null while loading or on error. */
  summaries: (MonthlySummary | null)[];
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function MonthlySpendingChart({ periods, summaries }: Props) {
  const data = useMemo(
    () =>
      periods.map((period, i) => ({
        label: `${MONTH_SHORT[period.month - 1]} ${String(period.year).slice(2)}`,
        total: Number(summaries[i]?.total_expenses ?? 0),
      })),
    [periods, summaries],
  );

  const hasData = data.some((d) => d.total > 0);
  if (!hasData) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Not enough history yet"
        description="Spending trends will appear once you have a few months of data."
      />
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
            }
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--accent))", opacity: 0.4 }}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
              color: "hsl(var(--popover-foreground))",
            }}
            formatter={(value) => [formatCurrency(Number(value)), "Spent"]}
          />
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
