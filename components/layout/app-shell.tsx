"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n/client";
import { SidebarContent, type ShellUser } from "./sidebar-content";

/** Fixed sidebar on desktop; slide-out drawer behind a menu button below `md`. */
export function AppShell({
  user,
  businessName,
  children,
}: {
  user: ShellUser;
  businessName: string | null;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar md:block">
        <SidebarContent user={user} businessName={businessName} />
      </aside>

      <div className="flex min-h-dvh flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={t.common.openMenu}>
                <Menu aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetTitle className="sr-only">{t.nav.mainNavigation}</SheetTitle>
              <SheetDescription className="sr-only">{t.common.appName}</SheetDescription>
              <SidebarContent user={user} businessName={businessName} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="md:hidden" aria-label={t.nav.dashboard}>
            <Logo label={t.common.appShortName} />
          </Link>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
