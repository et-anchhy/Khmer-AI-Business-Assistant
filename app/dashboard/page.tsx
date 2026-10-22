import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { displayNameOf, requireUser } from "@/lib/auth/session";
import { interpolate } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.nav.dashboard };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const { t } = await getI18n();

  return (
    <>
      <PageHeader
        title={interpolate(t.dashboard.welcomeTitle, { name: displayNameOf(user) })}
        description={t.dashboard.welcomeDescription}
      />
      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CircleCheck className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1.5">
            <CardTitle>{t.dashboard.accountReadyTitle}</CardTitle>
            <CardDescription>{t.dashboard.accountReadyDescription}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    </>
  );
}
