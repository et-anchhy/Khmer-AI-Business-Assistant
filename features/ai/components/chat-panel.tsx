"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowUp, MessageCircleQuestion, Settings2 } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessageAction } from "@/features/ai/actions";
import { MESSAGE_MAX } from "@/features/ai/schemas";
import { useI18n } from "@/lib/i18n/client";
import { MessageBubble, TypingIndicator, type ChatMessage } from "./message-bubble";

export function ChatPanel({
  conversationId,
  initialMessages,
  configured,
  notConfiguredHint,
}: {
  conversationId?: string;
  initialMessages: ChatMessage[];
  configured: boolean;
  notConfiguredHint: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<{ message: string; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const localId = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isPending, error]);

  function send(raw: string) {
    const text = raw.trim();
    if (!text || isPending || !configured) return;
    setError(null);
    setInput("");
    // Show the question immediately; it is saved together with the answer.
    localId.current += 1;
    const optimistic: ChatMessage = { id: `local-${localId.current}`, role: "user", content: text, created_at: "" };
    setMessages((current) => [...current, optimistic]);

    startTransition(async () => {
      const result = await sendMessageAction({ message: text, conversationId });
      if (!result.ok) {
        setMessages((current) => current.filter((m) => m.id !== optimistic.id));
        setInput(text);
        setError({ message: result.error, text });
        return;
      }
      setMessages((current) => [...current.filter((m) => m.id !== optimistic.id), ...result.data.messages]);
      if (!conversationId) router.replace(`/dashboard/ai/${result.data.conversationId}`, { scroll: false });
      inputRef.current?.focus();
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(input);
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card" aria-label={t.ai.title}>
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6" aria-live="polite">
        {!configured && (
          <Alert className="mx-auto mb-6 max-w-2xl">
            <Settings2 aria-hidden />
            <AlertTitle>{t.ai.notConfigured.title}</AlertTitle>
            <AlertDescription>{notConfiguredHint}</AlertDescription>
          </Alert>
        )}

        {messages.length === 0 && !isPending ? (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircleQuestion className="size-6" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold">{t.ai.emptyTitle}</h2>
            <p className="text-sm text-muted-foreground">{t.ai.emptyDescription}</p>
            <div className="mt-2 grid w-full gap-2 sm:grid-cols-2">
              {t.ai.suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  className="h-auto justify-start py-2.5 text-left whitespace-normal"
                  disabled={!configured}
                  onClick={() => send(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isPending && <TypingIndicator />}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mx-auto mt-5 max-w-3xl">
            <AlertCircle aria-hidden />
            <AlertDescription>{error.message}</AlertDescription>
            <AlertAction>
              <Button size="sm" variant="outline" onClick={() => send(error.text)} disabled={isPending}>
                {t.ai.errors.retry}
              </Button>
            </AlertAction>
          </Alert>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="border-t bg-background/60 p-3 sm:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.ai.placeholder}
            aria-label={t.ai.inputLabel}
            aria-describedby="chat-hint"
            maxLength={MESSAGE_MAX}
            rows={1}
            disabled={!configured}
            className="max-h-40 min-h-10 resize-none bg-background"
          />
          <Button
            type="submit"
            size="icon-lg"
            className="size-10 shrink-0 rounded-full"
            disabled={!configured || isPending || !input.trim()}
            aria-label={t.ai.send}
          >
            <ArrowUp aria-hidden />
          </Button>
        </div>
        <p id="chat-hint" className="mx-auto mt-2 max-w-3xl text-xs text-muted-foreground">
          <span className="hidden sm:inline">{t.ai.sendHint} · </span>
          {t.ai.groundedNote}
        </p>
      </form>
    </section>
  );
}
