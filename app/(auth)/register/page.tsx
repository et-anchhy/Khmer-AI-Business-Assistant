import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.register.submit };
}

export default async function RegisterPage() {
  const { t } = await getI18n();

  return (
    <AuthCard
      title={t.auth.register.title}
      description={t.auth.register.description}
      footer={
        <span>
          {t.auth.register.haveAccount}{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            {t.auth.register.loginLink}
          </Link>
        </span>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
