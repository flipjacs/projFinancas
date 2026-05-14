import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Installment } from "@/types/installment";
import { formatCurrency } from "@/utils/format";

interface Props {
  installment: Installment | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  submitting?: boolean;
}

export function DeleteInstallmentDialog({
  installment,
  onOpenChange,
  onConfirm,
  submitting,
}: Props) {
  return (
    <Dialog open={Boolean(installment)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover parcelamento?</DialogTitle>
          <DialogDescription>
            Esse parcelamento sai do seu compromisso futuro.
          </DialogDescription>
        </DialogHeader>

        {installment && (
          <div className="rounded-md border bg-muted/40 p-4 text-sm">
            <p className="font-medium">{installment.product_name}</p>
            <p className="text-muted-foreground">
              {installment.remaining_installments} de{" "}
              {installment.total_installments} parcelas ·{" "}
              {formatCurrency(installment.installment_value)}/mês
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={submitting || !installment}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
