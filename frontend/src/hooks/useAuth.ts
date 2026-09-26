import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { setUnauthorizedHandler, tokenStorage } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { tokenExpiresAt } from "@/lib/session";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import type { LoginRequest, RegisterRequest } from "@/types/auth";

function logout(expired = false) {
  // Cancel/remove in-flight reads and all cached financial data before another login.
  queryClient.clear();
  useAuthStore.getState().logout();
  useAuthStore.setState({ sessionExpired: expired });
}
let bootstrapPromise: Promise<void> | null = null;
let bootstrapToken: string | null = null;
export function bootstrapSession(): Promise<void> {
  const token = useAuthStore.getState().token;
  if (bootstrapPromise && bootstrapToken === token) return bootstrapPromise;
  if (!token) {
    useAuthStore.setState({ hydrated: true });
    return Promise.resolve();
  }
  if (tokenExpiresAt(token) <= Date.now()) {
    logout(true);
    return Promise.resolve();
  }
  useAuthStore.setState({ hydrated: false, bootstrapError: false });
  bootstrapToken = token;
  bootstrapPromise = userService
    .me()
    .then((user) => {
      if (useAuthStore.getState().token === token)
        useAuthStore.setState({ user, hydrated: true });
    })
    .catch(() => {
      if (useAuthStore.getState().token === token)
        useAuthStore.setState({ bootstrapError: true });
    })
    .finally(() => {
      if (bootstrapToken === token) bootstrapPromise = null;
    });
  return bootstrapPromise;
}

// Mount once at the app root, never in each consumer of useAuth.
export function useSessionLifecycle() {
  const token = useAuthStore((state) => state.token);
  useEffect(() => {
    setUnauthorizedHandler(() => logout(true));
    void bootstrapSession();
    const sync = (event: StorageEvent) => {
      if (event.key !== "fp:token" && event.key !== null) return;
      const persisted = tokenStorage.get();
      if (persisted === useAuthStore.getState().token) return;
      queryClient.clear();
      useAuthStore.setState({ token: persisted, user: null, hydrated: false });
      void bootstrapSession();
    };
    window.addEventListener("storage", sync);
    return () => {
      setUnauthorizedHandler(null);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    if (!token) return;
    let timer: number;
    const scheduleExpiry = () => {
      const remaining = tokenExpiresAt(token) - Date.now();
      if (remaining <= 0) {
        logout(true);
        return;
      }
      timer = window.setTimeout(scheduleExpiry, Math.min(remaining, 2_147_483_647));
    };
    scheduleExpiry();
    const check = () => {
      if (tokenExpiresAt(token) <= Date.now()) logout(true);
    };
    window.addEventListener("focus", check);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", check);
    };
  }, [token]);
}

export function useAuth() {
  const state = useAuthStore();
  async function login(payload: LoginRequest) {
    const tokens = await authService.login(payload);
    queryClient.clear();
    state.setToken(tokens.access_token);
    try {
      const user = await userService.me();
      if (useAuthStore.getState().token !== tokens.access_token) return;
      useAuthStore.setState({ user, hydrated: true });
    } catch (error) {
      if (useAuthStore.getState().token === tokens.access_token) logout();
      throw error;
    }
  }
  async function register(payload: RegisterRequest) {
    await authService.register(payload);
    await login({ email: payload.email, password: payload.password });
  }
  return {
    ...state,
    isAuthenticated: Boolean(state.token && state.user),
    login,
    register,
    logout: () => logout(),
  };
}
