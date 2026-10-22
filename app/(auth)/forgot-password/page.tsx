import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.forgotPassword.title };
}

export default async function ForgotPasswordPage() {
  const { t } = await getI18n();

  return (
    <AuthCard
      title={t.auth.forgotPassword.title}
      description={t.auth.forgotPassword.description}
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline">
          <ArrowLeft className="size-4" aria-hidden />
          {t.auth.forgotPassword.backToLogin}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
