"use client";

import { useState } from "react";
import { Bot, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectLanguage } from "@/lib/ai/language";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; created_at: string };

export function AssistantAvatar() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
      <Bot className="size-4" />
    </span>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const lang = detectLanguage(message.content) === "km" ? "km" : undefined;

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the text is still selectable.
    }
  }

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && <AssistantAvatar />}
      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser && "items-end")}>
        <span className="sr-only">{isUser ? t.ai.you : t.ai.assistant}:</span>
        <div
          lang={lang}
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap",
            isUser ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted",
          )}
        >
          {message.content}
        </div>
        {!isUser && (
          <Button variant="ghost" size="xs" className="self-start text-muted-foreground" onClick={copy}>
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied ? t.ai.copied : t.ai.copy}
          </Button>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  const { t } = useI18n();
  return (
    <div className="flex gap-3" role="status">
      <AssistantAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
        <span className="sr-only">{t.ai.typing}</span>
      </div>
    </div>
  );
}
