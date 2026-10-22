"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Providers({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <I18nProvider locale={locale} dictionary={dictionary}>
      <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      <Toaster position="top-center" richColors closeButton />
    </I18nProvider>
  );
}
