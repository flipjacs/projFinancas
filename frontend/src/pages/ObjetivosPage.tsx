import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { EmptyState } from "@/components/EmptyState";
import { CardObjetivo } from "@/components/planejamento/CardObjetivo";
import { ConfirmDialog } from "@/components/planejamento/ConfirmDialog";
import { ObjetivoFormDialog } from "@/components/planejamento/ObjetivoFormDialog";
import { useObjetivoMutations, useObjetivos } from "@/hooks/usePlanejamento";
import type { Objetivo } from "@/types/planejamento";
import { formatCurrency } from "@/utils/format";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ObjetivosPage() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Objetivo | null>(null);
  const [deleting, setDeleting] = useState<Objetivo | null>(null);

  const objetivos = useObjetivos();
  const { create, update, remove } = useObjetivoMutations();

  const lista = objetivos.data ?? [];

  const stats = useMemo(() => {
    const totalMeta = lista.reduce((s, o) => s + Number(o.valor_meta), 0);
    const totalGuardado = lista.reduce((s, o) => s + Number(o.valor_atual), 0);
    const totalPorMes = lista.reduce(
      (s, o) => s + Number(o.valor_necessario_por_mes),
      0,
    );
    return { totalMeta, totalGuardado, totalPorMes };
  }, [lista]);

  const dadosGrafico = useMemo(
    () =>
      lista.map((o) => ({
        nome: o.nome.length > 14 ? `${o.nome.slice(0, 14)}…` : o.nome,
        guardado: Number(o.valor_atual),
        faltando: Math.max(0, Number(o.valor_meta) - Number(o.valor_atual)),
      })),
    [lista],
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 h-auto p-0 text-muted-foreground hover:bg-transparent"
          >
            <Link to="/planejamento">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para o planejamento
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Objetivos financeiros
          </h1>
          <p className="text-sm text-muted-foreground">
            Defina metas, prazos e veja quanto guardar por mês.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Novo objetivo
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total das metas"
          value={formatCurrency(stats.totalMeta)}
          icon={Target}
          loading={objetivos.isLoading}
        />
        <StatCard
          label="Já guardado"
          value={formatCurrency(stats.totalGuardado)}
          icon={Target}
          tone="positive"
          loading={objetivos.isLoading}
        />
        <StatCard
          label="Necessário por mês"
          value={formatCurrency(stats.totalPorMes)}
          icon={Target}
          tone="warning"
          loading={objetivos.isLoading}
          hint="Soma do que cada meta exige por mês."
        />
      </div>

      {lista.length > 0 && (
        <ChartCard
          title="Progresso de cada objetivo"
          description="Guardado vs. faltando para bater a meta."
          loading={objetivos.isLoading}
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="nome"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(v) =>
                    Number(v).toLocaleString("pt-BR", {
                      notation: "compact",
                      compactDisplay: "short",
                    })
                  }
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name === "guardado" ? "Guardado" : "Faltando",
                  ]}
                />
                <Bar
                  dataKey="guardado"
                  stackId="a"
                  fill="#10b981"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="faltando"
                  stackId="a"
                  fill="hsl(var(--muted))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Metas em andamento</h2>
          <p className="text-xs text-muted-foreground">
            {lista.length}{" "}
            {lista.length === 1 ? "objetivo" : "objetivos"}
          </p>
        </div>

        {objetivos.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-4 p-5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : lista.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhum objetivo ainda"
            description="Crie sua primeira meta e veja exatamente quanto guardar por mês."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                Criar objetivo
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lista.map((item, idx) => (
              <CardObjetivo
                key={item.id}
                index={idx}
                objetivo={item}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </section>

      <ObjetivoFormDialog
        open={creating}
        onOpenChange={setCreating}
        submitting={create.isPending}
        onSubmit={async (values) => {
          await create.mutateAsync(values);
          setCreating(false);
        }}
      />

      <ObjetivoFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        objetivo={editing}
        submitting={update.isPending}
        onSubmit={async (values) => {
          if (!editing) return;
          await update.mutateAsync({ id: editing.id, payload: values });
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir objetivo?"
        description={
          deleting
            ? `Você vai remover "${deleting.nome}" da sua lista de metas.`
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
