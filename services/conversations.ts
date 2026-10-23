import "server-only";
import { isUuid } from "@/lib/supabase/filters";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Conversation = Pick<Tables<"conversations">, "id" | "title" | "updated_at">;
export type Message = Pick<Tables<"messages">, "id" | "role" | "content" | "created_at">;

export async function listConversations(supabase: ServerSupabaseClient, businessId: string, limit = 50): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getConversation(
  supabase: ServerSupabaseClient,
  businessId: string,
  id: string,
): Promise<Conversation | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("business_id", businessId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Messages in order; ties (same timestamp) put the question before the answer. */
export async function listMessages(
  supabase: ServerSupabaseClient,
  businessId: string,
  conversationId: string,
  limit = 200,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("business_id", businessId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .order("role", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.reverse();
}

export async function createConversation(
  supabase: ServerSupabaseClient,
  businessId: string,
  userId: string,
  title: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ business_id: businessId, created_by: userId, title })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function insertExchange(
  supabase: ServerSupabaseClient,
  businessId: string,
  conversationId: string,
  question: { content: string; at: Date },
  answer: { content: string; at: Date },
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .insert([
      { business_id: businessId, conversation_id: conversationId, role: "user", content: question.content, created_at: question.at.toISOString() },
      { business_id: businessId, conversation_id: conversationId, role: "assistant", content: answer.content, created_at: answer.at.toISOString() },
    ])
    .select("id, role, content, created_at");
  if (error) throw error;
  return data.sort((a, b) => (a.role === b.role ? 0 : a.role === "user" ? -1 : 1));
}

export async function deleteConversation(supabase: ServerSupabaseClient, businessId: string, id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const { data, error } = await supabase
    .from("conversations")
    .delete()
    .eq("business_id", businessId)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}
