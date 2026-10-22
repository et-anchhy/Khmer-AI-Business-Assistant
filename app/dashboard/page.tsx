import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { displayNameOf, requireBusiness } from "@/lib/auth/session";
import { interpolate } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.nav.dashboard };
}

export default async function DashboardPage() {
  const { user, business } = await requireBusiness();
  const { t } = await getI18n();

  return (
    <>
      <PageHeader
        title={interpolate(t.dashboard.welcomeTitle, { name: displayNameOf(user) })}
        description={interpolate(t.dashboard.welcomeDescription, { business: business.name })}
      />
      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CircleCheck className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1.5">
            <CardTitle>{t.dashboard.profileReadyTitle}</CardTitle>
            <CardDescription>{t.dashboard.profileReadyDescription}</CardDescription>
          </div>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline">
            <Link href="/dashboard/settings">
              <Settings aria-hidden />
              {t.dashboard.reviewSettings}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
