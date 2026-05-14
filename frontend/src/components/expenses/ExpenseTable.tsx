import { format, parseISO } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBadge } from "@/components/CategoryBadge";
import { EmptyState } from "@/components/EmptyState";
import { Receipt } from "lucide-react";
import type { Expense } from "@/types/expense";
import { formatCurrency } from "@/utils/format";

interface Props {
  expenses: Expense[];
  loading?: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  /** Shown when no expenses match the active filters. */
  emptyHint?: string;
}

function ExpenseRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
      <TableCell />
    </TableRow>
  );
}

export function ExpenseTable({
  expenses,
  loading,
  onEdit,
  onDelete,
  emptyHint,
}: Props) {
  if (!loading && expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No expenses to show"
        description={
          emptyHint ?? "Add your first expense to start tracking your spending."
        }
      />
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Recurring</TableHead>
            <TableHead className="w-12 sr-only">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <ExpenseRowSkeleton key={i} />
              ))
            : expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.title}</TableCell>
                  <TableCell>
                    <CategoryBadge category={expense.category} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(parseISO(expense.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {expense.recurring ? (
                      <Badge variant="secondary">Recurring</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${expense.title}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(expense)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(expense)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
