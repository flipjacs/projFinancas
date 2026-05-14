import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LineChart as LineIcon } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import type { FutureMonthBalance } from "@/types/financial";
import { formatCurrency } from "@/utils/format";

const MONTH_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

interface Props {
  months: FutureMonthBalance[];
}

export function FuturePaymentsChart({ months }: Props) {
  const data = useMemo(
    () =>
      months.map((m) => ({
        label: `${MONTH_SHORT[m.month - 1]} ${String(m.year).slice(2)}`,
        commitment: Number(m.projected_installment_commitment),
        active: m.active_installments,
      })),
    [months],
  );

  const hasData = data.some((d) => d.commitment > 0);
  if (!hasData) {
    return (
      <EmptyState
        icon={LineIcon}
        title="Nenhum parcelamento futuro"
        description="O compromisso futuro aparece aqui quando você cadastra parcelamentos."
      />
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="commitmentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.4 }}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
              color: "hsl(var(--popover-foreground))",
            }}
            formatter={(value, name) => {
              if (name === "active") {
                return [String(value), "Parcelamentos ativos"];
              }
              return [formatCurrency(Number(value)), "Compromisso"];
            }}
          />
          <Area
            type="monotone"
            dataKey="commitment"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#commitmentGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
