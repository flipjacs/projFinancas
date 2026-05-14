import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Inverse of ProtectedRoute. Used to keep authenticated users out of the
 * login/register pages by sending them to wherever they tried to reach,
 * or to the dashboard by default.
 */
export function PublicOnlyRoute() {
  const { isAuthenticated, hydrated } = useAuth();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    "/dashboard";

  if (!hydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
