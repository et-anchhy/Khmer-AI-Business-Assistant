/** Must match the `product-images` bucket's file_size_limit in the storage migration. */
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ProductImageType = (typeof PRODUCT_IMAGE_TYPES)[number];
