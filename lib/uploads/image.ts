import { PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES, type ProductImageType } from "./limits";

export type ImageCheck =
  | { ok: true; type: ProductImageType; extension: "jpg" | "png" | "webp" }
  | { ok: false; reason: "empty" | "tooLarge" | "unsupportedType" };

/**
 * Identifies an image by its first bytes rather than trusting the file name
 * or the browser-supplied MIME type, which an attacker controls.
 */
export function sniffImageType(bytes: Uint8Array): ProductImageType | null {
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // "RIFF" .... "WEBP"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

const EXTENSIONS: Record<ProductImageType, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function checkProductImage(bytes: Uint8Array): ImageCheck {
  if (bytes.byteLength === 0) return { ok: false, reason: "empty" };
  if (bytes.byteLength > PRODUCT_IMAGE_MAX_BYTES) return { ok: false, reason: "tooLarge" };
  const type = sniffImageType(bytes);
  if (!type || !PRODUCT_IMAGE_TYPES.includes(type)) return { ok: false, reason: "unsupportedType" };
  return { ok: true, type, extension: EXTENSIONS[type] };
}
