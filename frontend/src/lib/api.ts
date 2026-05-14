import axios, { AxiosError, type AxiosInstance } from "axios";
import { ApiError, type ApiErrorBody } from "@/types/api";

const TOKEN_STORAGE_KEY = "fp:token";

// O acesso ao token fica aqui (e não no store) para que o interceptor do
// axios consiga ler sem importar código que depende do React. Assim, o
// store continua sendo só um container de estado.
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

// ---- Interceptor de request: injeta o JWT ----
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Interceptor de response: normaliza erros e trata 401 ----
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

// Deixa o auth store registrar um callback para limpar o estado quando a
// API devolve 401. Evita um import circular entre api.ts e o store.
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
      "Erro inesperado ao contactar o servidor.";
    return Promise.reject(new ApiError(message, status, body?.error?.details));
  },
);
