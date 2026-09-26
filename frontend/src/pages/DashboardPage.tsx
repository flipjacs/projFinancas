import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleCheck,
  CreditCard,
  Plus,
  Receipt,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { CategoryBadge } from "@/components/CategoryBadge";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
import { ExpensesByCategoryChart } from "@/components/charts/ExpensesByCategoryChart";
import { FinancialEvolution } from "@/components/charts/FinancialEvolution";
import { IncomeDistribution } from "@/components/planejamento/IncomeDistribution";
import { AlertaFinanceiroCard } from "@/components/planejamento/AlertaFinanceiro";
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
import { useAuth } from "@/hooks/useAuth";
import { useMonthlySummary } from "@/hooks/useBalance";
import { useMonthSummary } from "@/hooks/useFinancial";
import { useAlertasPlanejamento } from "@/hooks/usePlanejamento";
import { useExpenseMutations, useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/utils/format";

export function DashboardPage() {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const monthly = useMonthlySummary();
  const financial = useMonthSummary();
  const alerts = useAlertasPlanejamento();
  const expenses = useExpenses({ limit: 5 });
  const { create } = useExpenseMutations();
  const value = financial.data;
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Seu panorama financeiro"
        title="Visão geral"
        description={`Olá${user ? `, ${user.name.split(" ")[0]}` : ""}. Acompanhe seu mês e abra espaço para o que importa.`}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Adicionar gasto
          </Button>
        }
      />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" />
        <span className="capitalize">
          {new Date().toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <span className="ml-auto hidden sm:inline">Valores em reais</span>
      </div>
      {financial.isError ? (
        <QueryErrorState
          error={financial.error}
          title="Não foi possível carregar o resumo financeiro"
          onRetry={() => void financial.refetch()}
        />
      ) : (
        <>
          <section
            className="surface-balance grid gap-5 rounded-lg border bg-card p-6 sm:p-7 lg:grid-cols-[1.3fr_1fr]"
            aria-label="Saldo do mês"
          >
            <div>
              <p className="text-sm text-muted-foreground">
                Saldo disponível no mês
              </p>
              {financial.isLoading ? (
                <Skeleton className="my-3 h-12 w-56 max-w-full" />
              ) : (
                <p
                  className={`mb-3 mt-2 break-words text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-[-0.04em] tabular-nums ${Number(value?.salary) - Number(value?.total_expenses) < 0 ? "text-destructive" : ""}`}
                >
                  {value
                    ? formatCurrency(
                        Number(value.salary) - Number(value.total_expenses),
                      )
                    : "—"}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Renda menos gastos registrados. Parcelas ainda não descontadas.
              </p>
            </div>
            <div className="flex flex-col justify-center border-t pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
              <p className="text-xs font-medium text-muted-foreground">
                DISPONÍVEL PARA GASTAR
              </p>
              {financial.isLoading ? (
                <Skeleton className="my-3 h-8 w-40" />
              ) : (
                <p
                  className={`my-2 text-2xl font-semibold tabular-nums ${Number(value?.remaining_balance) < 0 ? "text-destructive" : "text-primary"}`}
                >
                  {value ? formatCurrency(value.remaining_balance) : "—"}
                </p>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                Após gastos e parcelas previstos para este mês.
              </p>
              <Link
                to="/planejamento"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium"
              >
                Revisar planejamento <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
          <div className="metric-grid">
            <StatCard
              label="Renda mensal"
              value={value ? formatCurrency(value.salary) : "—"}
              icon={Wallet}
              loading={financial.isLoading}
              hint="Base do seu planejamento"
            />
            <StatCard
              label="Gastos do mês"
              value={value ? formatCurrency(value.total_expenses) : "—"}
              icon={TrendingDown}
              loading={financial.isLoading}
              hint="Lançamentos deste mês"
            />
            <StatCard
              label="Parcelas do mês"
              value={
                value
                  ? formatCurrency(value.monthly_installment_commitment)
                  : "—"
              }
              icon={CreditCard}
              loading={financial.isLoading}
              hint="Compromissos com compras parceladas"
            />
            <StatCard
              label="Valor comprometido"
              value={value ? formatCurrency(value.total_committed) : "—"}
              icon={Receipt}
              loading={financial.isLoading}
              hint={
                value
                  ? `${Number(value.committed_percentage).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% da renda · gastos e parcelas`
                  : "Gastos e parcelas"
              }
            />
          </div>
        </>
      )}
      <FinancialEvolution />
      <div className="grid items-start gap-5 xl:grid-cols-[1.15fr_1fr]">
        <ChartCard
          title="Gastos por categoria"
          description="Valores registrados no mês atual."
          loading={monthly.isLoading}
        >
          {monthly.isError ? (
            <QueryErrorState
              error={monthly.error}
              onRetry={() => void monthly.refetch()}
            />
          ) : (
            <ExpensesByCategoryChart data={monthly.data?.by_category ?? []} />
          )}
        </ChartCard>
        <IncomeDistribution />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle>Gastos recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/gastos">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {expenses.isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : expenses.isError ? (
              <QueryErrorState
                error={expenses.error}
                onRetry={() => void expenses.refetch()}
              />
            ) : !expenses.data?.length ? (
              <EmptyState
                icon={Receipt}
                title="Seu controle começa aqui"
                description="Registre o primeiro gasto para acompanhar seu dinheiro."
                action={
                  <Button variant="outline" onClick={() => setCreating(true)}>
                    Adicionar primeiro gasto
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y">
                {expenses.data.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-center justify-between gap-3 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {expense.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <CategoryBadge category={expense.category} />
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(expense.created_at).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatCurrency(expense.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <ChartCard
          title="Alertas financeiros"
          description="Pontos de atenção para manter o mês em dia."
          loading={alerts.isLoading}
        >
          {alerts.isError ? (
            <QueryErrorState
              error={alerts.error}
              onRetry={() => void alerts.refetch()}
            />
          ) : alerts.data?.alertas.length ? (
            <div className="space-y-3">
              {alerts.data.alertas.map((alert, i) => (
                <AlertaFinanceiroCard key={i} alerta={alert} />
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-3 py-5">
              <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  Nenhum alerta no planejamento
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Continue registrando os gastos e acompanhando suas categorias.
                </p>
              </div>
            </div>
          )}
        </ChartCard>
      </div>
      {creating && (
        <ExpenseFormDialog
          open
          onOpenChange={setCreating}
          submitting={create.isPending}
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
