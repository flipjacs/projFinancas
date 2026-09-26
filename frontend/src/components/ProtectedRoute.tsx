import { Navigate, Outlet, useLocation } from "react-router-dom";
import { QueryErrorState } from "@/components/QueryErrorState";
import { bootstrapSession } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";

/**
 * Guarda das rotas que exigem usuário autenticado.
 * - Enquanto o estado de auth ainda está hidratando do localStorage,
 *   mostramos um placeholder neutro para não dar "flash" da tela de
 *   login a cada reload.
 * - Quando não autenticado, redirecionamos para /login e guardamos
 *   o destino original em location.state.
 */
export function ProtectedRoute() {
  const { isAuthenticated, hydrated, bootstrapError } = useAuth();
  const location = useLocation();

  if (bootstrapError)
    return (
      <div className="mx-auto max-w-lg p-6">
        <QueryErrorState
          error={null}
          title="Não foi possível verificar sua sessão"
          onRetry={() => void bootstrapSession()}
        />
      </div>
    );

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
