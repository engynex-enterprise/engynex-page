"use client";

import { useState } from "react";
import { Clock, Search, Zap } from "lucide-react";
import { rulesCopy, TRIGGERS, type RuleGroup, type TriggerKey } from "@/content/rules";
import { ruleEditorCopy } from "@/content/ruleEditor";
import { inputClass } from "@/components/auth/inputClass";
import { GROUP_ICONS } from "./icons";
import { cn } from "@/lib/utils";

const GROUPS: RuleGroup[] = ["sales", "meetings", "service", "chat", "tasks", "deals", "accounts"];

/** Selector del disparador: buscador, grupos con icono y si es instantáneo o periódico. */
export function RuleTriggerPicker({
  value,
  onChange,
  param,
  onParam,
  disabled,
}: {
  value: TriggerKey;
  onChange: (key: TriggerKey) => void;
  param: number | null;
  onParam: (v: number | null) => void;
  disabled: boolean;
}) {
  const t = rulesCopy;
  const e = ruleEditorCopy;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<RuleGroup | "all">("all");
  const meta = TRIGGERS[value];
  const Icon = GROUP_ICONS[meta.group];
  const term = q.trim().toLowerCase();
  const keys = (Object.keys(TRIGGERS) as TriggerKey[]).filter(
    (k) =>
      (group === "all" || TRIGGERS[k].group === group) &&
      (!term || `${t.triggers[k].label} ${t.triggers[k].desc}`.toLowerCase().includes(term)),
  );

  return (
    <div className="grid gap-4">
      {/* Seleccionado */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[var(--meta-active)]/60 p-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-deep-700 text-white dark:bg-brand-green dark:text-deep-700">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.95rem] font-semibold text-heading">{t.triggers[value].label}</span>
          <span className="block text-sm text-muted">{t.triggers[value].desc}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-heading ring-1 ring-line dark:bg-card">
          {meta.instant ? <Zap className="h-3.5 w-3.5" aria-hidden /> : <Clock className="h-3.5 w-3.5" aria-hidden />}
          {meta.instant ? e.instant : e.periodic}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex h-9 items-center rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]"
          >
            {e.change}
          </button>
        )}
      </div>

      {meta.param && (
        <label className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-heading">{meta.param.label}</span>
          <input
            type="number"
            min={1}
            max={meta.param.key === "minutes" ? 10080 : meta.param.key === "hours" ? 720 : 365}
            value={param ?? ""}
            onChange={(ev) => onParam(Number(ev.target.value) || null)}
            disabled={disabled}
            className={cn(inputClass, "h-10 w-28 text-sm tabular-nums")}
          />
          <span className="text-sm text-muted">{meta.param.unit}</span>
        </label>
      )}

      {open && (
        <div className="rounded-xl border border-line p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <label className="sr-only" htmlFor="trigger-search">{e.triggerSearch}</label>
              <input
                id="trigger-search"
                autoFocus
                value={q}
                onChange={(ev) => setQ(ev.target.value)}
                placeholder={e.triggerSearch}
                className="h-9 w-full rounded-[10px] bg-transparent pl-9 pr-3 text-sm text-heading outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand-green-dark"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={e.steps.when}>
            {(["all", ...GROUPS] as const).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={group === g}
                onClick={() => setGroup(g)}
                className={cn(
                  "h-8 rounded-full px-3 text-sm",
                  group === g ? "bg-deep-700 font-semibold text-white dark:bg-white dark:text-deep-700" : "text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]",
                )}
              >
                {g === "all" ? e.anyValue : t.groups[g]}
              </button>
            ))}
          </div>
          <div className="mt-3 grid max-h-[26rem] gap-4 overflow-y-auto pr-1">
            {keys.length === 0 && <p className="py-6 text-center text-sm text-muted">{e.triggerNone}</p>}
            {GROUPS.filter((g) => keys.some((k) => TRIGGERS[k].group === g)).map((g) => {
              const GIcon = GROUP_ICONS[g];
              return (
                <div key={g}>
                  <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                    <GIcon className="h-3.5 w-3.5" aria-hidden />
                    {t.groups[g]}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {keys
                      .filter((k) => TRIGGERS[k].group === g)
                      .map((k) => (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={k === value}
                          onClick={() => {
                            onChange(k);
                            setOpen(false);
                            setQ("");
                          }}
                          className={cn(
                            "flex items-start gap-2.5 rounded-lg p-3 text-left transition-colors",
                            k === value ? "bg-[var(--meta-active)] ring-2 ring-brand-green-dark/40" : "ring-1 ring-line hover:bg-[var(--meta-hover)]",
                          )}
                        >
                          {TRIGGERS[k].instant ? <Zap className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden /> : <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />}
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-heading">{t.triggers[k].label}</span>
                            <span className="mt-0.5 block text-xs leading-snug text-muted">{t.triggers[k].desc}</span>
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
