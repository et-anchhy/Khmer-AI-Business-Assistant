/** Mirrors the `knowledge_category` enum in the database. */
export const KNOWLEDGE_CATEGORIES = [
  "faq",
  "business_info",
  "delivery_policy",
  "return_policy",
  "payment_info",
  "product_info",
  "other",
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

/** Topics suggested on the empty state — the ones customers ask about most. */
export const STARTER_CATEGORIES: KnowledgeCategory[] = [
  "faq",
  "delivery_policy",
  "payment_info",
  "return_policy",
  "business_info",
];

export const KNOWLEDGE_TITLE_MAX = 300;
export const KNOWLEDGE_CONTENT_MAX = 8000;
