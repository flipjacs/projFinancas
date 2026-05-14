import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types/user";
import { tokenStorage } from "@/lib/api";

interface AuthState {
  token: string | null;
  user: User | null;

  /** Mark the auth state as ready (token validated against /users/me). */
  hydrated: boolean;

  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,

      setToken: (token) => {
        tokenStorage.set(token);
        set({ token });
      },
      setUser: (user) => set({ user }),
      setHydrated: (hydrated) => set({ hydrated }),
      logout: () => {
        tokenStorage.clear();
        set({ token: null, user: null });
      },
    }),
    {
      name: "fp:auth",
      storage: createJSONStorage(() => localStorage),
      // Only persist what we need to survive a reload. The `hydrated` flag is
      // a runtime concern and should always start false on a fresh load.
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
