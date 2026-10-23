"use client";

import { useEffect, useMemo, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveKnowledgeAction } from "@/features/knowledge/actions";
import { KNOWLEDGE_CATEGORIES, KNOWLEDGE_CONTENT_MAX, type KnowledgeCategory } from "@/features/knowledge/constants";
import { createKnowledgeSchema, type KnowledgeFormInput, type KnowledgeFormValues } from "@/features/knowledge/schemas";
import { applyFieldErrors } from "@/lib/forms";
import { formatNumber } from "@/lib/format/money";
import { useI18n } from "@/lib/i18n/client";

export type KnowledgeDialogState =
  | { mode: "create"; category: KnowledgeCategory }
  | { mode: "edit"; entry: { id: string; title: string; content: string; category: KnowledgeCategory } };

export function KnowledgeEntryDialog({ state, onClose }: { state: KnowledgeDialogState | null; onClose: () => void }) {
  const { t } = useI18n();
  const k = t.knowledge;
  const [isPending, startTransition] = useTransition();
  const schema = useMemo(() => createKnowledgeSchema(t.validation), [t]);
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<KnowledgeFormInput, unknown, KnowledgeFormValues>({ resolver: zodResolver(schema) });

  // Load the entry (or a blank one in the chosen category) each time the dialog opens.
  useEffect(() => {
    if (!state) return;
    reset(
      state.mode === "edit"
        ? { title: state.entry.title, content: state.entry.content, category: state.entry.category }
        : { title: "", content: "", category: state.category },
    );
  }, [state, reset]);

  const category = (useWatch({ control, name: "category" }) ?? "faq") as KnowledgeCategory;
  const example = k.examples[category];
  const contentLength = (useWatch({ control, name: "content" }) ?? "").length;

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveKnowledgeAction(values, state?.mode === "edit" ? state.entry.id : undefined);
      if (result.ok) {
        toast.success(result.message);
        onClose();
        return;
      }
      if (!applyFieldErrors(setError, result.fieldErrors)) toast.error(result.error);
    }),
  );

  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{state?.mode === "edit" ? k.dialog.editTitle : k.dialog.createTitle}</DialogTitle>
            <DialogDescription>{k.dialog.description}</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <FormField id="category" label={k.category} error={errors.category?.message}>
              {(fieldProps) => (
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger {...fieldProps} ref={field.ref} onBlur={field.onBlur} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KNOWLEDGE_CATEGORIES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {k.categories[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>
            <TextField
              id="title"
              label={k.fields.title}
              description={category === "faq" ? k.fields.titleHint : undefined}
              placeholder={example.title}
              autoComplete="off"
              error={errors.title?.message}
              {...register("title")}
            />
            <FormField id="content" label={k.fields.content} description={k.fields.contentHint} error={errors.content?.message}>
              {(fieldProps) => (
                <div className="flex flex-col gap-1">
                  <Textarea {...fieldProps} rows={7} placeholder={example.content} className="max-h-80" {...register("content")} />
                  <span className="self-end text-xs text-muted-foreground tabular-nums" aria-hidden>
                    {formatNumber(contentLength)} / {formatNumber(KNOWLEDGE_CONTENT_MAX)}
                  </span>
                </div>
              )}
            </FormField>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t.common.cancel}
            </Button>
            <SubmitButton pending={isPending} disabled={state?.mode === "edit" && !isDirty}>
              {state?.mode === "edit" ? k.dialog.submitUpdate : k.dialog.submitCreate}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
