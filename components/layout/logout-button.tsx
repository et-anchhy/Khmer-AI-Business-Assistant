"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { logoutAction } from "@/features/auth/actions";
import { useI18n } from "@/lib/i18n/client";
import { navLinkClass } from "./sidebar-nav";

function LogoutSubmit() {
  const { t } = useI18n();
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={navLinkClass({ active: false })}>
      {pending ? <Spinner className="size-4" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
      <span>{t.nav.logout}</span>
    </button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <LogoutSubmit />
    </form>
  );
}
