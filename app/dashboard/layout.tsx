import { AppShell } from "@/components/layout/app-shell";
import { displayNameOf, requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Server-side check in addition to the proxy: never rely on the redirect alone.
  const user = await requireUser();

  return (
    <AppShell user={{ name: displayNameOf(user), email: user.email ?? "" }} businessName={null}>
      {children}
    </AppShell>
  );
}
