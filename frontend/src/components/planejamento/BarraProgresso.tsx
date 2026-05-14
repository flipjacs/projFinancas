import { cn } from "@/lib/utils";

interface Props {
  /** Percentual já consumido (0 a >100 — quando passa de 100 fica vermelho). */
  percentual: number;
  /** Cor base usada quando o percentual está em zona segura (< 80%). */
  cor?: string;
  className?: string;
  ariaLabel?: string;
}

// Barra de progresso "semáforo": verde até 80%, amarelo até 100%, vermelho
// acima. Usamos um <div> simples em vez do componente <Progress> porque
// precisamos passar percentuais > 100 para sinalizar "estourou".
export function BarraProgresso({
  percentual,
  cor,
  className,
  ariaLabel,
}: Props) {
  const seguro = percentual < 80;
  const aviso = percentual >= 80 && percentual < 100;
  const excedido = percentual >= 100;
  const largura = Math.min(100, Math.max(0, percentual));

  // Quando uma cor customizada é passada e estamos em zona segura, usamos ela.
  // Caso contrário, caímos na paleta padrão amarelo/vermelho.
  const corFinal = excedido
    ? "rgb(239 68 68)" // red-500
    : aviso
      ? "rgb(245 158 11)" // amber-500
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
          excedido && "animate-pulse",
        )}
        style={{
          width: `${largura}%`,
          backgroundColor: corFinal,
        }}
      />
      {seguro && null}
    </div>
  );
}
