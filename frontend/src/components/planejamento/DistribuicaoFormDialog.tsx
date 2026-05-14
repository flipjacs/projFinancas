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
  type Objetivo,
  type ObjetivoUpdate,
} from "@/types/planejamento";

const schema = z
  .object({
    categoria: z.string().min(1, "Dê um nome para a categoria").max(80),
    tipo_categoria: z.enum(TIPOS_CATEGORIA),
    subcategoria: z.string().max(80).optional().or(z.literal("")),
    tipo_distribuicao: z.enum(["valor_fixo", "porcentagem"]),
    valor: z.coerce.number().min(0, "Valor não pode ser negativo"),
    porcentagem: z.coerce
      .number()
      .min(0, "Não pode ser negativo")
      .max(100, "No máximo 100%"),
    limite_mensal: z.coerce.number().min(0, "Não pode ser negativo"),
    objetivo_nome: z.string().max(120).optional().or(z.literal("")),
    objetivo_valor_meta: z.coerce.number().min(0).optional(),
    objetivo_valor_atual: z.coerce.number().min(0).optional(),
    objetivo_prazo_meses: z.coerce.number().int().min(0).optional(),
  })
  .refine((v) => v.tipo_distribuicao !== "valor_fixo" || v.valor > 0, {
    path: ["valor"],
    message: "Informe um valor maior que zero",
  })
  .refine(
    (v) => v.tipo_distribuicao !== "porcentagem" || v.porcentagem > 0,
    {
      path: ["porcentagem"],
      message: "Informe uma porcentagem maior que zero",
    },
  )
  .refine(
    (v) =>
      v.tipo_categoria !== "Objetivos" ||
      (v.objetivo_nome && v.objetivo_nome.length > 0),
    {
      path: ["objetivo_nome"],
      message: "Dê um nome ao objetivo (ex.: iPhone 15 Pro)",
    },
  )
  .refine(
    (v) =>
      v.tipo_categoria !== "Objetivos" ||
      (v.objetivo_valor_meta ?? 0) > 0,
    {
      path: ["objetivo_valor_meta"],
      message: "Informe o valor da meta",
    },
  )
  .refine(
    (v) =>
      v.tipo_categoria !== "Objetivos" ||
      (v.objetivo_prazo_meses ?? 0) > 0,
    {
      path: ["objetivo_prazo_meses"],
      message: "Informe o prazo em meses",
    },
  );

type FormValues = z.infer<typeof schema>;

export interface DistribuicaoFormSubmit {
  distribuicao: DistribuicaoCreate;
  /** Quando editando uma distribuição linkada a um Objetivo, os campos do
   *  objetivo também voltam aqui para o caller atualizar via PUT /objetivos. */
  objetivoUpdate?: { id: number; payload: ObjetivoUpdate };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distribuicao?: Distribuicao | null;
  /** Objetivo já carregado da API quando a distribuição tem `objetivo_relacionado_id`.
   *  Permite pré-popular o form inline com os dados reais. */
  objetivoLinkado?: Objetivo | null;
  submitting?: boolean;
  onSubmit: (payload: DistribuicaoFormSubmit) => Promise<void> | void;
}

const DEFAULT: FormValues = {
  categoria: "",
  tipo_categoria: "Lazer",
  subcategoria: "",
  tipo_distribuicao: "porcentagem",
  valor: 0,
  porcentagem: 10,
  limite_mensal: 0,
  objetivo_nome: "",
  objetivo_valor_meta: 0,
  objetivo_valor_atual: 0,
  objetivo_prazo_meses: 6,
};

export function DistribuicaoFormDialog({
  open,
  onOpenChange,
  distribuicao,
  objetivoLinkado,
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
      // Em modo edição, pré-popula os campos do objetivo linkado quando houver,
      // pra o usuário poder editar nome/meta/prazo daqui mesmo. Bug 2 resolvido.
      form.reset({
        ...DEFAULT,
        categoria: distribuicao.categoria,
        tipo_categoria: distribuicao.tipo_categoria,
        subcategoria: distribuicao.subcategoria ?? "",
        tipo_distribuicao: distribuicao.tipo_distribuicao,
        valor: Number(distribuicao.valor),
        porcentagem: Number(distribuicao.porcentagem),
        limite_mensal: Number(distribuicao.limite_mensal),
        objetivo_nome: objetivoLinkado?.nome ?? "",
        objetivo_valor_meta: objetivoLinkado
          ? Number(objetivoLinkado.valor_meta)
          : 0,
        objetivo_valor_atual: objetivoLinkado
          ? Number(objetivoLinkado.valor_atual)
          : 0,
        objetivo_prazo_meses: objetivoLinkado?.prazo_meses ?? 6,
      });
    } else {
      form.reset(DEFAULT);
    }
  }, [open, distribuicao, objetivoLinkado, form]);

  const tipoDist = form.watch("tipo_distribuicao");
  const tipoCat = form.watch("tipo_categoria");
  const isObjetivos = tipoCat === "Objetivos";
  // Em modo edição com objetivo linkado, mostramos o form do objetivo pra
  // permitir editar nome/meta/prazo daqui mesmo — não bloqueia mais.
  const editandoObjetivoLinkado =
    isEdit && isObjetivos && Boolean(objetivoLinkado);
  const mostraFormObjetivoNovo = isObjetivos && !isEdit;

  async function handleSubmit(values: FormValues) {
    const base: DistribuicaoCreate = {
      categoria: values.categoria,
      tipo_categoria: values.tipo_categoria,
      subcategoria: values.subcategoria?.trim() || null,
      tipo_distribuicao: values.tipo_distribuicao,
      valor: values.valor,
      porcentagem: values.porcentagem,
      limite_mensal: values.limite_mensal,
    };
    const payload: DistribuicaoFormSubmit = { distribuicao: base };

    if (mostraFormObjetivoNovo) {
      base.objetivo = {
        nome: values.objetivo_nome!,
        valor_meta: values.objetivo_valor_meta!,
        valor_atual: values.objetivo_valor_atual ?? 0,
        prazo_meses: values.objetivo_prazo_meses!,
      };
    }

    if (editandoObjetivoLinkado && objetivoLinkado) {
      payload.objetivoUpdate = {
        id: objetivoLinkado.id,
        payload: {
          nome: values.objetivo_nome,
          valor_meta: values.objetivo_valor_meta,
          valor_atual: values.objetivo_valor_atual,
          prazo_meses: values.objetivo_prazo_meses,
        },
      };
    }

    await onSubmit(payload);
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
            <Label htmlFor="subcategoria">
              Subcategoria{" "}
              <span className="text-xs font-normal text-muted-foreground">
                opcional
              </span>
            </Label>
            <Input
              id="subcategoria"
              placeholder={
                isObjetivos
                  ? "ex.: Fundo Viagem, Tech, Reserva de emergência"
                  : "ex.: Streaming, Iguarias, Cursos"
              }
              {...form.register("subcategoria")}
            />
          </div>

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

          {(mostraFormObjetivoNovo || editandoObjetivoLinkado) && (
            <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {editandoObjetivoLinkado ? "Objetivo vinculado" : "Novo objetivo"}
              </p>
              <p className="text-xs text-muted-foreground">
                {editandoObjetivoLinkado
                  ? "Editar os campos abaixo atualiza o objetivo linkado também — nome, meta, já guardado e prazo permanecem em sincronia."
                  : "Como você escolheu a categoria Objetivos, o sistema cria um objetivo financeiro automaticamente e linka com essa distribuição."}
              </p>
              <div className="space-y-2">
                <Label htmlFor="objetivo_nome">Nome do objetivo</Label>
                <Input
                  id="objetivo_nome"
                  placeholder="ex.: iPhone 15 Pro"
                  {...form.register("objetivo_nome")}
                />
                {form.formState.errors.objetivo_nome && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.objetivo_nome.message}
                  </p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="objetivo_valor_meta">Meta (R$)</Label>
                  <Input
                    id="objetivo_valor_meta"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    {...form.register("objetivo_valor_meta")}
                  />
                  {form.formState.errors.objetivo_valor_meta && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.objetivo_valor_meta.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objetivo_valor_atual">Já guardado</Label>
                  <Input
                    id="objetivo_valor_atual"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    {...form.register("objetivo_valor_atual")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objetivo_prazo_meses">Prazo (meses)</Label>
                  <Input
                    id="objetivo_prazo_meses"
                    type="number"
                    min={1}
                    max={600}
                    {...form.register("objetivo_prazo_meses")}
                  />
                  {form.formState.errors.objetivo_prazo_meses && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.objetivo_prazo_meses.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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
