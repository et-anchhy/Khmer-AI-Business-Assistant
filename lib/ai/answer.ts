import { buildBusinessContext, type BusinessProfile } from "./context";
import { detectLanguage } from "./language";
import { buildInstructions } from "./prompt";
import { AiError, type AiProvider, type ChatTurn } from "./provider";
import type { ContextRetriever, RetrievedContext } from "./retrieval";

export const HISTORY_LIMITS = { turns: 10, charsPerTurn: 1500 } as const;

export function trimHistory(history: ChatTurn[]): ChatTurn[] {
  return history.slice(-HISTORY_LIMITS.turns).map((turn) => ({
    role: turn.role,
    content: turn.content.length > HISTORY_LIMITS.charsPerTurn ? `${turn.content.slice(0, HISTORY_LIMITS.charsPerTurn)}…` : turn.content,
  }));
}

/**
 * The grounded answering pipeline, independent of auth and storage so it can
 * be tested with a fake retriever and provider:
 *   retrieve relevant data → build a concise context → instruct → ask the model.
 */
export async function answerQuestion({
  business,
  question,
  history,
  retriever,
  provider,
}: {
  business: BusinessProfile;
  question: string;
  history: ChatTurn[];
  retriever: ContextRetriever;
  provider: AiProvider;
}): Promise<{ answer: string; retrieved: RetrievedContext; instructions: string }> {
  // Include the previous customer message so follow-ups like "and in white?" still find the product.
  const previousQuestion = [...history].reverse().find((turn) => turn.role === "user")?.content ?? "";
  const retrieved = await retriever.retrieve(`${question}\n${previousQuestion}`);

  const instructions = buildInstructions({
    business,
    context: buildBusinessContext(business, retrieved),
    language: detectLanguage(question),
  });

  const answer = (await provider.complete({
    instructions,
    messages: [...trimHistory(history), { role: "user", content: question }],
  })).trim();

  if (!answer) throw new AiError("failed", "The model returned an empty answer");
  return { answer, retrieved, instructions };
}
