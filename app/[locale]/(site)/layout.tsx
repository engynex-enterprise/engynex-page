import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { QuickStart } from "@/components/QuickStart";
import { CookieConsent } from "@/components/CookieConsent";
import { AttributionCapture } from "@/components/AttributionCapture";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { MarketingTags } from "@/components/MarketingTags";
import { FloatingActions } from "@/components/FloatingActions";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { LiveChatWidget } from "@/components/chat/LiveChatWidget";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildMegaMenu } from "@/lib/menu";

/**
 * Marco del sitio público: barra de navegación, footer, fila "Recibe una
 * propuesta", aviso de cookies y las pestañas flotantes. El portal y las
 * páginas de acceso usan sus propios layouts.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <>
      <Navbar
        locale={locale}
        nav={dict.nav}
        themeLabel={dict.common.toggleTheme}
        menu={buildMegaMenu(locale)}
        region={dict.region}
        a11y={dict.a11y}
      />
      <main className="flex-1">{children}</main>
      <AttributionCapture />
      <AnalyticsTracker locale={locale} />
      <MarketingTags />
      <QuickStart
        locale={locale}
        copy={dict.quickStart}
        privacyLabel={dict.consent.link}
      />
      <Footer locale={locale} dict={dict} />
      <CookieConsent
        copy={dict.cookies}
        policyHref={`/${locale}/legal/cookies`}
      />
      <FloatingActions topLabel={dict.common.backToTop} />
      <WhatsAppWidget chat={dict.chat} locale={locale} />
      <LiveChatWidget locale={locale} />
    </>
  );
}
