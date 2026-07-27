import type { Metadata } from "next";
import localFont from "next/font/local";
import { Nunito } from "next/font/google";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { siteConfig } from "@/lib/site";
import { buildMegaMenu } from "@/lib/menu";

// OpenDyslexic — títulos (lectura fácil, autoalojada).
const opendyslexic = localFont({
  src: [
    { path: "../fonts/opendyslexic-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/opendyslexic-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-opendyslexic",
  display: "swap",
});

// Nunito — cuerpo de texto (redondeada y muy legible).
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
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
      className={`${opendyslexic.variable} ${nunito.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans antialiased dark:bg-navy-950">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Navbar
          locale={locale}
          nav={dict.nav}
          themeLabel={dict.common.toggleTheme}
          menu={buildMegaMenu(locale)}
        />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} dict={dict} />
        <FloatingActions topLabel={dict.common.backToTop} />
        <WhatsAppWidget chat={dict.chat} />
      </body>
    </html>
  );
}
