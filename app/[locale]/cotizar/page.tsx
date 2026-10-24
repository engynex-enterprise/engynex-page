import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Accordion } from "@/components/Accordion";
import { ContactForm } from "@/components/ContactForm";
import { companyB } from "@/content/company-b";
import { services } from "@/content/services";
import { servicePlans, formatCOP, type Plan } from "@/content/pricing";
import { getDictionary } from "@/i18n/dictionaries";
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
  const t = companyB[safe].quote;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: `/${safe}/cotizar` },
  };
}

/** Plan con el precio publicado más bajo de un servicio (si tiene alguno). */
function cheapestPlan(slug: string): (Plan & { price: number }) | undefined {
  return (servicePlans[slug] ?? [])
    .filter((plan): plan is Plan & { price: number } => plan.price !== null)
    .sort((a, b) => a.price - b.price)[0];
}

/**
 * Cotizar: página de conversión enfocada, con la sensación de un flujo de
 * compra de meta.com. Promesa clara arriba, a la izquierda qué pasa después
 * de enviar y a la derecha el formulario; debajo, precios de referencia,
 * dudas sobre pagos y los demás canales.
 */
export default async function QuotePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = companyB[locale].quote;
  const plansCopy = dict.servicesPage.plans;
  const href = (path: string) => localizedHref(locale, path);

  // Las dos promesas de `trust` que aplican a la cotización.
  const promises = dict.trust.slice(0, 2);

  const prices = services.flatMap((service) => {
    const plan = cheapestPlan(service.slug);
    return plan ? [{ service, plan }] : [];
  });

  const channels: {
    icon: LucideIcon;
    title: string;
    text: string;
    href?: string;
    external?: boolean;
  }[] = [
    {
      icon: MessageCircle,
      title: dict.contactPage.channels.whatsapp.title,
      text: dict.contactPage.channels.whatsapp.desc,
      href: `https://wa.me/${siteConfig.whatsapp}`,
      external: true,
    },
    {
      icon: Mail,
      title: dict.contactPage.channels.email.title,
      text: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
    },
    {
      icon: Phone,
      title: dict.contactPage.channels.call.title,
      text: siteConfig.phoneDisplay,
      href: `tel:${siteConfig.phone.replace(/\s/g, "")}`,
    },
    { icon: Clock, title: t.hours, text: siteConfig.hours[locale] },
  ];

  return (
    <>
      {/* -------- Promesa + formulario -------- */}
      <section className="bg-surface pb-16 pt-32 sm:pb-24 sm:pt-40">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-heading">
              {t.hero.eyebrow}
            </p>
            <h1 className="mt-4 text-balance text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.08] text-heading">
              {t.hero.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              {t.hero.subtitle}
            </p>
            <ul className="mt-8 flex flex-wrap justify-center gap-3">
              {promises.map((item) => (
                <li
                  key={item.title}
                  className="inline-flex items-center gap-2 rounded-full bg-surface-soft px-4 py-2 text-sm"
                >
                  <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} aria-hidden />
                  <span className="font-bold text-heading">{item.title}</span>
                  <span className="hidden text-muted sm:inline">· {item.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-10 sm:mt-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            {/* Qué pasa después (en móvil, debajo del formulario) */}
            <div className="order-2 lg:order-1">
              <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-heading">
                {t.afterTitle}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted">
                {t.afterSubtitle}
              </p>
              <ol className="mt-10 grid gap-8">
                {t.steps.map((step, i) => (
                  <li key={step.title} className="flex gap-5">
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-deep-700 text-base font-bold text-white dark:bg-white dark:text-deep-700"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-xl leading-snug text-heading">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-base leading-relaxed text-body">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href={href("nosotros/proceso")}
                className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline"
              >
                <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                {dict.help.more.process}
              </Link>
            </div>

            {/* Formulario */}
            <div id="formulario" className="order-1 scroll-mt-28 lg:order-2">
              <div className="mb-6">
                <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-heading">
                  {t.formTitle}
                </h2>
                <p className="mt-2 text-sm text-muted">{t.formSubtitle}</p>
              </div>
              <ContactForm locale={locale} form={dict.contactPage.form}
              consent={{ ...dict.consent, href: `/${locale}/legal/privacidad` }}
            />
            </div>
          </div>
        </Container>
      </section>

      {/* -------- Precios de referencia -------- */}
      <section className="bg-surface-soft py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
              {t.pricesTitle}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              {t.pricesSubtitle}
            </p>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {prices.map(({ service, plan }) => (
              <li key={service.slug}>
                <Link
                  href={href(`servicios/${service.slug}#planes`)}
                  className="group flex h-full flex-col rounded-3xl bg-card p-6 transition-shadow hover:shadow-card-hover sm:p-8"
                >
                  <span className="text-lg font-bold leading-snug text-heading">
                    {service[locale].title}
                  </span>
                  <span className="mt-1 text-sm text-muted">{plan[locale].name}</span>
                  <span className="mt-auto pt-8 text-sm text-muted">{plansCopy.from}</span>
                  <span className="mt-0.5 text-[1.75rem] font-bold leading-none tracking-[-0.01em] text-heading">
                    {formatCOP(plan.price)}
                    <span className="ml-1 text-sm font-medium tracking-normal text-muted">
                      {plan.billing === "monthly"
                        ? plansCopy.monthly
                        : `· ${plansCopy.once}`}
                    </span>
                  </span>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-heading group-hover:underline">
                    <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                    {t.seePlans}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-muted">
            {plansCopy.note}
          </p>
        </Container>
      </section>

      {/* -------- Dudas sobre pagos -------- */}
      <section className="bg-surface py-16 sm:py-24">
        <Container className="max-w-4xl">
          <h2 className="text-center text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
            {t.faqTitle}
          </h2>
          <Accordion
            items={[...dict.contactPage.faqs.slice(1, 2), ...dict.servicesPage.commonFaqs]}
            defaultOpen={null}
            className="mt-10"
          />
          <p className="mt-8 text-center">
            <Link
              href={href("preguntas-frecuentes")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:underline"
            >
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
              {dict.footer.faqs}
            </Link>
          </p>
        </Container>
      </section>

      {/* -------- Otros canales -------- */}
      <section className="bg-surface-soft py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
              {t.channelsTitle}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              {t.channelsSubtitle}
            </p>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map(({ icon: Icon, title, text, href: target, external }) => {
              const body = (
                <>
                  <Icon className="h-7 w-7 text-accent" strokeWidth={1.75} aria-hidden />
                  <span className="mt-8 block text-xl font-bold text-heading">{title}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-body">{text}</span>
                </>
              );
              const className = "block h-full rounded-3xl bg-card p-8";
              return (
                <li key={title}>
                  {target ? (
                    <a
                      href={target}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={`${className} transition-shadow hover:shadow-card-hover`}
                    >
                      {body}
                    </a>
                  ) : (
                    <div className={className}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Container>
      </section>
    </>
  );
}
