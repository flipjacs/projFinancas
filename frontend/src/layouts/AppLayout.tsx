import { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/layouts/Navbar";
import { Sidebar } from "@/layouts/Sidebar";
import { PageFallback } from "@/components/PageFallback";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Skip link for keyboard users — hidden until focused. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Ir para o conteúdo
      </a>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 focus:outline-none"
        >
          <div className="mx-auto w-full max-w-7xl animate-fade-in px-4 py-6 sm:px-6 md:px-8 md:py-8">
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
