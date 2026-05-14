import { api } from "@/lib/api";
import type {
  Expense,
  ExpenseCreate,
  ExpenseListParams,
  ExpenseUpdate,
} from "@/types/expense";

export const expenseService = {
  async list(params: ExpenseListParams = {}): Promise<Expense[]> {
    const { data } = await api.get<Expense[]>("/expenses", { params });
    return data;
  },

  async create(payload: ExpenseCreate): Promise<Expense> {
    const { data } = await api.post<Expense>("/expenses", payload);
    return data;
  },

  async update(id: number, payload: ExpenseUpdate): Promise<Expense> {
    const { data } = await api.patch<Expense>(`/expenses/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};
