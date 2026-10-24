import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  Target,
  Eye,
  Gem,
  ShieldCheck,
  Lightbulb,
  HeartHandshake,
  Code2,
  Palette,
  LineChart,
  Video,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { MediaTile } from "@/components/ui/MediaTile";
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
const teamIcons = [Code2, Palette, LineChart, Video];

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

      {/* Misión y Visión con fotografía */}
      <Section tone="light" id="mision-vision" className="scroll-mt-24">
        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal className="relative min-h-[22rem] overflow-hidden rounded-3xl bg-surface-soft sm:min-h-[28rem]">
            <Image
              src="/images/about-office.jpg"
              alt={t.hero.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>

          <div className="grid gap-4">
            {[
              { Icon: Target, ...t.mission },
              { Icon: Eye, ...t.vision },
            ].map(({ Icon, title, description }, i) => (
              <Reveal
                key={title}
                delay={i * 100}
                className="flex flex-col justify-center rounded-3xl bg-surface-soft p-8 sm:p-10"
              >
                <Icon
                  className="h-7 w-7 text-accent"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h2 className="mt-8 text-[1.75rem] font-light leading-tight text-heading">
                  {title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-body sm:text-lg">
                  {description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Valores: tarjetas blancas sobre gris */}
      <Section tone="muted" id="valores" className="scroll-mt-24">
        <SectionHeading
          eyebrow={t.hero.eyebrow}
          title={t.valuesTitle}
          subtitle={t.valuesSubtitle}
          size="lg"
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.values.map((value, i) => {
            const Icon = valueIcons[i % valueIcons.length];
            return (
              <Reveal
                as="li"
                key={value.title}
                delay={(i % 4) * 80}
                className="h-full rounded-3xl bg-card p-8 sm:p-10"
              >
                <Icon
                  className="h-7 w-7 text-accent"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h3 className="mt-8 text-[1.75rem] font-light leading-tight text-heading">
                  {value.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-body">
                  {value.description}
                </p>
              </Reveal>
            );
          })}
        </ul>
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

      {/* Cómo trabajamos */}
      <div id="proceso" className="scroll-mt-24">
        <ProcessSection process={dict.process} tone="light" />
      </div>

      {/* Equipo: fotografía a todo el ancho y las áreas debajo */}
      <Section tone="muted" id="equipo" className="scroll-mt-24">
        <MediaTile
          size="wide"
          image="/images/about-meeting.jpg"
          kicker={t.hero.eyebrow}
          title={t.teamTitle}
          description={t.teamSubtitle}
        />
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.team.map((member, i) => {
            const Icon = teamIcons[i % teamIcons.length];
            return (
              <Reveal
                as="li"
                key={member.name}
                delay={(i % 4) * 80}
                className="h-full rounded-3xl bg-card p-8 sm:p-10"
              >
                <Icon
                  className="h-7 w-7 text-accent"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h3 className="mt-8 text-[1.75rem] font-light leading-tight text-heading">
                  {member.name}
                </h3>
                <p className="mt-3 text-sm text-muted">{member.role}</p>
              </Reveal>
            );
          })}
        </ul>
      </Section>

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
