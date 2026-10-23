import "server-only";
import type { KnowledgeFilters, KnowledgeFormValues } from "@/features/knowledge/schemas";
import { ilikeAnyFilter } from "@/lib/supabase/filters";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type KnowledgeEntry = Tables<"knowledge_base">;

export const KNOWLEDGE_PAGE_SIZE = 24;
const SEARCH_COLUMNS = ["title", "content"] as const;

/** Scoped to the session's business id and enforced again by RLS. */
export async function listKnowledge(
  supabase: ServerSupabaseClient,
  businessId: string,
  filters: KnowledgeFilters,
): Promise<{ entries: KnowledgeEntry[]; total: number }> {
  let query = supabase.from("knowledge_base").select("*", { count: "exact" }).eq("business_id", businessId);
  if (filters.q) query = query.or(ilikeAnyFilter(SEARCH_COLUMNS, filters.q));
  if (filters.category) query = query.eq("category", filters.category);

  const from = (filters.page - 1) * KNOWLEDGE_PAGE_SIZE;
  const { data, count, error } = await query
    .order("updated_at", { ascending: false })
    .order("id")
    .range(from, from + KNOWLEDGE_PAGE_SIZE - 1);

  if (error && error.code !== "PGRST103") throw error;
  return { entries: data ?? [], total: count ?? 0 };
}

export async function createKnowledgeEntry(supabase: ServerSupabaseClient, businessId: string, values: KnowledgeFormValues) {
  const { data, error } = await supabase
    .from("knowledge_base")
    .insert({ ...values, business_id: businessId })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function updateKnowledgeEntry(
  supabase: ServerSupabaseClient,
  businessId: string,
  id: string,
  values: KnowledgeFormValues,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("knowledge_base")
    .update(values)
    .eq("business_id", businessId)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function deleteKnowledgeEntry(supabase: ServerSupabaseClient, businessId: string, id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("knowledge_base")
    .delete()
    .eq("business_id", businessId)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}
