import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/PublicOnlyRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

// As páginas internas são carregadas sob demanda (code-splitting):
// quem está só na tela de login não baixa Recharts, formulários
// pesados nem a análise financeira.
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const ExpensesPage = lazy(() =>
  import("@/pages/ExpensesPage").then((m) => ({ default: m.ExpensesPage })),
);
const InstallmentsPage = lazy(() =>
  import("@/pages/InstallmentsPage").then((m) => ({
    default: m.InstallmentsPage,
  })),
);
const CanIBuyPage = lazy(() =>
  import("@/pages/CanIBuyPage").then((m) => ({ default: m.CanIBuyPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);

export function AppRouter() {
  return (
    <Routes>
      {/* Rotas públicas — só aparecem quando o usuário está deslogado. */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Rotas protegidas — exigem usuário autenticado. O AppLayout já
          envolve o conteúdo num Suspense para mostrar skeleton enquanto
          o chunk da página está sendo baixado. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/painel" element={<DashboardPage />} />
          <Route path="/gastos" element={<ExpensesPage />} />
          <Route path="/parcelamentos" element={<InstallmentsPage />} />
          <Route path="/posso-comprar" element={<CanIBuyPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Defaults */}
      <Route path="/" element={<Navigate to="/painel" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
