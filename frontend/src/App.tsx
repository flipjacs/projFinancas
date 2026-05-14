import { useCallback, useState } from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import { AppRouter } from "@/routes/AppRouter";
import { TopProgress } from "@/components/TopProgress";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QuickNavDialog } from "@/components/QuickNavDialog";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { useShortcuts } from "@/hooks/useShortcuts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <GlobalChrome />
            <AppRouter />
          </ErrorBoundary>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * Global UI chrome that lives inside the router so it can use navigation and
 * theme hooks: an in-flight progress bar tied to React Query, ⌘K quick-nav,
 * a "?" shortcuts dialog, and vim-style "g <letter>" navigation.
 */
function GlobalChrome() {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Two-key "g <letter>" sequence. We flip a flag for ~800ms after "g" so
  // subsequent letters route to a specific page; everything else cancels it.
  const [pendingG, setPendingG] = useState(false);

  const goTo = useCallback(
    (path: string) => {
      navigate(path);
      setPendingG(false);
    },
    [navigate],
  );

  useShortcuts([
    {
      key: "k",
      meta: true,
      handler: (e) => {
        e.preventDefault();
        setQuickNavOpen((open) => !open);
      },
    },
    {
      key: "/",
      meta: true,
      handler: (e) => {
        e.preventDefault();
        toggleTheme();
      },
    },
    {
      key: "?",
      shift: true,
      handler: (e) => {
        e.preventDefault();
        setShortcutsOpen(true);
      },
    },
    {
      key: "g",
      handler: () => {
        setPendingG(true);
        window.setTimeout(() => setPendingG(false), 800);
      },
    },
    { key: "d", handler: () => pendingG && goTo("/painel") },
    { key: "g", handler: () => pendingG && goTo("/gastos") },
    { key: "p", handler: () => pendingG && goTo("/parcelamentos") },
    { key: "c", handler: () => pendingG && goTo("/posso-comprar") },
    { key: "s", handler: () => pendingG && goTo("/configuracoes") },
  ]);

  return (
    <>
      <TopProgress />
      <QuickNavDialog open={quickNavOpen} onOpenChange={setQuickNavOpen} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}
