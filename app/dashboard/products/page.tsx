import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Package, Plus, SearchX } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { PaginationNav } from "@/components/pagination-nav";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProductsTable } from "@/features/products/components/products-table";
import { ProductsToolbar } from "@/features/products/components/products-toolbar";
import { productFiltersSchema } from "@/features/products/schemas";
import { requireBusiness } from "@/lib/auth/session";
import { formatNumber } from "@/lib/format/money";
import { interpolate } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";
import { productImageUrl } from "@/lib/storage";
import { listHref } from "@/lib/url";
import { createClient } from "@/lib/supabase/server";
import {
  countProductsNeedingRestock,
  listProductCategories,
  listProducts,
  PRODUCTS_PAGE_SIZE,
} from "@/services/products";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.products.title };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { business } = await requireBusiness();
  const { t } = await getI18n();
  const raw = await searchParams;
  const filters = productFiltersSchema.parse({
    q: raw.q,
    category: raw.category,
    stock: raw.stock,
    status: raw.status,
    page: raw.page,
  });

  const supabase = await createClient();
  const [{ products, total }, categories, restockCount] = await Promise.all([
    listProducts(supabase, business, filters),
    listProductCategories(supabase, business.id),
    countProductsNeedingRestock(supabase, business),
  ]);

  const hasFilters = Boolean(filters.q || filters.category || filters.stock || filters.status);
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE));
  const hrefForPage = (page: number) =>
    listHref("/dashboard/products", { q: filters.q, category: filters.category, stock: filters.stock, status: filters.status }, page);

  const addButton = (
    <Button asChild>
      <Link href="/dashboard/products/new">
        <Plus aria-hidden />
        {t.products.add}
      </Link>
    </Button>
  );

  // Brand-new business: one clear call to action instead of an empty table.
  if (total === 0 && !hasFilters) {
    return (
      <>
        <PageHeader title={t.products.title} description={t.products.description} />
        <EmptyState icon={Package} title={t.products.empty.title} description={t.products.empty.description} action={addButton} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t.products.title} description={t.products.description} actions={addButton} />

      {restockCount > 0 && filters.stock === undefined && (
        <Alert className="mb-4 border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <AlertTriangle aria-hidden />
          <AlertDescription className="flex flex-wrap items-center gap-x-3 text-inherit">
            {interpolate(t.products.restockAlert, { count: formatNumber(restockCount) })}
            <Link href="/dashboard/products?stock=low" className="font-medium underline underline-offset-4">
              {t.products.restockShow}
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <ProductsToolbar categories={categories} />

      {products.length === 0 ? (
        <EmptyState icon={SearchX} title={t.products.noResults.title} description={t.products.noResults.description} />
      ) : (
        <>
          <p className="mb-2 text-sm text-muted-foreground">
            {interpolate(t.products.totalCount, { count: formatNumber(total) })}
          </p>
          <ProductsTable
            products={products.map((p) => ({ ...p, imageUrl: productImageUrl(p.image_path) }))}
            currency={business.currency}
            lowStockThreshold={business.low_stock_threshold}
          />
        </>
      )}

      <PaginationNav
        page={filters.page}
        totalPages={totalPages}
        hrefForPage={hrefForPage}
        labels={{
          previous: t.common.previous,
          next: t.common.next,
          pageOf: interpolate(t.common.pageOf, { page: filters.page, total: totalPages }),
        }}
      />
    </>
  );
}
