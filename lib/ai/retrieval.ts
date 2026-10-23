import type { Tables } from "@/types/database";
import { rankDocuments } from "./search";

export type ProductCandidate = Pick<
  Tables<"products">,
  "id" | "name" | "name_km" | "description" | "description_km" | "sku" | "category" | "price" | "stock_quantity"
>;
export type KnowledgeCandidate = Pick<Tables<"knowledge_base">, "id" | "title" | "content" | "category">;

export type RetrievedContext = {
  /** Products that match the question, with full details. */
  matchedProducts: ProductCandidate[];
  /** Short catalogue (name, price, stock) so general questions can be answered. */
  catalog: ProductCandidate[];
  /** Number of active products in total, to tell the model if the catalogue is cut short. */
  catalogTotal: number;
  knowledge: KnowledgeCandidate[];
};

/**
 * Anything that can find the business data relevant to a question. The
 * keyword implementation below is the MVP; a vector/semantic retriever can
 * implement the same interface later without touching the rest of the AI flow.
 */
export interface ContextRetriever {
  retrieve(question: string): Promise<RetrievedContext>;
}

export const RETRIEVAL_LIMITS = {
  matchedProducts: 5,
  catalog: 40,
  knowledge: 6,
  fallbackKnowledge: 4,
} as const;

/** Categories useful as background when nothing in the knowledge base matches. */
const FALLBACK_CATEGORIES = new Set(["delivery_policy", "payment_info", "return_policy", "business_info"]);

/** Pure ranking step, shared by every keyword-based retriever and unit-tested directly. */
export function selectRelevant(
  question: string,
  products: ProductCandidate[],
  knowledge: KnowledgeCandidate[],
  limits = RETRIEVAL_LIMITS,
): RetrievedContext {
  const productRanking = rankDocuments(
    question,
    products.map((p) => [
      { text: p.name, weight: 3 },
      { text: p.name_km, weight: 3 },
      { text: p.sku, weight: 4 },
      { text: p.category, weight: 2 },
      { text: p.description, weight: 1 },
      { text: p.description_km, weight: 1 },
    ]),
  );
  const matchedProducts = productRanking.slice(0, limits.matchedProducts).map((r) => products[r.index]!);

  // Catalogue: matched products first, then the rest, up to the limit.
  const matchedIds = new Set(matchedProducts.map((p) => p.id));
  const catalog = [...matchedProducts, ...products.filter((p) => !matchedIds.has(p.id))].slice(0, limits.catalog);

  const knowledgeRanking = rankDocuments(
    question,
    knowledge.map((k) => [
      { text: k.title, weight: 3 },
      { text: k.content, weight: 1 },
    ]),
  );
  let selectedKnowledge = knowledgeRanking.slice(0, limits.knowledge).map((r) => knowledge[r.index]!);
  if (selectedKnowledge.length === 0) {
    selectedKnowledge = knowledge.filter((k) => FALLBACK_CATEGORIES.has(k.category)).slice(0, limits.fallbackKnowledge);
  }

  return { matchedProducts, catalog, catalogTotal: products.length, knowledge: selectedKnowledge };
}
