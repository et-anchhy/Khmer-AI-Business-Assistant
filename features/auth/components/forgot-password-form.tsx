"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { forgotPasswordAction } from "@/features/auth/actions";
import { createForgotPasswordSchema, type ForgotPasswordInput } from "@/features/auth/schemas";
import { applyFieldErrors } from "@/lib/forms";
import { useI18n } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const schema = useMemo(() => createForgotPasswordSchema(t.validation), [t]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await forgotPasswordAction(values);
      if (result.ok) {
        setSentTo(values.email.trim());
        return;
      }
      if (!applyFieldErrors(setError, result.fieldErrors)) toast.error(result.error);
    }),
  );

  if (sentTo) {
    return (
      <Alert>
        <MailCheck aria-hidden />
        <AlertTitle>{t.auth.forgotPassword.sentTitle}</AlertTitle>
        <AlertDescription>{interpolate(t.auth.forgotPassword.sentDescription, { email: sentTo })}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <TextField
          id="email"
          type="email"
          label={t.auth.forgotPassword.email}
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <SubmitButton pending={isPending} size="lg" className="w-full">
          {t.auth.forgotPassword.submit}
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
