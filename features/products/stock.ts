export type StockStatus = "in" | "low" | "out";

/** "low" means at or below the business's low-stock threshold but not sold out. */
export function stockStatus(quantity: number, lowStockThreshold: number): StockStatus {
  if (quantity <= 0) return "out";
  if (quantity <= lowStockThreshold) return "low";
  return "in";
}
