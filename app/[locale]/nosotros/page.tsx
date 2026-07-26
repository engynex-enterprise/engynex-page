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
      <Section tone="mesh">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-navy-900/10 dark:border-white/10 shadow-2xl sm:aspect-[4/3] lg:aspect-[4/5]">
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
              <p className="text-3xl font-extrabold text-navy-900 dark:text-white">
                <Counter value="98%" />
              </p>
              <p className="text-sm font-semibold text-slate-500 dark:text-ink-400">
                {t.stats[3].label}
              </p>
            </div>
          </Reveal>

          <div className="space-y-6">
            <Reveal className="rounded-3xl border border-navy-900/10 dark:border-white/10 bg-white/70 dark:bg-navy-800/70 p-7 backdrop-blur">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/15 text-brand-green-dark dark:text-brand-green">
                <Target className="h-7 w-7" strokeWidth={1.75} />
              </span>
              <h2 className="mt-5 text-2xl font-extrabold text-navy-900 dark:text-white">
                {t.mission.title}
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-ink-300">
                {t.mission.description}
              </p>
            </Reveal>
            <Reveal
              delay={100}
              className="rounded-3xl border border-navy-900/10 dark:border-white/10 bg-white/70 dark:bg-navy-800/70 p-7 backdrop-blur"
            >
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/15 text-brand-blue">
                <Eye className="h-7 w-7" strokeWidth={1.75} />
              </span>
              <h2 className="mt-5 text-2xl font-extrabold text-navy-900 dark:text-white">
                {t.vision.title}
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-ink-300">
                {t.vision.description}
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Nuestra historia */}
      <Timeline
        eyebrow={t.hero.eyebrow}
        title={t.timelineTitle}
        subtitle={t.timelineSubtitle}
        items={t.timeline}
        tone="mesh"
      />

      {/* Valores */}
      <Section tone="light">
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
                className="rounded-3xl border border-navy-900/10 dark:border-white/10 bg-white dark:bg-navy-800 p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green/20 to-brand-blue/20 text-navy-900 dark:text-white">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-navy-900 dark:text-white">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-ink-300">
                  {value.description}
                </p>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* Stats con contadores */}
      <section className="relative overflow-hidden bg-navy-950 py-20 text-ink-100">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src="/images/about-meeting.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-10"
          />
          <div className="bg-grid absolute inset-0 opacity-30" />
          <div className="absolute -left-10 top-0 h-72 w-72 rounded-full bg-brand-green/20 blur-[120px]" />
          <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-brand-blue/25 blur-[120px]" />
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <SectionHeading title={t.statsTitle} tone="dark" />
          <div className="mt-14 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {t.stats.map((stat, i) => (
              <Reveal
                key={stat.label}
                delay={(i % 4) * 80}
                className="glass-dark rounded-3xl p-8 text-center"
              >
                <p className="text-4xl font-extrabold text-gradient sm:text-5xl">
                  <Counter value={stat.value} />
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-ink-300">
                  {stat.label}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo trabajamos */}
      <ProcessSection process={dict.process} tone="light" />

      {/* Equipo */}
      <Section tone="mesh">
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
                className="group overflow-hidden rounded-3xl border border-navy-900/10 dark:border-white/10 bg-white dark:bg-navy-800 text-center shadow-sm"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-navy-800 to-navy-950">
                  <div className="bg-grid absolute inset-0 opacity-30" />
                  <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-brand-green-light ring-1 ring-white/15 backdrop-blur transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-10 w-10" strokeWidth={1.5} />
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-extrabold text-navy-900 dark:text-white">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-brand-green-dark dark:text-brand-green">
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
