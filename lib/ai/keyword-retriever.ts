import "server-only";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import { selectRelevant, type ContextRetriever } from "./retrieval";

const MAX_CANDIDATES = 1000;

/**
 * MVP retriever: loads the business's active products and knowledge entries
 * (scoped by business id and by RLS) and ranks them in memory. Fine for
 * small-business catalogues; swap for a vector retriever when catalogues grow.
 */
export function createKeywordRetriever(supabase: ServerSupabaseClient, businessId: string): ContextRetriever {
  return {
    async retrieve(question) {
      const [products, knowledge] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, name_km, description, description_km, sku, category, price, stock_quantity")
          .eq("business_id", businessId)
          .eq("is_active", true)
          .order("name")
          .limit(MAX_CANDIDATES),
        supabase
          .from("knowledge_base")
          .select("id, title, content, category")
          .eq("business_id", businessId)
          .order("updated_at", { ascending: false })
          .limit(MAX_CANDIDATES),
      ]);
      if (products.error) throw products.error;
      if (knowledge.error) throw knowledge.error;
      return selectRelevant(question, products.data, knowledge.data);
    },
  };
}
