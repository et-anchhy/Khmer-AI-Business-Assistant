import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/format";
import {
  BUSINESS_LANGUAGES,
  BUSINESS_TYPES,
  CURRENCIES,
  MAX_LOW_STOCK_THRESHOLD,
} from "./constants";

type V = Dictionary["validation"];

// Digits (Latin or Khmer ០-៩), spaces, +, -, parentheses. e.g. "012 345 678", "+855 (0)12-345-678".
const PHONE_PATTERN = /^[+()\-\s0-9០-៩]{6,40}$/;

/**
 * Trims text and stores empty values as null. Accepts null as input too, so
 * the parsed output can be validated again on the server unchanged.
 */
function optionalText(v: V, max: number, extra?: (schema: z.ZodString) => z.ZodType<string, string>) {
  const base = z.string().max(max, { error: interpolate(v.tooLong, { max }) });
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (value ?? "").trim())
    .pipe(z.union([z.literal(""), extra ? extra(base) : base]))
    .transform((value) => (value === "" ? null : value));
}

export function createBusinessSchema(v: V) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { error: v.businessNameRequired })
      .max(120, { error: interpolate(v.tooLong, { max: 120 }) }),
    businessType: z.enum(BUSINESS_TYPES, { error: v.chooseOption }),
    description: optionalText(v, 2000),
    phone: optionalText(v, 40, (s) => s.regex(PHONE_PATTERN, { error: v.phoneInvalid })),
    email: optionalText(v, 254, () => z.email({ error: v.emailInvalid })),
    address: optionalText(v, 500),
    openingHours: optionalText(v, 1000),
    deliveryInfo: optionalText(v, 4000),
    paymentInfo: optionalText(v, 4000),
    currency: z.enum(CURRENCIES, { error: v.chooseOption }),
    preferredLanguage: z.enum(BUSINESS_LANGUAGES, { error: v.chooseOption }),
    // An emptied number input must fail, not silently coerce to 0.
    lowStockThreshold: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce
        .number({ error: v.wholeNumber })
        .int({ error: v.wholeNumber })
        .min(0, { error: v.wholeNumber })
        .max(MAX_LOW_STOCK_THRESHOLD, { error: v.wholeNumber }),
    ),
  });
}

export type BusinessSchema = ReturnType<typeof createBusinessSchema>;
export type BusinessFormInput = z.input<BusinessSchema>;
export type BusinessFormValues = z.output<BusinessSchema>;
