import type { Metadata, Viewport } from "next";
import { getI18n } from "@/lib/i18n/server";
import { isRtl } from "@/lib/i18n";
import { I18nProvider } from "@/components/i18n-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health Tracker",
  description: "Track weight, injections, blood pressure, medications and how you feel.",
  appleWebApp: { capable: true, title: "Health", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1110" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, dict } = await getI18n();
  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className="h-full antialiased">
      <body className="min-h-full font-sans">
        <I18nProvider locale={locale} dict={dict}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
