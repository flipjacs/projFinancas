import { api } from "@/lib/api";
import type {
  Installment,
  InstallmentCreate,
  InstallmentListParams,
  InstallmentUpdate,
} from "@/types/installment";

export const installmentService = {
  async list(params: InstallmentListParams = {}): Promise<Installment[]> {
    const { data } = await api.get<Installment[]>("/installments", { params });
    return data;
  },

  async create(payload: InstallmentCreate): Promise<Installment> {
    const { data } = await api.post<Installment>("/installments", payload);
    return data;
  },

  async update(id: number, payload: InstallmentUpdate): Promise<Installment> {
    const { data } = await api.put<Installment>(`/installments/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/installments/${id}`);
  },
};
