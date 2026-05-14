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
import {
  CATEGORIAS_COMPORTAMENTAIS_EXPENSE,
  EXPENSE_CATEGORIES,
  LABEL_COMPORTAMENTAL_EXPENSE,
  type Expense,
} from "@/types/expense";
import { useDistribuicoes } from "@/hooks/usePlanejamento";
import { labelDoTipo } from "@/components/planejamento/cores";

const COMPORTAMENTAL_OPTIONS = ["auto", ...CATEGORIAS_COMPORTAMENTAIS_EXPENSE] as const;

const SEM_EARMARK = "sem_earmark";

const schema = z.object({
  title: z.string().min(1, "Descrição é obrigatória").max(180),
  amount: z.coerce
    .number({ invalid_type_error: "Valor precisa ser um número" })
    .min(0, "Valor não pode ser negativo"),
  category: z.enum(EXPENSE_CATEGORIES),
  categoria_comportamental: z.enum(COMPORTAMENTAL_OPTIONS),
  // String porque <Select> só aceita string; convertemos pra number/null no submit.
  distribuicao_id: z.string(),
  recurring: z.boolean(),
});

type FormSchema = z.infer<typeof schema>;

// Tipo exposto ao consumidor: já com "auto" e "sem_earmark" resolvidos pra null.
export type ExpenseFormValues = Omit<
  FormSchema,
  "categoria_comportamental" | "distribuicao_id"
> & {
  categoria_comportamental:
    | (typeof CATEGORIAS_COMPORTAMENTAIS_EXPENSE)[number]
    | null;
  distribuicao_id: number | null;
};

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando passado, o diálogo entra em modo de edição. */
  expense?: Expense | null;
  onSubmit: (values: ExpenseFormValues) => Promise<void> | void;
  submitting?: boolean;
}

const DEFAULT_VALUES: FormSchema = {
  title: "",
  amount: 0,
  category: "other",
  categoria_comportamental: "auto",
  distribuicao_id: SEM_EARMARK,
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
  // Lista de envelopes do planejamento — alimenta o seletor de earmark.
  // Carregamento é cacheado pelo react-query, então abrir o dialog é rápido.
  const distribuicoes = useDistribuicoes();

  const form = useForm<FormSchema>({
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
        categoria_comportamental:
          (expense.categoria_comportamental as FormSchema["categoria_comportamental"]) ??
          "auto",
        distribuicao_id:
          expense.distribuicao_id !== null
            ? String(expense.distribuicao_id)
            : SEM_EARMARK,
        recurring: expense.recurring,
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, expense, form]);

  const categoriaSelecionada = form.watch("category");
  const distribuicaoSelecionada = form.watch("distribuicao_id");

  // Para savings o earmark é essencial — destacamos isso visualmente.
  // Sem earmark, gastos de "savings" não caem em nenhuma reserva (isolation).
  const earmarkObrigatorio = categoriaSelecionada === "savings";
  const semEarmark = distribuicaoSelecionada === SEM_EARMARK;

  async function handleSubmit(values: FormSchema) {
    // "auto" → null no comportamental. "sem_earmark" → null em distribuicao_id.
    // Também avisamos o backend pra LIMPAR o earmark via desvincular flag
    // quando o usuário voltou de "linkado" para "sem_earmark" no edit.
    const { categoria_comportamental, distribuicao_id, ...rest } = values;
    const earmarkId =
      distribuicao_id === SEM_EARMARK ? null : Number(distribuicao_id);
    const desvincular =
      isEdit && earmarkId === null && expense?.distribuicao_id !== null;

    await onSubmit({
      ...rest,
      categoria_comportamental:
        categoria_comportamental === "auto" ? null : categoria_comportamental,
      distribuicao_id: earmarkId,
      // Cast — o ExpenseUpdate tem `desvincular_distribuicao` opcional.
      ...(desvincular ? { desvincular_distribuicao: true } : {}),
    } as ExpenseFormValues);
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
                  form.setValue("category", value as FormSchema["category"], {
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

          <div className="space-y-2">
            <Label htmlFor="categoria_comportamental">
              Comportamento financeiro
            </Label>
            <Select
              value={form.watch("categoria_comportamental")}
              onValueChange={(value) =>
                form.setValue(
                  "categoria_comportamental",
                  value as FormSchema["categoria_comportamental"],
                  { shouldValidate: true },
                )
              }
            >
              <SelectTrigger id="categoria_comportamental">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  Automático (sugerido pela categoria)
                </SelectItem>
                {CATEGORIAS_COMPORTAMENTAIS_EXPENSE.map((c) => (
                  <SelectItem key={c} value={c}>
                    {LABEL_COMPORTAMENTAL_EXPENSE[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              McDonald's é <em>alimentação</em>, mas comportamentalmente é{" "}
              <em>lazer</em>. Marque manualmente quando fizer sentido.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="distribuicao_id">
              Direcionar para envelope{" "}
              {earmarkObrigatorio ? (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  · recomendado para Reserva/Objetivos
                </span>
              ) : (
                <span className="text-xs font-normal text-muted-foreground">
                  · opcional
                </span>
              )}
            </Label>
            <Select
              value={form.watch("distribuicao_id")}
              onValueChange={(value) =>
                form.setValue("distribuicao_id", value, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="distribuicao_id">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_EARMARK}>
                  Sem direcionamento (categorização automática)
                </SelectItem>
                {(distribuicoes.data ?? []).map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.categoria}
                    {d.subcategoria ? ` › ${d.subcategoria}` : ""}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({labelDoTipo(d.tipo_categoria)})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {earmarkObrigatorio && semEarmark && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Sem direcionar, esse aporte não cai em nenhum Fundo / Reserva —
                cada um conta só o que foi explicitamente direcionado para ele.
              </p>
            )}
            {!earmarkObrigatorio && (
              <p className="text-xs text-muted-foreground">
                Gastos sem direcionamento caem nos envelopes pelo casamento de
                categoria. Direcione manualmente quando quiser garantir que o
                gasto pertence a um envelope específico.
              </p>
            )}
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
