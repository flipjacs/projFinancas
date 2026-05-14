import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RiskBadge } from "@/components/RiskBadge";
import type { SafeInstallmentSuggestion } from "@/types/financial";
import { formatCurrency, formatPercentage } from "@/utils/format";

interface Props {
  suggestions: SafeInstallmentSuggestion[];
}

export function SafeSuggestions({ suggestions }: Props) {
  if (!suggestions.length) return null;

  return (
    <Card className="animate-slide-up">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="h-4 w-4 text-primary" />
          Outras formas mais seguras de parcelar
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((s) => (
            <li
              key={s.installments}
              className="space-y-3 rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/60"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold tabular-nums">
                  {s.installments}× {formatCurrency(s.installment_value)}
                </p>
                <RiskBadge level={s.risk_level} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Impacto no mês</span>
                  <span className="tabular-nums">
                    {formatPercentage(s.monthly_impact_percentage)}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, Number(s.monthly_impact_percentage))}
                  indicatorClassName={
                    s.risk_level === "low"
                      ? "bg-emerald-500"
                      : s.risk_level === "medium"
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
