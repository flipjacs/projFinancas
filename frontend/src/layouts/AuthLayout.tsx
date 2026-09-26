import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ArrowUpRight, WalletCards } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
export function AuthLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${pathname === "/cadastro" ? "Criar conta" : "Entrar"} · Financeiro`;
  }, [pathname]);
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-20 items-center justify-between border-b px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
            <WalletCards className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">
            Financeiro<span className="text-primary">.</span>
          </span>
        </div>
        <ThemeToggle />
      </header>
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-16 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:py-16">
        <section className="hidden lg:block">
          <p className="section-label mb-7">Planejamento financeiro pessoal</p>
          <p className="max-w-md text-5xl font-semibold leading-[1.12] tracking-[-0.04em]">
            Seu dinheiro.
            <br />
            <span className="text-muted-foreground">
              Mais clareza para decidir.
            </span>
          </p>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
            Entenda seus gastos, organize o mês e acompanhe o caminho até seus
            objetivos.
          </p>
          <div className="mt-12 space-y-5 border-t pt-6">
            {[
              "Tudo o que entra e sai, organizado.",
              "Um plano que acompanha a sua realidade.",
              "Objetivos com progresso visível.",
            ].map((line, i) => (
              <div key={line} className="flex items-center gap-4 text-sm">
                <span className="text-xs tabular-nums text-muted-foreground">
                  0{i + 1}
                </span>
                {line}
                <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>
        <div className="mx-auto w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <footer className="px-6 py-5 text-center text-xs text-muted-foreground">
        Organize o presente. Planeje o que vem depois.
      </footer>
    </div>
  );
}
