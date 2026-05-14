import { api } from "@/lib/api";
import type { BalanceResponse, MonthlySummary } from "@/types/balance";

export const balanceService = {
  async current(): Promise<BalanceResponse> {
    const { data } = await api.get<BalanceResponse>("/balance");
    return data;
  },

  async monthly(year?: number, month?: number): Promise<MonthlySummary> {
    const { data } = await api.get<MonthlySummary>("/balance/monthly", {
      params: { year, month },
    });
    return data;
  },
};
