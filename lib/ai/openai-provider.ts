import "server-only";
import OpenAI from "openai";
import { isAiConfigured, serverEnv } from "@/lib/env.server";
import { AiError, type AiProvider } from "./provider";

const MAX_OUTPUT_TOKENS = 1200;

/** OpenAI Responses API. The key is read server-side only and never sent to the browser. */
export function createOpenAIProvider(): AiProvider {
  if (!isAiConfigured()) throw new AiError("not_configured", "OPENAI_API_KEY is not set");

  const client = new OpenAI({ apiKey: serverEnv.openaiApiKey, timeout: 45_000, maxRetries: 1 });
  const model = serverEnv.openaiModel;

  return {
    async complete({ instructions, messages }) {
      try {
        const response = await client.responses.create({
          model,
          instructions,
          input: messages.map((m) => ({ role: m.role, content: m.content })),
          max_output_tokens: MAX_OUTPUT_TOKENS,
          store: false,
        });
        return response.output_text;
      } catch (error) {
        if (error instanceof OpenAI.RateLimitError) throw new AiError("rate_limited", "OpenAI rate limit", { cause: error });
        if (error instanceof OpenAI.AuthenticationError || error instanceof OpenAI.PermissionDeniedError) {
          throw new AiError("not_configured", "OpenAI rejected the API key", { cause: error });
        }
        if (
          error instanceof OpenAI.APIConnectionError ||
          error instanceof OpenAI.InternalServerError
        ) {
          throw new AiError("unavailable", "OpenAI is unreachable", { cause: error });
        }
        throw new AiError("failed", "OpenAI request failed", { cause: error });
      }
    },
  };
}
