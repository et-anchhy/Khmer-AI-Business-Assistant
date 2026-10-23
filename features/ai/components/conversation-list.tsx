"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteConversationAction } from "@/features/ai/actions";
import { formatDate } from "@/lib/format/date";
import { useI18n } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

export type ConversationSummary = { id: string; title: string; updated_at: string };

export function ConversationList({
  conversations,
  onNavigate,
}: {
  conversations: ConversationSummary[];
  onNavigate?: () => void;
}) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [deleting, setDeleting] = useState<ConversationSummary | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Button asChild className="w-full">
        <Link href="/dashboard/ai" onClick={onNavigate}>
          <Plus aria-hidden />
          {t.ai.newChat}
        </Link>
      </Button>
      <h2 className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{t.ai.conversations}</h2>
      {conversations.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">{t.ai.noConversations}</p>
      ) : (
        <ul className="-mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1">
          {conversations.map((conversation) => {
            const href = `/dashboard/ai/${conversation.id}`;
            const active = pathname === href;
            const title = conversation.title || t.ai.newChat;
            return (
              <li key={conversation.id} className="group relative">
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-start gap-2 rounded-lg py-2 pr-9 pl-2 text-sm transition-colors",
                    active ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                  )}
                >
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{title}</span>
                    <span className="block text-xs text-muted-foreground">{formatDate(conversation.updated_at, locale)}</span>
                  </span>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-1.5 right-1 opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      aria-label={interpolate(t.ai.conversationActions, { title })}
                    >
                      <MoreHorizontal aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(conversation)}>
                      <Trash2 aria-hidden />
                      {t.ai.delete.action}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      )}

      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={t.ai.delete.title}
          description={interpolate(t.ai.delete.description, { title: deleting.title || t.ai.newChat })}
          confirmLabel={t.ai.delete.confirm}
          onConfirm={() => deleteConversationAction(deleting.id)}
          onDone={() => {
            if (pathname === `/dashboard/ai/${deleting.id}`) router.push("/dashboard/ai");
          }}
        />
      )}
    </div>
  );
}
