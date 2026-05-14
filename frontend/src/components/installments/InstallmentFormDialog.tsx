import { useEffect, useMemo } from "react";
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
import type { Installment } from "@/types/installment";
import { formatCurrency } from "@/utils/format";

const schema = z
  .object({
    product_name: z.string().min(1, "Nome é obrigatório").max(180),
    total_amount: z.coerce.number().positive("Precisa ser maior que 0"),
    total_installments: z.coerce
      .number()
      .int("Precisa ser um número inteiro")
      .min(1, "Pelo menos 1 parcela")
      .max(360, "No máximo 360 parcelas"),
    remaining_installments: z.coerce
      .number()
      .int("Precisa ser um número inteiro")
      .min(0, "Não pode ser negativo")
      .max(360),
    purchase_date: z.string().min(1, "Escolha uma data"),
  })
  .refine((v) => v.remaining_installments <= v.total_installments, {
    path: ["remaining_installments"],
    message: "Parcelas restantes não podem ser maiores que o total",
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installment?: Installment | null;
  submitting?: boolean;
  onSubmit: (payload: {
    product_name: string;
    total_amount: number;
    installment_value: number;
    total_installments: number;
    remaining_installments: number;
    purchase_date: string;
  }) => Promise<void> | void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultValues(): FormValues {
  return {
    product_name: "",
    total_amount: 0,
    total_installments: 12,
    remaining_installments: 12,
    purchase_date: todayISO(),
  };
}

export function InstallmentFormDialog({
  open,
  onOpenChange,
  installment,
  submitting,
  onSubmit,
}: Props) {
  const isEdit = Boolean(installment);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(),
  });

  useEffect(() => {
    if (!open) return;
    if (installment) {
      form.reset({
        product_name: installment.product_name,
        total_amount: Number(installment.total_amount),
        total_installments: installment.total_installments,
        remaining_installments: installment.remaining_installments,
        purchase_date: installment.purchase_date,
      });
    } else {
      form.reset(defaultValues());
    }
  }, [open, installment, form]);

  const total = form.watch("total_amount");
  const count = form.watch("total_installments");

  const installmentValue = useMemo(() => {
    const t = Number(total);
    const n = Number(count);
    if (!Number.isFinite(t) || !Number.isFinite(n) || n <= 0) return 0;
    return t / n;
  }, [total, count]);

  async function handleSubmit(values: FormValues) {
    await onSubmit({
      product_name: values.product_name,
      total_amount: values.total_amount,
      installment_value: Number(installmentValue.toFixed(2)),
      total_installments: values.total_installments,
      remaining_installments: values.remaining_installments,
      purchase_date: values.purchase_date,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar parcelamento" : "Novo parcelamento"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados deste parcelamento."
              : "Cadastre um novo parcelamento no seu controle."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="product_name">Produto ou finalidade</Label>
            <Input
              id="product_name"
              autoFocus
              placeholder="ex.: Notebook novo"
              {...form.register("product_name")}
            />
            {form.formState.errors.product_name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.product_name.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Valor total</Label>
              <Input
                id="total_amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                {...form.register("total_amount")}
              />
              {form.formState.errors.total_amount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.total_amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Data da compra</Label>
              <Input
                id="purchase_date"
                type="date"
                {...form.register("purchase_date")}
              />
              {form.formState.errors.purchase_date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.purchase_date.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total_installments">Número de parcelas</Label>
              <Input
                id="total_installments"
                type="number"
                min={1}
                max={360}
                {...form.register("total_installments")}
              />
              {form.formState.errors.total_installments && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.total_installments.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="remaining_installments">Parcelas restantes</Label>
              <Input
                id="remaining_installments"
                type="number"
                min={0}
                max={360}
                {...form.register("remaining_installments")}
              />
              {form.formState.errors.remaining_installments && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.remaining_installments.message}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor da parcela</span>
              <span className="text-base font-semibold tabular-nums">
                {formatCurrency(installmentValue)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Calculado como total ÷ número de parcelas.
            </p>
          </div>

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
              {isEdit ? "Salvar alterações" : "Adicionar parcelamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
