import "server-only";
import type { ProductFilters, ProductFormValues } from "@/features/products/schemas";
import { ilikeAnyFilter, isUuid } from "@/lib/supabase/filters";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import type { Business, Product, TablesInsert, TablesUpdate } from "@/types/database";

/**
 * Product data access. Every query is scoped to the session's business id
 * *and* runs under RLS — two independent layers of isolation.
 */

export const PRODUCTS_PAGE_SIZE = 20;
const SEARCH_COLUMNS = ["name", "name_km", "sku"] as const;

type BusinessScope = Pick<Business, "id" | "low_stock_threshold">;

export async function listProducts(
  supabase: ServerSupabaseClient,
  business: BusinessScope,
  filters: ProductFilters,
): Promise<{ products: Product[]; total: number }> {
  let query = supabase.from("products").select("*", { count: "exact" }).eq("business_id", business.id);

  if (filters.q) query = query.or(ilikeAnyFilter(SEARCH_COLUMNS, filters.q));
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.status) query = query.eq("is_active", filters.status === "active");
  if (filters.stock === "out") query = query.lte("stock_quantity", 0);
  if (filters.stock === "low") query = query.gt("stock_quantity", 0).lte("stock_quantity", business.low_stock_threshold);
  if (filters.stock === "in") query = query.gt("stock_quantity", business.low_stock_threshold);

  const from = (filters.page - 1) * PRODUCTS_PAGE_SIZE;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .order("id")
    .range(from, from + PRODUCTS_PAGE_SIZE - 1);

  // Asking for a page past the end is not an error; it is just empty.
  if (error && error.code !== "PGRST103") throw error;
  return { products: data ?? [], total: count ?? 0 };
}

/** Active products at or below the low-stock threshold (including sold out). */
export async function countProductsNeedingRestock(supabase: ServerSupabaseClient, business: BusinessScope) {
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("is_active", true)
    .lte("stock_quantity", business.low_stock_threshold);
  if (error) throw error;
  return count ?? 0;
}

export async function listProductCategories(supabase: ServerSupabaseClient, businessId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .eq("business_id", businessId)
    .not("category", "is", null)
    .limit(2000);
  if (error) throw error;
  return [...new Set(data.map((row) => row.category!))].sort((a, b) => a.localeCompare(b));
}

export async function getProduct(
  supabase: ServerSupabaseClient,
  businessId: string,
  productId: string,
): Promise<Product | null> {
  if (!isUuid(productId)) return null;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", productId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Editable product fields. Stock is excluded: after creation it changes only via adjust/set stock. */
export function toProductRow(values: ProductFormValues): TablesUpdate<"products"> {
  return {
    name: values.name,
    name_km: values.nameKm,
    description: values.description,
    description_km: values.descriptionKm,
    sku: values.sku,
    category: values.category,
    price: values.price,
    is_active: values.isActive,
  };
}

export async function createProduct(
  supabase: ServerSupabaseClient,
  businessId: string,
  values: ProductFormValues,
  imagePath: string | null,
): Promise<{ id: string }> {
  const row: TablesInsert<"products"> = {
    ...toProductRow(values),
    name: values.name,
    stock_quantity: values.stockQuantity,
    business_id: businessId,
    image_path: imagePath,
  };
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateProduct(
  supabase: ServerSupabaseClient,
  businessId: string,
  productId: string,
  changes: TablesUpdate<"products">,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .update(changes)
    .eq("business_id", businessId)
    .eq("id", productId)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function deleteProduct(supabase: ServerSupabaseClient, businessId: string, productId: string) {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("business_id", businessId)
    .eq("id", productId)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

/** Atomic `stock = stock + delta` via the database function. Returns the new quantity. */
export async function adjustProductStock(supabase: ServerSupabaseClient, productId: string, delta: number) {
  const { data, error } = await supabase.rpc("adjust_product_stock", { p_product_id: productId, p_delta: delta });
  if (error) throw error;
  return data;
}
