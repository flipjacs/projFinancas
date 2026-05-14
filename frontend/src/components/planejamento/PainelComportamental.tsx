import { Heart, Leaf, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ResumoComportamental } from "@/types/planejamento";
import { formatCurrency } from "@/utils/format";

interface Props {
  comportamental?: ResumoComportamental;
  loading?: boolean;
}

const BLOCOS: {
  key: keyof ResumoComportamental;
  label: string;
  icon: typeof Heart;
  className: string;
  hint: string;
}[] = [
  {
    key: "essencial",
    label: "Essencial",
    icon: Leaf,
    className: "text-emerald-600 dark:text-emerald-400",
    hint: "moradia, contas, alimentação base",
  },
  {
    key: "lazer",
    label: "Lazer",
    icon: Sparkles,
    className: "text-pink-600 dark:text-pink-400",
    hint: "diversão, refeições fora, streaming",
  },
  {
    key: "crescimento",
    label: "Crescimento",
    icon: TrendingUp,
    className: "text-indigo-600 dark:text-indigo-400",
    hint: "reserva, cursos, investimentos",
  },
  {
    key: "sobrevivencia",
    label: "Sobrevivência",
    icon: Wallet,
    className: "text-sky-600 dark:text-sky-400",
    hint: "saúde, urgências",
  },
  {
    key: "emocional",
    label: "Emocional",
    icon: Heart,
    className: "text-rose-600 dark:text-rose-400",
    hint: "compra por impulso, conforto",
  },
];

// Mostra como o gasto do mês se *comporta* — independente da categoria base.
// Vale mais para a saúde financeira que o agregado por categoria simples.
export function PainelComportamental({ comportamental, loading }: Props) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">Como você gastou neste mês</h2>
        <p className="text-xs text-muted-foreground">
          Leitura comportamental do seu gasto — não confunda categoria base com
          impacto real no orçamento.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {BLOCOS.map(({ key, label, icon: Icon, className, hint }) => (
          <Card key={key} className="overflow-hidden">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", className)} />
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
              </div>
              {loading || !comportamental ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(comportamental[key])}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
