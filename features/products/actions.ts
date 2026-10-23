"use server";

import { revalidatePath } from "next/cache";
import { fail, fieldErrorsFrom, ok, type ActionResult } from "@/lib/action-result";
import { requireBusiness } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { logger } from "@/lib/logger";
import { isUuid } from "@/lib/supabase/filters";
import { createClient } from "@/lib/supabase/server";
import { removeProductImage, uploadProductImage, type UploadResult } from "@/services/product-images";
import {
  adjustProductStock,
  createProduct,
  deleteProduct,
  getProduct,
  toProductRow,
  updateProduct,
} from "@/services/products";
import { createProductSchema, createStockUpdateSchema, type StockUpdateInput } from "./schemas";

const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";

function errorCode(error: unknown): string | undefined {
  return (error as { code?: string } | null)?.code;
}

function revalidateProducts(productId?: string) {
  revalidatePath("/dashboard/products");
  if (productId) revalidatePath(`/dashboard/products/${productId}`);
}

/**
 * Creates or updates a product. Sent as FormData so it can carry the photo:
 *   values      JSON of the form fields (re-validated here)
 *   id          product id when editing
 *   image       optional new photo
 *   removeImage "1" to clear the current photo
 */
export async function saveProductAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const { business } = await requireBusiness();
  const { t } = await getI18n();
  const e = t.products.errors;

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("values") ?? ""));
  } catch {
    return fail(e.saveFailed);
  }
  const parsed = createProductSchema(t.validation).safeParse(raw);
  if (!parsed.success) return fail(e.saveFailed, fieldErrorsFrom(parsed.error));

  const id = formData.get("id");
  const productId = typeof id === "string" && id ? id : null;
  if (productId !== null && !isUuid(productId)) return fail(e.notFound);

  const image = formData.get("image");
  const removeImage = formData.get("removeImage") === "1";
  const supabase = await createClient();

  // Editing: the product must belong to this business.
  const existing = productId ? await getProduct(supabase, business.id, productId) : null;
  if (productId && !existing) return fail(e.notFound);

  let upload: UploadResult | null = null;
  if (image instanceof File && image.size > 0) {
    upload = await uploadProductImage(supabase, business.id, image);
    if (!upload.ok) {
      const message =
        upload.reason === "tooLarge" ? e.imageTooLarge : upload.reason === "uploadFailed" ? e.imageUploadFailed : e.imageUnsupported;
      return fail(message, { image: message });
    }
  }
  const newImagePath = upload?.ok ? upload.path : null;

  try {
    if (!existing) {
      const created = await createProduct(supabase, business.id, parsed.data, newImagePath);
      revalidateProducts();
      return ok(created, t.products.created);
    }

    const imagePath = newImagePath ?? (removeImage ? null : existing.image_path);
    const updated = await updateProduct(supabase, business.id, existing.id, {
      ...toProductRow(parsed.data),
      image_path: imagePath,
    });
    if (!updated) {
      await removeProductImage(supabase, newImagePath);
      return fail(e.notFound);
    }
    if (existing.image_path && existing.image_path !== imagePath) {
      await removeProductImage(supabase, existing.image_path);
    }
    revalidateProducts(existing.id);
    return ok({ id: existing.id }, t.products.updated);
  } catch (error) {
    await removeProductImage(supabase, newImagePath);
    if (errorCode(error) === UNIQUE_VIOLATION) return fail(e.skuTaken, { sku: e.skuTaken });
    logger.error("products.save", "Failed to save product", error, { businessId: business.id, productId });
    return fail(e.saveFailed);
  }
}

export async function updateStockAction(
  productId: string,
  input: StockUpdateInput,
): Promise<ActionResult<{ stockQuantity: number }>> {
  const { business } = await requireBusiness();
  const { t } = await getI18n();
  const e = t.products.errors;

  const parsed = createStockUpdateSchema(t.validation).safeParse(input);
  if (!parsed.success) return fail(e.stockFailed, fieldErrorsFrom(parsed.error));

  const supabase = await createClient();
  const product = await getProduct(supabase, business.id, productId);
  if (!product) return fail(e.notFound);

  try {
    let stockQuantity: number;
    if (parsed.data.mode === "add") {
      stockQuantity = await adjustProductStock(supabase, product.id, parsed.data.amount);
    } else {
      const updated = await updateProduct(supabase, business.id, product.id, { stock_quantity: parsed.data.amount });
      if (!updated) return fail(e.notFound);
      stockQuantity = parsed.data.amount;
    }
    revalidateProducts(product.id);
    return ok({ stockQuantity }, t.products.stock.updated);
  } catch (error) {
    // The database CHECK constraint is the final guard against negative stock.
    if (errorCode(error) === CHECK_VIOLATION) return fail(e.stockBelowZero, { amount: e.stockBelowZero });
    logger.error("products.stock", "Failed to update stock", error, { businessId: business.id, productId });
    return fail(e.stockFailed);
  }
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const { t } = await getI18n();
  const e = t.products.errors;

  const supabase = await createClient();
  const product = await getProduct(supabase, business.id, productId);
  if (!product) return fail(e.notFound);

  try {
    const deleted = await deleteProduct(supabase, business.id, product.id);
    if (!deleted) return fail(e.notFound);
  } catch (error) {
    logger.error("products.delete", "Failed to delete product", error, { businessId: business.id, productId });
    return fail(e.deleteFailed);
  }

  await removeProductImage(supabase, product.image_path);
  revalidateProducts();
  return ok(undefined, t.products.delete.deleted);
}
