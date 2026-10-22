"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/form/password-input";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { registerAction } from "@/features/auth/actions";
import { createRegisterSchema, type RegisterInput } from "@/features/auth/schemas";
import { applyFieldErrors } from "@/lib/forms";
import { useI18n } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";

export function RegisterForm() {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);
  const schema = useMemo(() => createRegisterSchema(t.validation), [t]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await registerAction(values);
      if (result.ok) {
        if (result.data.needsEmailConfirmation) setConfirmationSentTo(result.data.email);
        return;
      }
      if (!applyFieldErrors(setError, result.fieldErrors)) toast.error(result.error);
    }),
  );

  if (confirmationSentTo) {
    return (
      <Alert>
        <MailCheck aria-hidden />
        <AlertTitle>{t.auth.register.checkEmailTitle}</AlertTitle>
        <AlertDescription>
          {interpolate(t.auth.register.checkEmailDescription, { email: confirmationSentTo })}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <TextField
          id="fullName"
          label={t.auth.register.fullName}
          autoComplete="name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <TextField
          id="email"
          type="email"
          label={t.auth.register.email}
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          id="password"
          label={t.auth.register.password}
          description={t.auth.register.passwordHint}
          autoComplete="new-password"
          error={errors.password?.message}
          render={(props) => <PasswordInput {...props} />}
          {...register("password")}
        />
        <TextField
          id="confirmPassword"
          label={t.auth.register.confirmPassword}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          render={(props) => <PasswordInput {...props} />}
          {...register("confirmPassword")}
        />
        <SubmitButton pending={isPending} size="lg" className="w-full">
          {t.auth.register.submit}
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
