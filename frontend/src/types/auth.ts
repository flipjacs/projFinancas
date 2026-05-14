export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  monthly_salary: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
