import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatPanel } from "@/features/ai/components/chat-panel";
import { aiAvailability } from "@/features/ai/config";
import { requireBusiness } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { getConversation, listMessages } from "@/services/conversations";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.ai.title };
}

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const { business } = await requireBusiness();
  const { t } = await getI18n();
  const supabase = await createClient();

  // Scoped to the session's business: another business's conversation is "not found".
  const conversation = await getConversation(supabase, business.id, conversationId);
  if (!conversation) notFound();
  const messages = await listMessages(supabase, business.id, conversation.id);

  return (
    <ChatPanel
      key={conversation.id}
      conversationId={conversation.id}
      initialMessages={messages}
      {...aiAvailability(t)}
    />
  );
}
