import { useMutation, useQuery, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { financialService } from "@/services/financial.service";
import type { CanIBuyRequest } from "@/types/financial";
import { ApiError } from "@/types/api";

export const financialKeys = {
  all: ["financial"] as const,
  monthSummary: (year?: number, month?: number) =>
    [...financialKeys.all, "month-summary", year ?? null, month ?? null] as const,
  futureBalance: (months: number) =>
    [...financialKeys.all, "future-balance", months] as const satisfies QueryKey,
};

export function useMonthSummary(year?: number, month?: number) {
  return useQuery({
    queryKey: financialKeys.monthSummary(year, month),
    queryFn: () => financialService.monthSummary(year, month),
  });
}

export function useFutureBalance(months = 12) {
  return useQuery({
    queryKey: financialKeys.futureBalance(months),
    queryFn: () => financialService.futureBalance(months),
  });
}

export function useCanIBuy() {
  return useMutation({
    mutationFn: (payload: CanIBuyRequest) => financialService.canIBuy(payload),
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not analyze this purchase.";
      toast.error(message);
    },
  });
}
