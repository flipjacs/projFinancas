import { CloudOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/types/api";

interface Props {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

/**
 * Inline error state for failed React Query reads. Pairs with `useQuery`'s
 * `isError` / `refetch` so individual cards/sections can recover without
 * forcing a full page reload.
 */
export function QueryErrorState({ error, onRetry, title }: Props) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Não foi possível carregar esta seção.";

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CloudOff className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title ?? "Falha ao carregar os dados"}</p>
        <p className="max-w-sm text-xs text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" />
          Tentar de novo
        </Button>
      )}
    </div>
  );
}
