"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { ConversationNotFoundError, generateBusinessAnswer } from "@/lib/ai/generate-business-answer";
import { AiError } from "@/lib/ai/provider";
import { requireBusiness } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { deleteConversation, type Message } from "@/services/conversations";
import { createSendMessageSchema, type SendMessageInput } from "./schemas";

const PATH = "/dashboard/ai";

export async function sendMessageAction(
  input: SendMessageInput,
): Promise<ActionResult<{ conversationId: string; messages: Message[] }>> {
  const { business } = await requireBusiness();
  const { t } = await getI18n();
  const e = t.ai.errors;

  const parsed = createSendMessageSchema(t.validation).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? e.failed);

  try {
    const result = await generateBusinessAnswer({
      businessId: business.id,
      userMessage: parsed.data.message,
      conversationId: parsed.data.conversationId,
    });
    revalidatePath(PATH, "layout");
    return ok(result);
  } catch (error) {
    if (error instanceof ConversationNotFoundError) return fail(e.notFound);
    if (error instanceof AiError) {
      logger.warn("ai.answer", "AI request failed", { kind: error.kind, businessId: business.id, cause: String(error.cause ?? "") });
      if (error.kind === "not_configured") return fail(e.notConfigured);
      if (error.kind === "rate_limited") return fail(e.rateLimited);
      return fail(e.failed);
    }
    logger.error("ai.answer", "Failed to answer", error, { businessId: business.id });
    return fail(e.failed);
  }
}

export async function deleteConversationAction(id: string): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const { t } = await getI18n();
  try {
    const deleted = await deleteConversation(await createClient(), business.id, id);
    if (!deleted) return fail(t.ai.errors.notFound);
  } catch (error) {
    logger.error("ai.delete", "Failed to delete conversation", error, { businessId: business.id, id });
    return fail(t.ai.errors.deleteFailed);
  }
  revalidatePath(PATH, "layout");
  return ok(undefined, t.ai.delete.deleted);
}
