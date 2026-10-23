"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KnowledgeCategory } from "@/features/knowledge/constants";
import { formatDate } from "@/lib/format/date";
import { useI18n } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

export type KnowledgeEntryView = {
  id: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  updated_at: string;
};

export function KnowledgeCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: KnowledgeEntryView;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t, locale } = useI18n();
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  // Only offer "Show more" when the clamped text is actually cut off.
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (el && !expanded) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [entry.content, expanded]);

  return (
    <article className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="secondary">{t.knowledge.categories[entry.category]}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-1" aria-label={interpolate(t.knowledge.rowActions, { title: entry.title })}>
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil aria-hidden />
              {t.common.edit}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 aria-hidden />
              {t.common.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <h2 className="font-medium">
        <button type="button" onClick={onEdit} className="text-left hover:underline">
          {entry.title}
        </button>
      </h2>
      <p ref={contentRef} className={cn("text-sm whitespace-pre-line text-muted-foreground", !expanded && "line-clamp-4")}>
        {entry.content}
      </p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
        <span>{interpolate(t.knowledge.updatedAt, { date: formatDate(entry.updated_at, locale) })}</span>
        {(overflowing || expanded) && (
          <Button variant="link" size="xs" className="h-auto p-0" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
            {expanded ? t.knowledge.showLess : t.knowledge.showMore}
          </Button>
        )}
      </div>
    </article>
  );
}
