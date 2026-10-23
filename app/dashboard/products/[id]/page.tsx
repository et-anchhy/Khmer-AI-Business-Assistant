import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ProductDetailActions } from "@/features/products/components/product-detail-actions";
import { ProductForm } from "@/features/products/components/product-form";
import { requireBusiness } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { productImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { getProduct, listProductCategories } from "@/services/products";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.products.editTitle };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await requireBusiness();
  const { t, locale } = await getI18n();
  const supabase = await createClient();

  // Scoped to the session's business: another business's id is simply "not found".
  const [product, categories] = await Promise.all([
    getProduct(supabase, business.id, id),
    listProductCategories(supabase, business.id),
  ]);
  if (!product) notFound();

  const displayName = locale === "km" && product.name_km ? product.name_km : product.name;

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/dashboard/products">
          <ArrowLeft aria-hidden />
          {t.products.title}
        </Link>
      </Button>
      <PageHeader
        title={displayName}
        description={t.products.editTitle}
        actions={
          <ProductDetailActions product={{ id: product.id, name: displayName, stock_quantity: product.stock_quantity }} />
        }
      />
      <ProductForm
        productId={product.id}
        defaultValues={{
          name: product.name,
          nameKm: product.name_km ?? "",
          description: product.description ?? "",
          descriptionKm: product.description_km ?? "",
          sku: product.sku ?? "",
          category: product.category ?? "",
          price: String(product.price),
          stockQuantity: String(product.stock_quantity),
          isActive: product.is_active,
        }}
        imageUrl={productImageUrl(product.image_path)}
        currency={business.currency}
        categories={categories}
        currentStock={product.stock_quantity}
      />
    </div>
  );
}
