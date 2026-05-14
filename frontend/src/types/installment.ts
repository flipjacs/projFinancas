export interface Installment {
  id: number;
  user_id: number;
  product_name: string;
  total_amount: string;
  installment_value: string;
  total_installments: number;
  remaining_installments: number;
  purchase_date: string;
  created_at: string;
}

export interface InstallmentCreate {
  product_name: string;
  total_amount: number;
  installment_value: number;
  total_installments: number;
  remaining_installments?: number;
  purchase_date: string;
}

export type InstallmentUpdate = Partial<InstallmentCreate>;

export interface InstallmentListParams {
  skip?: number;
  limit?: number;
  active_only?: boolean;
}
