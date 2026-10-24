import Image from "next/image";
import { BellRing, CalendarCheck, CheckCheck, ChevronLeft, ChevronRight, MousePointerClick, NotebookPen } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HeroActions, HeroBreadcrumb, toneClass } from "@/components/services/signatures/shared";
import { cn } from "@/lib/utils";
import type { ProductHeroProps, ProductSignature, ProductSignatureProps, Tone } from "./types";

/**
 * Agenda & Citas: la metáfora es el widget de reserva. La cabecera es una
 * fotografía a sangre con el widget flotando encima (calendario del mes,
 * día elegido, horas disponibles y "Confirmar cita") y la burbuja del
 * recordatorio por WhatsApp. La sección insignia explica la reserva en tres
 * pasos y muestra la agenda del día por profesional y recurso.
 */

const copy = {
  es: {
    widget: "Reservar cita",
    service: "Servicio",
    pro: "Profesional",
    month: "Mes",
    week: ["L", "M", "M", "J", "V", "S", "D"],
    slotsLabel: "Horas disponibles",
    confirm: "Confirmar cita",
    reminder: "Recordatorio automático",
    reminderText: "Hola, te recordamos tu cita de mañana a las 10:30. ¿Confirmas tu asistencia?",
    yes: "Sí, confirmo",
    move: "Reprogramar",
    eyebrow: "Así reservan tus clientes",
    title: "Tres pasos para el cliente, cero llamadas para tu equipo",
    subtitle: "El cliente reserva solo y a cualquier hora; tu equipo recibe la agenda lista.",
    steps: ["Elige servicio y profesional", "Escoge día y hora", "Recibe confirmación y recordatorio"],
    dayTitle: "La agenda del día",
    columns: ["Profesional 1", "Profesional 2", "Sala", "Equipo"],
    blocks: {
      booked: "Cita confirmada",
      pending: "Por confirmar",
      prep: "Preparación",
      blocked: "Bloqueo",
      virtual: "Cita virtual",
    },
    legend: "Cómo se lee",
    detail: "Al abrir una cita",
    virtualNote: "Enlace de videollamada incluido en el recordatorio.",
  },
  en: {
    widget: "Book an appointment",
    service: "Service",
    pro: "Professional",
    month: "Month",
    week: ["M", "T", "W", "T", "F", "S", "S"],
    slotsLabel: "Available times",
    confirm: "Confirm booking",
    reminder: "Automatic reminder",
    reminderText: "Hi, this is a reminder of your appointment tomorrow at 10:30. Can you confirm you'll attend?",
    yes: "Yes, I confirm",
    move: "Reschedule",
    eyebrow: "How your clients book",
    title: "Three steps for the client, zero calls for your team",
    subtitle: "Clients book on their own at any hour; your team gets the calendar ready to go.",
    steps: ["Pick service and professional", "Choose day and time", "Get confirmation and reminder"],
    dayTitle: "The day's calendar",
    columns: ["Professional 1", "Professional 2", "Room", "Equipment"],
    blocks: {
      booked: "Confirmed",
      pending: "To confirm",
      prep: "Prep time",
      blocked: "Blocked",
      virtual: "Virtual visit",
    },
    legend: "How to read it",
    detail: "When you open an appointment",
    virtualNote: "Video call link included in the reminder.",
  },
};

const slots = [
  { h: "08:00", s: "free" },
  { h: "08:30", s: "taken" },
  { h: "09:00", s: "free" },
  { h: "10:00", s: "taken" },
  { h: "10:30", s: "on" },
  { h: "11:00", s: "free" },
  { h: "14:00", s: "free" },
  { h: "15:30", s: "free" },
] as const;

function Hero({ product, locale, backLabel, backHref, categoryLabel, primary, secondary }: ProductHeroProps) {
  const c = product[locale];
  const t = copy[locale];
  // Mes ilustrativo: empieza en miércoles; los domingos no se atiende.
  const offset = 2;
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const selected = 14;

  return (
    <section className="relative isolate overflow-hidden bg-deep-950 pb-20 pt-28 text-white sm:pb-28 sm:pt-32">
      <Image src={product.image} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-deep-950/95 via-deep-950/80 to-deep-950/50" />
      <Container>
        <HeroBreadcrumb backLabel={backLabel} backHref={backHref} dark />
        <div className="mt-8 grid items-center gap-14 lg:grid-cols-[1fr_auto] lg:gap-20">
          <div className="max-w-2xl">
            {categoryLabel && <p className="text-sm font-semibold text-brand-green">{categoryLabel}</p>}
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
              {c.title}
            </h1>
            <p className="mt-5 text-xl font-medium text-white">{c.tagline}</p>
            <p className="mt-4 text-lg leading-relaxed text-white/80">{c.description}</p>
            <HeroActions primary={primary} secondary={secondary} dark className="mt-9" />
          </div>

          {/* Widget de reserva (ilustrativo). */}
          <div aria-hidden className="relative mx-auto w-full max-w-sm pt-24 lg:mx-0 lg:w-[23rem]">
            {/* Recordatorio */}
            <div className="absolute left-0 right-6 top-0 z-10 rounded-3xl rounded-bl-md bg-brand-green p-3.5 text-deep-700 shadow-card-hover sm:-left-12 sm:right-auto sm:w-72">
              <p className="flex items-center gap-1.5 text-[0.7rem] font-bold">
                <BellRing className="h-3.5 w-3.5" />
                {t.reminder}
              </p>
              <p className="mt-1.5 text-xs leading-snug">{t.reminderText}</p>
              <div className="mt-2.5 flex gap-1.5">
                <span className="rounded-full bg-deep-700 px-2.5 py-1 text-[0.65rem] font-semibold text-white">{t.yes}</span>
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[0.65rem] font-semibold">{t.move}</span>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 text-deep-700 shadow-card-hover">
              <p className="text-base font-bold">{t.widget}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[t.service, t.pro].map((label) => (
                  <span key={label} className="flex items-center justify-between rounded-xl bg-deep-100 px-3 py-2 text-xs font-semibold">
                    {label}
                    <ChevronRight className="h-3.5 w-3.5 rotate-90 text-deep-500" />
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <ChevronLeft className="h-4 w-4 text-deep-400" />
                <span className="text-sm font-semibold">{t.month}</span>
                <ChevronRight className="h-4 w-4 text-deep-500" />
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold text-deep-400">
                {t.week.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: offset }, (_, i) => (
                  <span key={`e${i}`} />
                ))}
                {days.map((d) => {
                  const sunday = (d + offset) % 7 === 0;
                  return (
                    <span
                      key={d}
                      className={cn(
                        "grid h-8 place-items-center rounded-full",
                        d === selected && "bg-deep-700 font-bold text-white",
                        d !== selected && sunday && "text-deep-200",
                        d !== selected && !sunday && "font-medium",
                      )}
                    >
                      {d}
                    </span>
                  );
                })}
              </div>

              <p className="mt-4 text-[0.7rem] font-semibold text-deep-500">{t.slotsLabel}</p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {slots.map((s) => (
                  <span
                    key={s.h}
                    className={cn(
                      "rounded-full py-1.5 text-center text-[0.7rem] font-semibold",
                      s.s === "on" && "bg-brand-green text-deep-700",
                      s.s === "free" && "ring-1 ring-deep-200",
                      s.s === "taken" && "text-deep-200 line-through",
                    )}
                  >
                    {s.h}
                  </span>
                ))}
              </div>
              <span className="mt-4 flex h-11 items-center justify-center rounded-full bg-deep-700 text-sm font-semibold text-white">
                {t.confirm}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

type BlockKind = keyof (typeof copy)["es"]["blocks"];

/** Agenda ilustrativa: columna, fila de inicio (cada fila = 30 min desde 8:00), duración en filas. */
const agenda: { col: number; start: number; span: number; kind: BlockKind }[] = [
  { col: 0, start: 0, span: 2, kind: "booked" },
  { col: 0, start: 2, span: 1, kind: "prep" },
  { col: 0, start: 3, span: 2, kind: "booked" },
  { col: 0, start: 6, span: 2, kind: "pending" },
  { col: 1, start: 1, span: 2, kind: "virtual" },
  { col: 1, start: 4, span: 2, kind: "blocked" },
  { col: 1, start: 6, span: 3, kind: "booked" },
  { col: 2, start: 0, span: 3, kind: "booked" },
  { col: 2, start: 5, span: 1, kind: "prep" },
  { col: 2, start: 6, span: 2, kind: "booked" },
  { col: 3, start: 2, span: 2, kind: "booked" },
  { col: 3, start: 7, span: 2, kind: "blocked" },
];

const blockClass: Record<BlockKind, string> = {
  booked: "bg-deep-700 text-white",
  virtual: "bg-brand-green text-deep-700",
  pending: "bg-white text-deep-700 ring-1 ring-inset ring-deep-700/40 dark:bg-transparent dark:text-white dark:ring-white/40",
  prep: "bg-deep-200 text-deep-700 dark:bg-white/15 dark:text-white",
  blocked:
    "bg-[repeating-linear-gradient(135deg,var(--color-deep-200)_0,var(--color-deep-200)_6px,transparent_6px,transparent_12px)] text-deep-700 ring-1 ring-inset ring-deep-200 dark:bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.12)_0,rgba(255,255,255,0.12)_6px,transparent_6px,transparent_12px)] dark:text-white/80 dark:ring-white/15",
};

const ROWS = 10;

/** Quita el "Sí." / "Yes." con que empiezan las respuestas de las preguntas frecuentes. */
const stripYes = (s: string) => s.replace(/^(Sí|Yes)\.\s*/, "");

function Showcase({ product, locale, tone }: ProductSignatureProps & { tone: Tone }) {
  const c = product[locale];
  const t = copy[locale];
  const m = c.modules;
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";
  const steps = [
    { icon: MousePointerClick, title: t.steps[0], text: m[0] },
    { icon: CalendarCheck, title: t.steps[1], text: `${c.features[0]}. ${m[4]}.` },
    { icon: BellRing, title: t.steps[2], text: `${c.features[1]}. ${stripYes(c.faqs[2]?.a ?? "")}` },
  ];
  const hours = Array.from({ length: ROWS }, (_, i) => `${8 + Math.floor(i / 2)}:${i % 2 ? "30" : "00"}`);
  // Leyenda: cada tipo de bloque con la función real que lo produce.
  const legend: { kind: BlockKind; text: string }[] = [
    { kind: "booked", text: m[0] },
    { kind: "pending", text: m[2] },
    { kind: "virtual", text: t.virtualNote },
    { kind: "prep", text: c.benefits[2]?.description ?? "" },
    { kind: "blocked", text: stripYes(c.faqs[0]?.a ?? "") },
  ];

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <SectionHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} size="lg" />

        {/* Tres pasos */}
        <ol className="mx-auto mt-12 grid max-w-6xl gap-4 sm:mt-14 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className={cn("rounded-3xl p-6 ring-1 ring-line sm:p-7", card)}>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-deep-700 text-sm font-bold text-white dark:bg-white dark:text-deep-700">
                  {i + 1}
                </span>
                <s.icon className="h-5 w-5 text-accent" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-bold text-heading">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-body">{s.text}</p>
            </li>
          ))}
        </ol>

        {/* Agenda del día por profesional y recurso */}
        <div className="mx-auto mt-16 max-w-6xl sm:mt-20">
          <div className="max-w-3xl">
            <h3 className="text-2xl font-bold text-heading sm:text-3xl">{t.dayTitle}</h3>
            <p className="mt-3 text-lg leading-relaxed text-body">{m[1]}.</p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div aria-hidden className={cn("rounded-3xl p-3 ring-1 ring-line sm:p-5", card)}>
              <div className="grid grid-cols-[2.75rem_repeat(3,minmax(0,1fr))] gap-x-1.5 sm:grid-cols-[3.5rem_repeat(4,minmax(0,1fr))] sm:gap-x-2">
                <span />
                {t.columns.map((col, i) => (
                  <span
                    key={col}
                    className={cn(
                      "truncate rounded-full bg-surface px-2 py-1.5 text-center text-[0.7rem] font-semibold text-heading ring-1 ring-line sm:text-xs",
                      i === 3 && "hidden sm:block",
                    )}
                  >
                    {col}
                  </span>
                ))}
              </div>
              <div
                className="relative mt-3 grid grid-cols-[2.75rem_repeat(3,minmax(0,1fr))] [--row:2.25rem] lg:[--row:3.4rem] gap-x-1.5 sm:grid-cols-[3.5rem_repeat(4,minmax(0,1fr))] sm:gap-x-2"
                style={{ gridTemplateRows: `repeat(${ROWS}, var(--row))` }}
              >
                {hours.map((h, r) => (
                  <span
                    key={h}
                    className="border-t border-line pt-0.5 text-[0.65rem] font-medium text-muted"
                    style={{ gridColumn: 1, gridRow: r + 1 }}
                  >
                    {r % 2 === 0 ? h : ""}
                  </span>
                ))}
                {hours.map((h, r) => (
                  <span
                    key={`line-${h}`}
                    className="border-t border-line"
                    style={{ gridColumn: "2 / -1", gridRow: r + 1 }}
                  />
                ))}
                {agenda.map((b) => (
                  <span
                    key={`${b.col}-${b.start}`}
                    className={cn(
                      "z-10 m-0.5 overflow-hidden rounded-xl px-2 py-1.5 text-[0.65rem] font-semibold leading-tight sm:text-xs",
                      blockClass[b.kind],
                      b.col === 3 && "hidden sm:block",
                    )}
                    style={{ gridColumn: b.col + 2, gridRow: `${b.start + 1} / span ${b.span}` }}
                  >
                    <span className="line-clamp-2">{t.blocks[b.kind]}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className={cn("rounded-3xl p-6 ring-1 ring-line", card)}>
                <p className="text-sm font-semibold text-muted">{t.legend}</p>
                <ul className="mt-4 space-y-4">
                  {legend.map((l) => (
                    <li key={l.kind} className="flex gap-3">
                      <span className={cn("block h-5 w-5 shrink-0 rounded-md", blockClass[l.kind])} aria-hidden />
                      <span className="text-sm leading-snug text-body">
                        <span className="font-semibold text-heading">{t.blocks[l.kind]}</span> · {l.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-deep-800 p-6 text-white">
                <p className="flex items-center gap-2 text-sm font-semibold text-brand-green">
                  <NotebookPen className="h-4 w-4" aria-hidden />
                  {t.detail}
                </p>
                <p className="mt-2 font-semibold">{c.features[3]}</p>
                <p className="mt-1 flex items-start gap-2 text-sm leading-relaxed text-white/75">
                  <CheckCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {m[3]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export const signature: ProductSignature = { Hero, Showcase };
