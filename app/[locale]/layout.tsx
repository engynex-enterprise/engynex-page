import type { Metadata } from "next";
import localFont from "next/font/local";
import { Figtree } from "next/font/google";
import { notFound } from "next/navigation";
import { A11Y_BOOT_SCRIPT } from "@/lib/a11yConfig";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { siteConfig } from "@/lib/site";
import { gtmContainerId, siteVerification } from "@/lib/siteVerification";

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
  const verify = await siteVerification();

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
    // Search Console y Bing Webmaster (se configuran en Integraciones).
    verification: {
      google: verify.google,
      other: verify.bing ? { "msvalidate.01": verify.bing } : undefined,
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
  const gtm = await gtmContainerId();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${figtree.variable} ${opendyslexic.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans antialiased dark:bg-deep-950">
        {/* Google Tag Manager (noscript): solo actúa sin JavaScript. El script
            del <head> lo carga lib/tracking.ts tras aceptar cookies. */}
        {gtm && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        )}
        <script
          dangerouslySetInnerHTML={{ __html: themeScript + A11Y_BOOT_SCRIPT }}
        />
        {children}
      </body>
    </html>
  );
}
