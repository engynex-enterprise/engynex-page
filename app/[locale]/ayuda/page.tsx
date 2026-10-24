import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Clock,
  CreditCard,
  Headset,
  Mail,
  MessageCircle,
  Package,
  Phone,
  Rocket,
  Server,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MediaTile } from "@/components/ui/MediaTile";
import { CardRail } from "@/components/ui/CardRail";
import { Accordion } from "@/components/Accordion";
import { HelpSearch, type HelpEntry } from "@/components/HelpSearch";
import { services } from "@/content/services";
import { products } from "@/content/products";
import { extraServiceFaqs } from "@/content/faqs";
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
  const t = getDictionary(safe).help;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: `/${safe}/ayuda` },
  };
}

/** Título de sección centrado, como en meta.com/help. */
function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-heading">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-xl text-base text-muted">{subtitle}</p>
      )}
    </div>
  );
}

/**
 * Centro de ayuda, con la estructura de meta.com/help: bienvenida con
 * buscador, accesos rápidos, tarjetas fotográficas por tema, ayuda por
 * servicio y por producto, preguntas frecuentes por tema, una rejilla de
 * enlaces y los canales de contacto.
 *
 * El buscador recorre todas las preguntas frecuentes del sitio (servicios,
 * productos y generales); cada resultado enlaza a la respuesta en su página.
 */
export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.help;
  const href = (path: string) => localizedHref(locale, path);
  const contactHref = href("contacto");
  const whatsappHref = `https://wa.me/${siteConfig.whatsapp}`;

  // -------- Índice del buscador --------
  const entries: HelpEntry[] = [
    ...services.flatMap((service) =>
      [
        ...service[locale].faqs,
        ...(extraServiceFaqs[service.slug]?.[locale] ?? []),
      ].map((faq) => ({
        ...faq,
        href: href(`servicios/${service.slug}#faq`),
        source: `${t.groupService} · ${service[locale].title}`,
      })),
    ),
    ...products.flatMap((product) =>
      product[locale].faqs.map((faq) => ({
        ...faq,
        href: href(`productos/${product.slug}#faq`),
        source: `${t.groupProduct} · ${product[locale].title}`,
      })),
    ),
    ...dict.servicesPage.commonFaqs.map((faq) => ({
      ...faq,
      href: href("ayuda#pagos"),
      source: `${t.groupGeneral} · ${t.paymentsTitle}`,
    })),
    ...dict.contactPage.faqs.map((faq) => ({
      ...faq,
      href: href("ayuda#antes-de-empezar"),
      source: `${t.groupGeneral} · ${t.projectsTitle}`,
    })),
    ...dict.productsPage.faqs.map((faq) => ({
      ...faq,
      href: href("ayuda#productos"),
      source: `${t.groupGeneral} · ${t.productsFaqTitle}`,
    })),
  ];

  const quick: { label: string; href: string; icon: LucideIcon }[] = [
    { label: t.quick.payments, href: "#pagos", icon: CreditCard },
    { label: t.quick.projects, href: "#antes-de-empezar", icon: Rocket },
    { label: t.quick.support, href: href("servicios/soporte-ti"), icon: Headset },
    {
      label: t.quick.hosting,
      href: href("servicios/hosting-mantenimiento"),
      icon: Server,
    },
    { label: t.quick.products, href: "#productos", icon: Package },
    { label: t.quick.contact, href: contactHref, icon: MessageCircle },
  ];

  const more = [
    { label: t.more.services, href: href("servicios") },
    { label: t.more.products, href: href("productos") },
    { label: t.more.portfolio, href: href("portafolio") },
    { label: t.more.process, href: href("nosotros#proceso") },
    { label: t.more.about, href: href("nosotros") },
    { label: t.more.webPlans, href: href("servicios/desarrollo-web#planes") },
    { label: t.more.rental, href: href("servicios/alquiler-equipos") },
    { label: t.more.quote, href: contactHref },
    { label: t.more.whatsapp, href: whatsappHref, external: true },
  ];

  const faqGroups = [
    { id: "pagos", title: t.paymentsTitle, items: dict.servicesPage.commonFaqs },
    { id: "antes-de-empezar", title: t.projectsTitle, items: dict.contactPage.faqs },
    { id: "productos", title: t.productsFaqTitle, items: dict.productsPage.faqs },
  ];

  return (
    <>
      {/* -------- Bienvenida + buscador -------- */}
      <section className="bg-surface px-4 pb-16 pt-32 text-center sm:pb-24 sm:pt-40">
        <h1 className="mx-auto max-w-3xl text-balance text-[clamp(2rem,4vw,2.75rem)] leading-tight text-heading">
          {t.titleLead}{" "}
          <span className="text-accent">{t.titleHighlight}</span>
        </h1>
        <HelpSearch entries={entries} copy={t} contactHref={contactHref} />
      </section>

      {/* -------- Accesos rápidos y temas -------- */}
      <section className="bg-surface pb-16 sm:pb-24">
        <Container>
          <Heading title={t.supportTitle} subtitle={t.supportSubtitle} />

          <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {quick.map(({ label, href: target, icon: Icon }) => (
              <li key={label}>
                <Link
                  href={target}
                  className="flex h-full flex-col gap-6 rounded-3xl bg-surface-soft p-5 transition-colors hover:bg-card-soft sm:p-6"
                >
                  <Icon className="h-9 w-9 text-accent" strokeWidth={1.6} aria-hidden />
                  <span className="text-lg font-bold leading-tight text-heading">
                    {label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid gap-4">
            <MediaTile
              size="wide"
              image="/images/svc-soporte-ti.jpg"
              title={t.tiles.supportTitle}
              description={t.tiles.supportDesc}
              primary={{
                label: t.tiles.supportPrimary,
                href: href("servicios/soporte-ti#faq"),
              }}
              secondary={{ label: t.tiles.supportSecondary, href: whatsappHref }}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <MediaTile
                image="/images/svc-hosting-mantenimiento.jpg"
                title={t.tiles.hostingTitle}
                description={t.tiles.hostingDesc}
                primary={{
                  label: t.tiles.hostingPrimary,
                  href: href("servicios/hosting-mantenimiento#faq"),
                }}
              />
              <MediaTile
                image="/images/svc-ciberseguridad.jpg"
                title={t.tiles.securityTitle}
                description={t.tiles.securityDesc}
                primary={{
                  label: t.tiles.securityPrimary,
                  href: href("servicios/ciberseguridad#faq"),
                }}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <MediaTile
                image="/images/svc-desarrollo-web.jpg"
                title={t.tiles.plansTitle}
                description={t.tiles.plansDesc}
                primary={{
                  label: t.tiles.plansPrimary,
                  href: href("servicios/desarrollo-web#planes"),
                }}
              />
              <MediaTile
                image="/images/about-meeting.jpg"
                title={t.tiles.processTitle}
                description={t.tiles.processDesc}
                primary={{
                  label: t.tiles.processPrimary,
                  href: href("nosotros#proceso"),
                }}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* -------- Ayuda por servicio -------- */}
      <section className="overflow-hidden bg-surface pb-16 sm:pb-24">
        <Container>
          <Heading title={t.servicesTitle} subtitle={t.servicesSubtitle} />
        </Container>
        <div className="mt-10">
          <CardRail
            label={t.servicesTitle}
            prevLabel={dict.ui.prev}
            nextLabel={dict.ui.next}
            cards={services.map((service) => ({
              key: service.slug,
              title: service[locale].title,
              caption: service[locale].tagline,
              image: service.image,
              href: href(`servicios/${service.slug}#faq`),
            }))}
          />
        </div>
      </section>

      {/* -------- Ayuda por producto -------- */}
      <section className="overflow-hidden bg-surface pb-16 sm:pb-24">
        <Container>
          <Heading title={t.productsTitle} />
        </Container>
        <div className="mt-10">
          <CardRail
            label={t.productsTitle}
            prevLabel={dict.ui.prev}
            nextLabel={dict.ui.next}
            cards={products.map((product) => ({
              key: product.slug,
              title: product[locale].title,
              caption: product[locale].tagline,
              image: product.image,
              href: href(`productos/${product.slug}#faq`),
            }))}
          />
        </div>
      </section>

      {/* -------- Preguntas frecuentes por tema -------- */}
      <section className="bg-surface-soft py-16 sm:py-24">
        <Container>
          <h2 className="text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
            {t.faqTitle}
          </h2>
          <div className="mt-10 grid gap-14">
            {faqGroups.map((group) => (
              <div key={group.id} id={group.id} className="scroll-mt-32">
                <h3 className="text-xl text-heading sm:text-2xl">{group.title}</h3>
                <Accordion
                  items={group.items}
                  defaultOpen={null}
                  className="mt-4"
                />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* -------- Explora más ayuda -------- */}
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <Heading title={t.moreTitle} />
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((item) => {
              const className =
                "flex h-14 items-center justify-between gap-3 rounded-xl border border-line px-5 text-sm font-semibold text-heading transition-colors hover:bg-surface-soft";
              const content = (
                <>
                  {item.label}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                </>
              );
              return (
                <li key={item.label}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={className}
                    >
                      {content}
                    </a>
                  ) : (
                    <Link href={item.href} className={className}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* -------- Canales de contacto -------- */}
      <section className="bg-surface-soft py-16 sm:py-24">
        <Container>
          <Heading title={t.contactTitle} subtitle={t.contactSubtitle} />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ContactCard
              icon={MessageCircle}
              title={t.whatsapp}
              text={t.whatsappDesc}
              href={whatsappHref}
              external
            />
            <ContactCard
              icon={Mail}
              title={t.email}
              text={siteConfig.email}
              href={`mailto:${siteConfig.email}`}
            />
            <ContactCard
              icon={Phone}
              title={t.call}
              text={siteConfig.phoneDisplay}
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
            />
            <ContactCard icon={Clock} title={t.hours} text={siteConfig.hours[locale]} />
          </ul>
        </Container>
      </section>
    </>
  );
}

function ContactCard({
  icon: Icon,
  title,
  text,
  href,
  external = false,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  href?: string;
  external?: boolean;
}) {
  const body = (
    <>
      <Icon className="h-7 w-7 text-accent" strokeWidth={1.75} aria-hidden />
      <span className="mt-8 block text-xl font-bold text-heading">{title}</span>
      <span className="mt-2 block text-sm leading-relaxed text-body">{text}</span>
    </>
  );
  const className = "block h-full rounded-3xl bg-card p-8";
  return (
    <li>
      {href ? (
        <a
          href={href}
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
}
