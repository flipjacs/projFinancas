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
import type { Objetivo, ObjetivoCreate } from "@/types/planejamento";
import { formatCurrency } from "@/utils/format";

const schema = z
  .object({
    nome: z.string().min(1, "Dê um nome para o objetivo").max(120),
    valor_meta: z.coerce.number().positive("Precisa ser maior que 0"),
    valor_atual: z.coerce.number().min(0, "Não pode ser negativo"),
    prazo_meses: z.coerce
      .number()
      .int("Precisa ser um número inteiro")
      .min(1, "Pelo menos 1 mês")
      .max(600, "Prazo muito longo"),
  })
  .refine((v) => v.valor_atual <= v.valor_meta, {
    path: ["valor_atual"],
    message: "O valor atual não pode passar da meta",
  });

type FormValues = z.infer<typeof schema>;

const DEFAULT: FormValues = {
  nome: "",
  valor_meta: 0,
  valor_atual: 0,
  prazo_meses: 6,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objetivo?: Objetivo | null;
  submitting?: boolean;
  onSubmit: (payload: ObjetivoCreate) => Promise<void> | void;
}

export function ObjetivoFormDialog({
  open,
  onOpenChange,
  objetivo,
  submitting,
  onSubmit,
}: Props) {
  const isEdit = Boolean(objetivo);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT,
  });

  useEffect(() => {
    if (!open) return;
    if (objetivo) {
      form.reset({
        nome: objetivo.nome,
        valor_meta: Number(objetivo.valor_meta),
        valor_atual: Number(objetivo.valor_atual),
        prazo_meses: objetivo.prazo_meses,
      });
    } else {
      form.reset(DEFAULT);
    }
  }, [open, objetivo, form]);

  const meta = form.watch("valor_meta");
  const atual = form.watch("valor_atual");
  const prazo = form.watch("prazo_meses");

  const previsao = useMemo(() => {
    const m = Number(meta);
    const a = Number(atual);
    const p = Number(prazo);
    if (!Number.isFinite(m) || !Number.isFinite(a) || !Number.isFinite(p)) {
      return 0;
    }
    if (p <= 0) return 0;
    const faltando = m - a;
    if (faltando <= 0) return 0;
    return faltando / p;
  }, [meta, atual, prazo]);

  async function handleSubmit(values: FormValues) {
    await onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar objetivo" : "Novo objetivo financeiro"}
          </DialogTitle>
          <DialogDescription>
            Defina uma meta e o prazo. A gente calcula quanto você precisa
            guardar por mês.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do objetivo</Label>
            <Input
              id="nome"
              autoFocus
              placeholder="ex.: iPhone 15 Pro"
              {...form.register("nome")}
            />
            {form.formState.errors.nome && (
              <p className="text-sm text-destructive">
                {form.formState.errors.nome.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="valor_meta">Valor da meta</Label>
              <Input
                id="valor_meta"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                {...form.register("valor_meta")}
              />
              {form.formState.errors.valor_meta && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.valor_meta.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_atual">Já guardado</Label>
              <Input
                id="valor_atual"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                {...form.register("valor_atual")}
              />
              {form.formState.errors.valor_atual && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.valor_atual.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prazo_meses">Prazo (em meses)</Label>
            <Input
              id="prazo_meses"
              type="number"
              min={1}
              max={600}
              {...form.register("prazo_meses")}
            />
            {form.formState.errors.prazo_meses && (
              <p className="text-sm text-destructive">
                {form.formState.errors.prazo_meses.message}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Você precisa guardar
              </span>
              <span className="text-base font-semibold tabular-nums">
                {formatCurrency(previsao)} / mês
              </span>
            </div>
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
              {isEdit ? "Salvar alterações" : "Criar objetivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
