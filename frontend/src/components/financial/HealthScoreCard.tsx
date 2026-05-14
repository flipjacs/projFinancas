import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  score: number;
  className?: string;
}

function scoreTone(score: number) {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function ringStroke(score: number) {
  if (score >= 75) return "stroke-emerald-500";
  if (score >= 50) return "stroke-amber-500";
  return "stroke-red-500";
}

export function HealthScoreCard({ score, className }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(clamped * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  const offset = circumference - (displayed / 100) * circumference;

  return (
    <Card className={cn("animate-slide-up", className)}>
      <CardContent className="flex items-center gap-5 p-5">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={radius}
              strokeWidth="8"
              className="stroke-muted"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={cn("transition-[stroke-dashoffset]", ringStroke(clamped))}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums",
              scoreTone(clamped),
            )}
          >
            {displayed}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            Saúde financeira
          </div>
          <p className="text-sm font-medium">
            {clamped >= 75
              ? "Sua situação está confortável."
              : clamped >= 50
                ? "Dá pra encarar, mas com cuidado."
                : "Apertado demais — talvez seja melhor esperar."}
          </p>
          <p className="text-xs text-muted-foreground">
            Pontuação calculada pelo salário menos seus compromissos mensais
            depois desta compra.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
