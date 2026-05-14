import { Navigate, Outlet, useLocation } from "react-router-dom";
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
  const { isAuthenticated, hydrated } = useAuth();
  const location = useLocation();

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
