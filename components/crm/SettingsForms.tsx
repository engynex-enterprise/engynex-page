"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Availability, AvailabilityBlock, BookingSettings } from "@/lib/supabase/types";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { crmCopy } from "@/content/crm";
import { budgetKeys, decisionKeys, leadFormCopy, timelineKeys } from "@/content/leadForm";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export interface ScoringShape {
  thresholds: { green: number; yellow: number };
  problem: { described: number; category_only: number; none: number; min_text_length: number };
  budget: Record<string, number>;
  decision: Record<string, number>;
  timeline: Record<string, number>;
  rules: { no_problem_is_red: boolean; browsing_max_tier: string | null };
}

const card = "rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8 dark:bg-card";

function NumberField({
  label,
  value,
  onChange,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <label htmlFor={id} className="text-sm text-heading">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(event) => onChange(Math.max(0, Math.min(max, Number(event.target.value) || 0)))}
        className={cn(inputClass, "h-10 w-24 text-right tabular-nums")}
      />
    </div>
  );
}

function SaveBar({ saving, saved, error, label, savedLabel }: { saving: boolean; saved: boolean; error: string | null; label: string; savedLabel: string }) {
  return (
    <div className="mt-6 flex items-center gap-4">
      <button type="submit" disabled={saving} className={buttonClasses("primary", "md")}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {label}
      </button>
      <p aria-live="polite" className={cn("text-sm", error ? "text-red-600 dark:text-red-400" : "text-accent")}>
        {error ?? (saved ? savedLabel : "")}
      </p>
    </div>
  );
}

/* ======================== Puntaje ======================== */

export function ScoringForm({ locale, initial }: { locale: Locale; initial: ScoringShape }) {
  const t = crmCopy[locale].settings;
  const f = leadFormCopy[locale].steps;
  const router = useRouter();
  const [cfg, setCfg] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ScoringShape>(key: K, value: ScoringShape[K]) => {
    setCfg((c) => ({ ...c, [key]: value }));
    setSaved(false);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (cfg.thresholds.green <= cfg.thresholds.yellow) {
      return setError(`${t.greenFrom} > ${t.yellowFrom}`);
    }
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    const { error: updateError } = await supabase
      .from("scoring_config")
      .update({ config: cfg as never, updated_at: new Date().toISOString(), updated_by: user.user?.id ?? null })
      .eq("id", 1);
    setSaving(false);
    if (updateError) return setError(updateError.message);
    setSaved(true);
    router.refresh();
  };

  const group = (title: string, children: React.ReactNode) => (
    <fieldset className="rounded-2xl border border-line p-4">
      <legend className="px-2 text-sm font-bold text-heading">{title}</legend>
      <div className="divide-y divide-line">{children}</div>
    </fieldset>
  );

  return (
    <form onSubmit={save} className={card}>
      <h2 className="text-lg text-heading">{t.scoringTitle}</h2>
      <p className="mt-1 text-sm text-muted">{t.scoringHelp}</p>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {group(
          t.thresholds,
          <>
            <NumberField label={t.greenFrom} value={cfg.thresholds.green} onChange={(v) => set("thresholds", { ...cfg.thresholds, green: v })} />
            <NumberField label={t.yellowFrom} value={cfg.thresholds.yellow} onChange={(v) => set("thresholds", { ...cfg.thresholds, yellow: v })} />
          </>,
        )}
        {group(
          f.problem.title,
          <>
            <NumberField label={t.problemDescribed} value={cfg.problem.described} onChange={(v) => set("problem", { ...cfg.problem, described: v })} />
            <NumberField label={t.problemCategory} value={cfg.problem.category_only} onChange={(v) => set("problem", { ...cfg.problem, category_only: v })} />
            <NumberField label={t.problemNone} value={cfg.problem.none} onChange={(v) => set("problem", { ...cfg.problem, none: v })} />
            <NumberField label={t.minText} value={cfg.problem.min_text_length} max={500} onChange={(v) => set("problem", { ...cfg.problem, min_text_length: v })} />
          </>,
        )}
        {group(
          f.budget.title,
          budgetKeys.map((k) => (
            <NumberField key={k} label={f.budget.options[k]} value={cfg.budget[k] ?? 0} onChange={(v) => set("budget", { ...cfg.budget, [k]: v })} />
          )),
        )}
        <div className="grid gap-5">
          {group(
            f.decision.title,
            decisionKeys.map((k) => (
              <NumberField key={k} label={f.decision.options[k]} value={cfg.decision[k] ?? 0} onChange={(v) => set("decision", { ...cfg.decision, [k]: v })} />
            )),
          )}
          {group(
            f.timeline.title,
            timelineKeys.map((k) => (
              <NumberField key={k} label={f.timeline.options[k]} value={cfg.timeline[k] ?? 0} onChange={(v) => set("timeline", { ...cfg.timeline, [k]: v })} />
            )),
          )}
        </div>
        {group(
          t.rules,
          <>
            <label className="flex items-center justify-between gap-4 py-2 text-sm text-heading">
              {t.ruleNoProblem}
              <input
                type="checkbox"
                checked={cfg.rules.no_problem_is_red}
                onChange={(event) => set("rules", { ...cfg.rules, no_problem_is_red: event.target.checked })}
                className="h-5 w-5 accent-deep-700 dark:accent-brand-green"
              />
            </label>
            <label className="flex items-center justify-between gap-4 py-2 text-sm text-heading">
              {t.ruleBrowsing}
              <input
                type="checkbox"
                checked={cfg.rules.browsing_max_tier === "yellow"}
                onChange={(event) => set("rules", { ...cfg.rules, browsing_max_tier: event.target.checked ? "yellow" : null })}
                className="h-5 w-5 accent-deep-700 dark:accent-brand-green"
              />
            </label>
          </>,
        )}
      </div>
      <SaveBar saving={saving} saved={saved} error={error} label={t.save} savedLabel={t.saved} />
    </form>
  );
}

/* ======================== Agenda ======================== */

export function BookingForm({ locale, initial }: { locale: Locale; initial: BookingSettings }) {
  const t = crmCopy[locale].settings;
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const { error: updateError } = await createClient()
      .from("booking_settings")
      .update({
        duration_min: values.duration_min,
        buffer_min: values.buffer_min,
        notice_hours: values.notice_hours,
        horizon_days: values.horizon_days,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setSaving(false);
    if (updateError) return setError(updateError.message);
    setError(null);
    setSaved(true);
    router.refresh();
  };

  const field = (key: "duration_min" | "buffer_min" | "notice_hours" | "horizon_days", label: string, max: number) => (
    <NumberField
      label={label}
      value={values[key]}
      max={max}
      onChange={(v) => {
        setValues((s) => ({ ...s, [key]: v }));
        setSaved(false);
      }}
    />
  );

  return (
    <form onSubmit={save} className={card}>
      <h2 className="text-lg text-heading">{t.bookingTitle}</h2>
      <div className="mt-4 divide-y divide-line">
        {field("duration_min", t.duration, 240)}
        {field("buffer_min", t.buffer, 120)}
        {field("notice_hours", t.notice, 168)}
        {field("horizon_days", t.horizon, 60)}
      </div>
      <SaveBar saving={saving} saved={saved} error={error} label={t.save} savedLabel={t.saved} />
    </form>
  );
}

const TIMES = Array.from({ length: 33 }, (_, i) => {
  const m = 6 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});

export function AvailabilityForm({ locale, initial }: { locale: Locale; initial: Availability[] }) {
  const t = crmCopy[locale].settings;
  const [rows, setRows] = useState(initial);
  const [draft, setDraft] = useState({ weekday: "1", start: "08:00", end: "12:00" });
  const [error, setError] = useState<string | null>(null);
  const fmt = (time: string) =>
    new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(`1970-01-01T${time.slice(0, 5)}:00Z`));

  const add = async () => {
    if (draft.end <= draft.start) return setError(`${t.to} > ${t.from}`);
    setError(null);
    const { data, error: insertError } = await createClient()
      .from("availability")
      .insert({ weekday: Number(draft.weekday), start_time: draft.start, end_time: draft.end })
      .select()
      .single();
    if (insertError) return setError(insertError.message);
    setRows((r) => [...r, data]);
  };

  const remove = async (id: number) => {
    const { error: deleteError } = await createClient().from("availability").delete().eq("id", id);
    if (!deleteError) setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <section className={card}>
      <h2 className="text-lg text-heading">{t.hoursTitle}</h2>
      <p className="mt-1 text-sm text-muted">{t.hoursHelp}</p>
      <ul className="mt-5 divide-y divide-line">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => {
          const ranges = rows.filter((r) => r.weekday === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
          return (
            <li key={day} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
              <span className="w-28 shrink-0 text-sm font-bold text-heading">{t.weekdays[day]}</span>
              <div className="flex flex-wrap gap-2">
                {ranges.length === 0 && <span className="text-sm text-muted">—</span>}
                {ranges.map((r) => (
                  <span key={r.id} className="inline-flex items-center gap-1 rounded-full bg-surface-soft py-1 pl-3 pr-1 text-sm tabular-nums text-heading dark:bg-white/[0.06]">
                    {fmt(r.start_time)} – {fmt(r.end_time)}
                    <button type="button" onClick={() => remove(r.id)} aria-label={`${t.remove} ${t.weekdays[day]} ${fmt(r.start_time)}`} className="grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-surface hover:text-red-600 dark:hover:bg-white/10">
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <Select size="md" label={t.day} value={draft.weekday} onChange={(v) => setDraft((d) => ({ ...d, weekday: v }))} options={[1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: String(d), label: t.weekdays[d] }))} />
        <Select size="md" label={t.from} value={draft.start} onChange={(v) => setDraft((d) => ({ ...d, start: v }))} options={TIMES.map((x) => ({ value: x, label: fmt(x) }))} />
        <Select size="md" label={t.to} value={draft.end} onChange={(v) => setDraft((d) => ({ ...d, end: v }))} options={TIMES.map((x) => ({ value: x, label: fmt(x) }))} />
        <button type="button" onClick={add} className={buttonClasses("dark", "md", "h-16")}>
          <Plus className="h-4 w-4" aria-hidden />
          {t.addRange}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </section>
  );
}

export function BlocksForm({ locale, initial }: { locale: Locale; initial: AvailabilityBlock[] }) {
  const t = crmCopy[locale].settings;
  const [rows, setRows] = useState(initial);
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = useId();
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(iso));

  const add = async () => {
    if (!start || !end || Date.parse(end) <= Date.parse(start)) return setError(`${t.blockEnd} > ${t.blockStart}`);
    setError(null);
    const { data, error: insertError } = await createClient()
      .from("availability_blocks")
      .insert({ starts_at: start, ends_at: end, reason: reason.trim() || null })
      .select()
      .single();
    if (insertError) return setError(insertError.message);
    setRows((r) => [...r, data].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
    setStart(null);
    setEnd(null);
    setReason("");
  };

  const remove = async (blockId: number) => {
    const { error: deleteError } = await createClient().from("availability_blocks").delete().eq("id", blockId);
    if (!deleteError) setRows((r) => r.filter((x) => x.id !== blockId));
  };

  return (
    <section className={card}>
      <h2 className="text-lg text-heading">{t.blocksTitle}</h2>
      <p className="mt-1 text-sm text-muted">{t.blocksHelp}</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.noBlocks}</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {rows.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-bold text-heading first-letter:uppercase">
                  {fmt(b.starts_at)} – {fmt(b.ends_at)}
                </p>
                {b.reason && <p className="text-xs text-muted">{b.reason}</p>}
              </div>
              <button type="button" onClick={() => remove(b.id)} aria-label={t.remove} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-soft hover:text-red-600 dark:hover:bg-white/10">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
        <DateTimePicker label={t.blockStart} value={start} onChange={setStart} locale={locale} />
        <DateTimePicker label={t.blockEnd} value={end} onChange={setEnd} locale={locale} />
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-reason`} className="mb-2 block text-sm font-semibold text-heading">
            {t.blockReason}
          </label>
          <input id={`${id}-reason`} value={reason} onChange={(event) => setReason(event.target.value)} className={inputClass} />
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="button" onClick={add} className={buttonClasses("dark", "md", "mt-4")}>
        <Plus className="h-4 w-4" aria-hidden />
        {t.addBlock}
      </button>
    </section>
  );
}
