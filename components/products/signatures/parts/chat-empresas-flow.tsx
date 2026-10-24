"use client";

import { useId, useRef, useState } from "react";
import { Bot, Check, MessageCircle, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = { label: string; text: string; points: string[] };

type Mock = {
  channels: string[];
  inbox: string;
  question: string;
  answer: string;
  quick: string[];
  bot: string;
  agents: string[];
  assigned: string;
  metrics: string[];
  closed: string;
};

/**
 * "Del mensaje a la venta": cuatro etapas como pestañas WAI-ARIA (flechas,
 * Inicio y Fin). Cada panel trae una maqueta ilustrativa (aria-hidden) y las
 * funciones y módulos reales que intervienen en esa etapa.
 */
export function ChatFlow({
  steps,
  mock,
  label,
  pointsLabel,
  tone,
}: {
  steps: Step[];
  mock: Mock;
  label: string;
  pointsLabel: string;
  tone: "light" | "muted";
}) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const last = steps.length - 1;

  const go = (index: number) => {
    setActive(index);
    tabs.current[index]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const next = active === last ? 0 : active + 1;
    const prev = active === 0 ? last : active - 1;
    const keys: Record<string, number> = {
      ArrowDown: next,
      ArrowRight: next,
      ArrowUp: prev,
      ArrowLeft: prev,
      Home: 0,
      End: last,
    };
    if (event.key in keys) {
      event.preventDefault();
      go(keys[event.key]);
    }
  };

  const step = steps[active];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-8">
      <div
        role="tablist"
        aria-label={label}
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1 lg:content-start"
      >
        {steps.map((s, i) => {
          const selected = i === active;
          return (
            <button
              key={s.label}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 dark:focus-visible:ring-action lg:px-5 lg:py-5",
                selected
                  ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700"
                  : cn(card, "text-heading hover:bg-line"),
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                  selected ? "bg-action text-deep-700" : "bg-line text-heading dark:bg-white/10",
                )}
              >
                {i + 1}
              </span>
              <span className="text-sm font-bold leading-snug sm:text-base">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${active}`}
        tabIndex={0}
        className={cn(
          "grid overflow-hidden rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 dark:focus-visible:ring-action md:grid-cols-2",
          card,
        )}
      >
        <div
          aria-hidden
          className="flex min-h-[18rem] items-center justify-center bg-deep-950 p-6 sm:p-8"
        >
          <div key={active} className="w-full max-w-sm motion-safe:animate-slide-up">
            <StepMock index={active} mock={mock} />
          </div>
        </div>
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-bold tabular-nums text-accent">
            {String(active + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </p>
          <h3 className="mt-3 text-2xl leading-tight text-heading sm:text-[1.75rem]">
            {step.label}
          </h3>
          <p className="mt-3 text-base leading-relaxed text-body">{step.text}</p>
          <p className="mt-8 text-sm font-semibold text-muted">{pointsLabel}</p>
          <ul className="mt-3 space-y-3">
            {step.points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-sm leading-snug text-body">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StepMock({ index, mock }: { index: number; mock: Mock }) {
  if (index === 0) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-2">
          {mock.channels.map((channel) => (
            <span
              key={channel}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
            >
              {channel}
            </span>
          ))}
        </div>
        <div className="h-px flex-1 bg-brand-green/60" />
        <div className="w-36 rounded-2xl bg-deep-800 p-3 ring-1 ring-white/10">
          <p className="flex items-center gap-1.5 text-xs font-bold text-white">
            <MessageCircle className="h-3.5 w-3.5 text-brand-green" />
            {mock.inbox}
          </p>
          <div className="mt-3 space-y-2">
            {[80, 65, 72, 55].map((w, i) => (
              <div key={w} className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    i === 0 ? "bg-brand-green" : "bg-white/25",
                  )}
                />
                <span className="h-1.5 rounded-full bg-white/20" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="space-y-3">
        <p className="max-w-[80%] rounded-2xl rounded-bl-md bg-white/10 px-3.5 py-2.5 text-sm text-white">
          {mock.question}
        </p>
        <div className="ml-auto max-w-[85%]">
          <p className="mb-1 flex items-center justify-end gap-1 text-[0.7rem] font-semibold text-brand-green">
            <Bot className="h-3 w-3" />
            {mock.bot}
          </p>
          <p className="rounded-2xl rounded-br-md bg-deep-700 px-3.5 py-2.5 text-sm text-white ring-1 ring-brand-green/40">
            {mock.answer}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5 pt-1">
          {mock.quick.map((q) => (
            <span
              key={q}
              className="rounded-full px-3 py-1 text-xs font-semibold text-brand-green ring-1 ring-brand-green/50"
            >
              {q}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div>
        <div className="rounded-2xl bg-white/10 p-3">
          <span className="block h-2 w-2/3 rounded-full bg-white/40" />
          <span className="mt-2 block h-2 w-1/2 rounded-full bg-white/20" />
        </div>
        <div className="mx-auto h-6 w-px bg-brand-green/60" />
        <div className="grid grid-cols-3 gap-2">
          {mock.agents.map((agent, i) => (
            <div
              key={agent}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl p-3 text-center",
                i === 1 ? "bg-action text-deep-700" : "bg-white/5 text-white/60",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  i === 1 ? "bg-deep-700 text-brand-green" : "bg-white/10",
                )}
              >
                <UserRound className="h-4 w-4" />
              </span>
              <span className="text-[0.7rem] font-semibold">{agent}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-white/80">
          <Check className="h-3.5 w-3.5 text-brand-green" />
          {mock.assigned}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-action px-3 py-1 text-xs font-bold text-deep-700">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        {mock.closed}
      </p>
      <div className="mt-4 space-y-3">
        {mock.metrics.map((metric, i) => (
          <div key={metric} className="rounded-2xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-white/80">{metric}</p>
            <div className="mt-2 h-1.5 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-brand-green"
                style={{ width: `${[72, 58, 84][i % 3]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
