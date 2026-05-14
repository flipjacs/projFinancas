import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/utils/format";

interface Props {
  salary: number;
  recurringExpenses: number;
  currentInstallmentCommitment: number;
  newInstallmentValue: number;
}

export function CommitmentBreakdownChart({
  salary,
  recurringExpenses,
  currentInstallmentCommitment,
  newInstallmentValue,
}: Props) {
  const data = useMemo(() => {
    const totalCommitted =
      recurringExpenses + currentInstallmentCommitment + newInstallmentValue;
    const free = Math.max(0, salary - totalCommitted);
    return [
      {
        label: "Visão mensal",
        "Gastos fixos": recurringExpenses,
        "Parcelas atuais": currentInstallmentCommitment,
        "Nova compra": newInstallmentValue,
        "Sobra": free,
      },
    ];
  }, [salary, recurringExpenses, currentInstallmentCommitment, newInstallmentValue]);

  const colors: Record<string, string> = {
    "Gastos fixos": "hsl(var(--muted-foreground))",
    "Parcelas atuais": "hsl(var(--primary))",
    "Nova compra": "hsl(38 92% 50%)",
    "Sobra": "hsl(160 84% 39%)",
  };

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          stackOffset="expand"
          margin={{ top: 12, right: 16, bottom: 0, left: 0 }}
          barCategoryGap={24}
        >
          <CartesianGrid
            horizontal={false}
            stroke="hsl(var(--border))"
            strokeDasharray="3 3"
          />
          <XAxis
            type="number"
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
              color: "hsl(var(--popover-foreground))",
            }}
            formatter={(value, name) => [formatCurrency(Number(value)), name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
            iconSize={8}
          />
          {(["Gastos fixos", "Parcelas atuais", "Nova compra", "Sobra"] as const).map(
            (key) => (
              <Bar key={key} dataKey={key} stackId="a" radius={[4, 4, 4, 4]}>
                <Cell fill={colors[key]} />
              </Bar>
            ),
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
