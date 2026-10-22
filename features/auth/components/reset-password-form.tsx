"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PasswordInput } from "@/components/form/password-input";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { FieldGroup } from "@/components/ui/field";
import { resetPasswordAction } from "@/features/auth/actions";
import { createResetPasswordSchema, type ResetPasswordInput } from "@/features/auth/schemas";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/routes";
import { applyFieldErrors } from "@/lib/forms";
import { useI18n } from "@/lib/i18n/client";

export function ResetPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const schema = useMemo(() => createResetPasswordSchema(t.validation), [t]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await resetPasswordAction(values);
      if (result.ok) {
        toast.success(result.message);
        router.replace(DEFAULT_AUTHENTICATED_PATH);
        return;
      }
      if (!applyFieldErrors(setError, result.fieldErrors)) toast.error(result.error);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <TextField
          id="password"
          label={t.auth.resetPassword.password}
          autoComplete="new-password"
          error={errors.password?.message}
          render={(props) => <PasswordInput {...props} />}
          {...register("password")}
        />
        <TextField
          id="confirmPassword"
          label={t.auth.resetPassword.confirmPassword}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          render={(props) => <PasswordInput {...props} />}
          {...register("confirmPassword")}
        />
        <SubmitButton pending={isPending} size="lg" className="w-full">
          {t.auth.resetPassword.submit}
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
