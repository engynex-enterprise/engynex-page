import { Check, MousePointerClick, PenLine } from "lucide-react";
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
