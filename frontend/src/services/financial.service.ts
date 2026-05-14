import { api } from "@/lib/api";
import type {
  CanIBuyRequest,
  CanIBuyResponse,
  FutureBalanceResponse,
  MonthSummary,
} from "@/types/financial";

export const financialService = {
  async monthSummary(year?: number, month?: number): Promise<MonthSummary> {
    const { data } = await api.get<MonthSummary>("/financial/month-summary", {
      params: { year, month },
    });
    return data;
  },

  async futureBalance(months = 12): Promise<FutureBalanceResponse> {
    const { data } = await api.get<FutureBalanceResponse>(
      "/financial/future-balance",
      { params: { months } },
    );
    return data;
  },

  async canIBuy(payload: CanIBuyRequest): Promise<CanIBuyResponse> {
    const { data } = await api.post<CanIBuyResponse>(
      "/financial-analysis/can-i-buy",
      payload,
    );
    return data;
  },
};
