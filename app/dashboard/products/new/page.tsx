import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/features/products/components/product-form";
import { requireBusiness } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { listProductCategories } from "@/services/products";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.products.newTitle };
}

export default async function NewProductPage() {
  const { business } = await requireBusiness();
  const { t } = await getI18n();
  const categories = await listProductCategories(await createClient(), business.id);

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/dashboard/products">
          <ArrowLeft aria-hidden />
          {t.products.title}
        </Link>
      </Button>
      <PageHeader title={t.products.newTitle} description={t.products.newDescription} />
      <ProductForm
        defaultValues={{
          name: "",
          nameKm: "",
          description: "",
          descriptionKm: "",
          sku: "",
          category: "",
          price: "",
          stockQuantity: "0",
          isActive: true,
        }}
        imageUrl={null}
        currency={business.currency}
        categories={categories}
      />
    </div>
  );
}
