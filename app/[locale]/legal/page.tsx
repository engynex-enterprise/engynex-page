import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { LegalDocCard } from "@/components/legal/LegalDocCard";
import { getLegalDocs, legalUi } from "@/content/legal";
import { formatLegalDate } from "@/lib/legal";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref, siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safe: Locale = isLocale(locale) ? locale : "es";
  const t = legalUi[safe];
  return {
    title: t.hubMetaTitle,
    description: t.hubMetaDescription,
    alternates: { canonical: `/${safe}/legal` },
  };
}

/**
 * Centro legal, inspirado en meta.com/legal: titular grande, una entrada
 * breve y una rejilla de tarjetas grises, una por documento.
 */
export default async function LegalHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = legalUi[locale];
  const docs = getLegalDocs(locale);

  return (
    <section className="bg-surface pb-16 pt-32 sm:pb-24 sm:pt-40">
      <Container>
        <div className="max-w-3xl">
          <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-heading">
            {t.hubTitle}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-body">{t.hubIntro}</p>
          <p className="mt-4 text-sm text-muted">
            {t.lastUpdated}: {formatLegalDate(locale)}
          </p>
        </div>

        <h2 className="sr-only">{t.hubDocsLabel}</h2>
        <ul className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <li key={doc.slug}>
              <LegalDocCard
                href={localizedHref(locale, `legal/${doc.slug}`)}
                title={doc.title}
                summary={doc.summary}
                readLabel={t.read}
              />
            </li>
          ))}
        </ul>

        <div className="mt-16 max-w-3xl border-t border-line pt-8">
          <h2 className="text-xl text-heading">{t.contactTitle}</h2>
          <p className="mt-2 text-base leading-relaxed text-body">
            {t.contactText}{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="font-semibold text-heading underline decoration-line-strong underline-offset-4 hover:decoration-current"
            >
              {siteConfig.email}
            </a>
          </p>
        </div>
      </Container>
    </section>
  );
}
