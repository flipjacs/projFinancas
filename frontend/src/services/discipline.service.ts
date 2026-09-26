import { api } from "@/lib/api";
import type { DisciplineStatus } from "@/types/discipline";
export interface DisciplineSettingsUpdate {
  max_leisure_percentage: number;
  max_installment_percentage: number;
  emergency_reserve_goal: number;
}
export const disciplineService = {
  async status(): Promise<DisciplineStatus> {
    return (await api.get<DisciplineStatus>("/discipline/status")).data;
  },
  async update(payload: DisciplineSettingsUpdate): Promise<DisciplineStatus> {
    return (await api.put<DisciplineStatus>("/discipline/settings", payload))
      .data;
  },
};
