import { getPublicEnv } from "@/lib/env";

export const PRODUCT_IMAGES_BUCKET = "product-images";

/** Public URL of a product image stored as "<business_id>/<file>". */
export function productImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${encoded}`;
}
