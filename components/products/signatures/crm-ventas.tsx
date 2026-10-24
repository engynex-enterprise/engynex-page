import {
  BellRing,
  Building2,
  FileText,
  Mail,
  Phone,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "@/components/services/signatures/shared";
import type { ProductHeroProps, ProductSignature, ProductSignatureProps, Tone } from "./types";

/**
 * CRM de Ventas: la cabecera es un tablero kanban del embudo comercial que
 * ocupa todo el ancho bajo un titular alineado a la izquierda; la sección
 * insignia es la ficha de un contacto con su línea de tiempo de actividades,
 * cada una ligada al módulo real que la registra. Los montos son "$ —".
 */
const AMOUNT = "$ —";

const copy = {
  es: {
    pipeline: "Embudo comercial",
    filters: ["Todos", "Este mes", "Mis oportunidades"],
    stages: ["Prospecto", "Calificado", "Cotización", "Negociación", "Ganado"],
    deal: "Oportunidad",
    newDeal: "Nueva oportunidad",
    showcaseEyebrow: "Ficha del cliente",
    showcaseTitle: "Cada interacción, en un solo lugar",
    showcaseSubtitle:
      "La ficha reúne todo lo que ha pasado con un cliente y lo que sigue. Un asesor nuevo la abre y sabe exactamente dónde va la venta.",
    contact: "Contacto A",
    company: "Empresa A",
    source: "Origen: Web",
    stage: "Etapa",
    value: "Valor",
    owner: "Asesor",
    timelineTitle: "Actividad",
    next: "Próximo",
    activities: [
      { icon: "reminder", title: "Recordatorio: volver a llamar" },
      { icon: "quote", title: "Cotización enviada" },
      { icon: "call", title: "Llamada registrada" },
      { icon: "mail", title: "Correo de seguimiento" },
      { icon: "lead", title: "Nuevo lead desde la web" },
    ],
    dashboardTitle: "Y el tablero lo resume",
  },
  en: {
    pipeline: "Sales pipeline",
    filters: ["All", "This month", "My deals"],
    stages: ["Lead", "Qualified", "Quote", "Negotiation", "Won"],
    deal: "Opportunity",
    newDeal: "New opportunity",
    showcaseEyebrow: "Customer record",
    showcaseTitle: "Every interaction in one place",
    showcaseSubtitle:
      "The record brings together everything that has happened with a customer and what comes next. A new rep opens it and knows exactly where the deal stands.",
    contact: "Contact A",
    company: "Company A",
    source: "Source: Web",
    stage: "Stage",
    value: "Value",
    owner: "Rep",
    timelineTitle: "Activity",
    next: "Up next",
    activities: [
      { icon: "reminder", title: "Reminder: call back" },
      { icon: "quote", title: "Quote sent" },
      { icon: "call", title: "Call logged" },
      { icon: "mail", title: "Follow-up email" },
      { icon: "lead", title: "New lead from the website" },
    ],
    dashboardTitle: "And the dashboard sums it up",
  },
};

const activityIcons: Record<string, LucideIcon> = {
  reminder: BellRing,
  quote: FileText,
  call: Phone,
  mail: Mail,
  lead: Sparkles,
};

/** Módulo o función real que registra cada actividad (en el mismo orden). */
const activitySource: { from: "modules" | "features"; index: number }[] = [
  { from: "modules", index: 3 },
  { from: "modules", index: 2 },
  { from: "modules", index: 0 },
  { from: "features", index: 1 },
  { from: "modules", index: 1 },
];

/** Tarjetas por etapa del tablero (letras genéricas, sin montos reales). */
const boardCards = [["A", "B", "C"], ["D", "E"], ["F", "G"], ["H"], ["I", "J"]];

function Hero({ product, locale, categoryLabel, ...props }: ProductHeroProps) {
  const c = product[locale];
  const t = copy[locale];

  return (
    <section className="relative overflow-hidden bg-surface pb-16 pt-28 sm:pb-24 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} />

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {categoryLabel && (
              <p className="text-sm font-semibold text-accent">{categoryLabel}</p>
            )}
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
              {c.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
              {c.tagline}
            </p>
          </div>
          <HeroActions
            primary={props.primary}
            secondary={props.secondary}
            className="shrink-0 lg:pb-2"
          />
        </div>

        {/* Tablero kanban del embudo (ilustrativo). */}
        <div
          aria-hidden
          className="mt-12 overflow-hidden rounded-3xl bg-surface-soft p-3 sm:mt-16 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-deep-700 px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-deep-700">
                {t.pipeline}
              </span>
              <div className="hidden gap-1.5 sm:flex">
                {t.filters.map((f, i) => (
                  <span
                    key={f}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold",
                      i === 0 ? "bg-card text-heading ring-1 ring-line" : "text-muted",
                    )}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <span className="rounded-full bg-action px-4 py-2 text-xs font-bold text-deep-700">
              + {t.newDeal}
            </span>
          </div>

          <div className="grid w-[64rem] grid-cols-5 gap-3 sm:w-auto sm:min-w-[56rem]">
            {t.stages.map((stage, s) => (
              <div key={stage} className="rounded-2xl bg-card p-3">
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="truncate text-sm font-bold text-heading">{stage}</span>
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-card-soft px-2 text-xs font-semibold tabular-nums text-muted">
                    {boardCards[s].length}
                  </span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${((s + 1) / t.stages.length) * 100}%` }}
                  />
                </div>
                <ul className="mt-3 space-y-2.5">
                  {boardCards[s].map((letter, k) => {
                    const lifted = s === 2 && k === 0;
                    const won = s === t.stages.length - 1;
                    return (
                      <li
                        key={letter}
                        className={cn(
                          "rounded-xl bg-surface p-3 ring-1 ring-line",
                          lifted &&
                            "relative z-10 ring-2 ring-accent motion-safe:-rotate-2 motion-safe:translate-x-2 shadow-[0_12px_30px_-12px_rgba(31,42,70,0.35)]",
                        )}
                      >
                        <p className="text-sm font-bold text-heading">
                          {t.deal} {letter}
                        </p>
                        <p className="mt-1 text-xs tabular-nums text-muted">{AMOUNT}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card-soft">
                            <UserRound className="h-3.5 w-3.5 text-muted" />
                          </span>
                          {won ? (
                            <span className="rounded-full bg-action px-2 py-0.5 text-[0.65rem] font-bold text-deep-700">
                              ✓
                            </span>
                          ) : (
                            <span className="h-1.5 w-12 rounded-full bg-line">
                              <span
                                className="block h-full rounded-full bg-deep-400"
                                style={{ width: `${20 + s * 18}%` }}
                              />
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Showcase({ product, locale, tone }: ProductSignatureProps & { tone: Tone }) {
  const c = product[locale];
  const t = copy[locale];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <SectionHeading
          eyebrow={t.showcaseEyebrow}
          title={t.showcaseTitle}
          subtitle={t.showcaseSubtitle}
          size="lg"
        />

        <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:mt-14 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          {/* Ficha del contacto (ilustrativa). */}
          <div aria-hidden className={cn("rounded-3xl p-6 sm:p-8", card)}>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-deep-700 text-lg font-bold text-white dark:bg-white dark:text-deep-700">
                A
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-heading">{t.contact}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                  <Building2 className="h-3.5 w-3.5" />
                  {t.company}
                </p>
              </div>
            </div>
            <span className="mt-5 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              {t.source}
            </span>

            <p className="mt-7 text-xs font-semibold text-muted">{t.stage}</p>
            <div className="mt-2 flex gap-1">
              {t.stages.map((stage, i) => (
                <span
                  key={stage}
                  className={cn(
                    "h-2 flex-1 rounded-full",
                    i < 3 ? "bg-accent" : "bg-line",
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-sm font-bold text-heading">{t.stages[2]}</p>

            <dl className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
                <dt className="text-xs text-muted">{t.value}</dt>
                <dd className="mt-1 text-lg font-bold tabular-nums text-heading">{AMOUNT}</dd>
              </div>
              <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
                <dt className="text-xs text-muted">{t.owner}</dt>
                <dd className="mt-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card-soft">
                    <UserRound className="h-3.5 w-3.5 text-muted" />
                  </span>
                  <span className="h-1.5 w-10 rounded-full bg-line" />
                </dd>
              </div>
            </dl>
          </div>

          {/* Línea de tiempo con los módulos reales. */}
          <div className={cn("rounded-3xl p-6 sm:p-8", card)}>
            <h3 className="text-xl text-heading">{t.timelineTitle}</h3>
            <ol className="relative mt-6">
              {t.activities.map((activity, i) => {
                const Icon = activityIcons[activity.icon];
                const source = activitySource[i];
                const detail = c[source.from][source.index];
                const upcoming = i === 0;
                return (
                  <li key={activity.title} className="relative flex gap-4 pb-7 last:pb-0">
                    {i < t.activities.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-5 top-11 bottom-0 w-px -translate-x-1/2 bg-line-strong"
                      />
                    )}
                    <span
                      aria-hidden
                      className={cn(
                        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        upcoming
                          ? "bg-action text-deep-700"
                          : "bg-surface text-heading ring-1 ring-line",
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0 pt-1">
                      <p className="flex flex-wrap items-center gap-2 font-bold text-heading">
                        {activity.title}
                        {upcoming && (
                          <span className="rounded-full bg-deep-700 px-2.5 py-0.5 text-[0.7rem] font-semibold text-white dark:bg-white dark:text-deep-700">
                            {t.next}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm leading-snug text-muted">{detail}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Metas y reportes: el resumen del tablero. */}
        <div className="mx-auto mt-4 max-w-6xl rounded-3xl bg-deep-950 p-6 text-white sm:p-8">
          <h3 className="text-xl text-white">{t.dashboardTitle}</h3>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {[c.features[3], c.modules[4], c.modules[5]].map((item, i) => (
              <li key={item} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <div aria-hidden className="flex h-10 items-end gap-1">
                  {[40, 65, 50, 80, 60, 95].map((h, k) => (
                    <span
                      key={k}
                      className={cn(
                        "w-full rounded-sm",
                        k === 5 - i ? "bg-brand-green" : "bg-white/20",
                      )}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm font-semibold leading-snug text-white/90">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

export const signature: ProductSignature = { Hero, Showcase };
