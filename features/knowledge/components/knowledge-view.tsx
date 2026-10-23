"use client";

import { useState } from "react";
import { BookOpen, Plus, SearchX } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { deleteKnowledgeAction } from "@/features/knowledge/actions";
import { STARTER_CATEGORIES } from "@/features/knowledge/constants";
import { formatNumber } from "@/lib/format/money";
import { useI18n } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";
import { KnowledgeCard, type KnowledgeEntryView } from "./knowledge-card";
import { KnowledgeEntryDialog, type KnowledgeDialogState } from "./knowledge-entry-dialog";

export function KnowledgeView({
  entries,
  total,
  hasFilters,
  toolbar,
  pagination,
}: {
  entries: KnowledgeEntryView[];
  total: number;
  hasFilters: boolean;
  toolbar: React.ReactNode;
  pagination: React.ReactNode;
}) {
  const { t } = useI18n();
  const k = t.knowledge;
  const [dialog, setDialog] = useState<KnowledgeDialogState | null>(null);
  const [deleting, setDeleting] = useState<KnowledgeEntryView | null>(null);

  const addButton = (
    <Button onClick={() => setDialog({ mode: "create", category: "faq" })}>
      <Plus aria-hidden />
      {k.add}
    </Button>
  );
  const isEmpty = total === 0 && !hasFilters;

  return (
    <>
      <PageHeader title={k.title} description={k.description} actions={isEmpty ? undefined : addButton} />

      {isEmpty ? (
        <EmptyState
          icon={BookOpen}
          title={k.empty.title}
          description={k.empty.description}
          action={
            <div className="flex flex-col items-center gap-3">
              {addButton}
              <p className="text-sm text-muted-foreground">{k.startWith}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTER_CATEGORIES.map((category) => (
                  <Button key={category} variant="outline" size="sm" onClick={() => setDialog({ mode: "create", category })}>
                    {k.categories[category]}
                  </Button>
                ))}
              </div>
            </div>
          }
        />
      ) : (
        <>
          {toolbar}
          {entries.length === 0 ? (
            <EmptyState icon={SearchX} title={k.noResults.title} description={k.noResults.description} />
          ) : (
            <>
              <p className="mb-2 text-sm text-muted-foreground">{interpolate(k.totalCount, { count: formatNumber(total) })}</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {entries.map((entry) => (
                  <KnowledgeCard
                    key={entry.id}
                    entry={entry}
                    onEdit={() => setDialog({ mode: "edit", entry })}
                    onDelete={() => setDeleting(entry)}
                  />
                ))}
              </div>
            </>
          )}
          {pagination}
        </>
      )}

      <KnowledgeEntryDialog state={dialog} onClose={() => setDialog(null)} />
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={k.delete.title}
          description={interpolate(k.delete.description, { title: deleting.title })}
          confirmLabel={k.delete.confirm}
          onConfirm={() => deleteKnowledgeAction(deleting.id)}
        />
      )}
    </>
  );
}
