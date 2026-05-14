import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertaFinanceiro as Alerta } from "@/types/planejamento";

interface Props {
  alerta: Alerta;
}

const ESTILOS: Record<
  Alerta["tipo"],
  { wrapper: string; icon: typeof Info; iconClass: string }
> = {
  excedido: {
    wrapper:
      "border-destructive/40 bg-destructive/10 text-destructive dark:text-red-300",
    icon: ShieldAlert,
    iconClass: "text-destructive",
  },
  proximo_limite: {
    wrapper:
      "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    icon: AlertTriangle,
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  reserva_baixa: {
    wrapper:
      "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200",
    icon: Info,
    iconClass: "text-sky-600 dark:text-sky-400",
  },
};

export function AlertaFinanceiroCard({ alerta }: Props) {
  const estilo = ESTILOS[alerta.tipo];
  const Icon = estilo.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-sm",
        estilo.wrapper,
      )}
      role="alert"
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", estilo.iconClass)} />
      <div className="min-w-0">
        <p className="font-medium">{alerta.categoria}</p>
        <p className="text-xs opacity-90">{alerta.mensagem}</p>
      </div>
    </div>
  );
}
