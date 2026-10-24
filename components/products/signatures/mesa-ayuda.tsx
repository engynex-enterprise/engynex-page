import { ArrowRight, BookOpen, Check, Search, UserRound } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "@/components/services/signatures/shared";
import type { ProductHeroProps, ProductSignature, ProductSignatureProps, Tone } from "./types";

/**
 * Mesa de Ayuda: la cabecera es un ticket abierto con su prioridad, categoría
 * y el anillo del reloj de SLA (sin cifras), junto al buscador de la base de
 * conocimiento. La sección insignia es el ciclo de vida del ticket en cuatro
 * columnas, con las funciones reales que actúan en cada estado.
 */
const copy = {
  es: {
    ticket: "Ticket",
    ticketTitle: "No puedo acceder al sistema",
    status: "Abierto",
    priority: "Prioridad",
    priorityValue: "Alta",
    category: "Categoría",
    categoryValue: "Accesos",
    channel: "Canal",
    channelValue: "Portal",
    owner: "Responsable",
    sla: "SLA",
    slaNote: "Tiempo restante",
    kbTitle: "Base de conocimiento",
    kbQuery: "restablecer contraseña",
    kbResults: ["Cómo restablecer tu contraseña", "Acceso desde un equipo nuevo", "Solicitar permisos"],
    showcaseEyebrow: "Ciclo de vida",
    showcaseTitle: "De la solicitud a la solución",
    showcaseSubtitle:
      "Cada caso avanza por estados claros, con responsable y reloj de SLA. Así se ve un ticket de principio a fin.",
    columns: [
      { label: "Nuevo", text: "La solicitud entra por cualquier canal y se convierte en ticket." },
      { label: "Asignado", text: "Se clasifica, se prioriza y llega al responsable con su SLA." },
      { label: "En progreso", text: "El equipo trabaja el caso con la información y el contexto a la mano." },
      { label: "Resuelto", text: "Se cierra, se mide y el usuario califica la atención." },
    ],
  },
  en: {
    ticket: "Ticket",
    ticketTitle: "I can't access the system",
    status: "Open",
    priority: "Priority",
    priorityValue: "High",
    category: "Category",
    categoryValue: "Access",
    channel: "Channel",
    channelValue: "Portal",
    owner: "Owner",
    sla: "SLA",
    slaNote: "Time remaining",
    kbTitle: "Knowledge base",
    kbQuery: "reset password",
    kbResults: ["How to reset your password", "Signing in from a new device", "Requesting permissions"],
    showcaseEyebrow: "Lifecycle",
    showcaseTitle: "From request to resolution",
    showcaseSubtitle:
      "Every case moves through clear states, with an owner and an SLA clock. This is a ticket from start to finish.",
    columns: [
      { label: "New", text: "The request comes in on any channel and becomes a ticket." },
      { label: "Assigned", text: "It's categorized, prioritized and routed to its owner with an SLA." },
      { label: "In progress", text: "The team works the case with the information and context at hand." },
      { label: "Resolved", text: "It's closed, measured and the user rates the service." },
    ],
  },
};

/** Funciones (`features`) y módulos (`modules`) reales de cada estado, por índice. */
const columnMap = [
  { features: [], modules: [0, 3] },
  { features: [], modules: [1] },
  { features: [], modules: [2, 4] },
  { features: [], modules: [5] },
];

/** Anillo del reloj de SLA: solo el arco, sin cifras. */
function SlaRing({ progress, className }: { progress: number; className?: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className={className}>
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-line" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - progress)}
        transform="rotate(-90 32 32)"
        className="stroke-accent"
      />
    </svg>
  );
}

function Hero({ product, locale, categoryLabel, ...props }: ProductHeroProps) {
  const c = product[locale];
  const t = copy[locale];
  const fields = [
    { k: t.priority, v: t.priorityValue, strong: true },
    { k: t.category, v: t.categoryValue },
    { k: t.channel, v: t.channelValue },
  ];

  return (
    <section className="relative overflow-hidden bg-surface-soft pb-16 pt-28 sm:pb-24 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} />

        <div className="mt-8 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            {categoryLabel && (
              <p className="text-sm font-semibold text-accent">{categoryLabel}</p>
            )}
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
              {c.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              {c.tagline}
            </p>
            <HeroActions
              primary={props.primary}
              secondary={props.secondary}
              className="mt-9"
            />
          </div>

          {/* Ticket con reloj de SLA + buscador de la base de conocimiento (ilustrativos). */}
          <div aria-hidden className="relative mx-auto w-full max-w-xl pb-28 sm:pb-24">
            <div className="rounded-3xl bg-card p-6 ring-1 ring-line sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted">
                    {t.ticket} <span className="tabular-nums">#—</span>
                  </p>
                  <p className="mt-2 text-xl font-bold leading-snug text-heading sm:text-2xl">
                    {t.ticketTitle}
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-deep-700 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-deep-700">
                    {t.status}
                  </span>
                </div>
                <div className="relative shrink-0 text-center">
                  <SlaRing progress={0.62} className="h-20 w-20 sm:h-24 sm:w-24" />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-heading">
                    {t.sla}
                  </span>
                  <p className="mt-1 text-[0.7rem] text-muted">{t.slaNote}</p>
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                {fields.map((f) => (
                  <div key={f.k} className="rounded-2xl bg-surface-soft p-3">
                    <dt className="text-[0.7rem] text-muted">{f.k}</dt>
                    <dd
                      className={cn(
                        "mt-1 truncate text-sm font-bold",
                        f.strong ? "text-heading" : "text-body",
                      )}
                    >
                      {f.strong && (
                        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-action align-middle" />
                      )}
                      {f.v}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 space-y-2">
                <span className="block h-2 w-full rounded-full bg-line" />
                <span className="block h-2 w-4/5 rounded-full bg-line" />
              </div>
              <div className="mt-6 flex items-center gap-2.5 border-t border-line pt-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card-soft">
                  <UserRound className="h-4 w-4 text-muted" />
                </span>
                <span className="text-xs font-semibold text-muted">{t.owner}</span>
                <span className="h-1.5 w-16 rounded-full bg-line" />
              </div>
            </div>

            {/* Buscador de la base de conocimiento, superpuesto. */}
            <div className="absolute bottom-0 left-4 right-4 rounded-3xl bg-deep-950 p-4 text-white shadow-[0_24px_48px_-24px_rgba(11,16,32,0.6)] sm:left-auto sm:right-[-1rem] sm:w-80 sm:p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-green">
                <BookOpen className="h-3.5 w-3.5" />
                {t.kbTitle}
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm">
                <Search className="h-4 w-4 shrink-0 text-white/60" />
                <span className="truncate">{t.kbQuery}</span>
                <span className="h-4 w-px bg-brand-green motion-safe:animate-pulse" />
              </div>
              <ul className="mt-3 hidden space-y-1.5 sm:block">
                {t.kbResults.map((r) => (
                  <li key={r} className="truncate rounded-xl px-2 py-1 text-xs text-white/75 first:bg-white/5 first:text-white">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
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
  const last = t.columns.length - 1;

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <SectionHeading
          eyebrow={t.showcaseEyebrow}
          title={t.showcaseTitle}
          subtitle={t.showcaseSubtitle}
          size="lg"
        />

        <ol className="mt-12 grid gap-4 sm:mt-14 md:grid-cols-2 xl:grid-cols-4">
          {t.columns.map((col, i) => {
            const points = [
              ...columnMap[i].features.map((k) => c.features[k]),
              ...columnMap[i].modules.map((k) => c.modules[k]),
            ].filter(Boolean);
            const resolved = i === last;
            return (
              <li key={col.label} className={cn("relative flex flex-col rounded-3xl p-6", card)}>
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-sm font-bold",
                      resolved
                        ? "bg-action text-deep-700"
                        : "bg-deep-700 text-white dark:bg-white dark:text-deep-700",
                    )}
                  >
                    {col.label}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Miniatura del ticket en este estado (ilustrativa). */}
                <div aria-hidden className="mt-5 rounded-2xl bg-surface p-4 ring-1 ring-line">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <span className="block h-2 w-3/4 rounded-full bg-line-strong" />
                      <span className="block h-2 w-1/2 rounded-full bg-line" />
                    </div>
                    {resolved ? (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-action text-deep-700">
                        <Check className="h-5 w-5" strokeWidth={3} />
                      </span>
                    ) : (
                      <SlaRing
                        progress={i === 0 ? 0.1 : i === 1 ? 0.35 : 0.7}
                        className="h-10 w-10 shrink-0"
                      />
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full",
                        i === 0 ? "border border-dashed border-line-strong" : "bg-card-soft",
                      )}
                    >
                      {i > 0 && <UserRound className="h-3.5 w-3.5 text-muted" />}
                    </span>
                    <span className="h-1.5 w-12 rounded-full bg-line" />
                  </div>
                </div>

                <p className="mt-5 text-base leading-relaxed text-body">{col.text}</p>
                <ul className="mt-5 space-y-3 border-t border-line pt-5">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                        <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                      </span>
                      <span className="text-sm leading-snug text-body">{point}</span>
                    </li>
                  ))}
                </ul>

                {i < last && (
                  <span
                    aria-hidden
                    className="absolute -right-3.5 top-7 z-10 hidden h-7 w-7 items-center justify-center rounded-full bg-surface text-heading ring-1 ring-line xl:flex"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

export const signature: ProductSignature = { Hero, Showcase };
