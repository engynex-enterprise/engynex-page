import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  ArrowRight,
  Share2,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PageHero } from "@/components/sections/PageHero";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/ui/Reveal";
import { Decor } from "@/components/Decor";
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
      accent: "green" as const,
    },
    {
      Icon: Phone,
      label: t.info.phoneLabel,
      value: siteConfig.phoneDisplay,
      href: `tel:${siteConfig.phone.replace(/\s/g, "")}`,
      accent: "blue" as const,
    },
    {
      Icon: MapPin,
      label: t.info.addressLabel,
      value: t.info.address,
      accent: "green" as const,
    },
    {
      Icon: Clock,
      label: t.info.hoursLabel,
      value: siteConfig.hours[locale],
      accent: "blue" as const,
    },
  ];

  const channels = [
    {
      Icon: MessageCircle,
      title: t.channels.whatsapp.title,
      desc: t.channels.whatsapp.desc,
      href: `https://wa.me/${siteConfig.whatsapp}`,
      color: "#25D366",
    },
    {
      Icon: Mail,
      title: t.channels.email.title,
      desc: t.channels.email.desc,
      href: `mailto:${siteConfig.email}`,
      color: "#70c13a",
    },
    {
      Icon: Phone,
      title: t.channels.call.title,
      desc: t.channels.call.desc,
      href: `tel:${siteConfig.phone.replace(/\s/g, "")}`,
      color: "#1e78e0",
    },
    {
      Icon: Share2,
      title: t.channels.social.title,
      desc: t.channels.social.desc,
      href: siteConfig.social.instagram,
      color: "#70c13a",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
      />

      {/* Formulario + info (tarjeta elevada que se superpone al hero) */}
      <div className="relative z-10 -mt-14 pb-6">
        <Container>
          <div className="overflow-hidden rounded-[2rem] border border-navy-900/10 bg-white shadow-2xl shadow-navy-900/10 dark:border-white/10 dark:bg-navy-900">
            <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
              {/* Panel info (oscuro) */}
              <div className="relative overflow-hidden bg-navy-950 p-8 text-ink-200 sm:p-10">
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  <div className="bg-grid absolute inset-0 opacity-30" />
                  <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-brand-green/20 blur-[90px]" />
                  <div className="absolute -bottom-12 -left-10 h-56 w-56 rounded-full bg-brand-blue/20 blur-[90px]" />
                </div>
                <div className="relative">
                  <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                    {dict.common.talkToUs}
                  </h2>
                  <p className="mt-3 max-w-sm text-ink-300">
                    {t.hero.subtitle}
                  </p>

                  <div className="mt-8 space-y-3">
                    {methods.map(({ Icon, label, value, href, accent }) => {
                      const inner = (
                        <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-brand-green/40 hover:bg-white/[0.07]">
                          <span
                            className={
                              accent === "green"
                                ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/20 text-brand-green"
                                : "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue/20 text-brand-blue-light"
                            }
                          >
                            <Icon className="h-5 w-5" strokeWidth={1.75} />
                          </span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                              {label}
                            </p>
                            <p className="mt-1 font-semibold text-white">
                              {value}
                            </p>
                          </div>
                        </div>
                      );
                      return href ? (
                        <a key={label} href={href}>
                          {inner}
                        </a>
                      ) : (
                        <div key={label}>{inner}</div>
                      );
                    })}
                  </div>

                  <ButtonExternal
                    href={`https://wa.me/${siteConfig.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="primary"
                    className="mt-6 w-full"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp
                    <ArrowRight className="h-4 w-4" />
                  </ButtonExternal>

                  <div className="mt-8 border-t border-white/10 pt-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                      {dict.footer.followUs}
                    </p>
                    <div className="mt-3 flex gap-3">
                      {socialLinks.map(({ href, label, Icon }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-ink-200 ring-1 ring-white/10 transition-all hover:bg-brand-green hover:text-navy-950"
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario */}
              <div className="p-6 sm:p-10">
                <div className="mb-6 flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green-dark dark:text-brand-green">
                    <Send className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold text-navy-900 dark:text-white">
                      {t.form.message}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-ink-400">
                      {dict.servicesPage.detail.ctaSubtitle}
                    </p>
                  </div>
                </div>
                <ContactForm locale={locale} form={t.form} variant="plain" />
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Canales de contacto (iconos animados) */}
      <Section tone="light" containerClassName="relative">
        <Decor />
        <div className="relative">
          <SectionHeading
            eyebrow={t.hero.eyebrow}
            title={t.channelsTitle}
            subtitle={t.channelsSubtitle}
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((c, i) => (
              <Reveal key={c.title} delay={(i % 4) * 80}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col items-center rounded-3xl border border-navy-900/10 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl dark:border-white/10 dark:bg-navy-800"
                >
                  <span
                    className="inline-flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:animate-none"
                    style={{
                      backgroundColor: c.color,
                      boxShadow: `0 12px 30px -10px ${c.color}80`,
                    }}
                  >
                    <c.Icon className="h-8 w-8 animate-float" strokeWidth={1.9} />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold text-navy-900 dark:text-white">
                    {c.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-ink-300">
                    {c.desc}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-green-dark transition-colors group-hover:text-brand-blue dark:text-brand-green">
                    {t.channels.action}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Franja de confianza */}
      <Section tone="mesh">
        <div className="grid gap-6 sm:grid-cols-3">
          {dict.trust.slice(0, 3).map((item, i) => (
            <Reveal
              key={item.title}
              delay={(i % 3) * 90}
              className="rounded-3xl border border-navy-900/10 bg-white p-7 text-center shadow-sm dark:border-white/10 dark:bg-navy-800"
            >
              <p className="text-lg font-extrabold text-navy-900 dark:text-white">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-ink-300">
                {item.desc}
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* FAQ de contacto */}
      <Section tone="light" containerClassName="relative">
        <Decor />
        <div className="relative">
          <SectionHeading
            eyebrow="FAQ"
            title={t.faqsTitle}
            subtitle={t.faqsSubtitle}
            className="mb-12"
          />
          <div className="mx-auto max-w-3xl">
            <Accordion items={t.faqs} />
          </div>
        </div>
      </Section>
    </>
  );
}
