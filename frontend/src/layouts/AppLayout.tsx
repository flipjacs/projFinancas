import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "@/layouts/nav";
import { Navbar } from "@/layouts/Navbar";
import { Sidebar } from "@/layouts/Sidebar";
import { PageFallback } from "@/components/PageFallback";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${NAV_ITEMS.find((item) => item.to === pathname)?.label ?? "Financeiro"} · Financeiro`;
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Skip link for keyboard users — hidden until focused. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Ir para o conteúdo
      </a>

      <Sidebar
        collapsed={collapsed}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          collapsed={collapsed}
          mobileOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onCollapse={() => setCollapsed((value) => !value)}
        />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
