/** Values allowed by the database check constraints / enums on `businesses`. */
export const BUSINESS_TYPES = [
  "clothing",
  "online_shop",
  "cafe",
  "restaurant",
  "beauty",
  "electronics",
  "grocery",
  "other",
] as const;

export const CURRENCIES = ["USD", "KHR"] as const;

export const BUSINESS_LANGUAGES = ["km", "en", "km_en"] as const;

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;
export const MAX_LOW_STOCK_THRESHOLD = 100_000;
