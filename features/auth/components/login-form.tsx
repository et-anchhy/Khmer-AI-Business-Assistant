"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PasswordInput } from "@/components/form/password-input";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { FieldGroup } from "@/components/ui/field";
import { loginAction } from "@/features/auth/actions";
import { createLoginSchema, type LoginInput } from "@/features/auth/schemas";
import { applyFieldErrors } from "@/lib/forms";
import { useI18n } from "@/lib/i18n/client";

export function LoginForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const schema = useMemo(() => createLoginSchema(t.validation), [t]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await loginAction(values, next);
      if (result.ok) return;
      if (!applyFieldErrors(setError, result.fieldErrors)) toast.error(result.error);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <TextField
          id="email"
          type="email"
          label={t.auth.login.email}
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <div className="flex flex-col gap-2">
          <TextField
            id="password"
            label={t.auth.login.password}
            autoComplete="current-password"
            error={errors.password?.message}
            render={(props) => <PasswordInput {...props} />}
            {...register("password")}
          />
          <Link
            href="/forgot-password"
            className="self-end text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t.auth.login.forgotPassword}
          </Link>
        </div>
        <SubmitButton pending={isPending} size="lg" className="w-full">
          {t.auth.login.submit}
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
