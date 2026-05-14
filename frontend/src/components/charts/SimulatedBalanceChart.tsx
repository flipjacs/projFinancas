import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
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
  /** Additional monthly commitment from the simulated purchase. */
  extraInstallmentValue: number;
  /** Number of months the simulated purchase will continue. */
  purchaseInstallments: number;
}

export function SimulatedBalanceChart({
  months,
  extraInstallmentValue,
  purchaseInstallments,
}: Props) {
  const data = useMemo(
    () =>
      months.map((m, idx) => {
        const stillPaying = idx < purchaseInstallments;
        const projected = Number(m.projected_balance);
        const simulated = stillPaying
          ? projected - extraInstallmentValue
          : projected;
        return {
          label: `${MONTH_SHORT[m.month - 1]} ${String(m.year).slice(2)}`,
          projected,
          simulated,
        };
      }),
    [months, extraInstallmentValue, purchaseInstallments],
  );

  if (data.length === 0) {
    return (
      <EmptyState
        icon={LineIcon}
        title="Dados insuficientes para projetar"
        description="A comparação do saldo futuro aparece aqui quando houver mais dados."
      />
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 16, right: 12, bottom: 0, left: -8 }}
        >
          <defs>
            <linearGradient id="simulatedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
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
              v >= 1000 || v <= -1000
                ? `${Math.round(v / 1000)}k`
                : String(v)
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
            formatter={(value, name) => [
              formatCurrency(Number(value)),
              name === "projected" ? "Sem a compra" : "Com a compra",
            ]}
          />
          <ReferenceLine
            y={0}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
          />
          <Legend
            iconType="line"
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) =>
              value === "projected" ? "Sem a compra" : "Com a compra"
            }
          />
          <Area
            type="monotone"
            dataKey="simulated"
            stroke="hsl(38 92% 50%)"
            strokeWidth={2.5}
            fill="url(#simulatedFill)"
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
