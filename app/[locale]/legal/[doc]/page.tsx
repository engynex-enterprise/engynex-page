import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { LegalBlocks } from "@/components/legal/LegalBlocks";
import { LegalToc } from "@/components/legal/LegalToc";
import { LegalDocCard } from "@/components/legal/LegalDocCard";
import { getLegalDoc, getLegalDocs, legalSlugs, legalUi } from "@/content/legal";
import { formatLegalDate, lastUpdated } from "@/lib/legal";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref, siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return locales.flatMap((locale) => legalSlugs.map((doc) => ({ locale, doc })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}): Promise<Metadata> {
  const { locale, doc: slug } = await params;
  const safe: Locale = isLocale(locale) ? locale : "es";
  const doc = getLegalDoc(slug, safe);
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.metaDescription,
    alternates: { canonical: `/${safe}/legal/${doc.slug}` },
  };
}

/**
 * Documento legal al estilo de meta.com/legal: titular y fecha, índice fijo
 * a la izquierda en escritorio (desplegable en móvil) y el texto a la derecha
 * con un ancho de lectura cómodo. Al final, los demás documentos y contacto.
 */
export default async function LegalDocPage({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale, doc: slug } = await params;
  if (!isLocale(locale)) notFound();
  const doc = getLegalDoc(slug, locale);
  if (!doc) notFound();
  const t = legalUi[locale];
  const others = getLegalDocs(locale).filter((d) => d.slug !== doc.slug);
  const toc = doc.sections.map(({ id, title }) => ({ id, title }));

  return (
    <>
      <section className="bg-surface pb-16 pt-32 sm:pb-24 sm:pt-40">
        <Container>
          <Link
            href={localizedHref(locale, "legal")}
            className="inline-flex items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-heading"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {t.backToHub}
          </Link>
          <h1 className="mt-4 max-w-4xl text-balance text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.08] text-heading">
            {doc.title}
          </h1>
          <p className="mt-4 text-sm text-muted">
            {t.lastUpdated}:{" "}
            <time dateTime={lastUpdated}>{formatLegalDate(locale)}</time>
          </p>

          <div className="mt-10 grid gap-8 sm:mt-14 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <div>
              <LegalToc items={toc} title={t.onThisPage} label={t.tocLabel} />
            </div>

            <article className="max-w-3xl min-w-0">
              {t.prevailNote && (
                <p className="mb-8 rounded-2xl bg-surface-soft px-5 py-4 text-sm leading-relaxed text-body">
                  {t.prevailNote}
                </p>
              )}
              <div className="text-lg">
                <LegalBlocks blocks={doc.intro} locale={locale} />
              </div>

              {doc.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={`${section.id}-title`}
                  className="mt-12 scroll-mt-28"
                >
                  <h2
                    id={`${section.id}-title`}
                    className="text-[clamp(1.25rem,2vw,1.5rem)] leading-snug text-heading"
                  >
                    {section.title}
                  </h2>
                  <div className="mt-4">
                    <LegalBlocks blocks={section.body} locale={locale} />
                  </div>
                </section>
              ))}
            </article>
          </div>
        </Container>
      </section>

      <section className="bg-surface-soft py-16 sm:py-24">
        <Container>
          <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-heading">
            {t.otherDocs}
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((other) => (
              <li key={other.slug}>
                <LegalDocCard
                  tone="card"
                  href={localizedHref(locale, `legal/${other.slug}`)}
                  title={other.title}
                  summary={other.summary}
                  readLabel={t.read}
                />
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-6 rounded-3xl bg-card p-7 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-xl leading-snug text-heading sm:text-2xl">
                {t.contactTitle}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-body">{t.contactText}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={`mailto:${siteConfig.email}`} className={buttonClasses("dark")}>
                {t.contactEmail}
              </a>
              <a
                href={`https://wa.me/${siteConfig.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("secondary")}
              >
                {t.contactWhatsapp}
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
