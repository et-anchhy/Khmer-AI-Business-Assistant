import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { getI18n } from "@/lib/i18n/server";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n();

  return (
    <div className="min-h-dvh bg-muted/40">
      <header className="flex items-center justify-between gap-2 px-4 py-4 sm:px-6">
        <Logo label={t.common.appShortName} />
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 pt-2 pb-12 sm:px-6">{children}</main>
    </div>
  );
}
