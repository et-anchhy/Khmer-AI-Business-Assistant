"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { isNavItemActive, navItems } from "./nav-config";

export function navLinkClass({ active, disabled }: { active: boolean; disabled?: boolean }) {
  return cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    disabled && "pointer-events-none opacity-55",
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav aria-label={t.nav.mainNavigation}>
      <ul className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const label = t.nav[item.key];

          if (!item.available) {
            return (
              <li key={item.key}>
                <span aria-disabled="true" className={navLinkClass({ active: false, disabled: true })}>
                  <Icon className="size-4" aria-hidden />
                  <span className="flex-1 truncate">{label}</span>
                  <Badge variant="secondary" className="text-[0.65rem]">
                    {t.common.soon}
                  </Badge>
                </span>
              </li>
            );
          }

          const active = isNavItemActive(item, pathname);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={navLinkClass({ active })}
              >
                <Icon className="size-4" aria-hidden />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
