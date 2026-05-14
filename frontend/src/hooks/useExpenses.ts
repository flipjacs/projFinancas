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

/** Server-state read for the expense list. */
export function useExpenses(params: ExpenseListParams = {}) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expenseService.list(params),
  });
}

/**
 * Bundled mutations so call sites don't have to duplicate the
 * cache-invalidation + toast plumbing for each verb.
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
          : `Failed to ${action} expense.`;
      toast.error(message);
    };
  }

  const create = useMutation({
    mutationFn: (payload: ExpenseCreate) => expenseService.create(payload),
    onSuccess: () => {
      toast.success("Expense added.");
      invalidateAll();
    },
    onError: reportError("create"),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExpenseUpdate }) =>
      expenseService.update(id, payload),
    onSuccess: () => {
      toast.success("Expense updated.");
      invalidateAll();
    },
    onError: reportError("update"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => expenseService.remove(id),
    onSuccess: () => {
      toast.success("Expense deleted.");
      invalidateAll();
    },
    onError: reportError("delete"),
  });

  return { create, update, remove };
}
