import "server-only";
import { requireBusiness } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  createConversation,
  deleteConversation,
  getConversation,
  insertExchange,
  listMessages,
  type Message,
} from "@/services/conversations";
import { truncateGraphemes } from "@/utils/text";
import { answerQuestion } from "./answer";
import { createKeywordRetriever } from "./keyword-retriever";
import { createOpenAIProvider } from "./openai-provider";

export class ConversationNotFoundError extends Error {
  constructor() {
    super("Conversation not found");
    this.name = "ConversationNotFoundError";
  }
}

const TITLE_LENGTH = 60;

/**
 * Answers a question for the signed-in owner's business and saves the exchange.
 *
 *  1. Authenticate and authorise (the business must be the caller's own).
 *  2–5. Retrieve the business profile, relevant products and knowledge entries
 *       — only this business's rows, enforced by query scope and RLS.
 *  6–8. Build a concise context, ask the model, return the answer.
 *  9. Save the question and answer (creating the conversation on first use).
 *
 * Nothing is stored if the model fails, so there are no orphaned questions.
 */
export async function generateBusinessAnswer({
  businessId,
  userMessage,
  conversationId,
}: {
  businessId: string;
  userMessage: string;
  conversationId?: string;
}): Promise<{ conversationId: string; messages: Message[] }> {
  const { user, business } = await requireBusiness();
  if (businessId !== business.id) throw new ConversationNotFoundError();

  const supabase = await createClient();
  if (conversationId && !(await getConversation(supabase, business.id, conversationId))) {
    throw new ConversationNotFoundError();
  }
  const history = conversationId ? await listMessages(supabase, business.id, conversationId, 20) : [];

  const askedAt = new Date();
  const { answer } = await answerQuestion({
    business,
    question: userMessage,
    history: history.map((m) => ({ role: m.role, content: m.content })),
    retriever: createKeywordRetriever(supabase, business.id),
    provider: createOpenAIProvider(),
  });

  const isNew = !conversationId;
  const id = conversationId ?? (await createConversation(supabase, business.id, user.id, truncateGraphemes(userMessage, TITLE_LENGTH)));
  try {
    const messages = await insertExchange(
      supabase,
      business.id,
      id,
      { content: userMessage, at: askedAt },
      { content: answer, at: new Date(Math.max(Date.now(), askedAt.getTime() + 1)) },
    );
    return { conversationId: id, messages };
  } catch (error) {
    if (isNew) await deleteConversation(supabase, business.id, id).catch(() => undefined);
    throw error;
  }
}
