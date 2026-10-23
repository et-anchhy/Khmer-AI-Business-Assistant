import type { Metadata } from "next";
import { ChatPanel } from "@/features/ai/components/chat-panel";
import { aiAvailability } from "@/features/ai/config";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.ai.title };
}

export default async function NewChatPage() {
  const { t } = await getI18n();
  return <ChatPanel key="new" initialMessages={[]} {...aiAvailability(t)} />;
}
