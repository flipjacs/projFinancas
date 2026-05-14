export interface BalanceResponse {
  salary: string;
  total_expenses_this_month: string;
  remaining_balance: string;
}

export interface CategoryTotal {
  category: string;
  total: string;
}

export interface MonthlySummary {
  year: number;
  month: number;
  salary: string;
  total_expenses: string;
  remaining_balance: string;
  expense_count: number;
  by_category: CategoryTotal[];
}
