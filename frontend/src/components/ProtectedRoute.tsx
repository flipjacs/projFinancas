import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Gate for routes that require an authenticated user.
 * - While the auth store is hydrating from localStorage we render a neutral
 *   placeholder so we don't flash the login page on every reload.
 * - When unauthenticated, we redirect to /login and remember where the user
 *   was trying to go via location state.
 */
export function ProtectedRoute() {
  const { isAuthenticated, hydrated } = useAuth();
  const location = useLocation();

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
