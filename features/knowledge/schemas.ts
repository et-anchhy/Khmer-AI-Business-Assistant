import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/format";
import { KNOWLEDGE_CATEGORIES, KNOWLEDGE_CONTENT_MAX, KNOWLEDGE_TITLE_MAX } from "./constants";

type V = Dictionary["validation"];

export function createKnowledgeSchema(v: V) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, { error: v.titleRequired })
      .max(KNOWLEDGE_TITLE_MAX, { error: interpolate(v.tooLong, { max: KNOWLEDGE_TITLE_MAX }) }),
    content: z
      .string()
      .trim()
      .min(1, { error: v.contentRequired })
      .max(KNOWLEDGE_CONTENT_MAX, { error: interpolate(v.tooLong, { max: KNOWLEDGE_CONTENT_MAX }) }),
    category: z.enum(KNOWLEDGE_CATEGORIES, { error: v.chooseOption }),
  });
}

export type KnowledgeFormInput = z.input<ReturnType<typeof createKnowledgeSchema>>;
export type KnowledgeFormValues = z.output<ReturnType<typeof createKnowledgeSchema>>;

export const knowledgeFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.enum(KNOWLEDGE_CATEGORIES).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1).default(1),
});

export type KnowledgeFilters = z.output<typeof knowledgeFiltersSchema>;
