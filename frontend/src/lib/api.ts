import axios, { AxiosError, type AxiosInstance } from "axios";
import { ApiError, type ApiErrorBody } from "@/types/api";

const TOKEN_STORAGE_KEY = "fp:token";

// O acesso ao token fica aqui (e não no store) para que o interceptor do
// axios consiga ler sem importar código que depende do React. Assim, o
// store continua sendo só um container de estado.
export const tokenStorage = {
  get(): string | null {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      // Remove the old duplicate auth/profile record after migrating its token.
      const legacy = localStorage.getItem("fp:auth");
      const legacyToken: unknown = legacy
        ? JSON.parse(legacy)?.state?.token
        : null;
      const current =
        token ?? (typeof legacyToken === "string" ? legacyToken : null);
      if (current) localStorage.setItem(TOKEN_STORAGE_KEY, current);
      localStorage.removeItem("fp:auth");
      return current;
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
      localStorage.removeItem("fp:auth");
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
export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | null,
): void {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    const authenticating = error.config?.url?.startsWith("/auth/");
    if (
      status === 401 &&
      !authenticating &&
      error.config?.headers.Authorization === `Bearer ${tokenStorage.get()}`
    ) {
      tokenStorage.clear();
      unauthorizedHandler?.();
    }

    // Never expose raw backend messages, validation internals or Axios details.
    const message =
      status === 0
        ? "Não foi possível conectar ao servidor. Verifique sua conexão."
        : status === 401
          ? authenticating
            ? "Email ou senha inválidos."
            : "Sua sessão expirou. Entre novamente."
          : status === 403
            ? "Você não tem permissão para esta ação."
            : status === 404
              ? "O registro não foi encontrado. Atualize a página."
              : status === 409
                ? "Já existe um registro com esses dados."
                : status === 422 || status === 400
                  ? "Confira os campos informados e tente novamente."
                  : status === 429
                    ? "Muitas tentativas. Aguarde um momento e tente novamente."
                    : "Não foi possível concluir a operação. Tente novamente.";
    return Promise.reject(new ApiError(message, status, body?.error?.details));
  },
);
