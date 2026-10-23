import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/format";

type V = Dictionary["validation"];

export const MAX_PRICE = 99_999_999.99;
export const MAX_STOCK = 1_000_000_000;

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

function optionalText(v: V, max: number) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (value ?? "").trim())
    .pipe(z.string().max(max, { error: interpolate(v.tooLong, { max }) }))
    .transform((value) => (value === "" ? null : value));
}

function price(v: V) {
  return z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: v.priceInvalid })
      .min(0, { error: v.priceInvalid })
      .max(MAX_PRICE, { error: v.priceTooLarge })
      .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, { error: v.priceDecimals }),
  );
}

export function stockQuantity(v: V) {
  return z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: v.stockWholeNumber })
      .int({ error: v.stockWholeNumber })
      .min(0, { error: v.stockNegative })
      .max(MAX_STOCK, { error: v.stockTooLarge }),
  );
}

export function createProductSchema(v: V) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { error: v.productNameRequired })
      .max(200, { error: interpolate(v.tooLong, { max: 200 }) }),
    nameKm: optionalText(v, 200),
    description: optionalText(v, 4000),
    descriptionKm: optionalText(v, 4000),
    sku: optionalText(v, 64),
    category: optionalText(v, 80),
    price: price(v),
    stockQuantity: stockQuantity(v),
    isActive: z.boolean(),
  });
}

export type ProductSchema = ReturnType<typeof createProductSchema>;
export type ProductFormInput = z.input<ProductSchema>;
export type ProductFormValues = z.output<ProductSchema>;

export function createStockUpdateSchema(v: V) {
  return z.discriminatedUnion("mode", [
    z.object({
      mode: z.literal("add"),
      amount: z.preprocess(
        emptyToUndefined,
        z.coerce
          .number({ error: v.stockChangeInvalid })
          .int({ error: v.stockChangeInvalid })
          .min(-MAX_STOCK, { error: v.stockChangeInvalid })
          .max(MAX_STOCK, { error: v.stockChangeInvalid })
          .refine((n) => n !== 0, { error: v.stockChangeInvalid }),
      ),
    }),
    z.object({ mode: z.literal("set"), amount: stockQuantity(v) }),
  ]);
}

export type StockUpdateInput = z.input<ReturnType<typeof createStockUpdateSchema>>;

/** List filters come from the URL; anything invalid falls back to "no filter". */
export const productFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().trim().max(80).optional().catch(undefined),
  stock: z.enum(["in", "low", "out"]).optional().catch(undefined),
  status: z.enum(["active", "inactive"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1).default(1),
});

export type ProductFilters = z.output<typeof productFiltersSchema>;
