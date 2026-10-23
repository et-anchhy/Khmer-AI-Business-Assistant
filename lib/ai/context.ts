import { stockStatus } from "@/features/products/stock";
import { formatMoney, formatNumber } from "@/lib/format/money";
import type { Business } from "@/types/database";
import type { ProductCandidate, RetrievedContext } from "./retrieval";

export type BusinessProfile = Pick<
  Business,
  | "name"
  | "business_type"
  | "description"
  | "phone"
  | "email"
  | "address"
  | "currency"
  | "opening_hours"
  | "delivery_info"
  | "payment_info"
  | "preferred_language"
  | "low_stock_threshold"
>;

export const CONTEXT_LIMITS = {
  description: 400,
  knowledgeEntry: 1200,
  total: 12_000,
} as const;

const NOT_PROVIDED = "not provided";

function clip(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function valueOrMissing(value: string | null | undefined, max = 2000): string {
  return value && value.trim() ? clip(value, max) : NOT_PROVIDED;
}

function stockLabel(product: ProductCandidate, threshold: number): string {
  const status = stockStatus(product.stock_quantity, threshold);
  if (status === "out") return "out of stock";
  if (status === "low") return `low stock (${formatNumber(product.stock_quantity)} left)`;
  return `in stock (${formatNumber(product.stock_quantity)} available)`;
}

function productNames(product: ProductCandidate): string {
  return product.name_km ? `${product.name} / ${product.name_km}` : product.name;
}

/**
 * Turns the business profile and the retrieved records into a compact,
 * plain-text fact sheet for the model. Missing facts are written as
 * "not provided" so the model knows they are unknown rather than guessing.
 */
export function buildBusinessContext(business: BusinessProfile, retrieved: RetrievedContext): string {
  const money = (amount: number) => formatMoney(amount, business.currency);
  const lines: string[] = [];

  lines.push(
    "## Business",
    `Name: ${business.name}`,
    `Type: ${business.business_type.replace(/_/g, " ")}`,
    `About: ${valueOrMissing(business.description)}`,
    `Phone: ${valueOrMissing(business.phone)}`,
    `Email: ${valueOrMissing(business.email)}`,
    `Address: ${valueOrMissing(business.address)}`,
    `Currency: ${business.currency}`,
    `Opening hours: ${valueOrMissing(business.opening_hours)}`,
    "",
    "## Delivery",
    valueOrMissing(business.delivery_info, 4000),
    "",
    "## Payment",
    valueOrMissing(business.payment_info, 4000),
    "",
  );

  if (retrieved.matchedProducts.length > 0) {
    lines.push("## Products matching the question");
    for (const p of retrieved.matchedProducts) {
      const parts = [
        productNames(p),
        p.sku ? `SKU ${p.sku}` : null,
        p.category ? `Category: ${p.category}` : null,
        `Price: ${money(p.price)}`,
        `Stock: ${stockLabel(p, business.low_stock_threshold)}`,
      ].filter(Boolean);
      lines.push(`- ${parts.join(" | ")}`);
      if (p.description) lines.push(`  Description: ${clip(p.description, CONTEXT_LIMITS.description)}`);
      if (p.description_km) lines.push(`  Khmer description: ${clip(p.description_km, CONTEXT_LIMITS.description)}`);
    }
    lines.push("");
  }

  lines.push(`## Product catalogue (${formatNumber(retrieved.catalogTotal)} products for sale)`);
  if (retrieved.catalogTotal === 0) {
    lines.push("No products have been added.");
  } else {
    for (const p of retrieved.catalog) {
      lines.push(`- ${productNames(p)} — ${money(p.price)} — ${stockLabel(p, business.low_stock_threshold)}`);
    }
    if (retrieved.catalog.length < retrieved.catalogTotal) {
      lines.push(
        `(Only ${retrieved.catalog.length} of ${retrieved.catalogTotal} products are listed here. Other products exist; do not claim an unlisted product is unavailable — suggest contacting the business.)`,
      );
    }
  }
  lines.push("");

  lines.push("## Knowledge base");
  if (retrieved.knowledge.length === 0) {
    lines.push("No relevant entries.");
  }
  const header = lines.join("\n");
  const entries: string[] = [];
  let budget = CONTEXT_LIMITS.total - header.length;
  for (const k of retrieved.knowledge) {
    const entry = `### [${k.category.replace(/_/g, " ")}] ${clip(k.title, 300)}\n${clip(k.content, CONTEXT_LIMITS.knowledgeEntry)}\n`;
    if (entry.length > budget) break;
    entries.push(entry);
    budget -= entry.length;
  }

  return [header, ...entries].join("\n").trim();
}
