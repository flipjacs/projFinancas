import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { expenseService } from "@/services/expense.service";
import type {
  ExpenseCreate,
  ExpenseListParams,
  ExpenseUpdate,
} from "@/types/expense";
import { ApiError } from "@/types/api";

export const expenseKeys = {
  all: ["expenses"] as const,
  list: (params: ExpenseListParams = {}) =>
    [...expenseKeys.all, "list", params] as const satisfies QueryKey,
};

// Hook de leitura da lista de gastos.
export function useExpenses(params: ExpenseListParams = {}) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expenseService.list(params),
  });
}

/**
 * Junta as mutations de criar/editar/excluir num só hook para que as
 * páginas não precisem duplicar a invalidação de cache + toasts.
 */
export function useExpenseMutations() {
  const qc = useQueryClient();

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: expenseKeys.all });
    qc.invalidateQueries({ queryKey: ["balance"] });
  }

  function reportError(action: string) {
    return (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : `Falha ao ${action} o gasto.`;
      toast.error(message);
    };
  }

  const create = useMutation({
    mutationFn: (payload: ExpenseCreate) => expenseService.create(payload),
    onSuccess: () => {
      toast.success("Gasto adicionado.");
      invalidateAll();
    },
    onError: reportError("criar"),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExpenseUpdate }) =>
      expenseService.update(id, payload),
    onSuccess: () => {
      toast.success("Gasto atualizado.");
      invalidateAll();
    },
    onError: reportError("atualizar"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => expenseService.remove(id),
    onSuccess: () => {
      toast.success("Gasto excluído.");
      invalidateAll();
    },
    onError: reportError("excluir"),
  });

  return { create, update, remove };
}
