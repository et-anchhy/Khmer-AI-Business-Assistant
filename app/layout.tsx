import type { Metadata, Viewport } from "next";
import { Inter, Kantumruy_Pro } from "next/font/google";
import { Providers } from "@/components/providers";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
// Inter has no Khmer glyphs, so Khmer text falls through to Kantumruy Pro.
const kantumruy = Kantumruy_Pro({ subsets: ["khmer"], variable: "--font-khmer", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t.common.appName, template: `%s · ${t.common.appShortName}` },
    description: t.auth.register.description,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();

  return (
    <html lang={locale} className={cn(inter.variable, kantumruy.variable)}>
      <body className="min-h-dvh">
        <Providers locale={locale} dictionary={t}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
