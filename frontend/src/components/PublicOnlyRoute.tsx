import { Navigate, Outlet, useLocation } from "react-router-dom";
import { QueryErrorState } from "@/components/QueryErrorState";
import { bootstrapSession } from "@/hooks/useAuth";
import { safeReturnPath } from "@/lib/session";
import { PageFallback } from "@/components/PageFallback";
import { useAuth } from "@/hooks/useAuth";

/**
 * Inverso do ProtectedRoute. Serve para impedir que um usuário já logado
 * fique navegando nas telas de login/cadastro — manda ele de volta para
 * onde estava tentando ir, ou para o painel.
 */
export function PublicOnlyRoute() {
  const { isAuthenticated, hydrated, bootstrapError } = useAuth();
  const location = useLocation();
  const from = safeReturnPath(
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname,
  );

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
      <div className="mx-auto max-w-xl p-6">
        <PageFallback />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
