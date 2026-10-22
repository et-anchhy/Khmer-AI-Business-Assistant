import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { BusinessForm } from "@/features/business/components/business-form";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/features/business/constants";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/routes";
import { getCurrentBusiness, requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.business.onboarding.title };
}

export default async function OnboardingPage() {
  const user = await requireUser();
  if (await getCurrentBusiness()) redirect(DEFAULT_AUTHENTICATED_PATH);
  const { t, locale } = await getI18n();

  return (
    <>
      <PageHeader title={t.business.onboarding.title} description={t.business.onboarding.description} />
      <BusinessForm
        mode="create"
        defaultValues={{
          name: "",
          description: "",
          phone: "",
          email: user.email ?? "",
          address: "",
          openingHours: "",
          deliveryInfo: "",
          paymentInfo: "",
          currency: "USD",
          preferredLanguage: locale === "km" ? "km" : "km_en",
          lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
        }}
      />
    </>
  );
}
