"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

/** Friendly fallback for error boundaries. Never shows the raw error to users. */
export function ErrorState({ reset }: { reset: () => void }) {
  const { t } = useI18n();

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-6" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold">{t.common.errorTitle}</h2>
      <p className="text-sm text-muted-foreground">{t.common.errorDescription}</p>
      <Button onClick={reset} className="mt-2">
        {t.common.tryAgain}
      </Button>
    </div>
  );
}
