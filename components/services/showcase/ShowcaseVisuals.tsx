import { ArrowDown, BellRing, Check, Laptop, MousePointerClick, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ilustraciones de la sección de resultados (solo CSS, sin imágenes): un
 * calendario de entregas, un embudo de conversión y el editor de contenidos.
 * Son decorativas: el texto de cada tarjeta dice lo mismo.
 */
const frame = "relative h-64 overflow-hidden rounded-3xl bg-surface-soft p-6 sm:h-72 dark:bg-white/[0.04]";

export function TimelineVisual({ week, review, live }: { week: string; review: string; live: string }) {
  const weeks = [
    { w: 92, label: review },
    { w: 70, label: review },
    { w: 84, label: review },
    { w: 100, label: live },
  ];
  return (
    <div className={frame} aria-hidden>
      <div className="grid h-full content-center gap-3.5">
        {weeks.map((x, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs font-medium text-muted">
              {week} {i * 2 + 2}
            </span>
            <span className="relative h-9 flex-1 rounded-full bg-white shadow-sm dark:bg-white/[0.06]">
              <span
                className={cn("absolute inset-y-1 left-1 flex items-center justify-end rounded-full pr-3 text-[0.7rem] font-semibold", i === 3 ? "bg-brand-green text-deep-700" : "bg-deep-700/90 text-white dark:bg-white/20")}
                style={{ width: `calc(${x.w}% - 0.5rem)` }}
              >
                {i === 3 && <Check className="mr-1 h-3.5 w-3.5" strokeWidth={3} />}
                {x.label}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FUNNEL_WIDTHS = [100, 62, 32];

export function FunnelVisual({ rows: data }: { rows: { label: string; value: string }[] }) {
  const rows = data.slice(0, 3).map((r, i) => ({ label: r.label, n: r.value, w: FUNNEL_WIDTHS[i] }));
  return (
    <div className={frame} aria-hidden>
      <MousePointerClick className="absolute right-6 top-6 h-5 w-5 text-brand-green-dark dark:text-brand-green" />
      <div className="grid h-full content-center gap-4">
        {rows.map((r, i) => (
          <div key={r.label}>
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="font-medium text-muted">{r.label}</span>
              <span className="font-semibold tabular-nums text-heading">{r.n}</span>
            </div>
            <span className="block h-3 rounded-full bg-white dark:bg-white/[0.06]">
              <span
                className={cn("block h-3 rounded-full", i === 2 ? "bg-brand-green" : i === 1 ? "bg-brand-green/60" : "bg-deep-700/80 dark:bg-white/30")}
                style={{ width: `${r.w}%` }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EditorVisual({ editor, publish, saved }: { editor: string; publish: string; saved: string }) {
  return (
    <div className={frame} aria-hidden>
      <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm dark:bg-white/[0.06]">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <PenLine className="h-4 w-4 text-muted" />
          <span className="text-xs font-semibold text-heading">{editor}</span>
          <span className="ml-auto rounded-full bg-brand-green px-3 py-1 text-[0.7rem] font-semibold text-deep-700">{publish}</span>
        </div>
        <div className="mt-4 grid gap-2.5">
          <span className="h-3 w-3/4 rounded-full bg-deep-700/80 dark:bg-white/40" />
          <span className="h-2.5 w-full rounded-full bg-line" />
          <span className="h-2.5 w-5/6 rounded-full bg-line" />
          <span className="relative mt-1 h-16 rounded-xl bg-surface-soft ring-2 ring-brand-green ring-offset-2 ring-offset-white dark:bg-white/[0.06] dark:ring-offset-transparent">
            <span className="absolute -top-2.5 left-3 rounded bg-brand-green px-1.5 text-[0.6rem] font-bold text-deep-700">IMG</span>
          </span>
        </div>
        <span className="mt-auto inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-100 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Check className="h-3 w-3" strokeWidth={3} />
          {saved}
        </span>
      </div>
    </div>
  );
}

const BARS = [38, 52, 44, 66, 58, 74, 88];

/** Tablero en vivo: dos indicadores, barras de la semana y una alerta. */
export function DashboardVisual({ title, kpis, alert }: { title: string; kpis: { label: string; value: string; delta: string }[]; alert: string }) {
  return (
    <div className={frame} aria-hidden>
      <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm dark:bg-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
          </span>
          <span className="text-xs font-semibold text-heading">{title}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {kpis.slice(0, 2).map((k) => (
            <div key={k.label} className="rounded-xl bg-surface-soft px-3 py-2 dark:bg-white/[0.06]">
              <span className="block text-[0.65rem] text-muted">{k.label}</span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold tabular-nums text-heading">{k.value}</span>
                <span className="text-[0.65rem] font-semibold text-brand-green-dark dark:text-brand-green">{k.delta}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-1 items-end gap-1.5">
          {BARS.map((h, i) => (
            <span key={i} className={cn("flex-1 rounded-t-md", i === BARS.length - 1 ? "bg-brand-green" : "bg-deep-700/80 dark:bg-white/30")} style={{ height: `${h}%` }} />
          ))}
        </div>
        <span className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1.5 text-[0.68rem] font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
          <BellRing className="h-3.5 w-3.5 shrink-0" />
          {alert}
        </span>
      </div>
    </div>
  );
}

/** Renting: la compra se paga el primer día; el renting, en cuotas iguales. */
export function CashVisual({ buyLabel, buyHint, rentLabel, rentHint }: { buyLabel: string; buyHint: string; rentLabel: string; rentHint: string }) {
  return (
    <div className={frame} aria-hidden>
      <div className="grid h-full content-center gap-6">
        <div>
          <div className="mb-2 flex items-baseline justify-between text-xs">
            <span className="font-semibold text-heading">{buyLabel}</span>
            <span className="text-muted">{buyHint}</span>
          </div>
          <div className="flex h-14 items-end gap-1">
            <span className="h-full w-[12%] rounded-md bg-deep-700/85 dark:bg-white/40" />
            {Array.from({ length: 11 }, (_, i) => (
              <span key={i} className="h-1 flex-1 rounded-full bg-line" />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between text-xs">
            <span className="font-semibold text-heading">{rentLabel}</span>
            <span className="text-muted">{rentHint}</span>
          </div>
          <div className="flex h-14 items-end gap-1">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="h-[22%] flex-1 rounded-md bg-brand-green" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Renting: pasos del reemplazo de un equipo con falla. */
export function SwapVisual({ steps }: { steps: string[] }) {
  return (
    <div className={frame} aria-hidden>
      <ol className="grid h-full content-center gap-1.5">
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          return (
            <li key={s} className="grid justify-items-center gap-1.5">
              <span className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm", i === 0 ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200" : last ? "bg-brand-green text-deep-700" : "bg-white text-heading dark:bg-white/[0.06]")}>
                <Laptop className="h-4 w-4 shrink-0" />
                {s}
                {last && <Check className="ml-auto h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              {!last && <ArrowDown className="h-3 w-3 text-muted" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const INVENTORY_TONE = {
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  service: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  renew: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
} as const;

/** Renting: inventario por equipo, usuario y estado. */
export function InventoryVisual({ title, rows }: { title: string; rows: { device: string; user: string; status: string; tone: "ok" | "service" | "renew" }[] }) {
  return (
    <div className={frame} aria-hidden>
      <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm dark:bg-white/[0.06]">
        <p className="text-xs font-semibold text-heading">{title}</p>
        <ul className="mt-3 grid flex-1 content-center gap-2">
          {rows.map((r) => (
            <li key={r.device + r.user} className="flex items-center gap-2.5 rounded-lg bg-surface-soft px-2.5 py-2 dark:bg-white/[0.04]">
              <Laptop className="h-4 w-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.7rem] font-semibold text-heading">{r.device}</span>
                <span className="block truncate text-[0.65rem] text-muted">{r.user}</span>
              </span>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold", INVENTORY_TONE[r.tone])}>{r.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Anillo de puntaje tipo Lighthouse. */
export function ScoreRing({ value, label, display }: { value: number; label: string; display?: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center text-center">
      <svg viewBox="0 0 100 100" className="h-24 w-24 sm:h-28 sm:w-28" role="img" aria-label={`${label}: ${display ?? value}`}>
        <circle cx="50" cy="50" r={r} fill="rgba(159,219,79,0.08)" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#9fdb4f"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="57" textAnchor="middle" className={cn("fill-white font-semibold", (display ?? String(value)).length > 3 ? "text-[1.3rem]" : "text-[1.6rem]")}>
          {display ?? value}
        </text>
      </svg>
      <span className="mt-3 text-sm text-ink-100/80">{label}</span>
    </div>
  );
}
