import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/financial";

const RISK_STYLES: Record<RiskLevel, string> = {
  low: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  medium: "bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  high: "bg-red-500/10 text-red-700 ring-red-500/30 dark:text-red-300",
};

const RISK_ICON: Record<RiskLevel, typeof CheckCircle2> = {
  low: CheckCircle2,
  medium: AlertTriangle,
  high: ShieldAlert,
};

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Risco baixo",
  medium: "Risco moderado",
  high: "Risco alto",
};

interface Props {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: Props) {
  const Icon = RISK_ICON[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        RISK_STYLES[level],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {RISK_LABEL[level]}
    </span>
  );
}
