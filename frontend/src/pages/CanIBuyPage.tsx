import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  Calculator,
  Loader2,
  PiggyBank,
  Scale,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { CommitmentBreakdownChart } from "@/components/charts/CommitmentBreakdownChart";
import { SimulatedBalanceChart } from "@/components/charts/SimulatedBalanceChart";
import { VerdictCard } from "@/components/financial/VerdictCard";
import { HealthScoreCard } from "@/components/financial/HealthScoreCard";
import { WarningsList } from "@/components/financial/WarningsList";
import { SafeSuggestions } from "@/components/financial/SafeSuggestions";
import { useCanIBuy, useFutureBalance } from "@/hooks/useFinancial";
import { formatCurrency, formatPercentage } from "@/utils/format";
import { cn } from "@/lib/utils";

const schema = z.object({
  product_name: z.string().max(180).optional().or(z.literal("")),
  product_price: z.coerce.number().positive("Precisa ser maior que 0"),
  installments: z.coerce
    .number()
    .int("Precisa ser um número inteiro")
    .min(1, "Pelo menos 1 parcela")
    .max(360, "No máximo 360 parcelas"),
});

type FormValues = z.infer<typeof schema>;

export function CanIBuyPage() {
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_name: "",
      product_price: 0,
      installments: 12,
    },
  });

  const analysis = useCanIBuy();
  const futureBalance = useFutureBalance(12);

  async function handleSubmit(values: FormValues) {
    const payload = {
      product_price: values.product_price,
      installments: values.installments,
      product_name: values.product_name || undefined,
    };
    setSubmitted(values);
    await analysis.mutateAsync(payload);
  }

  const result = analysis.data;
  const impactPct = result ? Number(result.monthly_impact_percentage) : 0;
  const impactTone =
    impactPct < 15 ? "emerald" : impactPct < 30 ? "amber" : "red";

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Posso comprar isso?</h1>
        <p className="text-sm text-muted-foreground">
          Simule uma compra e veja como ela impacta seu mês.
        </p>
      </header>

      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        />
        <CardContent className="relative grid gap-6 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Análise de compra
          </div>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto]"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="product_name">Produto</Label>
              <Input
                id="product_name"
                placeholder="ex.: Celular novo"
                {...form.register("product_name")}
              />
              {form.formState.errors.product_name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.product_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_price">Preço</Label>
              <Input
                id="product_price"
                type="number"
                step="0.01"
                min={0}
                inputMode="decimal"
                {...form.register("product_price")}
              />
              {form.formState.errors.product_price && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.product_price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Parcelas</Label>
              <Input
                id="installments"
                type="number"
                min={1}
                max={360}
                {...form.register("installments")}
              />
              {form.formState.errors.installments && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.installments.message}
                </p>
              )}
            </div>

            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <Button
                type="submit"
                size="lg"
                className="w-full lg:w-auto"
                disabled={analysis.isPending}
              >
                {analysis.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )}
                Simular
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground">
            Comparamos esta compra com seu salário, gastos fixos e parcelamentos
            atuais para estimar o risco.
          </p>
        </CardContent>
      </Card>

      {analysis.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      )}

      {result && !analysis.isPending && (
        <div className="space-y-6">
          <VerdictCard result={result} />

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="animate-slide-up">
              <CardContent className="space-y-5 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Impacto no mês
                    </p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums">
                      {formatPercentage(impactPct)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      do seu salário ficaria comprometido.
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex h-12 w-12 items-center justify-center rounded-xl",
                      impactTone === "emerald" &&
                        "bg-emerald-500/10 text-emerald-600",
                      impactTone === "amber" &&
                        "bg-amber-500/10 text-amber-600",
                      impactTone === "red" && "bg-red-500/10 text-red-600",
                    )}
                  >
                    <Scale className="h-5 w-5" />
                  </span>
                </div>
                <Progress
                  value={Math.min(100, impactPct)}
                  indicatorClassName={cn(
                    "bg-gradient-to-r",
                    impactTone === "emerald" &&
                      "from-emerald-500 to-emerald-400",
                    impactTone === "amber" && "from-amber-500 to-amber-400",
                    impactTone === "red" && "from-red-500 to-red-400",
                  )}
                />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      Nova parcela
                    </p>
                    <p className="mt-0.5 text-base font-semibold tabular-nums">
                      {formatCurrency(result.new_installment_value)}
                    </p>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      Compromisso total depois
                    </p>
                    <p className="mt-0.5 text-base font-semibold tabular-nums">
                      {formatCurrency(result.total_committed_after_purchase)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <HealthScoreCard score={result.financial_health_score} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Salário"
              value={formatCurrency(result.salary)}
              icon={Wallet}
              hint="Renda mensal base."
            />
            <StatCard
              label="Gastos fixos"
              value={formatCurrency(result.recurring_expenses)}
              icon={Scale}
              tone="warning"
              hint="Custos que se repetem todo mês."
            />
            <StatCard
              label="Parcelas atuais"
              value={formatCurrency(result.current_installment_commitment)}
              icon={ArrowRight}
              tone="warning"
              hint="Compromisso mensal já existente."
            />
            <StatCard
              label="Saldo depois da compra"
              value={formatCurrency(result.remaining_balance_after_purchase)}
              icon={PiggyBank}
              tone={
                Number(result.remaining_balance_after_purchase) < 0
                  ? "negative"
                  : Number(result.remaining_balance_after_purchase) <
                      Number(result.salary) * 0.15
                    ? "warning"
                    : "positive"
              }
              hint="Quanto sobra no mês."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Para onde vai seu salário"
              description="Compromisso mensal caso a compra seja feita."
            >
              <CommitmentBreakdownChart
                salary={Number(result.salary)}
                recurringExpenses={Number(result.recurring_expenses)}
                currentInstallmentCommitment={Number(
                  result.current_installment_commitment,
                )}
                newInstallmentValue={Number(result.new_installment_value)}
              />
            </ChartCard>

            <ChartCard
              title="Saldo projetado"
              description="Comparando o seu saldo com e sem a compra."
              loading={futureBalance.isLoading}
            >
              <SimulatedBalanceChart
                months={futureBalance.data?.months ?? []}
                extraInstallmentValue={Number(result.new_installment_value)}
                purchaseInstallments={submitted?.installments ?? 0}
              />
            </ChartCard>
          </div>

          <WarningsList warnings={result.warnings} />
          <SafeSuggestions suggestions={result.safe_installment_suggestions} />
        </div>
      )}

      {!result && !analysis.isPending && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Calculator className="h-6 w-6" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Preencha os dados para ver o resultado.
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Você recebe um nível de risco, o impacto no mês, a projeção do
                saldo e opções de parcelamento mais seguras.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
