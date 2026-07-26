import { ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ServiceIcon } from "@/components/ServiceIcon";
import { services } from "@/content/services";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

export function HomeHero({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.hero;
  const floatChips = services.slice(0, 6);

  return (
    <section className="relative overflow-hidden bg-navy-950 pt-32 pb-20 text-ink-100 sm:pt-40 lg:pb-28">
      {/* Fondo */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="animate-pulse-slow absolute -left-32 top-0 h-[32rem] w-[32rem] rounded-full bg-brand-blue/25 blur-[130px]" />
        <div className="animate-pulse-slow absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-brand-green/20 blur-[130px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-navy-950" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Texto */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-green-light ring-1 ring-white/10">
              <Sparkles className="h-3.5 w-3.5" />
              {t.badge}
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t.titleLead}{" "}
              <span className="text-gradient">{t.titleHighlight}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-300 lg:mx-0">
              {t.subtitle}
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Button
                href={localizedHref(locale, "contacto")}
                variant="primary"
                size="lg"
              >
                {t.ctaPrimary}
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                href={localizedHref(locale, "servicios")}
                variant="ghost"
                size="lg"
              >
                {t.ctaSecondary}
              </Button>
            </div>

            {/* Stats */}
            <dl className="mx-auto mt-12 grid max-w-lg grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 lg:mx-0">
              {t.stats.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-3xl font-extrabold text-white">
                    {stat.value}
                  </dd>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>
          </div>

          {/* Visual */}
          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <HeroVisual chips={floatChips} locale={locale} />
          </div>
        </div>
      </Container>
    </section>
  );
}

function HeroVisual({
  chips,
  locale,
}: {
  chips: typeof services;
  locale: Locale;
}) {
  return (
    <div className="relative aspect-square">
      {/* Panel central tipo "window" */}
      <div className="absolute left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-gradient-to-br from-navy-800 to-navy-900 p-5 shadow-2xl shadow-brand-blue/20">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-green" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-blue" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-2.5 w-3/4 rounded-full bg-gradient-to-r from-brand-green to-brand-blue" />
          <div className="h-2.5 w-1/2 rounded-full bg-white/15" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="h-8 w-8 rounded-lg bg-brand-green/20" />
              <div className="mt-3 h-2 w-full rounded-full bg-white/10" />
              <div className="mt-2 h-2 w-2/3 rounded-full bg-white/10" />
            </div>
            <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="h-8 w-8 rounded-lg bg-brand-blue/25" />
              <div className="mt-3 h-2 w-full rounded-full bg-white/10" />
              <div className="mt-2 h-2 w-2/3 rounded-full bg-white/10" />
            </div>
          </div>
          <div className="h-2.5 w-5/6 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Chips flotantes con iconos de servicio */}
      {chips.map((service, i) => {
        const positions = [
          "left-0 top-6",
          "right-0 top-16",
          "left-2 bottom-24",
          "right-2 bottom-8",
          "left-1/2 -top-2 -translate-x-1/2",
          "left-1/2 -bottom-3 -translate-x-1/2",
        ];
        const isGreen = service.accent === "green";
        return (
          <div
            key={service.slug}
            className={cn(
              "animate-float absolute flex items-center gap-2 rounded-2xl border border-white/10 bg-navy-800/90 px-3 py-2 shadow-lg backdrop-blur",
              positions[i],
            )}
            style={{ animationDelay: `${i * 0.6}s` }}
          >
            <span
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                isGreen
                  ? "bg-brand-green/20 text-brand-green"
                  : "bg-brand-blue/20 text-brand-blue-light",
              )}
            >
              <ServiceIcon name={service.icon} className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-white">
              {service[locale].title}
            </span>
          </div>
        );
      })}
    </div>
  );
}
