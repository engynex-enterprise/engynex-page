"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { createClient } from "@/lib/supabase/client";
import type { LeadTier } from "@/lib/supabase/types";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { tierStyles } from "@/lib/tiers";
import { dayKey, fmtTime } from "./shared";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type PickedLead = { id: string; name: string; email: string; phone: string; company: string | null; tier: LeadTier; locale: string | null };

const field =
  "h-11 w-full rounded-[10px] bg-[#f4f4f5] px-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]";

/** Buscador de leads (nombre, correo o empresa). */
export function LeadPicker({
  value,
  onChange,
  placeholder,
  noResults,
  label,
}: {
  value: PickedLead | null;
  onChange: (lead: PickedLead | null) => void;
  placeholder: string;
  noResults: string;
  label: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const [hits, setHits] = useState<PickedLead[] | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const search = (q: string) => {
    setQuery(q);
    window.clearTimeout(timer.current);
    const term = q.trim().replace(/[%,()]/g, "");
    if (term.length < 2) return setHits(null);
    timer.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, name, email, phone, company, tier, locale")
        .or(`name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%`)
        .order("created_at", { ascending: false })
        .limit(8);
      setHits((data ?? []) as PickedLead[]);
    }, 250);
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-line">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", tierStyles[value.tier].dot)} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-heading">{value.name}</span>
          <span className="block truncate text-xs text-muted">{[value.company, value.email].filter(Boolean).join(" · ")}</span>
        </span>
        <button type="button" onClick={() => onChange(null)} aria-label="×" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)]">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }
  return (
    <div className="relative">
      <input ref={setInput} autoFocus value={query} onChange={(e) => search(e.target.value)} placeholder={placeholder} aria-label={label} className={field} />
      {hits && (
        <FloatingPanel anchor={input} open onClose={() => setHits(null)} align="start" matchWidth className="max-h-64 rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card">
          <ul>
            {hits.length === 0 && <li className="px-3 py-2 text-sm text-muted">{noResults}</li>}
            {hits.map((h) => (
              <li key={h.id}>
                <button type="button" onClick={() => onChange(h)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-[var(--meta-hover)]">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", tierStyles[h.tier].dot)} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-heading">{h.name}</span>
                    <span className="block truncate text-xs text-muted">{[h.company, h.email].filter(Boolean).join(" · ")}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </FloatingPanel>
      )}
    </div>
  );
}

/**
 * Día + horarios libres (según disponibilidad, reuniones y bloqueos). También
 * permite una hora distinta con el selector completo.
 */
export function SlotPicker({
  locale,
  value,
  onChange,
  duration,
  labels,
}: {
  locale: Locale;
  value: string | null;
  onChange: (iso: string | null) => void;
  duration: number;
  labels: { day: string; noSlots: string; otherTime: string };
}) {
  const supabase = useMemo(() => createClient(), []);
  const [day, setDay] = useState<string | null>(value ? `${dayKey(value)}T17:00:00.000Z` : null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [custom, setCustom] = useState(false);
  const dayStr = day ? dayKey(day) : null;

  useEffect(() => {
    if (!dayStr) return;
    let alive = true;
    void supabase.rpc("staff_free_slots", { p_day: dayStr, p_duration: duration }).then(({ data }) => {
      if (alive) setSlots(((data ?? []) as { starts_at: string }[]).map((s) => s.starts_at));
    });
    return () => {
      alive = false;
    };
  }, [supabase, dayStr, duration]);

  return (
    <div className="grid gap-3">
      <DateTimePicker size="md" mode="date" label={labels.day} value={day} onChange={(v) => { setDay(v); setSlots(null); }} locale={locale} minDate={dayKey(new Date())} />
      {dayStr && !custom && (
        <div>
          {slots === null ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted">{labels.noSlots}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5" role="listbox" aria-label={labels.day}>
              {slots.map((s) => {
                const on = value != null && new Date(value).getTime() === new Date(s).getTime();
                return (
                  <button
                    key={s}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => onChange(new Date(s).toISOString())}
                    className={cn(
                      "h-9 rounded-lg px-3 text-sm tabular-nums ring-1 transition-colors",
                      on ? "bg-brand-green-dark font-semibold text-white ring-brand-green-dark dark:bg-brand-green dark:text-deep-950" : "text-heading ring-line hover:bg-[var(--meta-hover)]",
                    )}
                  >
                    {fmtTime(locale, s)}
                  </button>
                );
              })}
            </div>
          )}
          <button type="button" onClick={() => setCustom(true)} className="mt-2 text-xs font-semibold text-accent hover:underline">
            {labels.otherTime}
          </button>
        </div>
      )}
      {custom && <DateTimePicker size="md" label={labels.otherTime} value={value} onChange={onChange} locale={locale} step={15} />}
    </div>
  );
}
