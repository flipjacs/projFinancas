import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/ChartCard";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useTrailingMonthlySummaries } from "@/hooks/useBalance";
import { expenseService } from "@/services/expense.service";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";
import { startOfDay, subDays, format, isSameDay } from "date-fns";
import type { Expense } from "@/types/expense";

const ranges = [
  { value: "week", label: "7 dias" },
  { value: "1", label: "Mês" },
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "Ano" },
];
export function FinancialEvolution() {
  const [period, setPeriod] = useState("6");
  const weekly = period === "week";
  const trailing = useTrailingMonthlySummaries(weekly ? 0 : Number(period));
  const weekStart = startOfDay(subDays(new Date(), 6));
  const week = useQuery({
    queryKey: ["expenses", "week", format(weekStart, "yyyy-MM-dd")],
    enabled: weekly,
    queryFn: async ({ signal }) => {
      const rows: Expense[] = [];
      // The API is ordered newest first. Stop as soon as we cross the period.
      for (let skip = 0; ; skip += 100) {
        const page = await expenseService.list({ skip, limit: 100 }, signal);
        rows.push(
          ...page.filter(
            (expense) => new Date(expense.created_at) >= weekStart,
          ),
        );
        if (
          page.length < 100 ||
          new Date(page[page.length - 1].created_at) < weekStart
        )
          break;
      }
      return rows;
    },
  });
  const data: {
    label: string;
    gastos: number;
    renda: number | null;
    saldo: number | null;
  }[] = weekly
    ? Array.from({ length: 7 }, (_, i) => {
        const day = subDays(new Date(), 6 - i);
        return {
          label: format(day, "dd/MM"),
          gastos: (week.data ?? [])
            .filter((expense) => isSameDay(new Date(expense.created_at), day))
            .reduce((sum, expense) => sum + Number(expense.amount), 0),
          renda: null,
          saldo: null,
        };
      })
    : trailing.periods.map((p, i) => ({
        label:
          new Date(p.year, p.month - 1)
            .toLocaleDateString("pt-BR", { month: "short" })
            .replace(".", "") + ` ${String(p.year).slice(2)}`,
        gastos: Number(trailing.queries[i].data?.total_expenses ?? 0),
        renda: Number(trailing.queries[i].data?.salary ?? 0),
        saldo: Number(trailing.queries[i].data?.remaining_balance ?? 0),
      }));
  const failed = weekly ? week.isError : trailing.isError;
  return (
    <ChartCard
      title="Evolução financeira"
      description={
        weekly
          ? "Gastos registrados nos últimos 7 dias."
          : "Gastos e saldo mensal, usando a renda atual como referência."
      }
      loading={weekly ? week.isLoading : trailing.isLoading}
      action={
        <div
          className="flex flex-wrap gap-1 rounded-md border p-1"
          aria-label="Período do gráfico"
        >
          {ranges.map((range) => (
            <button
              key={range.value}
              type="button"
              aria-pressed={period === range.value}
              onClick={() => setPeriod(range.value)}
              className={cn(
                "theme-period min-h-8 rounded px-2.5 text-xs transition-colors",
                range.value === period
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      }
    >
      {failed ? (
        <QueryErrorState
          error={
            weekly ? week.error : trailing.queries.find((q) => q.isError)?.error
          }
          onRetry={() => {
            if (weekly) void week.refetch();
            else trailing.queries.forEach((q) => void q.refetch());
          }}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span>▰ Gastos</span>
            {!weekly && (
              <>
                <span className="text-primary">━ Saldo</span>
                <span>┄ Renda de referência</span>
              </>
            )}
          </div>
          <div
            className="chart-frame"
            role="img"
            aria-label="Evolução financeira. Os valores estão disponíveis na tabela abaixo."
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                accessibilityLayer
                data={data}
                margin={{ top: 8, left: -18, right: 8, bottom: 0 }}
              >
                <CartesianGrid stroke="hsl(var(--chart-grid))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="hsl(var(--chart-axis))"
                  minTickGap={20}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={65}
                  stroke="hsl(var(--chart-axis))"
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat("pt-BR", {
                      notation: "compact",
                    }).format(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name,
                  ]}
                />
                <Bar
                  dataKey="gastos"
                  name="Gastos"
                  fill="hsl(var(--chart-bar))"
                  fillOpacity="var(--chart-bar-opacity)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={56}
                  isAnimationActive={false}
                />
                {!weekly && (
                  <Line
                    dataKey="renda"
                    name="Renda de referência"
                    stroke="hsl(var(--chart-reference))"
                    strokeDasharray="4 5"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {!weekly && (
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke="hsl(var(--chart-primary))"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "hsl(var(--chart-point-fill))", stroke: "hsl(var(--chart-point-stroke))", strokeWidth: "var(--chart-point-width)" }}
                    isAnimationActive={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <details className="mt-4 border-t pt-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer py-1">
              Consultar valores do gráfico
            </summary>
            <dl className="mt-3 space-y-3">
              {data.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-wrap justify-between gap-2"
                >
                  <dt>{row.label}</dt>
                  <dd>
                    Gastos: {formatCurrency(row.gastos)}
                    {row.saldo !== null &&
                      ` · Saldo: ${formatCurrency(row.saldo)} · Renda: ${formatCurrency(row.renda ?? 0)}`}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        </>
      )}
    </ChartCard>
  );
}
