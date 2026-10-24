import Link from "next/link";
import { ArrowRight, CalendarClock, FileBarChart } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { getSla } from "@/content/serviceExtras";
import { servicePlans, formatCOP } from "@/content/pricing";
import { localizedHref } from "@/lib/site";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import type { ServiceSignature, SignatureHeroProps, SignatureProps, Tone } from "./types";

/**
 * Soporte TI: la metáfora es la mesa de ayuda. La cabecera muestra una cola de
 * tickets con prioridades y el técnico asignado; la sección insignia, la
 * franja horaria de cobertura y los planes de soporte.
 */

const copy = {
  es: {
    clientPill: "¿Ya eres cliente? Reporta un problema",
    queue: "Mesa de ayuda",
    open: "Tickets abiertos",
    priorities: ["Crítica", "Alta", "Media", "Baja"],
    statuses: ["En curso", "Asignado", "En espera", "Programado"],
    tech: "Técnico asignado",
    team: "Equipo Engynex",
    eyebrow: "Horario y alcance",
    title: "Cobertura de tu operación",
    subtitle:
      "Sabes exactamente cuándo te atendemos, cada cuánto hacemos mantenimiento y cuándo recibes el reporte del servicio.",
    days: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    plansTitle: "Planes de soporte",
    from: "Desde",
    month: "/mes",
    custom: "A la medida",
    seePlans: "Ver planes",
  },
  en: {
    clientPill: "Already a client? Report an issue",
    queue: "Help desk",
    open: "Open tickets",
    priorities: ["Critical", "High", "Medium", "Low"],
    statuses: ["In progress", "Assigned", "On hold", "Scheduled"],
    tech: "Assigned technician",
    team: "Engynex team",
    eyebrow: "Hours and scope",
    title: "Coverage for your operation",
    subtitle:
      "You know exactly when we're on, how often we run maintenance and when you get the service report.",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    plansTitle: "Support plans",
    from: "From",
    month: "/mo",
    custom: "Custom quote",
    seePlans: "See plans",
  },
};

/** Estilo de la píldora según prioridad (solo marino y verde de marca). */
const priorityPill = [
  "bg-action text-deep-700",
  "bg-white text-deep-700",
  "bg-white/15 text-white",
  "text-white/70 ring-1 ring-white/25",
];

function Hero({ service, locale, backLabel, backHref, primary, secondary }: SignatureHeroProps) {
  const c = service[locale];
  const t = copy[locale];
  const sla = getSla(service.slug, locale).slice(0, 2);
  const plans = servicePlans[service.slug] ?? [];
  // Asuntos de los tickets: funciones reales de los planes de soporte.
  const subjects = [
    plans[1]?.[locale].features[1],
    plans[0]?.[locale].features[1],
    plans[1]?.[locale].features[3],
    plans[0]?.[locale].features[3],
  ].filter(Boolean) as string[];

  return (
    <section className="bg-surface-soft pb-20 pt-28 sm:pb-28 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={backLabel} backHref={backHref} />
        <div className="mt-8 grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <Link
              href={localizedHref(locale, "soporte")}
              className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-heading ring-1 ring-line transition-colors hover:ring-line-strong"
            >
              <span className="h-2 w-2 rounded-full bg-action" aria-hidden />
              {t.clientPill}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <p className="mt-8 text-sm font-medium text-muted">{c.tagline}</p>
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
              {c.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-body">{c.intro}</p>
            {sla.length > 0 && (
              <dl className="mt-7 flex flex-wrap gap-3">
                {sla.map((row) => (
                  <div key={row.label} className="rounded-full bg-card px-4 py-2 text-sm ring-1 ring-line">
                    <dt className="inline text-muted">{row.label}: </dt>
                    <dd className="inline font-semibold text-heading">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <HeroActions
              primary={primary}
              secondary={secondary}
              className="mt-8 [&>a:last-child]:bg-card [&>a:last-child]:ring-1 [&>a:last-child]:ring-line"
            />
          </div>

          {/* Cola de tickets (ilustrativa). */}
          <div aria-hidden className="relative pb-24 sm:pb-16">
            <div className="rounded-3xl bg-deep-800 p-4 text-white shadow-card ring-1 ring-white/10 sm:p-6">
              <div className="flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <span className="ml-3 text-sm font-semibold">{t.queue}</span>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                  {t.open}
                </span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {subjects.map((subject, i) => (
                  <li
                    key={subject}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-3 sm:gap-4 sm:px-4",
                      i === 0 ? "bg-white/[0.09] ring-1 ring-brand-green/50" : "bg-white/[0.05]",
                    )}
                  >
                    <span className="hidden w-12 shrink-0 font-mono text-xs text-white/50 sm:block">
                      #{(i + 1).toString().padStart(3, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{subject}</p>
                      <p className="mt-0.5 text-xs text-white/60">{t.statuses[i]}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold", priorityPill[i])}>
                      {t.priorities[i]}
                    </span>
                    <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-deep-600 text-[0.7rem] font-bold text-white ring-2 ring-deep-800 sm:grid">
                      EX
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tarjeta del técnico. */}
            <div className="absolute bottom-0 left-4 right-4 flex items-center gap-4 rounded-3xl bg-card p-4 shadow-card-hover ring-1 ring-line sm:left-auto sm:right-8 sm:w-80">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-action text-sm font-bold text-deep-700">
                EX
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted">{t.tech}</p>
                <p className="font-semibold text-heading">{t.team}</p>
                {sla[0] && (
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {sla[0].label} · <span className="font-semibold text-heading">{sla[0].value}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Convierte "7:00–17:00" en horas de inicio y fin. */
function parseHours(value: string): [number, number] {
  const m = value.match(/(\d{1,2}):\d{2}\s*[–-]\s*(\d{1,2}):\d{2}/);
  return m ? [Number(m[1]), Number(m[2])] : [7, 17];
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const t = copy[locale];
  const sla = getSla(service.slug, locale);
  const coverage = sla[1];
  const [start, end] = parseHours(coverage?.value ?? "");
  const plans = servicePlans[service.slug] ?? [];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";
  const ticks = [0, start, 12, end, 24];

  const extras = [
    { icon: CalendarClock, row: sla[2] },
    { icon: FileBarChart, row: sla[3] },
  ].filter((x) => x.row);

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            {t.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">{t.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Franja semanal de cobertura. */}
          <figure className={cn("rounded-3xl p-5 sm:p-8", card)}>
            {coverage && (
              <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm text-muted">{coverage.label}</span>
                <span className="text-2xl font-bold tracking-tight text-heading">{coverage.value}</span>
              </figcaption>
            )}
            <div aria-hidden className="mt-8">
              <div className="grid grid-cols-[2.5rem_1fr] gap-x-3">
                <span />
                <div className="relative h-5 text-[0.7rem] font-medium text-muted">
                  {ticks.map((h, i) => (
                    <span
                      key={h}
                      className={cn(
                        "absolute top-0",
                        i === 0 ? "left-0" : i === ticks.length - 1 ? "right-0" : "-translate-x-1/2",
                        h === 12 && "hidden sm:inline",
                      )}
                      style={i === 0 || i === ticks.length - 1 ? undefined : { left: `${(h / 24) * 100}%` }}
                    >
                      {h}:00
                    </span>
                  ))}
                </div>
              </div>
              <ul className="mt-2 space-y-2">
                {t.days.map((day, d) => (
                  <li key={day} className="grid grid-cols-[2.5rem_1fr] items-center gap-x-3">
                    <span className={cn("text-sm font-semibold", d < 5 ? "text-heading" : "text-muted")}>{day}</span>
                    <div className="relative h-8 overflow-hidden rounded-full bg-line/70">
                      {d < 5 && (
                        <span
                          className="absolute inset-y-1 rounded-full bg-action"
                          style={{ left: `${(start / 24) * 100}%`, width: `${((end - start) / 24) * 100}%` }}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </figure>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {extras.map(({ icon: Icon, row }) => (
              <div key={row!.label} className={cn("flex items-center gap-5 rounded-3xl p-6 sm:p-7", card)}>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-deep-700 text-brand-green">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <p className="text-sm text-muted">{row!.label}</p>
                  <p className="text-2xl font-bold tracking-tight text-heading">{row!.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {plans.length > 0 && (
          <div className="mt-6 rounded-3xl bg-deep-700 p-6 text-white sm:p-8 dark:bg-card-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-xl font-bold">{t.plansTitle}</h3>
              <a href="#planes" className={buttonClasses("ghost", "md")}>
                {t.seePlans}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <ul className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
              {plans.map((plan) => (
                <li key={plan.key} className="flex flex-col bg-deep-700 p-5 dark:bg-card-soft">
                  <p className="font-semibold">{plan[locale].name}</p>
                  <p className="mt-1 text-sm text-white/70">{plan[locale].description}</p>
                  <p className="mt-auto pt-4 text-sm text-white/70">
                    {plan.price !== null ? (
                      <>
                        {t.from}{" "}
                        <span className="text-lg font-bold text-brand-green">
                          {formatCOP(plan.price)}
                        </span>
                        {plan.billing === "monthly" ? t.month : ""}
                      </>
                    ) : (
                      <span className="text-lg font-bold text-brand-green">{t.custom}</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = { Hero, Showcase };
