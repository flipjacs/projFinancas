import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Expense } from "@/types/expense";
import { formatCurrency } from "@/utils/format";

interface Props {
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  submitting?: boolean;
}

export function DeleteExpenseDialog({
  expense,
  onOpenChange,
  onConfirm,
  submitting,
}: Props) {
  return (
    <Dialog open={Boolean(expense)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete expense?</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {expense && (
          <div className="rounded-md border bg-muted/40 p-4 text-sm">
            <p className="font-medium">{expense.title}</p>
            <p className="text-muted-foreground">
              {formatCurrency(expense.amount)} · {expense.category}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={submitting || !expense}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
