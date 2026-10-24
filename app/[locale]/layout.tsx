import type { Metadata } from "next";
import localFont from "next/font/local";
import { Figtree } from "next/font/google";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { QuickStart } from "@/components/QuickStart";
import { CookieConsent } from "@/components/CookieConsent";
import { A11Y_BOOT_SCRIPT } from "@/lib/a11yConfig";
import { FloatingActions } from "@/components/FloatingActions";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { siteConfig } from "@/lib/site";
import { buildMegaMenu } from "@/lib/menu";

// Figtree — titulares y cuerpo. Es la alternativa libre más cercana a la
// tipografía geométrica-humanista de meta.com (Optimistic, propietaria).
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

// OpenDyslexic — solo se usa si el visitante activa "Fuente para dislexia"
// en el panel de accesibilidad; sin precarga para no pesar en cada visita.
const opendyslexic = localFont({
  src: [
    { path: "../fonts/opendyslexic-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/opendyslexic-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-opendyslexic",
  display: "swap",
  preload: false,
});

// Evita el parpadeo de tema: aplica .dark antes del primer paint.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : "es";
  const dict = getDictionary(safeLocale);

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: dict.meta.titleDefault,
      template: dict.meta.titleTemplate,
    },
    description: dict.meta.description,
    applicationName: siteConfig.name,
    keywords: [
      "desarrollo web",
      "aplicaciones web",
      "apps móviles",
      "e-commerce",
      "marketing digital",
      "producción audiovisual",
      "inteligencia artificial",
      "UX UI",
      "branding",
      "software a la medida",
      "Engynex",
    ],
    alternates: {
      canonical: `/${safeLocale}`,
      languages: {
        es: "/es",
        en: "/en",
      },
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: dict.meta.titleDefault,
      description: dict.meta.description,
      locale: safeLocale === "es" ? "es_CO" : "en_US",
      url: `/${safeLocale}`,
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.titleDefault,
      description: dict.meta.description,
    },
  };
}

export default async function LocaleLayout({
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
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${figtree.variable} ${opendyslexic.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans antialiased dark:bg-deep-950">
        <script
          dangerouslySetInnerHTML={{ __html: themeScript + A11Y_BOOT_SCRIPT }}
        />
        <Navbar
          locale={locale}
          nav={dict.nav}
          themeLabel={dict.common.toggleTheme}
          menu={buildMegaMenu(locale)}
          region={dict.region}
          a11y={dict.a11y}
        />
        <main className="flex-1">{children}</main>
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
      </body>
    </html>
  );
}
