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
import { CATEGORY_LABELS } from "@/components/CategoryBadge";
import { EXPENSE_CATEGORIES, type Expense } from "@/types/expense";

const schema = z.object({
  title: z.string().min(1, "Descrição é obrigatória").max(180),
  amount: z.coerce
    .number({ invalid_type_error: "Valor precisa ser um número" })
    .min(0, "Valor não pode ser negativo"),
  category: z.enum(EXPENSE_CATEGORIES),
  recurring: z.boolean(),
});

export type ExpenseFormValues = z.infer<typeof schema>;

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando passado, o diálogo entra em modo de edição. */
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

  // Reseta os valores sempre que o diálogo reabre — evita que dados
  // antigos vazem entre um ciclo de edição e outro.
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
          <DialogTitle>{isEdit ? "Editar gasto" : "Novo gasto"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados deste gasto."
              : "Adicione um novo gasto ao seu controle mensal."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="title">Descrição</Label>
            <Input
              id="title"
              autoFocus
              placeholder="ex.: Mercado"
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
              <Label htmlFor="amount">Valor</Label>
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
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) =>
                  form.setValue("category", value as ExpenseFormValues["category"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Escolha uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {CATEGORY_LABELS[category]}
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
            <span className="font-medium">Gasto fixo</span>
            <span className="ml-auto text-xs text-muted-foreground">
              Conta como custo fixo mensal
            </span>
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Salvar alterações" : "Adicionar gasto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
