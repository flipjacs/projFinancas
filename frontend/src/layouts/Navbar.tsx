import { Link, useLocation } from "react-router-dom";
import {
  Keyboard,
  LogOut,
  Menu,
  PanelLeft,
  Settings as SettingsIcon,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

import { NAV_ITEMS } from "@/layouts/nav";

interface NavbarProps {
  onCollapse: () => void;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleSidebar: () => void;
}

function initials(name?: string | null): string {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "·";
}

export function Navbar({
  onToggleSidebar,
  onCollapse,
  collapsed,
  mobileOpen,
}: NavbarProps) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const page = NAV_ITEMS.find((item) => item.to === pathname);

  return (
    <header className="surface-topbar sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onToggleSidebar}
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
        aria-controls="mobile-sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={onCollapse}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        aria-expanded={!collapsed}
        aria-controls="desktop-sidebar"
      >
        <PanelLeft className="h-4 w-4" />
      </Button>
      <span className="mx-2 hidden h-5 border-l sm:block" aria-hidden="true" />
      <p className="truncate text-sm text-muted-foreground">
        {page?.label ?? "Financeiro"}
      </p>
      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-9 gap-2 px-2.5 text-xs text-muted-foreground sm:inline-flex"
          onClick={() =>
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true }),
            )
          }
          aria-label="Busca rápida"
        >
          <Keyboard className="h-3.5 w-3.5" />
          <kbd className="rounded border bg-background px-1 font-mono text-[10px]">
            ⌘K
          </kbd>
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu da conta">
              {user ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(user.name)}
                </span>
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium leading-none">
                {user?.name ?? "Conta"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/configuracoes" className="cursor-pointer">
                <SettingsIcon className="h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
