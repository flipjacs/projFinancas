import { CalendarDays, MoreHorizontal, Pencil, Target, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarraProgresso } from "@/components/planejamento/BarraProgresso";
import { cn } from "@/lib/utils";
import type { Objetivo } from "@/types/planejamento";
import { formatCurrency } from "@/utils/format";

interface Props {
  objetivo: Objetivo;
  onEdit: (objetivo: Objetivo) => void;
  onDelete: (objetivo: Objetivo) => void;
  index?: number;
}

export function CardObjetivo({ objetivo, onEdit, onDelete, index = 0 }: Props) {
  const progresso = Number(objetivo.progresso_percentual);
  const necessario = Number(objetivo.valor_necessario_por_mes);
  const concluido = Number(objetivo.valor_atual) >= Number(objetivo.valor_meta);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-shadow duration-300 hover:shadow-lg animate-slide-up",
        concluido && "border-emerald-500/60",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <CardContent className="space-y-5 p-5">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold tracking-tight">
                {objetivo.nome}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                desde {format(parseISO(objetivo.criado_em), "d 'de' MMM',' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(objetivo)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onDelete(objetivo)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold tabular-nums">
              {formatCurrency(objetivo.valor_atual)}
            </span>
            <span className="text-xs text-muted-foreground">
              de {formatCurrency(objetivo.valor_meta)}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{progresso.toFixed(0)}% completo</span>
              <span className="text-muted-foreground">
                {objetivo.prazo_meses}{" "}
                {objetivo.prazo_meses === 1 ? "mês" : "meses"}
              </span>
            </div>
            <BarraProgresso
              percentual={progresso}
              cor={concluido ? "#10b981" : "hsl(var(--primary))"}
            />
          </div>
        </div>

        <div
          className={cn(
            "rounded-lg border bg-muted/40 p-3 text-sm",
            concluido && "border-emerald-500/30 bg-emerald-500/10",
          )}
        >
          {concluido ? (
            <p className="font-medium text-emerald-700 dark:text-emerald-300">
              🎉 Meta concluída! Parabéns.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Você precisa guardar
              </p>
              <p className="mt-0.5 text-base font-semibold tabular-nums">
                {formatCurrency(necessario)}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  por mês
                </span>
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
