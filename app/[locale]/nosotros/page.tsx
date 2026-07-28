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
import { Counter } from "@/components/Counter";
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
      />

      {/* Misión y Visión con imagen real */}
      <Section tone="mesh" id="mision-vision" className="scroll-mt-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line shadow-2xl sm:aspect-[4/3] lg:aspect-[4/5]">
              <Image
                src="/images/about-office.jpg"
                alt="Engynex"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/40 to-transparent" />
            </div>
            <div className="glass absolute -bottom-6 left-6 right-6 rounded-2xl p-5 sm:left-auto sm:right-6 sm:w-64">
              <p className="font-display text-3xl font-extrabold text-heading">
                <Counter value="98%" />
              </p>
              <p className="text-sm font-semibold text-muted">
                {t.stats[3].label}
              </p>
            </div>
          </Reveal>

          <div className="space-y-6">
            <Reveal className="rounded-3xl border border-line bg-card/80 p-7 shadow-card backdrop-blur">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/15 text-accent">
                <Target className="h-7 w-7" strokeWidth={1.75} />
              </span>
              <h2 className="mt-5 text-2xl font-extrabold text-heading">
                {t.mission.title}
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-body">
                {t.mission.description}
              </p>
            </Reveal>
            <Reveal
              delay={100}
              className="rounded-3xl border border-line bg-card/80 p-7 shadow-card backdrop-blur"
            >
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/15 text-brand-blue">
                <Eye className="h-7 w-7" strokeWidth={1.75} />
              </span>
              <h2 className="mt-5 text-2xl font-extrabold text-heading">
                {t.vision.title}
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-body">
                {t.vision.description}
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Nuestra historia */}
      <div id="historia" className="scroll-mt-24">
        <Timeline
          eyebrow={t.hero.eyebrow}
          title={t.timelineTitle}
          subtitle={t.timelineSubtitle}
          items={t.timeline}
          tone="mesh"
        />
      </div>

      {/* Valores */}
      <Section tone="light" id="valores" className="scroll-mt-24">
        <SectionHeading
          eyebrow={t.hero.eyebrow}
          title={t.valuesTitle}
          subtitle={t.valuesSubtitle}
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.values.map((value, i) => {
            const Icon = valueIcons[i];
            return (
              <Reveal
                key={value.title}
                delay={(i % 4) * 80}
                className="h-full rounded-3xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-card-hover"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green/20 to-brand-blue/20 text-heading">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-heading">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-body">
                  {value.description}
                </p>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* Stats con contadores */}
      <StatsBand
        id="cifras"
        className="scroll-mt-24"
        eyebrow={t.statsEyebrow}
        title={t.statsTitle}
        subtitle={t.statsSubtitle}
        stats={t.stats}
      />

      {/* Cómo trabajamos */}
      <div id="proceso" className="scroll-mt-24">
        <ProcessSection process={dict.process} tone="light" />
      </div>

      {/* Equipo */}
      <Section tone="mesh" id="equipo" className="scroll-mt-24">
        <SectionHeading
          eyebrow={t.hero.eyebrow}
          title={t.teamTitle}
          subtitle={t.teamSubtitle}
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.team.map((member, i) => {
            const Icon = teamIcons[i];
            return (
              <Reveal
                key={member.name}
                delay={(i % 4) * 80}
                className="group h-full overflow-hidden rounded-3xl border border-line bg-card text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-card-hover"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-navy-800 to-navy-950">
                  <div className="bg-grid absolute inset-0 opacity-30" />
                  <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-brand-green-light ring-1 ring-white/15 backdrop-blur transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-10 w-10" strokeWidth={1.5} />
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-extrabold text-heading">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-accent">
                    {member.role}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
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
