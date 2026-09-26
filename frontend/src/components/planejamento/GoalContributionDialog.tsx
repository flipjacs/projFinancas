import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useObjetivoMutations } from "@/hooks/usePlanejamento";
import type { Objetivo } from "@/types/planejamento";
import { formatCurrency } from "@/utils/format";
export function GoalContributionDialog({
  goal,
  onClose,
}: {
  goal: Objetivo;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const { update } = useObjetivoMutations();
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !update.isPending && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar dinheiro</DialogTitle>
          <DialogDescription>
            Atualize o valor guardado para {goal.nome}. Esta ação não cria um
            gasto nem uma transferência bancária.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (update.isPending) return;
            const value = Number(amount);
            const newTotal =
              (Math.round(Number(goal.valor_atual) * 100) +
                Math.round(value * 100)) /
              100;
            if (!Number.isFinite(value) || value <= 0) {
              setError("Informe um valor maior que zero.");
              return;
            }
            if (newTotal > Number(goal.valor_meta)) {
              setError(
                "O aporte ultrapassa a meta. Edite a meta antes de continuar.",
              );
              return;
            }
            try {
              await update.mutateAsync({
                id: goal.id,
                payload: { valor_atual: newTotal },
              });
              onClose();
            } catch {
              setError("Não foi possível salvar o aporte. Tente novamente.");
            }
          }}
        >
          <p className="text-sm text-muted-foreground">
            Já guardado:{" "}
            <strong className="text-foreground">
              {formatCurrency(goal.valor_atual)}
            </strong>
          </p>
          <div className="space-y-2">
            <Label htmlFor="contribution">Valor a adicionar (R$)</Label>
            <Input
              id="contribution"
              autoFocus
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              aria-invalid={!!error}
              aria-describedby="contribution-error"
            />
            <p
              id="contribution-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={update.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Salvando..." : "Adicionar dinheiro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
