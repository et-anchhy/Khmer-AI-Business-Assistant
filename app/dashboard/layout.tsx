import { AppShell } from "@/components/layout/app-shell";
import { displayNameOf, requireBusiness } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Server-side check in addition to the proxy: never rely on the redirect alone.
  // Users without a business are sent to onboarding.
  const { user, business } = await requireBusiness();

  return (
    <AppShell user={{ name: displayNameOf(user), email: user.email ?? "" }} businessName={business.name}>
      {children}
    </AppShell>
  );
}
