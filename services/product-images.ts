import "server-only";
import { checkProductImage, type ImageCheck } from "@/lib/uploads/image";
import { logger } from "@/lib/logger";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/storage";
import type { ServerSupabaseClient } from "@/lib/supabase/server";

export type UploadResult = { ok: true; path: string } | { ok: false; reason: Extract<ImageCheck, { ok: false }>["reason"] | "uploadFailed" };

/**
 * Validates and stores a product image under "<business_id>/<uuid>.<ext>".
 * The storage RLS policy independently rejects any other folder.
 */
export async function uploadProductImage(
  supabase: ServerSupabaseClient,
  businessId: string,
  file: File,
): Promise<UploadResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkProductImage(bytes);
  if (!check.ok) return check;

  const path = `${businessId}/${crypto.randomUUID()}.${check.extension}`;
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, bytes, {
    contentType: check.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    logger.error("products.image", "Image upload failed", error, { businessId });
    return { ok: false, reason: "uploadFailed" };
  }
  return { ok: true, path };
}

/** Best effort: a leftover file is harmless, so failures are logged, not thrown. */
export async function removeProductImage(supabase: ServerSupabaseClient, path: string | null | undefined) {
  if (!path) return;
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
  if (error) logger.warn("products.image", "Image removal failed", { path, detail: error.message });
}
