"use client";

import { ListToolbar } from "@/components/list-toolbar";
import { KNOWLEDGE_CATEGORIES } from "@/features/knowledge/constants";
import { useI18n } from "@/lib/i18n/client";

export function KnowledgeToolbar() {
  const { t } = useI18n();
  const k = t.knowledge;
  return (
    <ListToolbar
      searchPlaceholder={k.searchPlaceholder}
      searchLabel={k.searchLabel}
      filters={[
        {
          key: "category",
          label: k.category,
          allLabel: k.allCategories,
          options: KNOWLEDGE_CATEGORIES.map((value) => ({ value, label: k.categories[value] })),
        },
      ]}
    />
  );
}
