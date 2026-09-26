export interface DisciplineSettings {
  max_leisure_percentage: string;
  max_installment_percentage: string;
  emergency_reserve_goal: string;
}
export interface DisciplineStatus {
  score: number;
  streak_days: number;
  last_evaluated_date: string | null;
  settings: DisciplineSettings;
  metrics: {
    salary: string;
    leisure_spending: string;
    leisure_percentage: string;
    savings_amount: string;
    savings_percentage: string;
    installment_commitment: string;
    installment_percentage: string;
    total_committed_percentage: string;
  };
  warnings: string[];
  updated_at: string;
}
