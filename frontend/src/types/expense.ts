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

export const CATEGORIAS_COMPORTAMENTAIS_EXPENSE = [
  "essencial",
  "lazer",
  "crescimento",
  "sobrevivencia",
  "emocional",
] as const;
export type CategoriaComportamentalExpense =
  (typeof CATEGORIAS_COMPORTAMENTAIS_EXPENSE)[number];

export const LABEL_COMPORTAMENTAL_EXPENSE: Record<
  CategoriaComportamentalExpense,
  string
> = {
  essencial: "Essencial",
  lazer: "Lazer",
  crescimento: "Crescimento",
  sobrevivencia: "Sobrevivência",
  emocional: "Emocional",
};

export interface Expense {
  id: number;
  user_id: number;
  title: string;
  amount: string; // backend serializes Decimal as string
  category: ExpenseCategory;
  categoria_comportamental: CategoriaComportamentalExpense | null;
  impacto_financeiro: "positivo" | "neutro" | "negativo" | null;
  /** Envelope de planejamento que este gasto alimenta especificamente.
   *  Para Reserva/Objetivos, é mandatório para o gasto ser contabilizado. */
  distribuicao_id: number | null;
  recurring: boolean;
  created_at: string;
}

export interface ExpenseCreate {
  title: string;
  amount: number;
  category: ExpenseCategory;
  categoria_comportamental?: CategoriaComportamentalExpense | null;
  distribuicao_id?: number | null;
  recurring: boolean;
}

export type ExpenseUpdate = Partial<ExpenseCreate> & {
  desvincular_distribuicao?: boolean;
};

export interface ExpenseListParams {
  skip?: number;
  limit?: number;
}
