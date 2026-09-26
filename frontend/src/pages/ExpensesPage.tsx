import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
import { DeleteExpenseDialog } from "@/components/expenses/DeleteExpenseDialog";
import {
  ALL_CATEGORIES,
  CategoryFilter,
} from "@/components/expenses/CategoryFilter";
import { useExpenseMutations, useExpensePages } from "@/hooks/useExpenses";
import type { Expense, ExpenseCategory } from "@/types/expense";
import { formatCurrency } from "@/utils/format";

export function ExpensesPage() {
  const [category, setCategory] = useState<
    ExpenseCategory | typeof ALL_CATEGORIES
  >(ALL_CATEGORIES);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("");
  const [kind, setKind] = useState("all");
  const expensesQuery = useExpensePages();
  const { create, update, remove } = useExpenseMutations();

  const filtered = useMemo(() => {
    const data = expensesQuery.data?.pages.flat() ?? [];
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return data.filter((expense) => {
      const date = new Date(expense.created_at);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return (
        (category === ALL_CATEGORIES || expense.category === category) &&
        expense.title.toLocaleLowerCase("pt-BR").includes(term) &&
        (!period || month === period) &&
        (kind === "all" || expense.recurring === (kind === "recurring"))
      );
    });
  }, [expensesQuery.data, category, search, period, kind]);

  const totalShown = filtered.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gastos"
        description="Cada lançamento conta. Entenda para onde seu dinheiro vai."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Adicionar gasto
          </Button>
        }
      />
      <div className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="expense-search">Buscar descrição</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="expense-search"
              className="pl-9"
              placeholder="Ex.: mercado"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense-period">Mês do registro</Label>
          <Input
            id="expense-period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense-category">Categoria</Label>
          <CategoryFilter value={category} onChange={setCategory} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense-kind">Tipo de gasto</Label>
          <select
            id="expense-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">Todos os tipos</option>
            <option value="recurring">Recorrente mensal</option>
            <option value="single">Avulso</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2 xl:col-span-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setPeriod("");
              setCategory(ALL_CATEGORIES);
              setKind("all");
            }}
          >
            Limpar filtros
          </Button>
          <Link
            to="/parcelamentos"
            className="text-xs text-muted-foreground underline underline-offset-4"
          >
            Consultar compras parceladas
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Todos os gastos</CardTitle>
            <CardDescription>
              {expensesQuery.isLoading
                ? "Carregando…"
                : `${filtered.length} ${filtered.length === 1 ? "gasto" : "gastos"} · ${formatCurrency(totalShown)}`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {expensesQuery.isError && !expensesQuery.data ? (
            <QueryErrorState
              error={expensesQuery.error}
              onRetry={() => void expensesQuery.refetch()}
            />
          ) : (
            <ExpenseTable
              expenses={filtered}
              loading={expensesQuery.isLoading}
              onEdit={setEditing}
              onDelete={setDeleting}
              onCreate={() => setCreating(true)}
              emptyHint={
                search ||
                period ||
                kind !== "all" ||
                category !== ALL_CATEGORIES
                  ? "Nenhum registro carregado corresponde aos filtros. Ajuste a busca ou carregue mais registros."
                  : undefined
              }
            />
          )}
          <div className="flex flex-col items-start justify-between gap-3 border-t p-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <p>
              {expensesQuery.data?.pages.flat().length ?? 0} registros
              carregados. Filtros aplicados aos registros carregados.
            </p>
            {expensesQuery.hasNextPage && (
              <Button
                variant="outline"
                size="sm"
                disabled={expensesQuery.isFetchingNextPage}
                onClick={() => void expensesQuery.fetchNextPage()}
              >
                {expensesQuery.isFetchingNextPage
                  ? "Carregando..."
                  : "Carregar mais registros"}
              </Button>
            )}
          </div>
          {expensesQuery.isFetchNextPageError && (
            <QueryErrorState
              error={expensesQuery.error}
              title="Não foi possível carregar mais registros"
              onRetry={() => void expensesQuery.fetchNextPage()}
            />
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

      <ExpenseFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        expense={editing}
        submitting={update.isPending}
        onSubmit={async (values) => {
          if (!editing) return;
          await update.mutateAsync({ id: editing.id, payload: values });
          setEditing(null);
        }}
      />

      <DeleteExpenseDialog
        expense={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        submitting={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
