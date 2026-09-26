import { MoreHorizontal, Pencil, Trash2, Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBadge } from "@/components/CategoryBadge";
import { EmptyState } from "@/components/EmptyState";
import type { Expense } from "@/types/expense";
import { formatCurrency } from "@/utils/format";
interface Props {
  expenses: Expense[];
  loading?: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  emptyHint?: string;
  onCreate?: () => void;
}
export function ExpenseTable({
  expenses,
  loading,
  onEdit,
  onDelete,
  emptyHint,
  onCreate,
}: Props) {
  function actions(expense: Expense) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Ações de ${expense.title}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(expense)}>
            <Pencil className="h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(expense)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  if (loading)
    return (
      <div
        className="space-y-4 p-5"
        role="status"
        aria-label="Carregando gastos"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  if (!expenses.length)
    return (
      <EmptyState
        icon={Receipt}
        title={
          emptyHint
            ? "Nenhum gasto encontrado"
            : "Você ainda não possui gastos registrados"
        }
        description={
          emptyHint ?? "Registre seu primeiro gasto para começar a acompanhar."
        }
        action={onCreate && <Button onClick={onCreate}>Adicionar gasto</Button>}
      />
    );
  return (
    <>
      <ul className="divide-y lg:hidden">
        {expenses.map((expense) => (
          <li key={expense.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="break-words text-sm font-medium">
                  {expense.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(expense.created_at).toLocaleDateString("pt-BR")} ·{" "}
                  {expense.recurring ? "Recorrente mensal" : "Avulso"}
                </p>
              </div>
              {actions(expense)}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CategoryBadge category={expense.category} />
              <span className="text-base font-semibold tabular-nums">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data de registro</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="max-w-[260px] break-words font-medium">
                  {expense.title}
                </TableCell>
                <TableCell>
                  <CategoryBadge category={expense.category} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(expense.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {expense.recurring ? "Recorrente" : "Avulso"}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell>{actions(expense)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
