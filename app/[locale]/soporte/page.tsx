import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  ChevronRight,
  Clock,
  DatabaseBackup,
  HelpCircle,
  MessageCircle,
  Phone,
  Timer,
  Zap,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SpecRow } from "@/components/ui/SpecRow";
import { buttonClasses } from "@/components/ui/Button";
import { HelpSearch } from "@/components/HelpSearch";
import { SupportDesk } from "@/components/support/SupportDesk";
import { supportIcons } from "@/components/support/icons";
import { services, getService } from "@/content/services";
import { products } from "@/content/products";
import { extraServiceFaqs } from "@/content/faqs";
import { serviceSla } from "@/content/serviceExtras";
import {
  supportCategories,
  supportCommitments,
  supportCopy,
} from "@/content/support";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { buildHelpIndex } from "@/lib/helpIndex";
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
  const copy = supportCopy[safe];
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: `/${safe}/soporte` },
  };
}

/** Servicios que cubre el soporte técnico (los del grupo "operación"). */
const SUPPORT_SERVICES = [
  "soporte-ti",
  "hosting-mantenimiento",
  "ciberseguridad",
  "cloud-devops",
  "alquiler-equipos",
  "desarrollo-web",
];

/** Fotos que flotan alrededor del titular, como en el soporte de Meta. */
const heroPhotos = [
  { src: "/images/svc-soporte-ti.jpg", className: "left-[3%] top-10 h-40 w-32 -rotate-3" },
  { src: "/images/svc-hosting-mantenimiento.jpg", className: "left-[9%] bottom-6 h-32 w-44 rotate-2" },
  { src: "/images/svc-cloud-devops.jpg", className: "right-[4%] top-14 h-36 w-48 rotate-3" },
  { src: "/images/svc-alquiler-equipos.jpg", className: "right-[10%] bottom-4 h-40 w-32 -rotate-2" },
];

const commitmentIcons = [Timer, Zap, Clock, DatabaseBackup];

/**
 * Centro de soporte técnico, con la estructura del soporte de Meta Quest:
 * titular con buscador y fotos alrededor, "¿Con qué necesitas ayuda?" con
 * pestañas de problemas frecuentes que llevan al formulario de solicitud,
 * compromisos de respuesta, "Explorar por categoría" y "¿Aún necesitas
 * ayuda?".
 */
export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const copy = supportCopy[locale];
  const href = (path: string) => localizedHref(locale, path);
  const whatsappHref = `https://wa.me/${siteConfig.whatsapp}`;

  const commitments = supportCommitments.flatMap(([slug, row], i) => {
    const sla = serviceSla[slug]?.[locale]?.[row];
    const service = getService(slug);
    if (!sla || !service) return [];
    return [
      {
        icon: commitmentIcons[i % commitmentIcons.length],
        value: sla.value,
        label: `${sla.label} · ${service[locale].title}`,
      },
    ];
  });

  const affectedOptions = [
    ...services.map((service) => ({
      value: service[locale].title,
      label: service[locale].title,
      group: copy.form.groupServices,
    })),
    ...products.map((product) => ({
      value: product[locale].title,
      label: product[locale].title,
      group: copy.form.groupProducts,
    })),
  ];

  return (
    <>
      {/* -------- Titular + buscador -------- */}
      <section className="relative overflow-hidden bg-surface px-4 pb-16 pt-32 text-center sm:pb-24 sm:pt-40">
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
          {heroPhotos.map((photo) => (
            <div
              key={photo.src}
              className={`absolute overflow-hidden rounded-3xl shadow-card-hover ${photo.className}`}
            >
              <Image src={photo.src} alt="" fill sizes="12rem" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="relative">
          <h1 className="mx-auto max-w-2xl text-balance text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.08] text-heading">
            {copy.titleLead}{" "}
            <span className="text-accent">{copy.titleHighlight}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted sm:text-lg">
            {copy.subtitle}
          </p>
          <HelpSearch
            entries={buildHelpIndex(locale, { serviceSlugs: SUPPORT_SERVICES })}
            copy={dict.help}
            contactHref="#solicitud"
          />
        </div>
      </section>

      {/* -------- Problemas frecuentes + formulario -------- */}
      <SupportDesk
        locale={locale}
        copy={copy}
        affectedOptions={affectedOptions}
        privacyHref={href("legal/privacidad")}
        privacyLabel={dict.consent.link}
        consentText={dict.consent.text}
      />

      {/* -------- Compromisos de respuesta -------- */}
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <div className="text-center">
            <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-heading">
              {copy.commitmentsTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted">
              {copy.commitmentsSubtitle}
            </p>
          </div>
          <SpecRow items={commitments} className="mt-12" />
          <div className="mt-10 flex justify-center">
            <Link href={href("planes#soporte-ti")} className={buttonClasses("outline", "md")}>
              {dict.footer.supportPlans}
            </Link>
          </div>
        </Container>
      </section>

      {/* -------- Explorar por categoría -------- */}
      <section className="bg-surface-soft py-16 sm:py-24">
        <Container>
          <h2 className="text-center text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-heading">
            {copy.exploreTitle}
          </h2>
          <ul className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supportCategories.map((category) => {
              const service = getService(category.serviceSlug);
              if (!service) return null;
              const Icon = supportIcons[category.icon];
              const faqs = [
                ...service[locale].faqs,
                ...(extraServiceFaqs[category.serviceSlug]?.[locale] ?? []),
              ].slice(0, 3);
              return (
                <li
                  key={category.key}
                  id={`cat-${category.key}`}
                  className="flex scroll-mt-28 flex-col rounded-3xl bg-card p-6"
                >
                  <Icon className="h-6 w-6 text-accent" strokeWidth={1.6} aria-hidden />
                  <h3 className="mt-4 text-lg text-heading">{category[locale].title}</h3>
                  <ul className="mt-3 flex-1 divide-y divide-line">
                    {faqs.map((faq) => (
                      <li key={faq.q}>
                        <details className="group py-3">
                          <summary className="flex cursor-pointer list-none items-start gap-2 text-sm text-heading [&::-webkit-details-marker]:hidden">
                            <HelpCircle
                              className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                              aria-hidden
                            />
                            <span className="group-open:font-semibold">{faq.q}</span>
                          </summary>
                          <p className="mt-2 pl-6 text-sm leading-relaxed text-muted">
                            {faq.a}
                          </p>
                        </details>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={href("preguntas-frecuentes")}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-heading hover:underline"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full ring-1 ring-line-strong">
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </span>
                    {copy.viewAll}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* -------- ¿Aún necesitas ayuda? -------- */}
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <h2 className="text-center text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-heading">
            {copy.stillTitle}
          </h2>
          <div className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3">
            <HelpCard
              icon={MessageCircle}
              title={copy.whatsappTitle}
              text={copy.whatsappDesc}
              action={
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("primary", "md")}
                >
                  {copy.whatsappCta}
                </a>
              }
            />
            <HelpCard
              icon={Phone}
              title={copy.callTitle}
              text={`${siteConfig.phoneDisplay} · ${siteConfig.hours[locale]}`}
              action={
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                  className={buttonClasses("outline", "md")}
                >
                  {copy.callCta}
                </a>
              }
            />
            <HelpCard
              icon={HelpCircle}
              title={copy.helpTitle}
              text={copy.helpDesc}
              action={
                <Link
                  href={href("ayuda")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                  {copy.helpCta}
                </Link>
              }
            />
          </div>
        </Container>
      </section>
    </>
  );
}

function HelpCard({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: typeof Phone;
  title: string;
  text: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-3xl bg-surface-soft p-8">
      <Icon className="h-7 w-7 text-accent" strokeWidth={1.6} aria-hidden />
      <h3 className="mt-6 text-xl text-heading">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-body">{text}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}
