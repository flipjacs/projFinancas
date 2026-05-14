import { Outlet } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">Financeiro</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md animate-fade-in">
          <Outlet />
        </div>
      </main>

      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_hsl(var(--primary)/0.12),_transparent_60%)]"
        aria-hidden="true"
      />
    </div>
  );
}
