import Image from "next/image";
import { ArrowRight, Check, Clock, Minus, Users, X } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { SHOWCASE_ICONS as ICONS } from "@/components/services/showcase/icons";
import type { ShowcaseCaseDetail, ShowcaseCopy, ShowcaseFactoryCopy } from "@/content/servicePages/types";
import { cn } from "@/lib/utils";

/** Titular de sección de meta.com: centrado, grande y en negrita. */
export function ShowcaseHeading({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.12] text-heading">{title}</h2>
      {subtitle && <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{subtitle}</p>}
    </div>
  );
}

/**
 * La célula de desarrollo (los "pods" de Globant y los "squads" de
 * BairesDev): quién trabaja en tu proyecto y con qué dedicación.
 */
export function SquadSection({ copy: t }: { copy: ShowcaseFactoryCopy["squad"] }) {
  return (
    <Section tone="light">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-green-dark dark:text-brand-green">{t.eyebrow}</p>
          <h2 className="mt-4 text-balance text-[clamp(2rem,3.8vw,3.25rem)] font-bold leading-[1.08] text-heading">{t.title}</h2>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{t.body}</p>
          <ul className="mt-8 grid gap-3">
            {t.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[0.97rem] text-heading">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-brand-green-dark dark:text-brand-green">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <Reveal className="rounded-[2rem] bg-surface-soft p-4 sm:p-6 dark:bg-white/[0.04]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-4 pt-1">
            <p className="text-base font-bold text-heading">{t.panelTitle}</p>
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-heading ring-1 ring-line dark:bg-card">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
              </span>
              {t.panelStatus}
            </span>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {t.roles.map((r, i) => {
              const Icon = ICONS[r.icon];
              return (
                <li key={r.role} className="flex gap-4 rounded-3xl bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:bg-card">
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                      i === 0 ? "bg-brand-green text-deep-700" : "bg-deep-700 text-white dark:bg-white/10",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-tight text-heading">{r.role}</p>
                      <span className="shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-[0.7rem] font-semibold tabular-nums text-muted dark:bg-white/[0.06]">{r.share}</span>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-muted">{r.focus}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 px-2 text-center text-sm text-muted">{t.panelFoot}</p>
        </Reveal>
      </div>
    </Section>
  );
}

/** Industrias para las que construimos (Endava, EPAM). */
export function IndustriesSection({ copy: t }: { copy: ShowcaseFactoryCopy["industries"] }) {
  return (
    <Section tone="muted">
      <ShowcaseHeading title={t.title} subtitle={t.subtitle} className="mb-12 sm:mb-16" />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {t.items.map((it, i) => {
          const Icon = ICONS[it.icon];
          return (
            <Reveal key={it.name} as="li" delay={(i % 4) * 60} className="group flex flex-col rounded-3xl bg-card p-6 transition-transform duration-300 hover:-translate-y-1">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-brand-green-dark transition-colors group-hover:bg-brand-green group-hover:text-deep-700 dark:text-brand-green">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-bold text-heading">{it.name}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{it.examples}</p>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}

/** Cómo se gobierna la entrega (Thoughtworks): rituales, metas y herramientas. */
export function GovernanceSection({ copy: t }: { copy: ShowcaseFactoryCopy["governance"] }) {
  return (
    <Section tone="light">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-green-dark dark:text-brand-green">{t.eyebrow}</p>
          <h2 className="mt-4 text-balance text-[clamp(2rem,3.8vw,3.25rem)] font-bold leading-[1.08] text-heading">{t.title}</h2>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{t.subtitle}</p>
          <ol className="relative mt-10 grid gap-6 border-l-2 border-line pl-7">
            {t.rituals.map((r) => (
              <li key={r.name} className="relative">
                <span className="absolute -left-[2.06rem] top-1 h-3.5 w-3.5 rounded-full border-[3px] border-surface bg-brand-green ring-1 ring-line" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{r.cadence}</span>
                <p className="mt-1 text-lg font-bold text-heading">{r.name}</p>
                <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">{r.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="self-center">
          <Reveal className="rounded-[2rem] bg-deep-700 p-6 text-white sm:p-10 dark:bg-white/[0.06]">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-green">{t.metricsTitle}</p>
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
              {t.metrics.map((m) => (
                <div key={m.label} className="bg-deep-700 p-5 dark:bg-deep-900">
                  <dt className="sr-only">{m.label}</dt>
                  <dd className="text-[clamp(1.5rem,2.4vw,2rem)] font-bold leading-none tabular-nums text-brand-green">{m.value}</dd>
                  <dd className="mt-2 text-sm leading-snug text-white/80">{m.label}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-sm font-semibold text-white/90">{t.toolsLabel}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {t.tools.map((tool) => (
                <li key={tool} className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white">
                  {tool}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs text-white/60">{t.note}</p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/** Tabla comparativa de modelos de trabajo (BairesDev, Toptal). */
export function CompareModels({ copy: t, models }: { copy: ShowcaseFactoryCopy["compare"]; models: string[] }) {
  return (
    <div className="mt-14 sm:mt-20">
      <h3 className="text-center text-2xl font-bold text-heading sm:text-[1.75rem]">{t.title}</h3>
      <div className="mt-8 overflow-x-auto rounded-[2rem] bg-card">
        <table className="w-full min-w-[44rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="px-6 py-5 text-sm font-semibold text-muted">
                {t.criterion}
              </th>
              {models.map((m, i) => (
                <th key={m} scope="col" className={cn("px-6 py-5 text-base font-bold text-heading", i === 1 && "bg-accent-soft")}>
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-0">
                <th scope="row" className="px-6 py-4 align-top text-sm font-semibold text-heading">
                  {row.label}
                </th>
                {row.values.map((v, i) => (
                  <td key={i} className={cn("px-6 py-4 align-top text-[0.95rem] text-body", i === 1 && "bg-accent-soft/60")}>
                    {v === "—" ? <Minus className="h-4 w-4 text-muted" aria-label="—" /> : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Garantías de trabajar con la fábrica: propiedad, confidencialidad, salida. */
export function GuaranteesSection({ copy: t }: { copy: ShowcaseFactoryCopy["guarantees"] }) {
  return (
    <Section tone="light">
      <ShowcaseHeading title={t.title} subtitle={t.subtitle} className="mb-12 sm:mb-16" />
      <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {t.items.map((it, i) => {
          const Icon = ICONS[it.icon];
          return (
            <Reveal key={it.title} as="li" delay={i * 70} className="border-t-2 border-heading pt-6">
              <Icon className="h-7 w-7 text-brand-green-dark dark:text-brand-green" aria-hidden />
              <h3 className="mt-4 text-xl font-bold leading-snug text-heading">{it.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{it.body}</p>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}

/** Antes y después por tema (el "before / after" de Thoughtworks y EPAM). */
export function BeforeAfter({ copy: t }: { copy: NonNullable<ShowcaseCopy["outcomes"]["compare"]> }) {
  const grid = "md:grid md:grid-cols-[9rem_minmax(0,1fr)_2.5rem_minmax(0,1fr)] md:items-center md:gap-4";
  return (
    <Reveal className="rounded-[2rem] bg-surface-soft p-4 sm:p-6 lg:p-8 dark:bg-white/[0.04]">
      <div className={cn(grid, "hidden px-2 pb-4")}>
        <span />
        <span className="inline-flex items-center gap-2 justify-self-start rounded-full bg-surface px-3.5 py-1.5 text-sm font-semibold text-muted ring-1 ring-line dark:bg-card">
          <X className="h-4 w-4" aria-hidden />
          {t.beforeLabel}
        </span>
        <span />
        <span className="inline-flex items-center gap-2 justify-self-start rounded-full bg-brand-green px-3.5 py-1.5 text-sm font-semibold text-deep-700">
          <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
          {t.afterLabel}
        </span>
      </div>
      <dl className="grid gap-3 md:gap-2">
        {t.rows.map((r) => (
          <div key={r.topic} className={cn(grid, "rounded-3xl bg-surface p-4 md:rounded-none md:bg-transparent md:p-2 md:[&:not(:first-child)]:border-t md:[&:not(:first-child)]:border-line md:pt-4 dark:bg-card md:dark:bg-transparent")}>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted md:text-sm md:normal-case md:tracking-normal md:text-heading">{r.topic}</dt>
            <dd className="mt-3 flex items-start gap-2.5 text-[0.95rem] text-muted md:mt-0">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-line/70 text-muted dark:bg-white/10">
                <X className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
              <span>
                <span className="sr-only">{t.beforeLabel}: </span>
                {r.before}
              </span>
            </dd>
            <dd aria-hidden className="hidden justify-center text-brand-green-dark md:flex dark:text-brand-green">
              <ArrowRight className="h-5 w-5" />
            </dd>
            <dd className="mt-2.5 flex items-start gap-2.5 rounded-2xl bg-accent-soft px-3.5 py-3 text-[0.95rem] font-semibold text-heading md:mt-0 md:bg-surface md:shadow-[0_1px_2px_rgba(16,24,40,0.06)] md:dark:bg-card">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-green text-deep-700">
                <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden />
              </span>
              <span>
                <span className="sr-only">{t.afterLabel}: </span>
                {r.after}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}

/**
 * Caso de estudio (Globant, Endava): foto con el resultado principal, reto,
 * solución, tres métricas y la ficha del equipo.
 */
export function CaseStudy({
  project,
  detail: d,
  labels,
  reverse,
}: {
  project: { title: string; summary: string; result: string; image: string };
  detail: ShowcaseCaseDetail;
  labels: NonNullable<ShowcaseCopy["cases"]["labels"]>;
  reverse?: boolean;
}) {
  return (
    <Reveal as="article" className="grid overflow-hidden rounded-[2rem] bg-surface-soft lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] dark:bg-white/[0.04]">
      <div className={cn("relative isolate flex min-h-80 flex-col justify-between p-6 text-white sm:min-h-[26rem] sm:p-8", reverse && "lg:order-2")}>
        <Image src={project.image} alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/30 to-black/10" aria-hidden />
        <span className="self-start rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-deep-700">{d.industry}</span>
        <div>
          <p className="text-base font-medium text-white/85">{project.title}</p>
          <p className="mt-1 text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.02] tracking-tight">{project.result}</p>
        </div>
      </div>

      <div className="flex flex-col p-6 sm:p-8 lg:p-10">
        <h3 className="text-2xl font-bold leading-snug text-heading">{project.title}</h3>
        <p className="mt-2 text-[0.97rem] leading-relaxed text-muted">{project.summary}</p>

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{labels.challenge}</p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-body">{d.challenge}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-green-dark dark:text-brand-green">{labels.solution}</p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-body">{d.solution}</p>
          </div>
        </div>

        <dl className="mb-7 mt-7 grid grid-cols-3 gap-2 sm:gap-3">
          {d.metrics.slice(0, 3).map((m) => (
            <div key={m.label} className="rounded-2xl bg-surface p-3 sm:p-4 dark:bg-card">
              <dt className="sr-only">{m.label}</dt>
              <dd className="text-lg font-bold leading-tight tabular-nums text-heading [overflow-wrap:anywhere] sm:text-2xl">{m.value}</dd>
              <dd className="mt-1 text-xs leading-snug text-muted sm:text-sm">{m.label}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5 text-sm lg:mt-auto">
          <span className="inline-flex items-center gap-1.5 text-heading">
            <Users className="h-4 w-4 text-muted" aria-hidden />
            <span className="sr-only">{labels.team}: </span>
            {d.team}
          </span>
          <span className="inline-flex items-center gap-1.5 text-heading">
            <Clock className="h-4 w-4 text-muted" aria-hidden />
            <span className="sr-only">{labels.duration}: </span>
            {d.duration}
          </span>
          <ul aria-label={labels.stack} className="flex flex-wrap gap-1.5">
            {d.stack.map((x) => (
              <li key={x} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-heading ring-1 ring-line dark:bg-card">
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}

/** ¿Nativa, multiplataforma o web app? (Netguru, BairesDev). */
export function PlatformsSection({ copy: t }: { copy: NonNullable<ShowcaseCopy["platforms"]> }) {
  return (
    <Section tone="light">
      <ShowcaseHeading title={t.title} subtitle={t.subtitle} className="mb-12 sm:mb-16" />
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {t.items.map((it, i) => {
          const dark = !!it.highlight;
          return (
            <Reveal key={it.name} delay={i * 80} className={cn("relative flex flex-col rounded-[2rem] p-7 sm:p-8", dark ? "bg-deep-700 text-white dark:bg-white/[0.08]" : "bg-surface-soft dark:bg-white/[0.04]")}>
              {dark && <span className="absolute right-6 top-6 rounded-full bg-brand-green px-3 py-1 text-xs font-semibold text-deep-700">{t.recommended}</span>}
              <h3 className={cn("pr-28 text-[1.6rem] font-bold leading-tight", dark ? "text-white" : "text-heading")}>{it.name}</h3>
              <p className={cn("mt-2 text-[0.97rem] leading-relaxed", dark ? "text-white/80" : "text-muted")}>{it.tagline}</p>

              <dl className="mt-6 grid gap-3">
                {it.ratings.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-4 text-sm">
                    <dt className={dark ? "text-white/85" : "text-heading"}>{r.label}</dt>
                    <dd className="flex gap-1" aria-label={`${r.value}/3`}>
                      {[1, 2, 3].map((n) => (
                        <span key={n} className={cn("h-2 w-7 rounded-full", n <= r.value ? "bg-brand-green" : dark ? "bg-white/15" : "bg-line")} />
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className={cn("mt-7 text-xs font-semibold uppercase tracking-[0.12em]", dark ? "text-brand-green" : "text-brand-green-dark dark:text-brand-green")}>{t.bestForLabel}</p>
              <ul className="mt-3 grid flex-1 content-start gap-2.5">
                {it.bestFor.map((b) => (
                  <li key={b} className={cn("flex items-start gap-2.5 text-[0.95rem]", dark ? "text-white" : "text-heading")}>
                    <Check className={cn("mt-0.5 h-4 w-4 shrink-0", dark ? "text-brand-green" : "text-accent")} strokeWidth={2.5} aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
              <ul className="mt-7 flex flex-wrap gap-1.5">
                {it.tech.map((x) => (
                  <li key={x} className={cn("rounded-full px-2.5 py-1 text-xs font-medium", dark ? "bg-white/10 text-white" : "bg-surface text-heading ring-1 ring-line dark:bg-card")}>
                    {x}
                  </li>
                ))}
              </ul>
            </Reveal>
          );
        })}
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">{t.note}</p>
    </Section>
  );
}
