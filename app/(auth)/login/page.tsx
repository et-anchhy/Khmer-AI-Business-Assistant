import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeRedirectPath } from "@/lib/auth/routes";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.login.submit };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>;
}) {
  const { t } = await getI18n();
  const { next, notice } = await searchParams;

  return (
    <AuthCard
      title={t.auth.login.title}
      description={t.auth.login.description}
      footer={
        <span>
          {t.auth.login.noAccount}{" "}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            {t.auth.login.registerLink}
          </Link>
        </span>
      }
    >
      {notice === "link-invalid" && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertDescription>{t.auth.notices.linkInvalid}</AlertDescription>
        </Alert>
      )}
      {notice === "signed-out" && (
        <Alert>
          <Info aria-hidden />
          <AlertDescription>{t.auth.notices.signedOut}</AlertDescription>
        </Alert>
      )}
      <LoginForm next={next ? safeRedirectPath(next) : undefined} />
    </AuthCard>
  );
}
