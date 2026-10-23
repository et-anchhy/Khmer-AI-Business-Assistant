export type ChatTurn = { role: "user" | "assistant"; content: string };

/** A language model that turns instructions plus a conversation into one reply. */
export interface AiProvider {
  complete(input: { instructions: string; messages: ChatTurn[] }): Promise<string>;
}

export type AiErrorKind = "not_configured" | "rate_limited" | "unavailable" | "failed";

/** Provider failures, classified so the UI can show a helpful message without internals. */
export class AiError extends Error {
  constructor(
    public readonly kind: AiErrorKind,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AiError";
  }
}
