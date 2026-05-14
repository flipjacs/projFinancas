import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  Receipt,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { CategoryBadge } from "@/components/CategoryBadge";
import { EmptyState } from "@/components/EmptyState";
import { ExpensesByCategoryChart } from "@/components/charts/ExpensesByCategoryChart";
import { MonthlySpendingChart } from "@/components/charts/MonthlySpendingChart";
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
import { useAuth } from "@/hooks/useAuth";
import {
  useCurrentBalance,
  useMonthlySummary,
  useTrailingMonthlySummaries,
} from "@/hooks/useBalance";
import { useExpenseMutations, useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/utils/format";

const RECENT_LIMIT = 5;

export function DashboardPage() {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  const balanceQuery = useCurrentBalance();
  const monthlyQuery = useMonthlySummary();
  const trailing = useTrailingMonthlySummaries(6);
  const expensesQuery = useExpenses({ limit: RECENT_LIMIT });
  const { create } = useExpenseMutations();

  const balance = balanceQuery.data;
  const monthly = monthlyQuery.data;

  // Cor do card de saldo restante muda conforme a margem do mês.
  const remainingTone = useMemo(() => {
    if (!balance) return "default" as const;
    const remaining = Number(balance.remaining_balance);
    if (remaining < 0) return "negative" as const;
    if (remaining < Number(balance.salary) * 0.2) return "warning" as const;
    return "positive" as const;
  }, [balance]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá{user ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Veja como estão suas finanças neste mês.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Novo gasto
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Salário mensal"
          value={balance ? formatCurrency(balance.salary) : "-"}
          icon={Wallet}
          loading={balanceQuery.isLoading}
          hint="Definido no cadastro · pode ser editado em Configurações."
        />
        <StatCard
          label="Gasto neste mês"
          value={
            balance ? formatCurrency(balance.total_expenses_this_month) : "-"
          }
          icon={TrendingDown}
          tone="warning"
          loading={balanceQuery.isLoading}
          hint={
            monthly
              ? `${monthly.expense_count} ${monthly.expense_count === 1 ? "gasto registrado" : "gastos registrados"}`
              : "Calculado a partir de /balance"
          }
        />
        <StatCard
          label="Saldo restante"
          value={balance ? formatCurrency(balance.remaining_balance) : "-"}
          icon={Receipt}
          tone={remainingTone}
          loading={balanceQuery.isLoading}
          hint="Salário menos os gastos do mês."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Gastos por categoria"
          description="Distribuição do mês atual"
          loading={monthlyQuery.isLoading}
        >
          <ExpensesByCategoryChart data={monthly?.by_category ?? []} />
        </ChartCard>
        <ChartCard
          title="Últimos 6 meses"
          description="Total gasto em cada mês"
          loading={trailing.isLoading}
        >
          <MonthlySpendingChart
            periods={trailing.periods}
            summaries={trailing.queries.map((q) => q.data ?? null)}
          />
        </ChartCard>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Gastos recentes</CardTitle>
            <CardDescription>
              Seus últimos lançamentos em todas as categorias.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/gastos">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {expensesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : !expensesQuery.data || expensesQuery.data.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Nenhum gasto registrado ainda"
              description="Adicione seu primeiro gasto para começar."
              action={
                <Button onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" />
                  Novo gasto
                </Button>
              }
            />
          ) : (
            <ul className="divide-y">
              {expensesQuery.data.slice(0, RECENT_LIMIT).map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <CategoryBadge category={expense.category} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {expense.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(expense.created_at), "d 'de' MMM',' yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(expense.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ExpenseFormDialog
        open={creating}
        onOpenChange={setCreating}
        submitting={create.isPending}
        onSubmit={async (values) => {
          await create.mutateAsync(values);
          setCreating(false);
        }}
      />
    </div>
  );
}
