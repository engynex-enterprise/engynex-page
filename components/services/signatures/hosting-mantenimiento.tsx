import { Clock, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getSla } from "@/content/serviceExtras";
import { getServiceProcess } from "@/content/serviceProcess";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import type { ServiceSignature, SignatureHeroProps, SignatureProps, Tone } from "./types";

/**
 * Hosting & Mantenimiento: la metáfora es una página de estado. La cabecera
 * muestra un panel "todos los sistemas operativos" y la sección insignia, el
 * calendario de tareas que hacemos sin que el cliente lo note.
 */

const copy = {
  es: {
    statusTitle: "Estado del servicio",
    allOk: "Todos los sistemas operativos",
    monitor: "Monitoreo 24/7",
    operational: "Operativo",
    rows: ["Sitio web", "Correo", "Base de datos", "Copias de seguridad"],
    eyebrow: "Rutina de mantenimiento",
    title: "Mantenimiento que no ves",
    subtitle:
      "Mientras tu equipo trabaja, nosotros cumplimos una rutina fija cada mes: copias, vigilancia, actualizaciones y un reporte de salud.",
    week: "Semana",
    calendarCaption: "Un mes típico de tu sitio con nosotros",
  },
  en: {
    statusTitle: "Service status",
    allOk: "All systems operational",
    monitor: "24/7 monitoring",
    operational: "Operational",
    rows: ["Website", "Email", "Database", "Backups"],
    eyebrow: "Maintenance routine",
    title: "Maintenance you never see",
    subtitle:
      "While your team works, we follow a fixed routine every month: backups, monitoring, updates and a health report.",
    week: "Week",
    calendarCaption: "A typical month of your site with us",
  },
};

const BARS = 30;

function Hero({ service, locale, backLabel, backHref, primary, secondary }: SignatureHeroProps) {
  const c = service[locale];
  const t = copy[locale];
  const availability = getSla(service.slug, locale)[0];

  return (
    <section className="bg-surface pb-16 pt-28 sm:pb-24 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={backLabel} backHref={backHref} />
        <div className="mt-8 grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <p className="text-sm font-medium text-muted">{c.tagline}</p>
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
              {c.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-body">{c.intro}</p>
            <HeroActions primary={primary} secondary={secondary} className="mt-8" />
          </div>

          {/* Página de estado (ilustrativa). */}
          <div className="rounded-3xl bg-surface-soft p-5 ring-1 ring-line sm:p-8 dark:bg-card">
            <div aria-hidden>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-muted">{t.statusTitle}</p>
                <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-heading ring-1 ring-line dark:bg-deep-950">
                  <span className="h-2 w-2 rounded-full bg-action" />
                  {t.monitor}
                </span>
              </div>
              <p className="mt-6 flex items-center gap-3 text-2xl font-bold tracking-tight text-heading sm:text-3xl">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="absolute inset-0 rounded-full bg-action motion-safe:animate-ping motion-safe:[animation-duration:2.4s]" />
                  <span className="relative h-3.5 w-3.5 rounded-full bg-action" />
                </span>
                {t.allOk}
              </p>
              <ul className="mt-6 divide-y divide-line rounded-2xl bg-surface ring-1 ring-line dark:bg-deep-950">
                {t.rows.map((row) => (
                  <li key={row} className="px-4 py-4 sm:px-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2.5 text-sm font-semibold text-heading">
                        <span className="h-2 w-2 rounded-full bg-action" />
                        {row}
                      </span>
                      <span className="text-xs font-medium text-accent">{t.operational}</span>
                    </div>
                    <div className="mt-3 flex h-7 gap-[3px]">
                      {Array.from({ length: BARS }, (_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "flex-1 rounded-[3px] bg-action/85",
                            i < BARS - 18 && "hidden sm:block",
                          )}
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {availability && (
              <dl className="mt-5 flex items-baseline justify-between gap-4 px-1">
                <dt className="text-sm text-muted">{availability.label}</dt>
                <dd className="text-2xl font-bold tracking-tight text-heading">{availability.value}</dd>
              </dl>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Días del mes (4 semanas) en los que aparece cada tarea. */
type Pattern = "daily" | "continuous" | "window" | "end";
const DAYS = 28;

function Track({ pattern }: { pattern: Pattern }) {
  if (pattern === "continuous") {
    return (
      <div aria-hidden className="flex h-6 items-center">
        <span className="h-2.5 w-full rounded-full bg-deep-700 dark:bg-brand-blue-light" />
      </div>
    );
  }
  return (
    <div aria-hidden className="grid h-6 grid-cols-[repeat(28,minmax(0,1fr))] gap-[2px] sm:gap-1">
      {Array.from({ length: DAYS }, (_, d) => {
        const on =
          pattern === "daily" ||
          (pattern === "window" && (d === 13 || d === 14)) ||
          (pattern === "end" && d === DAYS - 1);
        return (
          <span
            key={d}
            className={cn(
              "rounded-[3px]",
              on ? "bg-action" : "bg-line",
            )}
          />
        );
      })}
    </div>
  );
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const t = copy[locale];
  const sla = getSla(service.slug, locale);
  const steps = getServiceProcess(service.slug)?.[locale].steps ?? [];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  // Tareas reales: copias (SLA) + monitoreo, mantenimiento y reporte (proceso).
  const tasks: { label: string; meta: string; pattern: Pattern }[] = [
    sla[1] && { label: sla[1].label, meta: sla[1].value, pattern: "daily" as const },
    steps[2] && { label: steps[2].title, meta: steps[2].meta, pattern: "continuous" as const },
    steps[3] && { label: steps[3].title, meta: steps[3].meta, pattern: "window" as const },
    steps[4] && { label: steps[4].title, meta: steps[4].meta, pattern: "end" as const },
  ].filter((x): x is { label: string; meta: string; pattern: Pattern } => Boolean(x));

  const stats = [
    { icon: Clock, row: sla[2] },
    { icon: MessageCircle, row: sla[3] },
  ].filter((s) => s.row);

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

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <figure className={cn("rounded-3xl p-5 sm:p-8", card)}>
            <figcaption className="text-sm font-semibold text-heading">{t.calendarCaption}</figcaption>

            <div className="mt-6 grid gap-x-6 sm:grid-cols-[13rem_1fr]">
              <span className="hidden sm:block" />
              <div aria-hidden className="grid grid-cols-4 gap-1 text-xs font-medium text-muted">
                {[1, 2, 3, 4].map((w) => (
                  <span key={w} className="border-l border-line-strong pl-2">
                    {t.week} {w}
                  </span>
                ))}
              </div>
            </div>

            <ul className="mt-4 divide-y divide-line">
              {tasks.map((task) => (
                <li key={task.label} className="grid gap-x-6 gap-y-3 py-5 sm:grid-cols-[13rem_1fr] sm:items-center">
                  <div>
                    <p className="font-semibold text-heading">{task.label}</p>
                    <p className="mt-0.5 text-sm text-muted">{task.meta}</p>
                  </div>
                  <Track pattern={task.pattern} />
                </li>
              ))}
            </ul>
          </figure>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {stats.map(({ icon: Icon, row }) => (
              <div key={row!.label} className="flex flex-col justify-between rounded-3xl bg-deep-700 p-7 text-white dark:bg-card-soft">
                <Icon className="h-6 w-6 text-brand-green" aria-hidden />
                <div className="mt-10">
                  <p className="text-sm text-white/75">{row!.label}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">{row!.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = { Hero, Showcase };
