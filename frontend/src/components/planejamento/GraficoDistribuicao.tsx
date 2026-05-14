import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { corDoTipo, labelDoTipo } from "@/components/planejamento/cores";
import type { CategoriaResumo } from "@/types/planejamento";
import { formatCurrency } from "@/utils/format";

interface Props {
  /** Categorias do resumo da renda (já com valor_planejado calculado). */
  categorias: CategoriaResumo[];
  /** Saldo restante que ainda não foi distribuído — entra como fatia "livre". */
  saldoRestante: number;
}

export function GraficoDistribuicao({ categorias, saldoRestante }: Props) {
  const dados = useMemo(() => {
    const linhas = categorias
      .map((c) => ({
        name: c.categoria,
        rawTipo: c.tipo_categoria,
        value: Number(c.valor_planejado),
        cor: corDoTipo(c.tipo_categoria),
      }))
      .filter((row) => row.value > 0);
    if (saldoRestante > 0) {
      linhas.push({
        name: "Livre",
        rawTipo: "Livre",
        value: saldoRestante,
        cor: "#94a3b8",
      });
    }
    return linhas;
  }, [categorias, saldoRestante]);

  if (dados.length === 0) {
    return (
      <EmptyState
        icon={PieIcon}
        title="Sem distribuição ainda"
        description="Cadastre categorias para visualizar como sua renda está organizada."
      />
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dados}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            stroke="none"
          >
            {dados.map((entry) => (
              <Cell key={entry.name} fill={entry.cor} />
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
            formatter={(value, name, payload) => {
              const tipo = payload?.payload?.rawTipo as string | undefined;
              const label =
                tipo && tipo !== "Livre" ? `${name} (${labelDoTipo(tipo)})` : name;
              return [formatCurrency(Number(value)), label];
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
