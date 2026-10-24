"use client";

import { useId, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChannelPost {
  /** Índice del día (0 = lunes). */
  day: number;
  label: string;
}

export interface Channel {
  name: string;
  what: string;
  deliverables: string[];
  posts: ChannelPost[];
}

/**
 * Tablero de canales: pestañas con cada canal real del servicio; al elegir
 * uno se ve qué hacemos ahí, qué entregamos y una semana tipo del calendario
 * (ilustrativa, sin métricas).
 */
export function MarketingChannelBoard({
  channels,
  days,
  labels,
  surface,
  inner,
}: {
  channels: Channel[];
  days: string[];
  labels: {
    tablist: string;
    what: string;
    deliverables: string;
    week: string;
    weekNote: string;
    empty: string;
  };
  surface: string;
  inner: string;
}) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();
  const channel = channels[active];

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown")
      next = (active + 1) % channels.length;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (active - 1 + channels.length) % channels.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = channels.length - 1;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div
        role="tablist"
        aria-label={labels.tablist}
        aria-orientation="vertical"
        className="flex flex-col gap-2 lg:col-span-4"
      >
        {channels.map((ch, i) => {
          const selected = i === active;
          return (
            <button
              key={ch.name}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${base}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onKeyDown}
              className={cn(
                "flex w-full items-center gap-3 rounded-full px-5 py-4 text-left text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 dark:focus-visible:ring-action",
                selected
                  ? "bg-deep-700 text-white dark:bg-action dark:text-deep-700"
                  : cn(surface, "text-heading hover:bg-line"),
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs tabular-nums",
                  selected
                    ? "bg-action text-deep-700 dark:bg-deep-700 dark:text-white"
                    : "bg-line text-muted",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="leading-snug">{ch.name}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-tab-${active}`}
        className={cn("rounded-3xl p-6 sm:p-8 lg:col-span-8", surface)}
      >
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {labels.what}
            </p>
            <h3 className="mt-2 text-2xl font-bold leading-snug text-heading">
              {channel.name}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-body">
              {channel.what}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {labels.deliverables}
            </p>
            <ul className="mt-3 space-y-2">
              {channel.deliverables.map((d) => (
                <li
                  key={d}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-heading",
                    inner,
                  )}
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-bold text-heading">{labels.week}</p>
            <p className="text-xs text-muted">{labels.weekNote}</p>
          </div>
          <ol className="mt-4 grid gap-2 sm:grid-cols-7">
            {days.map((day, d) => {
              const posts = channel.posts.filter((p) => p.day === d);
              return (
                <li
                  key={day}
                  className={cn(
                    "flex gap-3 rounded-2xl p-3 sm:min-h-32 sm:flex-col sm:gap-2",
                    inner,
                  )}
                >
                  <span className="w-10 shrink-0 text-xs font-semibold text-muted sm:w-auto">
                    {day}
                  </span>
                  <span className="flex flex-1 flex-wrap gap-1.5 sm:flex-col">
                    {posts.length === 0 ? (
                      <span className="text-xs text-muted">
                        <span aria-hidden>—</span>
                        <span className="sr-only">{labels.empty}</span>
                      </span>
                    ) : (
                      posts.map((p) => (
                        <span
                          key={p.label}
                          className="rounded-lg border-l-4 border-action bg-accent-soft px-2 py-1.5 text-xs font-semibold leading-tight text-heading"
                        >
                          {p.label}
                        </span>
                      ))
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
