import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Target,
  Eye,
  Gem,
  ShieldCheck,
  Lightbulb,
  HeartHandshake,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { SplitFeature } from "@/components/ui/SplitFeature";
import { SpecRow } from "@/components/ui/SpecRow";
import { CardRail } from "@/components/ui/CardRail";
import { buttonClasses } from "@/components/ui/Button";
import { PageHero } from "@/components/sections/PageHero";
import { CtaBand } from "@/components/sections/CtaBand";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { Timeline } from "@/components/sections/Timeline";
import { StatsBand } from "@/components/sections/StatsBand";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";

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
    title: dict.nav.about,
    description: dict.aboutPage.hero.subtitle,
    alternates: { canonical: `/${safe}/nosotros` },
  };
}

const valueIcons = [Gem, ShieldCheck, Lightbulb, HeartHandshake];
/** Foto de cada área del equipo (mismo orden que `aboutPage.team`). */
const teamImages = [
  "/images/svc-desarrollo-web.jpg",
  "/images/svc-ux-ui-branding.jpg",
  "/images/svc-marketing-digital.jpg",
  "/images/svc-produccion-audiovisual.jpg",
];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.aboutPage;

  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
        image="/images/about-team.jpg"
      />

      {/* Misión y visión: bloques divididos de meta.com */}
      <section
        id="mision-vision"
        className="scroll-mt-24 bg-surface py-16 sm:py-24"
      >
        <Container className="space-y-16 sm:space-y-24">
          <SplitFeature
            image="/images/about-office.jpg"
            imageAlt={t.hero.title}
            eyebrow={t.hero.eyebrow}
            title={t.mission.title}
            description={t.mission.description}
          >
            <Target
              className="mt-8 h-8 w-8 text-accent"
              strokeWidth={1.75}
              aria-hidden
            />
          </SplitFeature>
          <SplitFeature
            reverse
            image="/images/about-meeting.jpg"
            eyebrow={t.hero.eyebrow}
            title={t.vision.title}
            description={t.vision.description}
            primary={{
              label: dict.ctaBand.primary,
              href: localizedHref(locale, "contacto"),
            }}
            secondary={{
              label: dict.common.viewServices,
              href: localizedHref(locale, "servicios"),
            }}
          >
            <Eye
              className="mt-8 h-8 w-8 text-accent"
              strokeWidth={1.75}
              aria-hidden
            />
          </SplitFeature>
        </Container>
      </section>

      {/* Valores: fila de especificaciones de meta.com */}
      <Section tone="muted" id="valores" className="scroll-mt-24">
        <SectionHeading
          title={t.valuesTitle}
          subtitle={t.valuesSubtitle}
          size="lg"
        />
        <SpecRow
          className="mt-14 sm:mt-16"
          items={t.values.map((value, i) => ({
            icon: valueIcons[i % valueIcons.length],
            value: value.title,
            label: value.description,
          }))}
        />
      </Section>

      {/* Nuestra historia */}
      <div id="historia" className="scroll-mt-24">
        <Timeline
          eyebrow={t.hero.eyebrow}
          title={t.timelineTitle}
          subtitle={t.timelineSubtitle}
          items={t.timeline}
          tone="light"
        />
      </div>

      {/* Cifras */}
      <StatsBand
        id="cifras"
        className="scroll-mt-24"
        eyebrow={t.statsEyebrow}
        title={t.statsTitle}
        subtitle={t.statsSubtitle}
        stats={t.stats}
        tone="muted"
      />

      {/* Equipo: titular centrado y carril de tarjetas fotográficas */}
      <section
        id="equipo"
        className="scroll-mt-24 overflow-hidden bg-surface py-16 sm:py-24"
      >
        <Container className="text-center">
          <h2 className="mx-auto max-w-3xl text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
            {t.teamTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted sm:text-lg">
            {t.teamSubtitle}
          </p>
          <Link
            href={localizedHref(locale, "servicios")}
            className={buttonClasses("outline", "md", "mt-6")}
          >
            {dict.common.viewServices}
          </Link>
        </Container>
        <div className="mt-10 sm:mt-12">
          <CardRail
            label={t.teamTitle}
            prevLabel={dict.ui.prev}
            nextLabel={dict.ui.next}
            cards={t.team.map((member, i) => ({
              key: member.name,
              title: member.name,
              caption: member.role,
              image: teamImages[i % teamImages.length],
            }))}
          />
        </div>
      </section>

      {/* Cómo trabajamos */}
      <div id="proceso" className="scroll-mt-24">
        <ProcessSection process={dict.process} tone="muted" />
      </div>

      <CtaBand
        locale={locale}
        title={dict.ctaBand.title}
        subtitle={dict.ctaBand.subtitle}
        primaryLabel={dict.ctaBand.primary}
        secondaryLabel={dict.common.viewServices}
        secondaryHref={localizedHref(locale, "servicios")}
      />
    </>
  );
}
