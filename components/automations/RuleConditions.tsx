"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { rulesCopy, type ConditionKey, type RuleConditions as Conditions } from "@/content/rules";
import { ruleEditorCopy } from "@/content/ruleEditor";
import { inputClass } from "@/components/auth/inputClass";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };
type ListKey = "tiers" | "statuses" | "problems" | "priorities" | "channels" | "sources" | "categories" | "stages" | "kinds";
const LIST_KEYS: ListKey[] = ["tiers", "statuses", "problems", "priorities", "channels", "sources", "categories", "stages", "kinds"];

/** Chips de selección múltiple (ninguno = cualquiera). */
export function Chips({ options, value, onChange, disabled }: { options: Option[]; value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm transition-colors disabled:cursor-default",
              on ? "bg-[var(--meta-active)] font-semibold text-accent ring-1 ring-brand-green-dark/40" : "text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]",
            )}
          >
            {on && <Check className="h-3.5 w-3.5" aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function TagsInput({ value, onChange, disabled }: { value: string[]; onChange: (v: string[]) => void; disabled: boolean }) {
  const e = ruleEditorCopy;
  const [draft, setDraft] = useState("");
  const add = () => {
    const tag = draft.trim().toLowerCase().slice(0, 30);
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.map((tag) => (
        <span key={tag} className="inline-flex h-8 items-center gap-1 rounded-full bg-[var(--meta-active)] pl-3 pr-1 text-sm text-heading">
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== tag))}
              aria-label={e.removeTag.replace("{tag}", tag)}
              className="grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-[var(--meta-hover)] hover:text-heading"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          value={draft}
          onChange={(ev) => setDraft(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" || ev.key === ",") {
              ev.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={e.tagsPlaceholder}
          aria-label={rulesCopy.conditions.tags_any}
          className="h-8 min-w-[14rem] flex-1 rounded-full bg-transparent px-3 text-sm text-heading outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand-green-dark"
        />
      )}
    </div>
  );
}

/**
 * Condiciones del disparador elegido. Las listas vacías significan
 * "cualquiera"; los números vacíos, "sin filtro".
 */
export function RuleConditions({
  keys,
  value,
  onChange,
  options,
  disabled,
}: {
  keys: ConditionKey[];
  value: Conditions;
  onChange: (v: Conditions) => void;
  /** Opciones de cada lista, ya filtradas para la entidad. */
  options: Partial<Record<ListKey, Option[]>>;
  disabled: boolean;
}) {
  const t = rulesCopy.conditions;
  const e = ruleEditorCopy;
  const set = <K extends keyof Conditions>(key: K, v: Conditions[K] | undefined) => {
    const next = { ...value };
    if (v === undefined || (Array.isArray(v) && v.length === 0) || v === false) delete next[key];
    else next[key] = v;
    onChange(next);
  };

  if (keys.length === 0) return <p className="text-sm text-muted">{e.noConditions}</p>;

  const row = (label: string, body: React.ReactNode, hint?: string) => (
    <div className="grid gap-2 border-b border-line pb-4 last:border-0 last:pb-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
      <div>
        <p className="text-sm font-medium text-heading">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <div className="min-w-0">{body}</div>
    </div>
  );
  const number = (key: "min_score" | "min_value" | "max_rating", placeholder: string, max: number) => (
    <input
      type="number"
      min={key === "max_rating" ? 1 : 0}
      max={max}
      value={value[key] ?? ""}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(ev) => set(key, ev.target.value === "" ? undefined : Math.max(0, Math.min(max, Number(ev.target.value))))}
      aria-label={t[key]}
      className={cn(inputClass, "h-10 w-40 text-sm tabular-nums")}
    />
  );
  const toggle = (key: "business_hours" | "outside_hours") => (
    <button
      type="button"
      role="switch"
      aria-checked={!!value[key]}
      aria-label={t[key]}
      disabled={disabled}
      onClick={() => {
        const next = { ...value };
        if (value[key]) delete next[key];
        else {
          next[key] = true;
          delete next[key === "business_hours" ? "outside_hours" : "business_hours"];
        }
        onChange(next);
      }}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", value[key] ? "bg-brand-green-dark dark:bg-brand-green" : "bg-line-strong dark:bg-white/20")}
    >
      <span className={cn("absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", value[key] ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );

  return (
    <div className="grid gap-4">
      {keys.map((k) => {
        if (LIST_KEYS.includes(k as ListKey)) {
          const opts = options[k as ListKey] ?? [];
          if (opts.length === 0) return null;
          return (
            <div key={k}>
              {row(
                t[k as ListKey],
                <Chips options={opts} value={(value[k as ListKey] as string[] | undefined) ?? []} onChange={(v) => set(k as ListKey, v)} disabled={disabled} />,
                (value[k as ListKey] as string[] | undefined)?.length ? undefined : e.anyValue,
              )}
            </div>
          );
        }
        switch (k) {
          case "tags_any":
            return <div key={k}>{row(t.tags_any, <TagsInput value={value.tags_any ?? []} onChange={(v) => set("tags_any", v)} disabled={disabled} />)}</div>;
          case "min_score":
            return <div key={k}>{row(t.min_score, number("min_score", e.numberPlaceholder, 100))}</div>;
          case "min_value":
            return <div key={k}>{row(t.min_value, number("min_value", e.numberPlaceholder, 100_000_000_000))}</div>;
          case "max_rating":
            return <div key={k}>{row(t.max_rating, number("max_rating", e.ratingPlaceholder, 5), "1 – 5")}</div>;
          case "owner":
            return (
              <div key={k}>
                {row(
                  t.owner,
                  <Chips
                    options={(["assigned", "unassigned"] as const).map((o) => ({ value: o, label: t.ownerOptions[o] }))}
                    value={value.owner ? [value.owner] : []}
                    onChange={(v) => set("owner", (v.filter((x) => x !== value.owner)[0] as Conditions["owner"]) ?? undefined)}
                    disabled={disabled}
                  />,
                  value.owner ? undefined : e.anyValue,
                )}
              </div>
            );
          case "business_hours":
          case "outside_hours":
            return (
              <div key={k}>
                {row(t[k], <div className="flex items-center gap-3">{toggle(k)}<span className="text-xs text-muted">{t.hoursHint}</span></div>)}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
