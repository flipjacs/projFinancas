import * as Dialog from "@radix-ui/react-dialog";
import { NavLink } from "react-router-dom";
import { ArrowUpRight, WalletCards, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/layouts/nav";

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
}

function Navigation({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate: () => void;
}) {
  return (
    <>
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b px-5",
          collapsed && "justify-center px-0",
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
          <WalletCards className="h-4 w-4" aria-hidden="true" />
        </span>
        {!collapsed && (
          <div>
            <p className="text-sm font-semibold tracking-tight">
              Financeiro<span className="text-primary">.</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Seu dinheiro, com direção
            </p>
          </div>
        )}
      </div>
      <nav
        aria-label="Navegação principal"
        className="flex-1 space-y-7 overflow-y-auto px-3 py-7"
      >
        {(["Principal", "Planejamento", "Sistema"] as const).map((group) => (
          <div key={group}>
            <p
              className={cn("section-label mb-3 px-3", collapsed && "sr-only")}
            >
              {group}
            </p>
            <div className="space-y-1">
              {NAV_ITEMS.filter((item) => item.group === group).map(
                ({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onNavigate}
                    title={collapsed ? label : undefined}
                    aria-label={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                        collapsed && "justify-center px-0",
                        isActive
                          ? "bg-accent font-medium text-foreground before:absolute before:left-0 before:h-4 before:w-0.5 before:rounded before:bg-primary"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )
                    }
                  >
                    <Icon
                      className="h-[18px] w-[18px] shrink-0"
                      strokeWidth={1.6}
                      aria-hidden="true"
                    />
                    {!collapsed && label}
                  </NavLink>
                ),
              )}
            </div>
          </div>
        ))}
      </nav>
      {!collapsed && (
        <div className="m-4 rounded-md border p-4">
          <p className="text-xs font-medium">Uma decisão de cada vez.</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Planeje antes de comprar e dê espaço aos seus objetivos.
          </p>
          <NavLink
            to="/posso-comprar"
            onClick={onNavigate}
            className="mt-3 inline-flex min-h-9 items-center gap-2 text-xs font-medium text-primary"
          >
            Simular uma compra <ArrowUpRight className="h-3.5 w-3.5" />
          </NavLink>
        </div>
      )}
    </>
  );
}

export function Sidebar({ open, collapsed, onClose }: SidebarProps) {
  return (
    <>
      <aside
        id="desktop-sidebar"
        aria-label="Menu lateral"
        className={cn(
          "surface-sidebar sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-card md:flex",
          collapsed ? "w-[72px]" : "w-56",
        )}
      >
        <Navigation collapsed={collapsed} onNavigate={onClose} />
      </aside>
      <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/65" />
          <Dialog.Content
            id="mobile-sidebar"
            className="surface-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(280px,90vw)] flex-col border-r bg-card shadow-xl"
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              document
                .querySelector<HTMLButtonElement>(
                  '[aria-controls="mobile-sidebar"]',
                )
                ?.focus();
            }}
          >
            <Dialog.Title className="sr-only">Menu de navegação</Dialog.Title>
            <Navigation onNavigate={onClose} />
            <Dialog.Close
              className="absolute right-2 top-3 flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              aria-label="Fechar menu"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
