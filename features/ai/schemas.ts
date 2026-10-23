import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export const MESSAGE_MAX = 2000;

export function createSendMessageSchema(v: Dictionary["validation"]) {
  return z.object({
    message: z.string().trim().min(1, { error: v.messageRequired }).max(MESSAGE_MAX, { error: v.messageTooLong }),
    conversationId: z.uuid().optional(),
  });
}

export type SendMessageInput = z.input<ReturnType<typeof createSendMessageSchema>>;
