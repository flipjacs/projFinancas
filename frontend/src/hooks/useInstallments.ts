import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { installmentService } from "@/services/installment.service";
import type {
  InstallmentCreate,
  InstallmentListParams,
  InstallmentUpdate,
} from "@/types/installment";
import { ApiError } from "@/types/api";

export const installmentKeys = {
  all: ["installments"] as const,
  list: (params: InstallmentListParams = {}) =>
    [...installmentKeys.all, "list", params] as const satisfies QueryKey,
};

export function useInstallments(params: InstallmentListParams = {}) {
  return useQuery({
    queryKey: installmentKeys.list(params),
    queryFn: () => installmentService.list(params),
  });
}

export function useInstallmentMutations() {
  const qc = useQueryClient();

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: installmentKeys.all });
    qc.invalidateQueries({ queryKey: ["financial"] });
    qc.invalidateQueries({ queryKey: ["balance"] });
  }

  function reportError(action: string) {
    return (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : `Falha ao ${action} o parcelamento.`;
      toast.error(message);
    };
  }

  const create = useMutation({
    mutationFn: (payload: InstallmentCreate) => installmentService.create(payload),
    onSuccess: () => {
      toast.success("Parcelamento adicionado.");
      invalidateAll();
    },
    onError: reportError("criar"),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InstallmentUpdate }) =>
      installmentService.update(id, payload),
    onSuccess: () => {
      toast.success("Parcelamento atualizado.");
      invalidateAll();
    },
    onError: reportError("atualizar"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => installmentService.remove(id),
    onSuccess: () => {
      toast.success("Parcelamento removido.");
      invalidateAll();
    },
    onError: reportError("remover"),
  });

  return { create, update, remove };
}
