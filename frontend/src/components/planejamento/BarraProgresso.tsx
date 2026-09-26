import { cn } from "@/lib/utils";

interface Props {
  /** Percentual já consumido (0 a >100 — quando passa de 100 fica vermelho). */
  percentual: number;
  /** Cor base usada quando o percentual está em zona segura (< 80%). */
  cor?: string;
  className?: string;
  ariaLabel?: string;
  mode?: "budget" | "goal";
}

// Barra de progresso "semáforo": verde até 80%, amarelo até 100%, vermelho
// acima. Usamos um <div> simples em vez do componente <Progress> porque
// precisamos passar percentuais > 100 para sinalizar "estourou".
export function BarraProgresso({
  percentual,
  cor,
  className,
  ariaLabel = "Utilização do orçamento",
  mode = "budget",
}: Props) {
  const aviso = percentual >= 80 && percentual < 100;
  const excedido = percentual > 100;
  const largura = Math.min(100, Math.max(0, percentual));

  // Quando uma cor customizada é passada e estamos em zona segura, usamos ela.
  // Caso contrário, caímos na paleta padrão amarelo/vermelho.
  const corFinal =
    mode === "goal"
      ? (cor ?? "hsl(var(--primary))")
      : excedido
        ? "hsl(var(--destructive))" // red-500
        : aviso
          ? "hsl(var(--warning))" // amber-500
          : (cor ?? "hsl(var(--primary))");

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(largura)}
      aria-label={ariaLabel}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
        )}
        style={{
          width: `${largura}%`,
          backgroundColor: corFinal,
        }}
      />
    </div>
  );
}
