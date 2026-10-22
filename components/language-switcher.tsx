"use client";

import { useTransition } from "react";
import { Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocaleAction } from "@/features/i18n/actions";
import { useI18n } from "@/lib/i18n/client";
import { localeNames, locales } from "@/lib/i18n/config";

export function LanguageSwitcher({ align = "end" }: { align?: "start" | "end" }) {
  const { locale, t } = useI18n();
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending} aria-label={t.common.language}>
          <Languages aria-hidden />
          {localeNames[locale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-36">
        <DropdownMenuLabel>{t.common.language}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((code) => (
          <DropdownMenuItem
            key={code}
            lang={code}
            onSelect={() => startTransition(() => setLocaleAction(code))}
          >
            <span className="flex-1">{localeNames[code]}</span>
            {code === locale && <Check aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
