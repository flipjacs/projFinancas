import { useQueries, useQuery, type QueryKey } from "@tanstack/react-query";
import { balanceService } from "@/services/balance.service";

export const balanceKeys = {
  all: ["balance"] as const,
  current: () => [...balanceKeys.all, "current"] as const satisfies QueryKey,
  monthly: (year?: number, month?: number) =>
    [...balanceKeys.all, "monthly", year ?? null, month ?? null] as const,
};

export function useCurrentBalance() {
  return useQuery({
    queryKey: balanceKeys.current(),
    queryFn: () => balanceService.current(),
  });
}

export function useMonthlySummary(year?: number, month?: number) {
  return useQuery({
    queryKey: balanceKeys.monthly(year, month),
    queryFn: () => balanceService.monthly(year, month),
  });
}

/** Build the (year, month) tuple `monthsBack` months before `today`. */
function shiftMonth(today: Date, monthsBack: number): { year: number; month: number } {
  const d = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/**
 * Fetch summaries for the trailing N months (inclusive of the current one).
 * Uses parallel queries so React Query manages concurrency, caching, and
 * loading states for each month independently.
 */
export function useTrailingMonthlySummaries(months = 6) {
  const today = new Date();
  const periods = Array.from({ length: months }, (_, i) =>
    shiftMonth(today, months - 1 - i),
  );

  const queries = useQueries({
    queries: periods.map(({ year, month }) => ({
      queryKey: balanceKeys.monthly(year, month),
      queryFn: () => balanceService.monthly(year, month),
    })),
  });

  return {
    periods,
    queries,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
}
