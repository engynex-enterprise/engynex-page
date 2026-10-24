import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  ArrowRight,
  Share2,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PageHero } from "@/components/sections/PageHero";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/ui/Reveal";
import { Accordion } from "@/components/Accordion";
import { ButtonExternal } from "@/components/ui/Button";
import {
  InstagramIcon,
  FacebookIcon,
  TiktokIcon,
} from "@/components/SocialIcons";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { siteConfig } from "@/lib/site";

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
  const dict = getDictionary(safe);
  return {
    title: dict.nav.contact,
    description: dict.contactPage.hero.subtitle,
    alternates: { canonical: `/${safe}/contacto` },
  };
}

const socialLinks = [
  { href: siteConfig.social.instagram, label: "Instagram", Icon: InstagramIcon },
  { href: siteConfig.social.facebook, label: "Facebook", Icon: FacebookIcon },
  { href: siteConfig.social.tiktok, label: "TikTok", Icon: TiktokIcon },
];

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.contactPage;

  const methods = [
    {
      Icon: Mail,
      label: t.info.emailLabel,
      value: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
    },
    {
      Icon: Phone,
      label: t.info.phoneLabel,
      value: siteConfig.phoneDisplay,
      href: `tel:${siteConfig.phone.replace(/\s/g, "")}`,
    },
    {
      Icon: MapPin,
      label: t.info.addressLabel,
      value: t.info.address,
    },
    {
      Icon: Clock,
      label: t.info.hoursLabel,
      value: siteConfig.hours[locale],
    },
  ];

  const channels = [
    {
      Icon: MessageCircle,
      title: t.channels.whatsapp.title,
      desc: t.channels.whatsapp.desc,
      href: `https://wa.me/${siteConfig.whatsapp}`,
    },
    {
      Icon: Mail,
      title: t.channels.email.title,
      desc: t.channels.email.desc,
      href: `mailto:${siteConfig.email}`,
    },
    {
      Icon: Phone,
      title: t.channels.call.title,
      desc: t.channels.call.desc,
      href: `tel:${siteConfig.phone.replace(/\s/g, "")}`,
    },
    {
      Icon: Share2,
      title: t.channels.social.title,
      desc: t.channels.social.desc,
      href: siteConfig.social.instagram,
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
        image="/images/about-meeting.jpg"
      />

      {/* Información + formulario */}
      <Section tone="light">
        <div className="grid gap-4 lg:grid-cols-[5fr_7fr]">
          {/* Columna de información */}
          <div className="grid content-start gap-4">
            <div className="rounded-3xl bg-surface-soft p-8 sm:p-10">
              <h2 className="text-[clamp(1.75rem,2.8vw,2.25rem)] font-medium leading-tight text-heading">
                {dict.common.talkToUs}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-body">
                {t.hero.subtitle}
              </p>
              <ButtonExternal
                href={`https://wa.me/${siteConfig.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="mt-6"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                WhatsApp
              </ButtonExternal>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {methods.map(({ Icon, label, value, href }) => {
                const inner = (
                  <>
                    <Icon
                      className="h-6 w-6 text-action"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <p className="mt-6 text-sm text-muted">{label}</p>
                    <p className="mt-1 break-words text-base font-medium text-heading">
                      {value}
                    </p>
                  </>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        className="block h-full rounded-3xl bg-surface-soft p-6 transition-colors hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="h-full rounded-3xl bg-surface-soft p-6">
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="rounded-3xl bg-surface-soft p-6">
              <p className="text-sm text-muted">{dict.footer.followUs}</p>
              <div className="mt-3 flex gap-2">
                {socialLinks.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card text-heading transition-colors hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="rounded-3xl bg-surface-soft p-6 sm:p-10">
            <h2 className="text-[clamp(1.75rem,2.8vw,2.25rem)] font-medium leading-tight text-heading">
              {t.form.message}
            </h2>
            <p className="mt-2 text-base text-muted">
              {dict.servicesPage.detail.ctaSubtitle}
            </p>
            <div className="mt-8">
              <ContactForm locale={locale} form={t.form} variant="plain" />
            </div>
          </div>
        </div>
      </Section>

      {/* Canales de contacto */}
      <Section tone="muted">
        <SectionHeading
          eyebrow={t.hero.eyebrow}
          title={t.channelsTitle}
          subtitle={t.channelsSubtitle}
          size="lg"
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c, i) => (
            <Reveal as="li" key={c.title} delay={(i % 4) * 80}>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-3xl bg-card p-8 transition-colors hover:bg-card-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action sm:p-10"
              >
                <c.Icon
                  className="h-7 w-7 text-action"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h3 className="mt-8 text-[1.75rem] font-light leading-tight text-heading">
                  {c.title}
                </h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-body">
                  {c.desc}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  {t.channels.action}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </a>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* Garantías */}
      <TrustStrip items={dict.trust} tone="light" />

      {/* FAQ de contacto */}
      <Section tone="muted" id="faq" className="scroll-mt-24">
        <SectionHeading
          eyebrow="FAQ"
          title={t.faqsTitle}
          subtitle={t.faqsSubtitle}
          size="lg"
          className="mb-12"
        />
        <div className="mx-auto max-w-3xl">
          <Accordion items={t.faqs} />
        </div>
      </Section>
    </>
  );
}
