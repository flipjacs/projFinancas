import { CalendarDays, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Installment } from "@/types/installment";
import { formatCurrency } from "@/utils/format";

interface Props {
  installment: Installment;
  onEdit: (installment: Installment) => void;
  onDelete: (installment: Installment) => void;
  /** Index para escalonar a animação de entrada na grid. */
  index?: number;
}

export function InstallmentCard({ installment, onEdit, onDelete, index = 0 }: Props) {
  const paid = installment.total_installments - installment.remaining_installments;
  const progress = installment.total_installments
    ? (paid / installment.total_installments) * 100
    : 0;
  const remainingAmount =
    Number(installment.installment_value) * installment.remaining_installments;
  const isFinished = installment.remaining_installments === 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/60 transition-shadow duration-300 hover:shadow-lg animate-slide-up",
        isFinished && "opacity-80",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <CardContent className="space-y-5 p-5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold tracking-tight">
              {installment.product_name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {format(parseISO(installment.purchase_date), "d 'de' MMM',' yyyy", {
                locale: ptBR,
              })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(installment)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onDelete(installment)}
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
              {formatCurrency(installment.installment_value)}
            </span>
            <span className="text-xs text-muted-foreground">por mês</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Total {formatCurrency(installment.total_amount)}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              {paid}/{installment.total_installments} pagas
            </span>
            <span className="text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress
            value={progress}
            indicatorClassName={cn(
              "bg-gradient-to-r from-primary to-primary/70",
              isFinished && "from-emerald-500 to-emerald-400",
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 text-xs">
          <div>
            <p className="text-muted-foreground">Faltam</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              {installment.remaining_installments}x
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">A pagar</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              {formatCurrency(remainingAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
