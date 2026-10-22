import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BusinessForm } from "@/features/business/components/business-form";
import { requireBusiness } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { toBusinessFormValues } from "@/services/business";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.business.settings.title };
}

export default async function SettingsPage() {
  const { business } = await requireBusiness();
  const { t } = await getI18n();

  return (
    <div className="max-w-3xl">
      <PageHeader title={t.business.settings.title} description={t.business.settings.description} />
      <BusinessForm mode="edit" defaultValues={toBusinessFormValues(business)} />
    </div>
  );
}
