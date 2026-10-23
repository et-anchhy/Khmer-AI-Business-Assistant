"use client";

import { ListToolbar, type ToolbarFilter } from "@/components/list-toolbar";
import { useI18n } from "@/lib/i18n/client";

export function ProductsToolbar({ categories }: { categories: string[] }) {
  const { t } = useI18n();
  const f = t.products.filters;

  const filters: ToolbarFilter[] = [
    ...(categories.length > 0
      ? [{ key: "category", label: f.category, allLabel: f.allCategories, options: categories.map((c) => ({ value: c, label: c })) }]
      : []),
    {
      key: "stock",
      label: f.stock,
      allLabel: f.allStock,
      options: [
        { value: "in", label: f.in },
        { value: "low", label: f.low },
        { value: "out", label: f.out },
      ],
    },
    {
      key: "status",
      label: f.status,
      allLabel: f.allStatuses,
      options: [
        { value: "active", label: f.active },
        { value: "inactive", label: f.inactive },
      ],
    },
  ];

  return <ListToolbar searchPlaceholder={t.products.searchPlaceholder} searchLabel={t.products.searchLabel} filters={filters} />;
}
