import type { Metadata } from "next";
import { PaginationNav } from "@/components/pagination-nav";
import { KnowledgeToolbar } from "@/features/knowledge/components/knowledge-toolbar";
import { KnowledgeView } from "@/features/knowledge/components/knowledge-view";
import { knowledgeFiltersSchema } from "@/features/knowledge/schemas";
import { requireBusiness } from "@/lib/auth/session";
import { interpolate } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { listHref } from "@/lib/url";
import { KNOWLEDGE_PAGE_SIZE, listKnowledge } from "@/services/knowledge";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.knowledge.title };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function KnowledgePage({ searchParams }: { searchParams: SearchParams }) {
  const { business } = await requireBusiness();
  const { t } = await getI18n();
  const raw = await searchParams;
  const filters = knowledgeFiltersSchema.parse({ q: raw.q, category: raw.category, page: raw.page });

  const { entries, total } = await listKnowledge(await createClient(), business.id, filters);
  const totalPages = Math.max(1, Math.ceil(total / KNOWLEDGE_PAGE_SIZE));

  return (
    <KnowledgeView
      entries={entries.map(({ id, title, content, category, updated_at }) => ({ id, title, content, category, updated_at }))}
      total={total}
      hasFilters={Boolean(filters.q || filters.category)}
      toolbar={<KnowledgeToolbar />}
      pagination={
        <PaginationNav
          page={filters.page}
          totalPages={totalPages}
          hrefForPage={(page) => listHref("/dashboard/knowledge", { q: filters.q, category: filters.category }, page)}
          labels={{
            previous: t.common.previous,
            next: t.common.next,
            pageOf: interpolate(t.common.pageOf, { page: filters.page, total: totalPages }),
          }}
        />
      }
    />
  );
}
