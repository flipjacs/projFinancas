import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES, type Expense } from "@/types/expense";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(180),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .min(0, "Amount cannot be negative"),
  category: z.enum(EXPENSE_CATEGORIES),
  recurring: z.boolean(),
});

export type ExpenseFormValues = z.infer<typeof schema>;

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog runs in edit mode and pre-fills the form. */
  expense?: Expense | null;
  onSubmit: (values: ExpenseFormValues) => Promise<void> | void;
  submitting?: boolean;
}

const DEFAULT_VALUES: ExpenseFormValues = {
  title: "",
  amount: 0,
  category: "other",
  recurring: false,
};

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  onSubmit,
  submitting,
}: ExpenseFormDialogProps) {
  const isEdit = Boolean(expense);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  // Reset whenever the dialog re-opens — prevents stale values bleeding from
  // a previous edit/create cycle.
  useEffect(() => {
    if (!open) return;
    if (expense) {
      form.reset({
        title: expense.title,
        amount: Number(expense.amount),
        category: expense.category,
        recurring: expense.recurring,
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, expense, form]);

  async function handleSubmit(values: ExpenseFormValues) {
    await onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "New expense"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this expense."
              : "Add a new expense to your monthly tracker."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              autoFocus
              placeholder="e.g. Groceries"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                {...form.register("amount")}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) =>
                  form.setValue("category", value as ExpenseFormValues["category"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="capitalize"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              {...form.register("recurring")}
            />
            <span className="font-medium">Recurring</span>
            <span className="ml-auto text-xs text-muted-foreground">
              Counts towards your monthly fixed costs
            </span>
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
