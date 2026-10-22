"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/client";
import { initialsOf } from "@/utils/text";
import { LogoutButton } from "./logout-button";
import { SidebarNav } from "./sidebar-nav";

export type ShellUser = { name: string; email: string };

export function SidebarContent({
  user,
  businessName,
  onNavigate,
}: {
  user: ShellUser;
  businessName: string | null;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <Link href="/dashboard" onClick={onNavigate} className="px-2 pt-1" aria-label={t.nav.dashboard}>
        <Logo label={t.common.appShortName} />
      </Link>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav onNavigate={onNavigate} />
      </div>

      <div className="flex flex-col gap-2">
        <LogoutButton />
        <Separator />
        {businessName && (
          <div className="flex items-center gap-2 px-3 pt-1 text-sm font-medium">
            <Store className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{businessName}</span>
          </div>
        )}
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-sm leading-tight">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
