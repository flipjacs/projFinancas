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
import { labelDoTipo } from "@/components/planejamento/cores";
import {
  TIPOS_CATEGORIA,
  type Distribuicao,
  type DistribuicaoCreate,
} from "@/types/planejamento";

const schema = z
  .object({
    categoria: z.string().min(1, "Dê um nome para a categoria").max(80),
    tipo_categoria: z.enum(TIPOS_CATEGORIA),
    tipo_distribuicao: z.enum(["valor_fixo", "porcentagem"]),
    valor: z.coerce.number().min(0, "Valor não pode ser negativo"),
    porcentagem: z.coerce
      .number()
      .min(0, "Não pode ser negativo")
      .max(100, "No máximo 100%"),
    limite_mensal: z.coerce.number().min(0, "Não pode ser negativo"),
  })
  .refine(
    (v) =>
      v.tipo_distribuicao !== "valor_fixo" || v.valor > 0,
    {
      path: ["valor"],
      message: "Informe um valor maior que zero",
    },
  )
  .refine(
    (v) =>
      v.tipo_distribuicao !== "porcentagem" || v.porcentagem > 0,
    {
      path: ["porcentagem"],
      message: "Informe uma porcentagem maior que zero",
    },
  );

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distribuicao?: Distribuicao | null;
  submitting?: boolean;
  onSubmit: (payload: DistribuicaoCreate) => Promise<void> | void;
}

const DEFAULT: FormValues = {
  categoria: "",
  tipo_categoria: "Lazer",
  tipo_distribuicao: "porcentagem",
  valor: 0,
  porcentagem: 10,
  limite_mensal: 0,
};

export function DistribuicaoFormDialog({
  open,
  onOpenChange,
  distribuicao,
  submitting,
  onSubmit,
}: Props) {
  const isEdit = Boolean(distribuicao);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT,
  });

  useEffect(() => {
    if (!open) return;
    if (distribuicao) {
      form.reset({
        categoria: distribuicao.categoria,
        tipo_categoria: distribuicao.tipo_categoria,
        tipo_distribuicao: distribuicao.tipo_distribuicao,
        valor: Number(distribuicao.valor),
        porcentagem: Number(distribuicao.porcentagem),
        limite_mensal: Number(distribuicao.limite_mensal),
      });
    } else {
      form.reset(DEFAULT);
    }
  }, [open, distribuicao, form]);

  const tipoDist = form.watch("tipo_distribuicao");

  async function handleSubmit(values: FormValues) {
    await onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar categoria" : "Nova categoria do orçamento"}
          </DialogTitle>
          <DialogDescription>
            Defina quanto da sua renda vai para esta categoria — em valor fixo
            ou porcentagem.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="categoria">Nome da categoria</Label>
            <Input
              id="categoria"
              autoFocus
              placeholder="ex.: Lazer mensal"
              {...form.register("categoria")}
            />
            {form.formState.errors.categoria && (
              <p className="text-sm text-destructive">
                {form.formState.errors.categoria.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo_categoria">Tipo</Label>
              <Select
                value={form.watch("tipo_categoria")}
                onValueChange={(value) =>
                  form.setValue(
                    "tipo_categoria",
                    value as FormValues["tipo_categoria"],
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger id="tipo_categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CATEGORIA.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {labelDoTipo(tipo)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_distribuicao">Distribuição</Label>
              <Select
                value={form.watch("tipo_distribuicao")}
                onValueChange={(value) =>
                  form.setValue(
                    "tipo_distribuicao",
                    value as FormValues["tipo_distribuicao"],
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger id="tipo_distribuicao">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="porcentagem">Porcentagem</SelectItem>
                  <SelectItem value="valor_fixo">Valor fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {tipoDist === "porcentagem" ? (
            <div className="space-y-2">
              <Label htmlFor="porcentagem">Porcentagem da renda</Label>
              <Input
                id="porcentagem"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                max={100}
                {...form.register("porcentagem")}
              />
              <p className="text-xs text-muted-foreground">
                A soma de todas as porcentagens não pode passar de 100%.
              </p>
              {form.formState.errors.porcentagem && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.porcentagem.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="valor">Valor fixo mensal (R$)</Label>
              <Input
                id="valor"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                {...form.register("valor")}
              />
              {form.formState.errors.valor && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.valor.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="limite_mensal">
              Limite mensal (R$){" "}
              <span className="text-xs font-normal text-muted-foreground">
                opcional
              </span>
            </Label>
            <Input
              id="limite_mensal"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              placeholder="0 = usar o valor planejado"
              {...form.register("limite_mensal")}
            />
            <p className="text-xs text-muted-foreground">
              Quando você deixa em 0, o sistema usa o valor planejado como teto.
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
              {isEdit ? "Salvar alterações" : "Adicionar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
