import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useResumoPlanejamento } from "@/hooks/usePlanejamento";
import { ChartCard } from "@/components/ChartCard";
import { QueryErrorState } from "@/components/QueryErrorState";
import { formatCurrency } from "@/utils/format";

export function IncomeDistribution() {
  const query = useResumoPlanejamento();
  return (
    <ChartCard
      title="Distribuição da renda"
      description="Seu planejamento para este mês."
      loading={query.isLoading}
      action={
        <Link
          to="/planejamento"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-accent"
          aria-label="Abrir planejamento"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      }
    >
      {query.isError ? (
        <QueryErrorState
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-4">
            <span className="text-xs text-muted-foreground">Renda mensal</span>
            <span className="text-xl font-semibold tabular-nums">
              {formatCurrency(query.data?.salario ?? 0)}
            </span>
          </div>
          {query.data?.categorias.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Distribua sua renda no planejamento para acompanhar cada
              categoria.
            </p>
          )}
          {query.data?.categorias.map((category) => {
            const percent =
              Number(query.data?.salario) > 0
                ? (Number(category.valor_planejado) /
                    Number(query.data?.salario)) *
                  100
                : 0;
            return (
              <div key={category.distribuicao_id}>
                <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {category.categoria}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(category.valor_planejado)}
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap justify-between gap-2 border-t pt-4 text-sm">
            <span className="text-muted-foreground">Não distribuído</span>
            <strong className="tabular-nums">
              {formatCurrency(query.data?.saldo_restante ?? 0)}
            </strong>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
