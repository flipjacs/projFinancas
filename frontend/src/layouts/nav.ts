import {
  CreditCard,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Settings,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Itens desativados aparecem mas não são clicáveis — usados para
   *  páginas que ainda não foram implementadas. */
  disabled?: boolean;
}

// Fonte única de verdade da navegação. Adicionar uma nova seção é uma
// linha nova aqui. Itens com `disabled: true` aparecem como "Em breve".
export const NAV_ITEMS: NavItem[] = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/gastos", label: "Gastos", icon: Receipt },
  { to: "/parcelamentos", label: "Parcelamentos", icon: CreditCard },
  { to: "/planejamento", label: "Planejamento", icon: Wallet, disabled: true },
  { to: "/posso-comprar", label: "Posso Comprar?", icon: PiggyBank },
  { to: "/disciplina", label: "Modo Disciplina", icon: ShieldCheck, disabled: true },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];
