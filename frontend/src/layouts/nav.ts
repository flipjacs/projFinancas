import {
  CreditCard,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Settings,
  ShieldCheck,
  Target,
  Wallet,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Itens desativados aparecem mas não são clicáveis — usados para
   *  páginas que ainda não foram implementadas. */
  disabled?: boolean;
  group: "Principal" | "Planejamento" | "Sistema";
}

// Fonte única de verdade da navegação. Adicionar uma nova seção é uma
// linha nova aqui. Itens com `disabled: true` aparecem como "Em breve".
export const NAV_ITEMS: NavItem[] = [
  {
    to: "/painel",
    label: "Visão geral",
    icon: LayoutDashboard,
    group: "Principal",
  },
  { to: "/gastos", label: "Gastos", icon: Receipt, group: "Principal" },
  {
    to: "/planejamento",
    label: "Planejamento",
    icon: Wallet,
    group: "Principal",
  },
  { to: "/objetivos", label: "Objetivos", icon: Target, group: "Planejamento" },
  {
    to: "/parcelamentos",
    label: "Parcelamentos",
    icon: CreditCard,
    group: "Planejamento",
  },
  {
    to: "/disciplina",
    label: "Modo disciplina",
    icon: ShieldCheck,
    group: "Planejamento",
  },
  {
    to: "/posso-comprar",
    label: "Posso comprar?",
    icon: PiggyBank,
    group: "Planejamento",
  },
  {
    to: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    group: "Sistema",
  },
  { to: "/perfil", label: "Perfil", icon: UserRound, group: "Sistema" },
];
