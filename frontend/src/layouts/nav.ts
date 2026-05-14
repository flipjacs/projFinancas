import {
  CreditCard,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Disabled items render but cannot be clicked — used for routes that
   *  exist on the backend but don't yet have a frontend page. */
  disabled?: boolean;
}

/**
 * Navigation source of truth. Adding a new section is a one-line change here.
 * The backend has more endpoints than the frontend renders today; disabled
 * entries are placeholders for upcoming phases.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/installments", label: "Installments", icon: CreditCard, disabled: true },
  { to: "/financial", label: "Financial planning", icon: Wallet, disabled: true },
  { to: "/can-i-buy", label: "Purchase analysis", icon: PiggyBank, disabled: true },
  { to: "/discipline", label: "Discipline mode", icon: ShieldCheck, disabled: true },
];
