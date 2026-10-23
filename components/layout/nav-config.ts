import {
  BookOpen,
  Bot,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type NavItem = {
  key: Exclude<keyof Dictionary["nav"], "mainNavigation" | "logout">;
  href: string;
  icon: LucideIcon;
  /** False until the section is built; rendered as a disabled "Soon" entry, never a dead link. */
  available: boolean;
};

export const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, available: true },
  { key: "ai", href: "/dashboard/ai", icon: Bot, available: true },
  { key: "products", href: "/dashboard/products", icon: Package, available: true },
  { key: "orders", href: "/dashboard/orders", icon: ShoppingCart, available: false },
  { key: "customers", href: "/dashboard/customers", icon: Users, available: false },
  { key: "knowledge", href: "/dashboard/knowledge", icon: BookOpen, available: true },
  { key: "settings", href: "/dashboard/settings", icon: Settings, available: true },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/dashboard") return pathname === "/dashboard";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
