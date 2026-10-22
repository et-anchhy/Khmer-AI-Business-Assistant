import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.resetPassword.title };
}

// Reached from the reset email via /auth/callback, which signs the user in.
export default async function ResetPasswordPage() {
  await requireUser();
  const { t } = await getI18n();

  return (
    <AuthCard title={t.auth.resetPassword.title} description={t.auth.resetPassword.description}>
      <ResetPasswordForm />
    </AuthCard>
  );
}
