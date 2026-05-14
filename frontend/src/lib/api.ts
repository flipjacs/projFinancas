import axios, { AxiosError, type AxiosInstance } from "axios";
import { ApiError, type ApiErrorBody } from "@/types/api";

const TOKEN_STORAGE_KEY = "fp:token";

/**
 * Token I/O is colocated here (rather than in the auth store) so the axios
 * interceptor can read the token without importing React-bound code, and the
 * store can stay a pure state container.
 */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      /* private mode / quota */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ---- Request interceptor: inject JWT ----
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response interceptor: normalize errors, handle 401 ----
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Lets the auth store register a callback to clear state when the API
 * returns 401. Avoids a circular import between api.ts and the store.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    if (status === 401) {
      tokenStorage.clear();
      unauthorizedHandler?.();
    }

    const message =
      body?.error?.message ??
      error.message ??
      "Unexpected error contacting the server.";
    return Promise.reject(new ApiError(message, status, body?.error?.details));
  },
);
