"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n/client";
import { ConversationList, type ConversationSummary } from "./conversation-list";

/** Conversation history beside the chat on large screens, in a drawer on smaller ones. */
export function AiShell({ conversations, children }: { conversations: ConversationSummary[]; children: React.ReactNode }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    // Fill the viewport below the app header (3.5rem) minus the main padding (2 × 1.5rem).
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-[28rem] flex-col gap-3 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-4">
      <aside className="hidden min-h-0 lg:block">
        <ConversationList conversations={conversations} />
      </aside>
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <h1 className="text-lg font-semibold">{t.ai.title}</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <History aria-hidden />
              {t.ai.history}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-4 pt-12">
            <SheetTitle className="sr-only">{t.ai.conversations}</SheetTitle>
            <SheetDescription className="sr-only">{t.ai.description}</SheetDescription>
            <ConversationList conversations={conversations} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
