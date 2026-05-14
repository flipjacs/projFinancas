export type RiskLevel = "low" | "medium" | "high";

export interface MonthSummary {
  year: number;
  month: number;
  salary: string;
  total_expenses: string;
  monthly_installment_commitment: string;
  total_committed: string;
  remaining_balance: string;
  committed_percentage: string;
  active_installments: number;
}

export interface FutureMonthBalance {
  months_ahead: number;
  year: number;
  month: number;
  projected_installment_commitment: string;
  projected_balance: string;
  active_installments: number;
}

export interface FutureBalanceResponse {
  salary: string;
  months: FutureMonthBalance[];
}

export interface CanIBuyRequest {
  product_price: number;
  installments: number;
  product_name?: string;
}

export interface SafeInstallmentSuggestion {
  installments: number;
  installment_value: string;
  monthly_impact_percentage: string;
  risk_level: RiskLevel;
}

export interface CanIBuyResponse {
  approved: boolean;
  risk_level: RiskLevel;
  monthly_impact_percentage: string;
  new_installment_value: string;
  remaining_balance_after_purchase: string;
  salary: string;
  recurring_expenses: string;
  current_installment_commitment: string;
  total_committed_after_purchase: string;
  financial_health_score: number;
  recommendation: string;
  warnings: string[];
  safe_installment_suggestions: SafeInstallmentSuggestion[];
}
