import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Info, PiggyBank, Plus, Repeat, Target, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { EmptyState } from "@/components/EmptyState";
import { AlertaFinanceiroCard } from "@/components/planejamento/AlertaFinanceiro";
import { CardCategoria } from "@/components/planejamento/CardCategoria";
import { ConfirmDialog } from "@/components/planejamento/ConfirmDialog";
import { DistribuicaoFormDialog } from "@/components/planejamento/DistribuicaoFormDialog";
import { GraficoDistribuicao } from "@/components/planejamento/GraficoDistribuicao";
import { PainelComportamental } from "@/components/planejamento/PainelComportamental";
import {
  useAlertasPlanejamento,
  useDistribuicaoMutations,
  useDistribuicoes,
  useObjetivoMutations,
  useObjetivos,
  useResumoPlanejamento,
} from "@/hooks/usePlanejamento";
import type { Distribuicao } from "@/types/planejamento";
import { formatCurrency } from "@/utils/format";

export function PlanejamentoPage() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Distribuicao | null>(null);
  const [deleting, setDeleting] = useState<Distribuicao | null>(null);

  const distribuicoes = useDistribuicoes();
  const resumo = useResumoPlanejamento();
  const alertas = useAlertasPlanejamento();
  const objetivos = useObjetivos();
  const { create, update, remove } = useDistribuicaoMutations();
  const { update: updateObjetivo } = useObjetivoMutations();

  // Quando o usuário está editando uma distribuição linkada a um objetivo,
  // precisamos do objetivo carregado pra pré-popular o form. Sem isso, o
  // dialog não saberia o nome/meta atuais (bug 2).
  const objetivoLinkado = useMemo(() => {
    if (!editing?.objetivo_relacionado_id) return null;
    return (
      objetivos.data?.find((o) => o.id === editing.objetivo_relacionado_id) ??
      null
    );
  }, [editing, objetivos.data]);

  // Indexa o resumo por distribuição para passar os números calculados
  // direto pro CardCategoria sem fazer lookup em cada render.
  const resumoPorId = useMemo(() => {
    const map = new Map<number, NonNullable<typeof resumo.data>["categorias"][number]>();
    resumo.data?.categorias.forEach((c) => map.set(c.distribuicao_id, c));
    return map;
  }, [resumo.data]);

  const listaAlertas = alertas.data?.alertas ?? [];
  const lista = distribuicoes.data ?? [];
  const carregando = distribuicoes.isLoading || resumo.isLoading;

  return (
    <div className="space-y-8">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Planejamento financeiro
          </h1>
          <p className="text-sm text-muted-foreground">
            Distribua sua renda em categorias e acompanhe limites do mês.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/objetivos">
              <Target className="h-4 w-4" />
              Ver objetivos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Nova categoria
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Salário mensal"
          value={
            resumo.data ? formatCurrency(resumo.data.salario) : "-"
          }
          icon={Wallet}
          loading={resumo.isLoading}
        />
        <StatCard
          label="Total distribuído"
          value={
            resumo.data
              ? formatCurrency(resumo.data.total_distribuido)
              : "-"
          }
          icon={PiggyBank}
          tone="default"
          loading={resumo.isLoading}
          hint={
            resumo.data
              ? `${Number(resumo.data.porcentagem_comprometida).toFixed(0)}% comprometidos`
              : undefined
          }
        />
        <StatCard
          label="Saldo restante"
          value={
            resumo.data ? formatCurrency(resumo.data.saldo_restante) : "-"
          }
          icon={Wallet}
          tone={
            resumo.data && Number(resumo.data.saldo_restante) < 0
              ? "negative"
              : "positive"
          }
          loading={resumo.isLoading}
          hint="Salário menos o total distribuído."
        />
        <StatCard
          label="Gasto neste mês"
          value={
            resumo.data ? formatCurrency(resumo.data.total_gasto_mes) : "-"
          }
          icon={Target}
          tone="warning"
          loading={resumo.isLoading}
        />
      </div>

      {listaAlertas.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Alertas do mês
          </h2>
          <div className="grid gap-2 md:grid-cols-2">
            {listaAlertas.map((alerta, idx) => (
              <AlertaFinanceiroCard
                key={`${alerta.categoria}-${alerta.tipo}-${idx}`}
                alerta={alerta}
              />
            ))}
          </div>
        </section>
      )}

      {resumo.data && Number(resumo.data.total_gastos_fixos) > 0 && (
        <section className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Repeat className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="font-medium">
              Gastos recorrentes alimentam o envelope <em>Fixo</em>{" "}
              automaticamente
            </p>
            <p className="text-xs text-muted-foreground">
              Hoje você tem{" "}
              <strong className="text-foreground tabular-nums">
                {formatCurrency(resumo.data.total_gastos_fixos)}/mês
              </strong>{" "}
              em obrigações fixas, composto por{" "}
              <strong className="text-foreground">
                {resumo.data.composicao_fixos.length}
              </strong>{" "}
              {resumo.data.composicao_fixos.length === 1
                ? "gasto recorrente"
                : "gastos recorrentes"}
              . Marque um gasto como recorrente em <em>Gastos</em> e ele
              aparece aqui sem trabalho manual.
            </p>
          </div>
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        </section>
      )}

      <ChartCard
        title="Como sua renda está distribuída"
        description="Soma das categorias planejadas vs. saldo livre."
        loading={resumo.isLoading}
      >
        <GraficoDistribuicao
          categorias={resumo.data?.categorias ?? []}
          saldoRestante={Number(resumo.data?.saldo_restante ?? 0)}
        />
      </ChartCard>

      <PainelComportamental
        comportamental={resumo.data?.comportamental}
        loading={resumo.isLoading}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Categorias</h2>
          <p className="text-xs text-muted-foreground">
            {lista.length}{" "}
            {lista.length === 1 ? "categoria cadastrada" : "categorias cadastradas"}
          </p>
        </div>

        {carregando ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-4 p-5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : lista.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="Nenhuma categoria criada ainda"
            description="Crie sua primeira categoria para distribuir sua renda."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                Criar categoria
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lista.map((item, idx) => (
              <CardCategoria
                key={item.id}
                index={idx}
                distribuicao={item}
                resumo={resumoPorId.get(item.id)}
                composicaoFixos={resumo.data?.composicao_fixos}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </section>

      <DistribuicaoFormDialog
        open={creating}
        onOpenChange={setCreating}
        submitting={create.isPending}
        onSubmit={async ({ distribuicao: payload }) => {
          await create.mutateAsync(payload);
          setCreating(false);
        }}
      />

      <DistribuicaoFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        distribuicao={editing}
        objetivoLinkado={objetivoLinkado}
        submitting={update.isPending || updateObjetivo.isPending}
        onSubmit={async ({ distribuicao: payload, objetivoUpdate }) => {
          if (!editing) return;
          // Atualiza a distribuição primeiro; depois o objetivo linkado, se houver.
          // O backend já recalcula o resumo automaticamente via invalidate.
          await update.mutateAsync({ id: editing.id, payload });
          if (objetivoUpdate) {
            await updateObjetivo.mutateAsync(objetivoUpdate);
          }
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir categoria?"
        description={
          deleting
            ? `Você vai remover "${deleting.categoria}" do seu planejamento.`
            : ""
        }
        confirmLabel="Excluir"
        submitting={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
