import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { setUnauthorizedHandler, tokenStorage } from "@/lib/api";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import type { LoginRequest, RegisterRequest } from "@/types/auth";

/**
 * Convenience hook exposing a flat auth API for components.
 * Also installs the global 401 handler that clears state when the
 * backend invalidates our token.
 */
export function useAuth() {
  const { token, user, hydrated, setToken, setUser, setHydrated, logout } =
    useAuthStore();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.getState().logout();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // On first mount: if we have a persisted token, validate it by fetching /me.
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const persistedToken = useAuthStore.getState().token ?? tokenStorage.get();
      if (!persistedToken) {
        setHydrated(true);
        return;
      }
      try {
        const me = await userService.me();
        if (!cancelled) {
          setUser(me);
          setHydrated(true);
        }
      } catch {
        if (!cancelled) {
          logout();
          setHydrated(true);
        }
      }
    }
    if (!hydrated) {
      bootstrap();
    }
    return () => {
      cancelled = true;
    };
    // hydrated intentionally excluded — bootstrap runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(payload: LoginRequest) {
    const tokens = await authService.login(payload);
    setToken(tokens.access_token);
    const me = await userService.me();
    setUser(me);
  }

  async function register(payload: RegisterRequest) {
    await authService.register(payload);
    await login({ email: payload.email, password: payload.password });
  }

  return {
    token,
    user,
    hydrated,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  };
}
