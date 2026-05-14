import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Inverso do ProtectedRoute. Serve para impedir que um usuário já logado
 * fique navegando nas telas de login/cadastro — manda ele de volta para
 * onde estava tentando ir, ou para o painel.
 */
export function PublicOnlyRoute() {
  const { isAuthenticated, hydrated } = useAuth();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    "/painel";

  if (!hydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
