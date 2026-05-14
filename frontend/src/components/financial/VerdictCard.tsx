import { CheckCircle2, XCircle } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CanIBuyResponse } from "@/types/financial";

interface Props {
  result: CanIBuyResponse;
}

export function VerdictCard({ result }: Props) {
  const approved = result.approved;
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 animate-scale-in",
        approved
          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-background to-background"
          : "border-red-500/40 bg-gradient-to-br from-red-500/10 via-background to-background",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl",
          approved ? "bg-emerald-500/20" : "bg-red-500/20",
        )}
      />
      <CardContent className="relative grid gap-4 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6 sm:p-6">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 rounded-full animate-pulse-ring",
              approved ? "bg-emerald-500/30" : "bg-red-500/30",
            )}
          />
          <span
            className={cn(
              "relative flex h-16 w-16 items-center justify-center rounded-full",
              approved
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white",
            )}
          >
            {approved ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <XCircle className="h-8 w-8" />
            )}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {approved ? "Pode comprar! 👍" : "Melhor pensar com calma 🤔"}
            </h2>
            <RiskBadge level={result.risk_level} />
          </div>
          <p className="text-sm text-muted-foreground">{result.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
