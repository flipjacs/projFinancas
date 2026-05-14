import {
  AlertTriangle,
  MoreHorizontal,
  Pencil,
  Repeat,
  Target,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarraProgresso } from "@/components/planejamento/BarraProgresso";
import { corDoTipo, labelDoTipo } from "@/components/planejamento/cores";
import { cn } from "@/lib/utils";
import type {
  CategoriaResumo,
  Distribuicao,
  GastoFixoItem,
} from "@/types/planejamento";
import { formatCurrency } from "@/utils/format";

interface Props {
  distribuicao: Distribuicao;
  resumo?: CategoriaResumo;
  /** Quando este card é do tipo Fixo, lista os recorrentes que o compõem. */
  composicaoFixos?: GastoFixoItem[];
  onEdit: (distribuicao: Distribuicao) => void;
  onDelete: (distribuicao: Distribuicao) => void;
  index?: number;
}

export function CardCategoria({
  distribuicao,
  resumo,
  composicaoFixos,
  onEdit,
  onDelete,
  index = 0,
}: Props) {
  const cor = corDoTipo(distribuicao.tipo_categoria);
  const percentual = Number(resumo?.percentual_utilizado ?? 0);
  const gastoAtual = Number(resumo?.gasto_atual ?? 0);
  const valorPlanejado = Number(
    resumo?.valor_planejado ?? distribuicao.valor,
  );
  const limite = Number(resumo?.limite_mensal ?? distribuicao.limite_mensal);
  const excedido = resumo?.excedido ?? false;
  const proximo = resumo?.proximo_do_limite ?? false;
  const isFixo = distribuicao.tipo_categoria === "Fixo";
  const fixos = isFixo ? composicaoFixos ?? [] : [];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-shadow duration-300 hover:shadow-lg animate-slide-up",
        excedido && "border-destructive/60",
        proximo && "border-amber-500/60",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      {/* Faixa colorida no topo identifica o tipo de categoria */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: cor }}
      />

      <CardContent className="space-y-4 p-5 pt-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold tracking-tight">
              {distribuicao.categoria}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: `${cor}1f`,
                  color: cor,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: cor }}
                />
                {labelDoTipo(distribuicao.tipo_categoria)}
                {distribuicao.subcategoria && (
                  <>
                    <span className="opacity-60">›</span>
                    <span className="opacity-90">{distribuicao.subcategoria}</span>
                  </>
                )}
              </span>
              {distribuicao.objetivo_relacionado_id !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <Target className="h-3 w-3" />
                  Objetivo vinculado
                </span>
              )}
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
              <DropdownMenuItem onSelect={() => onEdit(distribuicao)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onDelete(distribuicao)}
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
              {formatCurrency(valorPlanejado)}
            </span>
            <span className="text-xs text-muted-foreground">
              {distribuicao.tipo_distribuicao === "porcentagem"
                ? `${Number(distribuicao.porcentagem).toFixed(2)}% do salário`
                : "valor fixo"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Limite mensal{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(limite)}
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              {formatCurrency(gastoAtual)} usados
            </span>
            <span
              className={cn(
                "tabular-nums",
                excedido && "font-semibold text-destructive",
                proximo && "font-semibold text-amber-600 dark:text-amber-400",
                !excedido && !proximo && "text-muted-foreground",
              )}
            >
              {percentual.toFixed(0)}%
            </span>
          </div>
          <BarraProgresso percentual={percentual} cor={cor} />
        </div>

        {excedido && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            Você passou do limite desta categoria.
          </div>
        )}
        {!excedido && proximo && (
          <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            Você está perto do limite mensal.
          </div>
        )}

        {isFixo && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Repeat className="h-3 w-3" />
              Composto automaticamente
              <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] normal-case">
                {fixos.length}{" "}
                {fixos.length === 1 ? "recorrente" : "recorrentes"}
              </span>
            </div>
            {fixos.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum gasto marcado como recorrente ainda — qualquer despesa
                que você marcar como recorrente entra aqui automaticamente.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {fixos.slice(0, 5).map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 truncate">{g.title}</span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatCurrency(g.amount)}
                    </span>
                  </li>
                ))}
                {fixos.length > 5 && (
                  <li className="text-[11px] text-muted-foreground">
                    + {fixos.length - 5} outros recorrentes
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
