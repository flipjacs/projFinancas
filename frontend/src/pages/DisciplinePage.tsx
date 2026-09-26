import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  Target,
  TrendingDown,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ChartCard } from "@/components/ChartCard";
import { StatCard } from "@/components/StatCard";
import { PageFallback } from "@/components/PageFallback";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Progress } from "@/components/ui/progress";
import { DisciplineSettingsForm } from "@/components/financial/DisciplineSettingsForm";
import { WarningsList } from "@/components/financial/WarningsList";
import { useDiscipline } from "@/hooks/useDiscipline";
import { useResumoPlanejamento, useObjetivos } from "@/hooks/usePlanejamento";
import { formatCurrency } from "@/utils/format";
export function DisciplinePage() {
  const query = useDiscipline();
  const plan = useResumoPlanejamento();
  const goals = useObjetivos();
  const status = query.data;
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Consistência no dia a dia"
        title="Modo disciplina"
        description="Acompanhe seus hábitos financeiros e ajuste os limites ao seu momento."
      />
      {query.isLoading ? (
        <PageFallback />
      ) : query.isError || !status ? (
        <QueryErrorState
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          <section className="grid gap-6 rounded-lg border bg-card p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Índice de disciplina
              </div>
              <p className="my-4 text-6xl font-semibold tracking-tighter tabular-nums">
                {status.score}
                <span className="ml-2 text-xl font-normal tracking-normal text-muted-foreground">
                  /100
                </span>
              </p>
              <Progress
                value={status.score}
                ariaLabel="Índice de disciplina financeira"
                animated={false}
              />
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Calculado a partir dos seus gastos, reserva e compromissos. Use
                como referência para acompanhar seus hábitos.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3 border-t pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <CalendarCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-medium">
                {status.streak_days}{" "}
                {status.streak_days === 1
                  ? "dia de consistência"
                  : "dias de consistência"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Sequência de dias avaliada pelo modo disciplina.
              </p>
              <p className="text-xs text-muted-foreground">
                Última avaliação:{" "}
                {status.last_evaluated_date
                  ? new Date(
                      `${status.last_evaluated_date}T12:00:00`,
                    ).toLocaleDateString("pt-BR")
                  : "Aguardando avaliação"}
              </p>
            </div>
          </section>
          <div className="metric-grid">
            <StatCard
              label="Gastos com lazer"
              value={formatCurrency(status.metrics.leisure_spending)}
              icon={TrendingDown}
              hint={`${Number(status.metrics.leisure_percentage).toLocaleString("pt-BR")}% da renda · limite de ${Number(status.settings.max_leisure_percentage)}%`}
            />
            <StatCard
              label="Compromisso com parcelas"
              value={formatCurrency(status.metrics.installment_commitment)}
              icon={CreditCard}
              hint={`${Number(status.metrics.installment_percentage).toLocaleString("pt-BR")}% da renda`}
            />
            <StatCard
              label="Poupança registrada"
              value={formatCurrency(status.metrics.savings_amount)}
              tone="positive"
              icon={ShieldCheck}
              hint={`Meta: ${formatCurrency(status.settings.emergency_reserve_goal)}`}
            />
            <StatCard
              label="Renda comprometida"
              value={`${Number(status.metrics.total_committed_percentage).toLocaleString("pt-BR")}%`}
              icon={Target}
              hint="Gastos e compromissos financeiros"
            />
          </div>
          <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-5">
              <ChartCard
                title="Acompanhamento do mês"
                description="Essenciais e lazer, com base na classificação dos seus gastos."
                loading={plan.isLoading}
              >
                {plan.isError ? (
                  <QueryErrorState
                    error={plan.error}
                    onRetry={() => void plan.refetch()}
                  />
                ) : (
                  <dl className="divide-y text-sm">
                    {[
                      {
                        label: "Gastos essenciais",
                        value: plan.data?.comportamental.essencial,
                      },
                      {
                        label: "Lazer",
                        value: plan.data?.comportamental.lazer,
                      },
                      {
                        label: "Crescimento pessoal",
                        value: plan.data?.comportamental.crescimento,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex flex-wrap justify-between gap-2 py-4"
                      >
                        <dt className="text-muted-foreground">{row.label}</dt>
                        <dd className="font-medium tabular-nums">
                          {formatCurrency(row.value ?? 0)}
                        </dd>
                      </div>
                    ))}
                    <div className="flex flex-wrap justify-between gap-2 py-4">
                      <dt className="text-muted-foreground">
                        Limites excedidos
                      </dt>
                      <dd>
                        {plan.data?.categorias.filter(
                          (category) => category.excedido,
                        ).length ?? 0}{" "}
                        categorias
                      </dd>
                    </div>
                  </dl>
                )}
              </ChartCard>
              <ChartCard
                title="Seus objetivos"
                description="Mantenha suas metas no radar."
                loading={goals.isLoading}
                action={
                  <Link
                    to="/objetivos"
                    aria-label="Abrir objetivos"
                    className="rounded p-2 hover:bg-accent"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                }
              >
                {goals.isError ? (
                  <QueryErrorState
                    error={goals.error}
                    onRetry={() => void goals.refetch()}
                  />
                ) : goals.data?.length ? (
                  <ul className="space-y-5">
                    {goals.data.map((goal) => (
                      <li key={goal.id}>
                        <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                          <span>{goal.nome}</span>
                          <span className="text-muted-foreground">
                            {Number(goal.progresso_percentual).toFixed(0)}%
                          </span>
                        </div>
                        <Progress
                          value={Number(goal.progresso_percentual)}
                          ariaLabel={`Progresso de ${goal.nome}`}
                          animated={false}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Crie seu primeiro objetivo para acompanhar seu progresso.
                  </p>
                )}
              </ChartCard>
              <WarningsList warnings={status.warnings} />
              {!status.warnings.length && (
                <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Nenhum alerta do modo disciplina neste momento.
                </p>
              )}
            </div>
            <ChartCard
              title="Seus limites"
              description="Defina parâmetros realistas para sua renda."
            >
              <DisciplineSettingsForm settings={status.settings} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
