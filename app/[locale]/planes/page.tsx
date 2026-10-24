import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonClasses } from "@/components/ui/Button";
import { PricingTable } from "@/components/PricingTable";
import { Accordion } from "@/components/Accordion";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { CtaBand } from "@/components/sections/CtaBand";
import { PlansChipBar } from "@/components/plans/PlansChipBar";
import { servicePlans, formatCOP, type Plan } from "@/content/pricing";
import { getService, type Service } from "@/content/services";
import { serviceGroups } from "@/content/navigation";
import { extraServiceFaqs } from "@/content/faqs";
import { featuredPlanEntries, getPlansPageCopy } from "@/content/plans-page";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";
import { cn } from "@/lib/utils";

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
  const t = getPlansPageCopy(safe);
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: `/${safe}/planes` },
  };
}

/** Plan con el precio más bajo (ignora los planes a la medida). */
function cheapestPlan(plans: Plan[]): Plan | undefined {
  return plans
    .filter((plan) => plan.price !== null)
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
}

/**
 * Hub de planes y precios, con la estructura de las páginas de tienda y
 * comparación de meta.com: hero centrado con los tres planes más
 * consultados, barra de chips pegada bajo la navegación, una sección por
 * servicio con sus planes (agrupados como en el mega menú), una
 * comparación "pago único o suscripción", preguntas frecuentes, garantías y
 * cierre.
 *
 * Cada servicio con planes tiene su ancla `#<slug>`; los grupos usan
 * `#construir`, `#crecer` y `#operar`.
 */
export default async function PlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = getPlansPageCopy(locale);
  const plansT = dict.servicesPage.plans;
  const href = (path: string) => localizedHref(locale, path);
  const quoteHref = href("cotizar");

  // -------- Accesos destacados del hero --------
  const featured = featuredPlanEntries.flatMap((entry) => {
    const service = getService(entry.slug);
    const plans = servicePlans[entry.slug];
    if (!service || !plans?.length) return [];
    const plan =
      ("planKey" in entry
        ? plans.find((p) => p.key === entry.planKey)
        : undefined) ?? cheapestPlan(plans);
    return [{ service, plan, label: dict.footer[entry.label] }];
  });

  // -------- Grupos y servicios con planes --------
  const groups = serviceGroups
    .map((group) => ({
      key: group.key,
      id: t.groupAnchors[group.key] ?? group.key,
      title: group[locale].title,
      services: group.slugs
        .map((slug) => getService(slug))
        .filter(
          (service): service is Service =>
            service !== undefined && Boolean(servicePlans[service.slug]?.length),
        ),
    }))
    .filter((group) => group.services.length > 0);

  // Fondos alternos blanco / gris a lo largo de todos los bloques.
  let block = 0;
  const nextTone = () => (block++ % 2 === 0 ? "soft" : "white");
  // Cada grupo ocupa tantos bloques como servicios (cabecera + primer
  // servicio comparten fondo); la comparación sigue la alternancia.
  const totalBlocks = groups.reduce((n, group) => n + group.services.length, 0);
  const compareSoft = totalBlocks % 2 === 0;

  // -------- Comparación pago único / suscripción (desarrollo web) --------
  const webPlans = servicePlans["desarrollo-web"] ?? [];
  const monthlyWeb = cheapestPlan(webPlans.filter((p) => p.billing === "monthly"));
  const onceWeb = cheapestPlan(webPlans.filter((p) => p.billing === "once"));
  const webFaqs = extraServiceFaqs["desarrollo-web"]?.[locale].slice(0, 2) ?? [];

  return (
    <>
      {/* -------- Hero -------- */}
      <section className="bg-surface px-4 pb-16 pt-32 sm:pb-20 sm:pt-40">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-accent">{t.hero.eyebrow}</p>
          <h1 className="mt-3 text-balance text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.02em] text-heading">
            {t.hero.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {t.hero.subtitle}
          </p>
        </div>

        <ul
          aria-label={t.hero.featuredLabel}
          className="mx-auto mt-10 grid max-w-5xl gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4"
        >
          {featured.map(({ service, plan, label }) => (
            <li key={service.slug}>
              <a
                href={`#${service.slug}`}
                className="group flex h-full items-center gap-4 rounded-3xl bg-surface-soft p-3 sm:flex-col sm:items-stretch sm:gap-0 sm:p-4 transition-colors hover:bg-card-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-action"
              >
                <span className="relative block aspect-square w-24 shrink-0 overflow-hidden rounded-2xl bg-deep-800 sm:aspect-[16/10] sm:w-auto">
                  <Image
                    src={service.image}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 640px) 96px, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </span>
                <span className="flex flex-1 items-center justify-between gap-3 pr-2 sm:items-end sm:px-2 sm:pb-2 sm:pt-5">
                  <span>
                    <span className="block text-lg font-bold leading-tight text-heading">
                      {label}
                    </span>
                    {plan && plan.price !== null && (
                      <span className="mt-1 block text-sm text-muted">
                        {plansT.from}{" "}
                        <span className="font-semibold text-heading">
                          {formatCOP(plan.price)}
                        </span>{" "}
                        {plan.billing === "monthly" ? plansT.monthly : plansT.once}
                      </span>
                    )}
                  </span>
                  <ArrowRight
                    className="h-5 w-5 shrink-0 text-heading transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* -------- Barra de chips -------- */}
      <PlansChipBar
        label={t.chips.navLabel}
        chips={groups.map((group) => ({ id: group.id, label: group.title }))}
        action={{ label: t.chips.quote, href: quoteHref }}
      />

      {/* Nota de precios, una sola vez para toda la página */}
      <p className="bg-surface px-4 pt-6 text-center text-xs leading-relaxed text-muted">
        {plansT.note}
      </p>

      {/* -------- Planes por grupo y servicio -------- */}
      {groups.map((group) => {
        const headerTone = nextTone();
        return (
          <div key={group.key} id={group.id} className="scroll-mt-32">
            <section
              aria-labelledby={`${group.id}-title`}
              className={cn(
                "pb-4 pt-16 sm:pt-20",
                headerTone === "soft" ? "bg-surface-soft" : "bg-surface",
              )}
            >
              <Container>
                <h2
                  id={`${group.id}-title`}
                  className="text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.1] text-heading"
                >
                  {group.title}
                </h2>
                <p className="mt-3 text-base text-muted">
                  {t.groupCount(group.services.length)}
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {group.services.map((service) => (
                    <li key={service.slug}>
                      <a
                        href={`#${service.slug}`}
                        className={buttonClasses(
                          "outline",
                          "md",
                          "h-9 px-4 font-medium",
                        )}
                      >
                        {service[locale].title}
                      </a>
                    </li>
                  ))}
                </ul>
              </Container>
            </section>

            {group.services.map((service, i) => {
              // El primer servicio comparte fondo con la cabecera del grupo.
              const tone = i === 0 ? headerTone : nextTone();
              const copy = service[locale];
              return (
                <section
                  key={service.slug}
                  id={service.slug}
                  aria-labelledby={`${service.slug}-title`}
                  className={cn(
                    "scroll-mt-32",
                    i === 0 ? "pb-16 pt-12 sm:pb-24" : "py-16 sm:py-24",
                    tone === "soft" ? "bg-surface-soft" : "bg-surface",
                  )}
                >
                  <Container>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div className="max-w-3xl">
                        <h2
                          id={`${service.slug}-title`}
                          className="text-[clamp(1.75rem,2.8vw,2.25rem)] font-bold leading-[1.2] text-heading"
                        >
                          {copy.title}
                        </h2>
                        <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
                          {copy.tagline}
                        </p>
                      </div>
                      <Link
                        href={href(`servicios/${service.slug}`)}
                        className="inline-flex shrink-0 items-center gap-1 self-start rounded-full text-sm font-semibold text-heading underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 focus-visible:ring-offset-2 focus-visible:ring-offset-surface md:self-auto dark:focus-visible:ring-action"
                      >
                        {t.viewService}
                        <span className="sr-only">: {copy.title}</span>
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                    <div className="mt-10">
                      <PricingTable
                        plans={servicePlans[service.slug]}
                        locale={locale}
                        t={plansT}
                        badges={dict.badges}
                        ctaHref={quoteHref}
                        surface={tone === "soft" ? "white" : "soft"}
                        showNote={false}
                      />
                    </div>
                  </Container>
                </section>
              );
            })}
          </div>
        );
      })}

      {/* -------- ¿Pago único o suscripción? -------- */}
      <section
        id="pago-unico-o-suscripcion"
        aria-labelledby="compare-title"
        className={cn(
          "scroll-mt-32 py-16 sm:py-24",
          compareSoft ? "bg-surface-soft" : "bg-surface",
        )}
      >
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-accent">{t.compare.eyebrow}</p>
            <h2
              id="compare-title"
              className="mt-3 text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading"
            >
              {t.compare.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {t.compare.subtitle}
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
            <CompareCard
              title={t.compare.subscription.title}
              planName={monthlyWeb?.[locale].name}
              price={
                monthlyWeb?.price != null
                  ? `${plansT.from} ${formatCOP(monthlyWeb.price)} ${plansT.monthly}`
                  : undefined
              }
              points={t.compare.subscription.points}
              onSoft={compareSoft}
            />
            <CompareCard
              title={t.compare.once.title}
              planName={onceWeb?.[locale].name}
              price={
                onceWeb?.price != null
                  ? `${plansT.from} ${formatCOP(onceWeb.price)} · ${plansT.once}`
                  : undefined
              }
              points={t.compare.once.points}
              note={onceWeb?.[locale].note}
              onSoft={compareSoft}
            />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#desarrollo-web" className={buttonClasses("dark", "md")}>
              {t.compare.seePlans}
            </a>
            <Link
              href={href("servicios/desarrollo-web#faq")}
              className={buttonClasses("secondary", "md")}
            >
              {t.compare.moreQuestions}
            </Link>
          </div>

          {webFaqs.length > 0 && (
            <div className="mx-auto mt-16 max-w-5xl">
              <h3 className="text-xl font-bold text-heading sm:text-2xl">
                {t.compare.faqTitle}
              </h3>
              <Accordion items={webFaqs} defaultOpen={null} className="mt-4" />
            </div>
          )}
        </Container>
      </section>

      {/* -------- Preguntas frecuentes -------- */}
      <section
        id="faq"
        aria-labelledby="faq-title"
        className={cn(
          "scroll-mt-32 py-16 sm:py-24",
          compareSoft ? "bg-surface" : "bg-surface-soft",
        )}
      >
        <Container>
          <SectionHeading
            align="left"
            title={<span id="faq-title">{dict.ui.faqTitle}</span>}
            subtitle={t.faqSubtitle}
            size="lg"
          />
          <Accordion
            items={dict.servicesPage.commonFaqs}
            defaultOpen={null}
            className="mt-10"
          />
        </Container>
      </section>

      <TrustStrip
        items={dict.trust}
        title={t.trustTitle}
        tone={compareSoft ? "muted" : "light"}
      />

      <CtaBand
        locale={locale}
        title={dict.ctaBand.title}
        subtitle={dict.ctaBand.subtitle}
        primaryLabel={dict.ctaBand.primary}
        primaryHref={quoteHref}
        secondaryLabel={dict.ctaBand.secondary}
        secondaryHref={href("portafolio")}
      />
    </>
  );
}

function CompareCard({
  title,
  planName,
  price,
  points,
  note,
  onSoft = false,
}: {
  title: string;
  planName?: string;
  price?: string;
  points: string[];
  note?: string;
  /** La sección es gris: la tarjeta va en blanco. */
  onSoft?: boolean;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-3xl p-8 sm:p-10",
        onSoft ? "bg-card" : "bg-surface-soft",
      )}
    >
      <h3 className="text-2xl font-bold text-heading">{title}</h3>
      {(planName || price) && (
        <p className="mt-2 text-sm text-muted">
          {planName}
          {planName && price ? " · " : ""}
          {price && <span className="font-semibold text-heading">{price}</span>}
        </p>
      )}
      <ul className="mt-8 flex-1 space-y-4">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <Check
              className="mt-0.5 h-5 w-5 shrink-0 text-accent"
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="text-base leading-snug text-body">{point}</span>
          </li>
        ))}
      </ul>
      {note && <p className="mt-8 text-xs text-muted">{note}</p>}
    </article>
  );
}
