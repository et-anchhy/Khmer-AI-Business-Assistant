import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" aria-hidden />
      </span>
      <h1 className="text-lg font-semibold">{t.common.notFoundTitle}</h1>
      <p className="text-sm text-muted-foreground">{t.common.notFoundDescription}</p>
      <Button asChild className="mt-2">
        <Link href="/dashboard">{t.common.backToDashboard}</Link>
      </Button>
    </main>
  );
}
