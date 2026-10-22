"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { logoutAction } from "@/features/auth/actions";
import { useI18n } from "@/lib/i18n/client";

function Submit() {
  const { t } = useI18n();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      {pending ? <Spinner aria-hidden /> : <LogOut aria-hidden />}
      {t.nav.logout}
    </Button>
  );
}

/** Compact log-out button for headers outside the dashboard shell. */
export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <Submit />
    </form>
  );
}
