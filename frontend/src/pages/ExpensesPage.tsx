import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import { useExpenseMutations, useExpenses } from "@/hooks/useExpenses";
import type { Expense, ExpenseCategory } from "@/types/expense";
import { formatCurrency } from "@/utils/format";

export function ExpensesPage() {
  const [category, setCategory] = useState<
    ExpenseCategory | typeof ALL_CATEGORIES
  >(ALL_CATEGORIES);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const expensesQuery = useExpenses({ limit: 200 });
  const { create, update, remove } = useExpenseMutations();

  // Filtramos no front porque o backend ainda não aceita category como
  // query param e o limit é pequeno o suficiente para isso não pesar.
  const filtered = useMemo(() => {
    const data = expensesQuery.data ?? [];
    if (category === ALL_CATEGORIES) return data;
    return data.filter((expense) => expense.category === category);
  }, [expensesQuery.data, category]);

  const totalShown = filtered.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todos os seus gastos, organizados por categoria.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Novo gasto
        </Button>
      </header>

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
          <CategoryFilter value={category} onChange={setCategory} />
        </CardHeader>
        <CardContent className="p-0">
          <ExpenseTable
            expenses={filtered}
            loading={expensesQuery.isLoading}
            onEdit={setEditing}
            onDelete={setDeleting}
            emptyHint={
              category === ALL_CATEGORIES
                ? undefined
                : `Nenhum gasto na categoria "${category}".`
            }
          />
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
