import { api } from "@/lib/api";
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
} from "@/types/auth";
import type { User } from "@/types/user";

export const authService = {
  async register(payload: RegisterRequest): Promise<User> {
    const { data } = await api.post<User>("/auth/register", payload);
    return data;
  },

  async login(payload: LoginRequest): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/auth/login", payload);
    return data;
  },
};
