export const EXPENSE_CATEGORIES = [
  "housing",
  "food",
  "transport",
  "health",
  "education",
  "entertainment",
  "utilities",
  "shopping",
  "savings",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: number;
  user_id: number;
  title: string;
  amount: string; // backend serializes Decimal as string
  category: ExpenseCategory;
  recurring: boolean;
  created_at: string;
}

export interface ExpenseCreate {
  title: string;
  amount: number;
  category: ExpenseCategory;
  recurring: boolean;
}

export type ExpenseUpdate = Partial<ExpenseCreate>;

export interface ExpenseListParams {
  skip?: number;
  limit?: number;
}
