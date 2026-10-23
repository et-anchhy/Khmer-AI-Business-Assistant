import { AiShell } from "@/features/ai/components/ai-shell";
import { requireBusiness } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listConversations } from "@/services/conversations";

export default async function AiLayout({ children }: { children: React.ReactNode }) {
  const { business } = await requireBusiness();
  const conversations = await listConversations(await createClient(), business.id);
  return <AiShell conversations={conversations}>{children}</AiShell>;
}
