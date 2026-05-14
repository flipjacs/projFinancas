import { useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  CreditCard,
  Layers,
  Plus,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { EmptyState } from "@/components/EmptyState";
import { InstallmentCard } from "@/components/installments/InstallmentCard";
import { InstallmentFormDialog } from "@/components/installments/InstallmentFormDialog";
import { DeleteInstallmentDialog } from "@/components/installments/DeleteInstallmentDialog";
import { FuturePaymentsChart } from "@/components/charts/FuturePaymentsChart";
import {
  useInstallmentMutations,
  useInstallments,
} from "@/hooks/useInstallments";
import { useFutureBalance } from "@/hooks/useFinancial";
import type { Installment } from "@/types/installment";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

type Filter = "active" | "all";

export function InstallmentsPage() {
  const [filter, setFilter] = useState<Filter>("active");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Installment | null>(null);
  const [deleting, setDeleting] = useState<Installment | null>(null);

  const installmentsQuery = useInstallments({ limit: 200 });
  const futureQuery = useFutureBalance(12);
  const { create, update, remove } = useInstallmentMutations();

  const installments = installmentsQuery.data ?? [];

  const filtered = useMemo(() => {
    if (filter === "active") {
      return installments.filter((i) => i.remaining_installments > 0);
    }
    return installments;
  }, [installments, filter]);

  const stats = useMemo(() => {
    const active = installments.filter((i) => i.remaining_installments > 0);
    const monthlyCommitment = active.reduce(
      (acc, i) => acc + Number(i.installment_value),
      0,
    );
    const outstanding = active.reduce(
      (acc, i) => acc + Number(i.installment_value) * i.remaining_installments,
      0,
    );
    const longestRemaining = active.reduce(
      (max, i) => Math.max(max, i.remaining_installments),
      0,
    );
    return {
      active: active.length,
      monthlyCommitment,
      outstanding,
      longestRemaining,
    };
  }, [installments]);

  const loading = installmentsQuery.isLoading;

  return (
    <div className="space-y-8">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Parcelamentos</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe cada compra parcelada e o quanto ela compromete seus
            próximos meses.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Novo parcelamento
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Parcelamentos ativos"
          value={loading ? "-" : String(stats.active)}
          icon={Layers}
          loading={loading}
          hint="Parcelas ainda em andamento."
        />
        <StatCard
          label="Compromisso mensal"
          value={loading ? "-" : formatCurrency(stats.monthlyCommitment)}
          icon={Wallet}
          tone="warning"
          loading={loading}
          hint="Soma das parcelas mensais ativas."
        />
        <StatCard
          label="Saldo a pagar"
          value={loading ? "-" : formatCurrency(stats.outstanding)}
          icon={CreditCard}
          tone={stats.outstanding > 0 ? "negative" : "positive"}
          loading={loading}
          hint="Total que ainda falta pagar."
        />
        <StatCard
          label="Maior plano"
          value={
            loading
              ? "-"
              : stats.longestRemaining > 0
                ? `${stats.longestRemaining}x restantes`
                : "—"
          }
          icon={CalendarClock}
          loading={loading}
          hint="Quantos meses até quitar o parcelamento mais longo."
        />
      </div>

      <ChartCard
        title="Compromisso futuro com parcelas"
        description="Quanto de cada mês já está comprometido com parcelas que você já tem."
        loading={futureQuery.isLoading}
        action={
          <span className="hidden items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
            <Activity className="h-3.5 w-3.5" />
            Próximos 12 meses
          </span>
        }
      >
        <FuturePaymentsChart months={futureQuery.data?.months ?? []} />
      </ChartCard>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Meus parcelamentos
              </h2>
              <p className="text-xs text-muted-foreground">
                {loading
                  ? "Carregando…"
                  : `${filtered.length} ${filtered.length === 1 ? "parcelamento" : "parcelamentos"}`}
              </p>
            </div>
            <div className="inline-flex items-center rounded-md border bg-background p-1 text-xs font-medium">
              {(["active", "all"] as Filter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={cn(
                    "rounded-sm px-3 py-1 transition-colors",
                    filter === option
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option === "active" ? "Ativos" : "Todos"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title={
                filter === "active"
                  ? "Nenhum parcelamento ativo"
                  : "Você ainda não tem parcelamentos"
              }
              description={
                filter === "active"
                  ? "Todas as suas parcelas já foram quitadas — show. Cadastre quando tiver uma nova compra."
                  : "Cadastre suas compras parceladas para planejar melhor o caixa dos próximos meses."
              }
              action={
                <Button onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" />
                  Novo parcelamento
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((installment, index) => (
                <InstallmentCard
                  key={installment.id}
                  installment={installment}
                  index={index}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InstallmentFormDialog
        open={creating}
        onOpenChange={setCreating}
        submitting={create.isPending}
        onSubmit={async (values) => {
          await create.mutateAsync(values);
          setCreating(false);
        }}
      />

      <InstallmentFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        installment={editing}
        submitting={update.isPending}
        onSubmit={async (values) => {
          if (!editing) return;
          await update.mutateAsync({ id: editing.id, payload: values });
          setEditing(null);
        }}
      />

      <DeleteInstallmentDialog
        installment={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
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
