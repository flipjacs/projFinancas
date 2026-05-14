export interface User {
  id: number;
  name: string;
  email: string;
  monthly_salary: number;
  created_at: string;
}

export interface UserUpdate {
  name?: string;
  monthly_salary?: number;
}
