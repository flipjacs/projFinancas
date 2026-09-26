import { create } from "zustand";
import type { User } from "@/types/user";
import { tokenStorage } from "@/lib/api";
interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  sessionExpired: boolean;
  bootstrapError: boolean;
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
}
// Only the Bearer token persists. Profile and salary stay in memory.
export const useAuthStore = create<AuthState>()((set) => ({
  token: tokenStorage.get(),
  user: null,
  hydrated: false,
  sessionExpired: false,
  bootstrapError: false,
  setToken: (token) => {
    tokenStorage.set(token);
    set({ token, sessionExpired: false, bootstrapError: false });
  },
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
  logout: () => {
    tokenStorage.clear();
    set({ token: null, user: null, hydrated: true, bootstrapError: false });
  },
}));
