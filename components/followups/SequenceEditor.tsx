"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, Loader2, Mail, Plus, Send, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";
import { followupEditorCopy } from "@/content/followupEditor";
import {
  FOLLOWUP_VARIABLES,
  MAX_STEPS,
  defaultAbandonedTexts,
  defaultStepTexts,
  normalizeFollowupConfig,
  type EmailTexts,
  type FollowupConfig,
  type StepConfig,
} from "@/content/followupDefaults";
import { Select } from "@/components/ui/Select";
import { inputClass } from "@/components/auth/inputClass";
import { buttonClasses } from "@/components/ui/Button";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Texts = Record<Locale, EmailTexts>;
type StepDraft = { enabled: boolean; delay_minutes: number; texts: Texts };
type Draft = Omit<FollowupConfig, "steps" | "abandoned_texts"> & { steps: StepDraft[]; abandoned: Texts };
type Unit = "minutes" | "hours" | "days";

const LOCALES: Locale[] = ["es", "en"];
const FIELDS: (keyof EmailTexts)[] = ["subject", "title", "body", "cta"];
const FACTOR: Record<Unit, number> = { minutes: 1, hours: 60, days: 1440 };
const TIERS = ["green", "yellow", "red"] as const;
const TIER_DOT: Record<string, string> = { green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-red-500" };

const emptyTexts = (): Texts => ({
  es: { subject: "", title: "", body: "", cta: "" },
  en: { subject: "", title: "", body: "", cta: "" },
});
/** Lo guardado (solo lo que difiere del texto predeterminado) a campos editables. */
const textsFrom = (saved: Partial<Record<Locale, Partial<EmailTexts>>> | undefined): Texts => {
  const t = emptyTexts();
  for (const l of LOCALES) for (const f of FIELDS) t[l][f] = saved?.[l]?.[f] ?? "";
  return t;
};
/** Solo se guarda lo escrito que no sea igual al texto predeterminado. */
const overrides = (texts: Texts, defaults: (l: Locale) => EmailTexts) => {
  const out: Partial<Record<Locale, Partial<EmailTexts>>> = {};
  for (const l of LOCALES) {
    for (const f of FIELDS) {
      const v = texts[l][f].trim();
      if (v && v !== defaults(l)[f]) (out[l] ??= {})[f] = v;
    }
  }
  return Object.keys(out).length ? out : undefined;
};
const stepDefaults = (i: number) => (l: Locale) => defaultStepTexts[l][i] ?? defaultStepTexts[l][defaultStepTexts[l].length - 1];

function toDraft(raw: unknown): Draft {
  const c = normalizeFollowupConfig(raw);
  return {
    tiers: c.tiers,
    window: { ...c.window, days: [...c.window.days] },
    abandoned_delay_minutes: c.abandoned_delay_minutes,
    steps: c.steps.map((s) => ({ enabled: s.enabled !== false, delay_minutes: Math.max(0, s.delay_minutes ?? 0), texts: textsFrom(s.texts) })),
    abandoned: textsFrom(c.abandoned_texts),
  };
}

function toConfig(d: Draft): FollowupConfig {
  return {
    tiers: d.tiers,
    window: d.window,
    abandoned_delay_minutes: Math.max(15, Math.round(d.abandoned_delay_minutes) || 60),
    steps: d.steps.map((s, i): StepConfig => {
      const texts = overrides(s.texts, stepDefaults(i));
      return { enabled: s.enabled, delay_minutes: Math.max(0, Math.round(s.delay_minutes)), ...(texts ? { texts } : {}) };
    }),
    ...(() => {
      const texts = overrides(d.abandoned, (l) => defaultAbandonedTexts[l]);
      return texts ? { abandoned_texts: texts } : {};
    })(),
  };
}

const unitOf = (minutes: number): Unit => (minutes > 0 && minutes % 1440 === 0 ? "days" : minutes > 0 && minutes % 60 === 0 ? "hours" : "minutes");

/* ---------------- Piezas ---------------- */

function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={cn("flex items-center justify-between gap-4 py-1.5", disabled ? "cursor-default" : "cursor-pointer")}>
      <span className="text-sm text-heading">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:opacity-60",
          checked ? "bg-brand-green-dark dark:bg-brand-green" : "bg-line-strong",
        )}
      >
        <span className={cn("absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[1.375rem]" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

function Card({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 dark:bg-card">
      <h2 className="text-[0.98rem] font-semibold text-heading">{title}</h2>
      <p className="mt-0.5 max-w-3xl text-sm text-muted">{hint}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const small = cn(inputClass, "h-10 text-sm");
const area = cn(inputClass, "h-auto resize-y py-2.5 text-sm leading-relaxed");
const labelCls = "mb-1 block text-xs font-semibold text-muted";
const ghostBtn = "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50";
const iconBtn = "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading disabled:opacity-30 disabled:hover:bg-transparent";

/** Pestañas ES/EN. */
function LangTabs({ value, onChange }: { value: Locale; onChange: (l: Locale) => void }) {
  return (
    <div className="inline-flex rounded-[10px] bg-card-soft p-0.5 dark:bg-white/[0.06]" role="tablist">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={value === l}
          onClick={() => onChange(l)}
          className={cn("h-7 rounded-lg px-3 text-xs font-semibold uppercase", value === l ? "bg-surface text-heading shadow-sm dark:bg-card" : "text-muted hover:text-heading")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/** Campos de un correo (asunto, título, mensaje, botón) en un idioma. */
function TextsFields({
  texts,
  defaults,
  onChange,
  disabled,
  locale,
  bodyRef,
}: {
  texts: EmailTexts;
  defaults: EmailTexts;
  onChange: (p: Partial<EmailTexts>) => void;
  disabled: boolean;
  locale: Locale;
  bodyRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const t = followupEditorCopy[locale].sequence.steps;
  const insert = (variable: string) => {
    const el = bodyRef?.current;
    const current = texts.body || defaults.body;
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    const piece = variable === "{recursos}" ? `\n\n${variable}\n\n` : variable;
    onChange({ body: current.slice(0, start) + piece + current.slice(end) });
    window.setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(start + piece.length, start + piece.length);
    }, 0);
  };
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t.subject}</label>
          <input value={texts.subject} placeholder={defaults.subject} onChange={(e) => onChange({ subject: e.target.value })} disabled={disabled} maxLength={200} className={small} />
        </div>
        <div>
          <label className={labelCls}>{t.titleField}</label>
          <input value={texts.title} placeholder={defaults.title} onChange={(e) => onChange({ title: e.target.value })} disabled={disabled} maxLength={200} className={small} />
        </div>
      </div>
      <div>
        <label className={labelCls}>{t.body}</label>
        <textarea
          ref={bodyRef}
          value={texts.body}
          placeholder={defaults.body}
          onChange={(e) => onChange({ body: e.target.value })}
          disabled={disabled}
          rows={6}
          maxLength={5000}
          className={area}
        />
        {!disabled && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted">{t.variables}:</span>
            {FOLLOWUP_VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insert(v)}
                className="h-7 rounded-lg bg-card-soft px-2 font-mono text-xs text-heading ring-1 ring-line hover:bg-[var(--meta-active)] dark:bg-white/[0.06]"
              >
                {v}
              </button>
            ))}
            <span className="w-full text-xs text-muted">{t.variablesHint}</span>
          </div>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label className={labelCls}>{t.cta}</label>
          <input value={texts.cta} placeholder={defaults.cta} onChange={(e) => onChange({ cta: e.target.value })} disabled={disabled} maxLength={60} className={small} />
        </div>
        {!disabled && FIELDS.some((f) => texts[f]) && (
          <button type="button" onClick={() => onChange({ subject: "", title: "", body: "", cta: "" })} className="h-10 px-1 text-left text-sm font-semibold text-accent hover:underline">
            {t.reset}
          </button>
        )}
      </div>
      <p className="text-xs text-muted">{t.defaultHint}</p>
    </div>
  );
}

/* ---------------- Editor ---------------- */

/**
 * Seguimiento → Secuencia: quién entra, los correos (hasta 5, con textos
 * en es/en), horario de envío y el recordatorio de formularios sin terminar.
 * A la derecha, la vista previa real del correo (con un lead de ejemplo).
 */
export function SequenceEditor({
  locale,
  initial,
  updatedAt,
  canEdit,
}: {
  locale: Locale;
  initial: Json | null;
  updatedAt: string | null;
  canEdit: boolean;
}) {
  const t = followupEditorCopy[locale].sequence;
  const supabase = useMemo(() => createClient(), []);
  const [baseline, setBaseline] = useState(() => toDraft(initial));
  const [d, setD] = useState(baseline);
  const [lang, setLang] = useState<Locale>(locale);
  const [selected, setSelected] = useState<number | "abandoned">(0);
  const [state, setState] = useState<{ kind: "idle" | "busy" | "saved" | "error"; detail?: string }>({ kind: "idle" });
  const [lastUpdate, setLastUpdate] = useState(updatedAt);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [previewState, setPreviewState] = useState<"loading" | "ok" | "error">("loading");
  const [test, setTest] = useState<{ kind: "idle" | "busy" | "ok" | "error"; text?: string }>({ kind: "idle" });
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const abandonedBodyRef = useRef<HTMLTextAreaElement>(null);

  const dirty = JSON.stringify(d) !== JSON.stringify(baseline);
  const config = useMemo(() => toConfig(d), [d]);
  const configKey = JSON.stringify(config);
  const ro = !canEdit;

  const patch = (p: Partial<Draft>) => {
    setD((x) => ({ ...x, ...p }));
    setState({ kind: "idle" });
  };
  const setStep = (i: number, p: Partial<StepDraft>) => patch({ steps: d.steps.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  const setStepTexts = (i: number, p: Partial<EmailTexts>) =>
    setStep(i, { texts: { ...d.steps[i].texts, [lang]: { ...d.steps[i].texts[lang], ...p } } });
  const move = (i: number, dir: -1 | 1) => {
    const steps = [...d.steps];
    [steps[i], steps[i + dir]] = [steps[i + dir], steps[i]];
    patch({ steps });
    setSelected(i + dir);
  };

  // Vista previa (con espera para no pedirla en cada tecla).
  const body = useMemo(
    () =>
      JSON.stringify(
        selected === "abandoned"
          ? { mode: "abandoned", locale: lang, config: JSON.parse(configKey) }
          : { mode: "step", step: selected + 1, locale: lang, config: JSON.parse(configKey) },
      ),
    [selected, lang, configKey],
  );
  useEffect(() => {
    let alive = true;
    const id = window.setTimeout(async () => {
      setPreviewState("loading");
      const res = await fetch("/api/email/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body }).catch(() => null);
      const data = res?.ok ? ((await res.json()) as { subject: string; html: string }) : null;
      if (!alive) return;
      setPreview(data);
      setPreviewState(data ? "ok" : "error");
    }, 600);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [body]);

  const sendTest = async () => {
    setTest({ kind: "busy" });
    const payload = { ...(JSON.parse(body) as object), test: true };
    const res = await fetch("/api/email/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; to?: string; error?: string };
    if (res.ok && data.ok) setTest({ kind: "ok", text: t.preview.testOk.replace("{to}", data.to ?? "—") });
    else setTest({ kind: "error", text: t.preview.testErrors[data.error ?? ""] ?? t.preview.testFail.replace("{detail}", data.error ?? `HTTP ${res.status}`) });
  };

  const save = async () => {
    if (d.tiers.length === 0) return setState({ kind: "error", detail: t.general.atLeastOne });
    setState({ kind: "busy" });
    const { data, error } = await supabase
      .from("followup_settings")
      .update({ config: config as unknown as Json })
      .eq("id", true)
      .select("config, updated_at")
      .maybeSingle();
    if (error || !data) return setState({ kind: "error", detail: error?.message ?? "forbidden" });
    const fresh = toDraft(data.config);
    setBaseline(fresh);
    setD(fresh);
    setLastUpdate(data.updated_at);
    setState({ kind: "saved" });
  };

  const fmtDelay = (minutes: number) => {
    const unit = unitOf(minutes);
    return `${minutes / FACTOR[unit]} ${t.steps.units[unit]}`;
  };
  const previewItems = [
    ...d.steps.map((s, i) => ({ value: String(i), label: t.steps.step.replace("{n}", String(i + 1)) })),
    { value: "abandoned", label: t.preview.reminder },
  ];

  return (
    <div className="grid gap-5 pb-24">
      <p className="max-w-3xl text-sm text-muted">
        {t.intro}
        {lastUpdate && (
          <span className="block text-xs">
            {t.updated.replace("{date}", new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastUpdate)))}
          </span>
        )}
      </p>
      {ro && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">{t.readOnly}</p>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_30rem]">
        <div className="grid min-w-0 gap-5">
          {/* Quién entra */}
          <Card title={t.general.title} hint={t.general.hint}>
            <div className="flex flex-wrap gap-2">
              {TIERS.map((tier) => {
                const on = d.tiers.includes(tier);
                return (
                  <button
                    key={tier}
                    type="button"
                    disabled={ro}
                    aria-pressed={on}
                    onClick={() => patch({ tiers: on ? d.tiers.filter((x) => x !== tier) : [...d.tiers, tier] })}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-[10px] px-3 text-sm font-medium ring-1 transition-colors disabled:cursor-default",
                      on ? "bg-[var(--meta-active)] text-heading ring-brand-green/50" : "text-muted ring-line hover:bg-[var(--meta-hover)]",
                    )}
                  >
                    <span className={cn("h-2.5 w-2.5 rounded-full", TIER_DOT[tier])} aria-hidden />
                    {t.general.tiers[tier]}
                  </button>
                );
              })}
            </div>
            {d.tiers.length === 0 && <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{t.general.atLeastOne}</p>}
            <p className="mt-3 text-xs text-muted">
              {t.general.master}{" "}
              <Link href={`/${locale}/portal/integraciones`} className="font-semibold text-accent hover:underline">
                {t.general.masterLink}
              </Link>
            </p>
          </Card>

          {/* Correos */}
          <Card title={t.steps.title} hint={t.steps.hint}>
            <ol className="relative grid gap-3">
              {d.steps.map((s, i) => {
                const open = selected === i;
                const unit = unitOf(s.delay_minutes);
                const defaults = stepDefaults(i)(lang);
                const subject = s.texts[lang].subject || defaults.subject;
                return (
                  <li key={i} className="relative pl-10">
                    {/* Línea de tiempo */}
                    <span
                      className={cn(
                        "absolute left-0 top-3 grid h-7 w-7 place-items-center rounded-full text-xs font-bold ring-4 ring-surface dark:ring-card",
                        s.enabled ? "bg-brand-green-dark text-white dark:bg-brand-green dark:text-deep-950" : "bg-card-soft text-muted dark:bg-white/10",
                      )}
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    {i < d.steps.length - 1 && <span className="absolute bottom-[-0.75rem] left-[13px] top-10 w-0.5 bg-line" aria-hidden />}
                    <div className={cn("rounded-xl ring-1 transition-colors", open ? "ring-brand-green/50" : "ring-line")}>
                      <button type="button" onClick={() => setSelected(i)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-semibold text-heading">
                            {t.steps.step.replace("{n}", String(i + 1))}
                            {!s.enabled && <span className="rounded-md bg-card-soft px-1.5 text-xs font-medium text-muted dark:bg-white/10">{t.steps.off}</span>}
                          </span>
                          <span className="block truncate text-sm text-muted">
                            {t.steps.delay} {fmtDelay(s.delay_minutes)} {t.steps.after} · {subject.replace("{nombre}", "María")}
                          </span>
                        </span>
                        <Eye className={cn("h-4 w-4 shrink-0", open ? "text-accent" : "text-muted")} aria-label={t.steps.previewThis} />
                      </button>
                      {open && (
                        <div className="grid gap-4 border-t border-line px-4 py-4">
                          <div className="flex flex-wrap items-end gap-3">
                            <div className="w-40">
                              <Switch checked={s.enabled} onChange={(v) => setStep(i, { enabled: v })} label={t.steps.enabled} disabled={ro} />
                            </div>
                            <div className="flex items-end gap-2">
                              <div>
                                <label className={labelCls}>{t.steps.delay}</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={s.delay_minutes / FACTOR[unit]}
                                  disabled={ro}
                                  onChange={(e) => setStep(i, { delay_minutes: Math.max(0, Number(e.target.value) || 0) * FACTOR[unit] })}
                                  className={cn(small, "w-24")}
                                />
                              </div>
                              <div className="w-36">
                                <Select
                                  size="md"
                                  label={t.steps.unit}
                                  value={unit}
                                  onChange={(v) => setStep(i, { delay_minutes: (s.delay_minutes / FACTOR[unit]) * FACTOR[v as Unit] })}
                                  options={(["minutes", "hours", "days"] as Unit[]).map((u) => ({ value: u, label: t.steps.units[u] }))}
                                />
                              </div>
                              <span className="pb-2.5 text-sm text-muted">{t.steps.after}</span>
                            </div>
                            {!ro && (
                              <div className="ml-auto flex items-center gap-1">
                                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t.steps.up} title={t.steps.up} className={iconBtn}>
                                  <ArrowUp className="h-4 w-4" aria-hidden />
                                </button>
                                <button type="button" onClick={() => move(i, 1)} disabled={i === d.steps.length - 1} aria-label={t.steps.down} title={t.steps.down} className={iconBtn}>
                                  <ArrowDown className="h-4 w-4" aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    patch({ steps: d.steps.filter((_, j) => j !== i) });
                                    setSelected(Math.max(0, i - 1));
                                  }}
                                  disabled={d.steps.length <= 1}
                                  aria-label={t.steps.remove}
                                  title={t.steps.remove}
                                  className={cn(iconBtn, "hover:text-red-600")}
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </button>
                              </div>
                            )}
                          </div>
                          <div>
                            <LangTabs value={lang} onChange={setLang} />
                          </div>
                          <TextsFields
                            texts={s.texts[lang]}
                            defaults={defaults}
                            onChange={(p) => setStepTexts(i, p)}
                            disabled={ro}
                            locale={locale}
                            bodyRef={bodyRef}
                          />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            {!ro && d.steps.length < MAX_STEPS && (
              <button
                type="button"
                onClick={() => {
                  const last = d.steps.at(-1)?.delay_minutes ?? 0;
                  patch({ steps: [...d.steps, { enabled: true, delay_minutes: last + 4320, texts: emptyTexts() }] });
                  setSelected(d.steps.length);
                }}
                className={cn(ghostBtn, "mt-4")}
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t.steps.add}
              </button>
            )}
          </Card>

          {/* Horario de envío */}
          <Card title={t.window.title} hint={t.window.hint}>
            <Switch checked={d.window.enabled} onChange={(v) => patch({ window: { ...d.window, enabled: v } })} label={t.window.enabled} disabled={ro} />
            {d.window.enabled && (
              <div className="mt-3 flex flex-wrap items-end gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {t.window.days.map((label, i) => {
                    const key = String(i + 1);
                    const on = d.window.days.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={ro}
                        aria-pressed={on}
                        onClick={() => patch({ window: { ...d.window, days: on ? d.window.days.filter((x) => x !== key) : [...d.window.days, key].sort() } })}
                        className={cn(
                          "h-9 min-w-12 rounded-[10px] px-2.5 text-sm font-medium ring-1",
                          on ? "bg-[var(--meta-active)] text-heading ring-brand-green/50" : "text-muted ring-line hover:bg-[var(--meta-hover)]",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-end gap-2">
                  <div>
                    <label className={labelCls}>{t.window.from}</label>
                    <input type="time" value={d.window.from} disabled={ro} onChange={(e) => patch({ window: { ...d.window, from: e.target.value } })} className={cn(small, "w-32")} />
                  </div>
                  <span className="pb-2.5 text-muted">–</span>
                  <div>
                    <label className={labelCls}>{t.window.to}</label>
                    <input type="time" value={d.window.to} disabled={ro} onChange={(e) => patch({ window: { ...d.window, to: e.target.value } })} className={cn(small, "w-32")} />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Recordatorio */}
          <Card title={t.abandoned.title} hint={t.abandoned.hint}>
            <div className="grid gap-4">
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className={labelCls}>{t.abandoned.delay}</label>
                  <input
                    type="number"
                    min={15}
                    value={d.abandoned_delay_minutes}
                    disabled={ro}
                    onChange={(e) => patch({ abandoned_delay_minutes: Number(e.target.value) || 0 })}
                    className={cn(small, "w-28")}
                  />
                </div>
                <span className="pb-2.5 text-sm text-muted">{t.abandoned.minutes}</span>
                <button type="button" onClick={() => setSelected("abandoned")} className={cn(ghostBtn, "ml-auto", selected === "abandoned" && "bg-[var(--meta-active)] ring-brand-green/50")}>
                  <Eye className="h-4 w-4" aria-hidden />
                  {t.steps.previewThis}
                </button>
              </div>
              <div>
                <LangTabs value={lang} onChange={setLang} />
              </div>
              <TextsFields
                texts={d.abandoned[lang]}
                defaults={defaultAbandonedTexts[lang]}
                onChange={(p) => {
                  patch({ abandoned: { ...d.abandoned, [lang]: { ...d.abandoned[lang], ...p } } });
                  setSelected("abandoned");
                }}
                disabled={ro}
                locale={locale}
                bodyRef={abandonedBodyRef}
              />
            </div>
          </Card>
        </div>

        {/* Vista previa */}
        <aside className="grid gap-3 rounded-xl border border-line bg-surface p-4 xl:sticky xl:top-20 dark:bg-card" aria-label={t.preview.title}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto flex items-center gap-1.5 text-[0.98rem] font-semibold text-heading">
              <Mail className="h-4 w-4 text-accent" aria-hidden />
              {t.preview.title}
            </h2>
            <LangTabs value={lang} onChange={setLang} />
          </div>
          <Select
            size="md"
            label={t.preview.title}
            value={String(selected)}
            onChange={(v) => setSelected(v === "abandoned" ? "abandoned" : Number(v))}
            options={previewItems}
          />
          <div className="rounded-lg bg-card-soft px-3 py-2 text-sm dark:bg-white/[0.06]">
            <span className="text-xs font-semibold text-muted">{t.preview.subject}: </span>
            <span className="font-medium text-heading">{preview?.subject ?? "—"}</span>
          </div>
          <div className="relative overflow-hidden rounded-lg ring-1 ring-line">
            {previewState !== "ok" && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-surface/70 text-sm text-muted dark:bg-card/70">
                {previewState === "loading" ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t.preview.loading}
                  </span>
                ) : (
                  t.preview.error
                )}
              </div>
            )}
            <iframe title={t.preview.title} srcDoc={preview?.html ?? ""} sandbox="" className="h-[34rem] w-full bg-white" />
          </div>
          <p className="text-xs text-muted">{t.preview.sample}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void sendTest()} disabled={test.kind === "busy"} className={ghostBtn}>
              {test.kind === "busy" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              {test.kind === "busy" ? t.preview.testing : t.preview.test}
            </button>
            {test.text && (
              <p role="status" className={cn("text-xs font-semibold", test.kind === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                {test.text}
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Barra de guardado */}
      {canEdit && (
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:bg-card/95">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <p
              role="status"
              className={cn(
                "mr-auto text-sm",
                state.kind === "error" ? "font-semibold text-red-600 dark:text-red-400" : state.kind === "saved" ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-muted",
              )}
            >
              {state.kind === "error" ? t.error.replace("{detail}", state.detail ?? "—") : state.kind === "saved" ? t.saved : dirty ? t.unsaved : ""}
            </p>
            <button
              type="button"
              disabled={!dirty || state.kind === "busy"}
              onClick={() => {
                setD(baseline);
                setState({ kind: "idle" });
              }}
              className={cn(ghostBtn, "h-10")}
            >
              {t.discard}
            </button>
            <button type="button" disabled={!dirty || state.kind === "busy"} onClick={() => void save()} className={buttonClasses("primary", "md", "h-10 px-5 disabled:opacity-50")}>
              {state.kind === "busy" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {state.kind === "busy" ? t.saving : t.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
