"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, MessagesSquare, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";
import { chatSettingsCopy } from "@/content/chatSettings";
import { liveChatCopy } from "@/content/liveChat";
import { Select } from "@/components/ui/Select";
import { inputClass } from "@/components/auth/inputClass";
import { buttonClasses } from "@/components/ui/Button";
import {
  DAY_KEYS,
  readableOn,
  type ChatAiMode,
  type ChatAiProvider,
  type ChatConfig,
  type ChatQuickReply,
  type ChatInvite,
  type ChatTexts,
  type DayKey,
  type FieldMode,
  type RoutingMode,
} from "@/lib/chatConfig";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const PRESETS = ["#1f2a46", "#467316", "#18181b", "#2563eb", "#0f766e", "#6d28d9"];
const CLOSE_PRESETS = [0, 15, 30, 60, 120];
const MAX_FAQS = 30;

const MAX_QUICK = 6;
const WAIT_PRESETS = [1, 2, 3, 5, 10];

/** Pregunta frecuente en edición: las palabras clave van como texto. */
type FaqDraft = { keywords: string; answer: string; answer_en: string; priority: number };
type BotDraft = {
  enabled: boolean;
  faqs: FaqDraft[];
  intents_enabled: boolean;
  sales: { answer: string; answer_en: string };
  support: { answer: string; answer_en: string };
  page_greetings: { enabled: boolean; text: string; text_en: string };
  quick_replies: { label: string; label_en: string }[];
  wait_message: { enabled: boolean; minutes: number; text: string; text_en: string };
  auto_lead: boolean;
  ai: { enabled: boolean; mode: ChatAiMode; provider: ChatAiProvider };
};
type Draft = Omit<ChatConfig, "bot" | "exclude_paths"> & {
  bot: BotDraft;
  /** Ajustes del bot tal como estaban: se conservan las claves que este formulario no edita. */
  bot_raw: Record<string, unknown>;
  exclude_text: string;
};

/** Ajustes guardados + valores seguros para lo que falte. */
function toDraft(raw: unknown): Draft {
  const c = (raw && typeof raw === "object" ? raw : {}) as Partial<ChatConfig>;
  const textsFrom = (lang: Locale): ChatTexts => {
    const w = liveChatCopy[lang].widget;
    return {
      title: w.title,
      launcher: w.launcher,
      greeting: w.greeting,
      greeting_away: w.greetingAway,
      invite: w.invite.default,
      ...(c.texts?.[lang] ?? {}),
    };
  };
  return {
    enabled: c.enabled ?? true,
    color: c.color || PRESETS[0],
    position: c.position === "left" ? "left" : "right",
    show_agents: c.show_agents ?? true,
    texts: { es: textsFrom("es"), en: textsFrom("en") },
    fields: { email: c.fields?.email ?? "optional", phone: c.fields?.phone ?? "optional" },
    exclude_text: (c.exclude_paths ?? []).join("\n"),
    hours: { enabled: c.hours?.enabled ?? false, email_team: c.hours?.email_team ?? false, days: { ...(c.hours?.days ?? {}) } },
    bot: {
      enabled: c.bot?.enabled ?? false,
      faqs: (c.bot?.faqs ?? []).map((f) => ({ keywords: (f.keywords ?? []).join(", "), answer: f.answer ?? "", answer_en: f.answer_en ?? "", priority: f.priority ?? 0 })),
      intents_enabled: c.bot?.intents_enabled ?? true,
      sales: { answer: c.bot?.intents?.sales?.answer ?? "", answer_en: c.bot?.intents?.sales?.answer_en ?? "" },
      support: { answer: c.bot?.intents?.support?.answer ?? "", answer_en: c.bot?.intents?.support?.answer_en ?? "" },
      page_greetings: {
        enabled: c.bot?.page_greetings?.enabled ?? false,
        text: c.bot?.page_greetings?.text ?? "",
        text_en: c.bot?.page_greetings?.text_en ?? "",
      },
      quick_replies: (c.bot?.quick_replies ?? []).map((q: ChatQuickReply) => ({ label: q.label ?? "", label_en: q.label_en ?? "" })),
      wait_message: {
        enabled: c.bot?.wait_message?.enabled ?? false,
        minutes: c.bot?.wait_message?.minutes ?? 3,
        text: c.bot?.wait_message?.text ?? "",
        text_en: c.bot?.wait_message?.text_en ?? "",
      },
      auto_lead: c.bot?.auto_lead ?? true,
      ai: { enabled: c.bot?.ai?.enabled ?? false, mode: c.bot?.ai?.mode ?? "assist", provider: c.bot?.ai?.provider ?? "anthropic" },
    },
    bot_raw: c.bot && typeof c.bot === "object" ? (c.bot as unknown as Record<string, unknown>) : {},
    routing: { mode: c.routing?.mode ?? "off", max_chats: c.routing?.max_chats ?? 5 },
    auto_close_minutes: c.auto_close_minutes ?? 0,
    invites: (c.invites ?? []).map((i) => ({ path: i.path ?? "", delay: i.delay ?? 20, es: i.es ?? "", en: i.en ?? "" })),
    invite_delay: c.invite_delay ?? 20,
    exit_intent: c.exit_intent ?? false,
  };
}

/** Del formulario a lo que se guarda en chat_settings.config. */
function toConfig(d: Draft): ChatConfig {
  const { exclude_text, bot_raw, ...rest } = d;
  const b = d.bot;
  const intentText = (x: { answer: string; answer_en: string }) => ({
    ...(x.answer.trim() ? { answer: x.answer.trim() } : {}),
    ...(x.answer_en.trim() ? { answer_en: x.answer_en.trim() } : {}),
  });
  return {
    ...rest,
    exclude_paths: exclude_text
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => (p.startsWith("/") ? p : `/${p}`)),
    bot: {
      // Claves que este formulario no conoce (p. ej. ajustes extra de la IA) se conservan.
      ...(bot_raw as Partial<ChatConfig["bot"]>),
      enabled: b.enabled,
      faqs: b.faqs
        .map((f) => ({
          keywords: f.keywords.split(",").map((k) => k.trim()).filter(Boolean),
          answer: f.answer.trim(),
          ...(f.answer_en.trim() ? { answer_en: f.answer_en.trim() } : {}),
          ...(Math.round(f.priority) ? { priority: Math.max(-9, Math.min(9, Math.round(f.priority))) } : {}),
        }))
        .filter((f) => f.keywords.length && f.answer),
      intents_enabled: b.intents_enabled,
      intents: { sales: intentText(b.sales), support: intentText(b.support) },
      page_greetings: { enabled: b.page_greetings.enabled, text: b.page_greetings.text.trim(), text_en: b.page_greetings.text_en.trim() },
      quick_replies: b.quick_replies
        .map((q) => ({ label: q.label.trim(), ...(q.label_en.trim() ? { label_en: q.label_en.trim() } : {}) }))
        .filter((q) => q.label),
      wait_message: {
        enabled: b.wait_message.enabled,
        minutes: Math.min(60, Math.max(1, Math.round(b.wait_message.minutes) || 3)),
        text: b.wait_message.text.trim(),
        text_en: b.wait_message.text_en.trim(),
      },
      auto_lead: b.auto_lead,
      ai: { ...((bot_raw.ai as Record<string, unknown>) ?? {}), enabled: b.ai.enabled, mode: b.ai.mode, provider: b.ai.provider },
    },
    routing: { mode: d.routing.mode, max_chats: Math.min(50, Math.max(1, Math.round(d.routing.max_chats) || 5)) },
    auto_close_minutes: Math.max(0, Math.round(d.auto_close_minutes) || 0),
    invite_delay: Math.max(0, Math.round(d.invite_delay) || 0),
    invites: d.invites
      .map((i) => ({ ...i, path: i.path.trim() ? (i.path.trim().startsWith("/") ? i.path.trim() : `/${i.path.trim()}`) : "", delay: Math.max(0, Math.round(i.delay) || 0) }))
      .filter((i) => i.path && (i.es.trim() || i.en.trim())),
  };
}

/* ---------------- Piezas ---------------- */

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-heading">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2",
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
const ghostBtn = "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]";
const iconBtn = "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-muted hover:bg-[var(--meta-hover)] hover:text-red-600";

/**
 * Chat → Ajustes: apariencia del widget, formulario previo, páginas, horario,
 * bot de preguntas frecuentes, asignación automática, cierre automático e
 * invitaciones. Todo se guarda en chat_settings (solo administradores).
 */
export function ChatSettingsForm({ locale, initial, updatedAt }: { locale: Locale; initial: Json | null; updatedAt: string | null }) {
  const t = chatSettingsCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [baseline, setBaseline] = useState(() => toDraft(initial));
  const [d, setD] = useState(baseline);
  const [lang, setLang] = useState<Locale>(locale);
  const [state, setState] = useState<{ kind: "idle" | "busy" | "saved" | "error"; detail?: string }>({ kind: "idle" });
  const [lastUpdate, setLastUpdate] = useState(updatedAt);

  const dirty = JSON.stringify(d) !== JSON.stringify(baseline);
  const bothHidden = d.fields.email === "hidden" && d.fields.phone === "hidden";

  const patch = (p: Partial<Draft>) => {
    setD((x) => ({ ...x, ...p }));
    setState({ kind: "idle" });
  };
  const setText = (key: keyof ChatTexts, value: string) =>
    patch({ texts: { ...d.texts, [lang]: { ...d.texts[lang], [key]: value } } });
  const setDay = (day: DayKey, value: [string, string] | null) => {
    const days = { ...d.hours.days };
    if (value) days[day] = value;
    else delete days[day];
    patch({ hours: { ...d.hours, days } });
  };
  const setFaq = (i: number, p: Partial<FaqDraft>) => patch({ bot: { ...d.bot, faqs: d.bot.faqs.map((f, j) => (j === i ? { ...f, ...p } : f)) } });
  const setBot = (p: Partial<BotDraft>) => patch({ bot: { ...d.bot, ...p } });
  const setInvite = (i: number, p: Partial<ChatInvite>) => patch({ invites: d.invites.map((x, j) => (j === i ? { ...x, ...p } : x)) });

  const save = async () => {
    if (bothHidden) return setState({ kind: "error", detail: t.form.bothHidden });
    setState({ kind: "busy" });
    const config = toConfig(d);
    const { data, error } = await supabase
      .from("chat_settings")
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

  const fg = readableOn(d.color);
  const texts = d.texts[lang];
  const modeOptions = (["required", "optional", "hidden"] as FieldMode[]).map((m) => ({ value: m, label: t.form.modes[m] }));

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

      {/* 1. Apariencia */}
      <Card title={t.appearance.title} hint={t.appearance.hint}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid gap-4">
            <Switch checked={d.enabled} onChange={(v) => patch({ enabled: v })} label={t.appearance.enabled} />
            <div>
              <p className={labelCls}>{t.appearance.color}</p>
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => patch({ color: c })}
                    aria-label={c}
                    aria-pressed={d.color.toLowerCase() === c}
                    className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-line"
                    style={{ backgroundColor: c, color: readableOn(c) }}
                  >
                    {d.color.toLowerCase() === c && <Check className="h-4 w-4" aria-hidden />}
                  </button>
                ))}
                <label className="ml-1 inline-flex items-center gap-2 text-sm text-heading">
                  <input
                    type="color"
                    value={d.color}
                    onChange={(e) => patch({ color: e.target.value })}
                    className="h-9 w-12 cursor-pointer rounded-md border border-line bg-transparent"
                  />
                  {t.appearance.custom}
                  <span className="font-mono text-xs text-muted">{d.color}</span>
                </label>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                size="md"
                label={t.appearance.position}
                value={d.position}
                onChange={(v) => patch({ position: v === "left" ? "left" : "right" })}
                options={[
                  { value: "right", label: t.appearance.right },
                  { value: "left", label: t.appearance.left },
                ]}
              />
            </div>
            <Switch checked={d.show_agents} onChange={(v) => patch({ show_agents: v })} label={t.appearance.showAgents} />

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-heading">{t.appearance.texts}</p>
                <div role="tablist" className="flex rounded-[10px] bg-card-soft p-0.5 dark:bg-white/[0.06]">
                  {(["es", "en"] as Locale[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      role="tab"
                      aria-selected={lang === l}
                      onClick={() => setLang(l)}
                      className={cn("h-8 rounded-lg px-3 text-xs font-semibold", lang === l ? "bg-surface text-heading shadow-sm dark:bg-card" : "text-muted")}
                    >
                      {t.appearance.langs[l]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["title", "launcher"] as const).map((k) => (
                  <label key={k}>
                    <span className={labelCls}>{t.appearance.fields[k]}</span>
                    <input value={texts[k]} onChange={(e) => setText(k, e.target.value)} maxLength={60} className={small} />
                  </label>
                ))}
                {(["greeting", "greeting_away", "invite"] as const).map((k) => (
                  <label key={k} className="sm:col-span-2">
                    <span className={labelCls}>{t.appearance.fields[k]}</span>
                    <textarea value={texts[k]} onChange={(e) => setText(k, e.target.value)} rows={2} maxLength={400} className={area} />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Vista previa */}
          <div aria-label={t.appearance.preview} className="lg:sticky lg:top-24 lg:self-start">
            <p className={labelCls}>{t.appearance.preview}</p>
            <div className="rounded-2xl bg-card-soft p-4 dark:bg-white/[0.04]">
              <div className="overflow-hidden rounded-2xl bg-surface shadow-[0_12px_32px_-12px_rgba(16,24,40,0.35)] ring-1 ring-line dark:bg-card">
                <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                  <span className="relative grid h-9 w-9 place-items-center rounded-full" style={{ backgroundColor: d.color, color: fg }}>
                    <MessagesSquare className="h-4 w-4" aria-hidden />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface dark:ring-card" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-heading">{texts.title || "—"}</span>
                    <span className="block text-xs text-muted">{t.appearance.online}</span>
                  </span>
                </div>
                <div className="grid gap-2 px-4 py-3">
                  <p className="max-w-[90%] rounded-2xl rounded-tl-md bg-surface-soft px-3 py-2 text-xs leading-relaxed text-body dark:bg-white/[0.06]">
                    {texts.greeting || "—"}
                  </p>
                  <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-md px-3 py-2 text-xs" style={{ backgroundColor: d.color, color: fg }}>
                    {lang === "es" ? "Hola, quiero una cotización" : "Hi, I'd like a quote"}
                  </p>
                </div>
              </div>
              <div className={cn("mt-4 flex", d.position === "left" ? "justify-start" : "justify-end")}>
                <span className="inline-flex h-11 items-center gap-2 rounded-full pl-3.5 pr-4 text-sm font-semibold shadow-[0_10px_24px_-10px_rgba(11,16,32,0.6)]" style={{ backgroundColor: d.color, color: fg }}>
                  <MessagesSquare className="h-5 w-5" aria-hidden />
                  {texts.launcher || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* 2. Formulario previo */}
        <Card title={t.form.title} hint={t.form.hint}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select size="md" label={t.form.email} value={d.fields.email} onChange={(v) => patch({ fields: { ...d.fields, email: v as FieldMode } })} options={modeOptions} invalid={bothHidden} />
            <Select size="md" label={t.form.phone} value={d.fields.phone} onChange={(v) => patch({ fields: { ...d.fields, phone: v as FieldMode } })} options={modeOptions} invalid={bothHidden} />
          </div>
          {bothHidden && (
            <p role="alert" className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
              {t.form.bothHidden}
            </p>
          )}
        </Card>

        {/* 3. Páginas */}
        <Card title={t.pages.title} hint={t.pages.hint}>
          <textarea
            value={d.exclude_text}
            onChange={(e) => patch({ exclude_text: e.target.value })}
            rows={4}
            spellCheck={false}
            aria-label={t.pages.title}
            className={cn(area, "font-mono")}
          />
        </Card>
      </div>

      {/* 4. Horario */}
      <Card title={t.hours.title} hint={t.hours.hint}>
        <Switch checked={d.hours.enabled} onChange={(v) => patch({ hours: { ...d.hours, enabled: v } })} label={t.hours.enabled} />
        <div className={cn("mt-3 grid gap-1", !d.hours.enabled && "pointer-events-none opacity-50")} aria-disabled={!d.hours.enabled}>
          {DAY_KEYS.map((day) => {
            const span = d.hours.days[day];
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 border-b border-line py-2 last:border-0">
                <label className="flex w-36 items-center gap-2 text-sm text-heading">
                  <input
                    type="checkbox"
                    checked={!!span}
                    onChange={(e) => setDay(day, e.target.checked ? ["08:00", "17:00"] : null)}
                    className="h-4 w-4 rounded accent-brand-green-dark"
                  />
                  {t.hours.days[day]}
                </label>
                {span ? (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <input type="time" value={span[0]} onChange={(e) => setDay(day, [e.target.value, span[1]])} aria-label={`${t.hours.days[day]} · ${t.hours.from}`} className={cn(small, "w-32")} />
                    –
                    <input type="time" value={span[1]} onChange={(e) => setDay(day, [span[0], e.target.value])} aria-label={`${t.hours.days[day]} · ${t.hours.to}`} className={cn(small, "w-32")} />
                  </div>
                ) : (
                  <span className="text-sm text-muted">{t.hours.closed}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <Switch checked={d.hours.email_team} onChange={(v) => patch({ hours: { ...d.hours, email_team: v } })} label={t.hours.emailTeam} />
        </div>
      </Card>

      {/* 5. Bot */}
      <Card title={t.bot.title} hint={t.bot.hint}>
        <Switch checked={d.bot.enabled} onChange={(v) => patch({ bot: { ...d.bot, enabled: v } })} label={t.bot.enabled} />
        <div className="mt-3 grid gap-3">
          {d.bot.faqs.length === 0 && <p className="text-sm text-muted">{t.bot.empty}</p>}
          {d.bot.faqs.map((f, i) => (
            <div key={i} className="grid gap-3 rounded-xl bg-card-soft/60 p-4 ring-1 ring-line dark:bg-white/[0.03]">
              <div className="flex items-end gap-2">
                <label className="min-w-0 flex-1">
                  <span className={labelCls}>{t.bot.keywords}</span>
                  <input value={f.keywords} onChange={(e) => setFaq(i, { keywords: e.target.value })} maxLength={300} className={small} />
                </label>
                <label className="w-24 shrink-0" title={t.automation.priorityHint}>
                  <span className={labelCls}>{t.automation.priority}</span>
                  <input type="number" min={-9} max={9} value={f.priority} onChange={(e) => setFaq(i, { priority: Number(e.target.value) || 0 })} className={small} />
                </label>
                <button
                  type="button"
                  onClick={() => patch({ bot: { ...d.bot, faqs: d.bot.faqs.filter((_, j) => j !== i) } })}
                  aria-label={`${t.remove} ${i + 1}`}
                  className={iconBtn}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label>
                  <span className={labelCls}>{t.bot.answer}</span>
                  <textarea value={f.answer} onChange={(e) => setFaq(i, { answer: e.target.value })} rows={3} maxLength={2000} className={area} />
                </label>
                <label>
                  <span className={labelCls}>{t.bot.answerEn}</span>
                  <textarea value={f.answer_en} onChange={(e) => setFaq(i, { answer_en: e.target.value })} rows={3} maxLength={2000} className={area} />
                </label>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={d.bot.faqs.length >= MAX_FAQS}
              onClick={() => patch({ bot: { ...d.bot, faqs: [...d.bot.faqs, { keywords: "", answer: "", answer_en: "", priority: 0 }] } })}
              className={cn(ghostBtn, "disabled:opacity-50")}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t.bot.add}
            </button>
            {d.bot.faqs.length >= MAX_FAQS && <span className="text-xs text-muted">{t.bot.max}</span>}
          </div>
        </div>
      </Card>

      <Card title={t.automation.title} hint={t.automation.hint}>
        <div className="grid gap-5">
          <div>
            <Switch checked={d.bot.intents_enabled} onChange={(v) => setBot({ intents_enabled: v })} label={t.automation.intents} />
            {d.bot.intents_enabled && (
              <div className="mt-3 grid gap-3">
                <p className="text-xs text-muted">{t.automation.salesHint}</p>
                {(["sales", "support"] as const).map((k) => (
                  <div key={k} className="grid gap-3 md:grid-cols-2">
                    <label>
                      <span className={labelCls}>{t.automation[k]}</span>
                      <textarea value={d.bot[k].answer} onChange={(e) => setBot({ [k]: { ...d.bot[k], answer: e.target.value } })} rows={3} maxLength={2000} className={area} />
                    </label>
                    <label>
                      <span className={labelCls}>{t.automation.answerEn}</span>
                      <textarea value={d.bot[k].answer_en} onChange={(e) => setBot({ [k]: { ...d.bot[k], answer_en: e.target.value } })} rows={3} maxLength={2000} className={area} />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-line pt-4">
            <Switch checked={d.bot.page_greetings.enabled} onChange={(v) => setBot({ page_greetings: { ...d.bot.page_greetings, enabled: v } })} label={t.automation.pageGreeting} />
            <p className="text-xs text-muted">{t.automation.pageGreetingHint}</p>
            {d.bot.page_greetings.enabled && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label>
                  <span className={labelCls}>{t.automation.text}</span>
                  <textarea value={d.bot.page_greetings.text} onChange={(e) => setBot({ page_greetings: { ...d.bot.page_greetings, text: e.target.value } })} rows={2} maxLength={300} className={area} />
                </label>
                <label>
                  <span className={labelCls}>{t.automation.answerEn}</span>
                  <textarea value={d.bot.page_greetings.text_en} onChange={(e) => setBot({ page_greetings: { ...d.bot.page_greetings, text_en: e.target.value } })} rows={2} maxLength={300} className={area} />
                </label>
              </div>
            )}
          </div>

          <div className="border-t border-line pt-4">
            <p className="text-sm font-medium text-heading">{t.automation.quickReplies}</p>
            <p className="text-xs text-muted">{t.automation.quickRepliesHint}</p>
            <div className="mt-3 grid gap-2">
              {d.bot.quick_replies.map((q, i) => (
                <div key={i} className="flex items-end gap-2">
                  <label className="min-w-0 flex-1">
                    <span className={labelCls}>{t.automation.quickLabel}</span>
                    <input value={q.label} onChange={(e) => setBot({ quick_replies: d.bot.quick_replies.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} maxLength={60} className={small} />
                  </label>
                  <label className="min-w-0 flex-1">
                    <span className={labelCls}>{t.automation.quickLabelEn}</span>
                    <input value={q.label_en} onChange={(e) => setBot({ quick_replies: d.bot.quick_replies.map((x, j) => (j === i ? { ...x, label_en: e.target.value } : x)) })} maxLength={60} className={small} />
                  </label>
                  <button type="button" onClick={() => setBot({ quick_replies: d.bot.quick_replies.filter((_, j) => j !== i) })} aria-label={`${t.remove} ${i + 1}`} className={iconBtn}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={d.bot.quick_replies.length >= MAX_QUICK}
                onClick={() => setBot({ quick_replies: [...d.bot.quick_replies, { label: "", label_en: "" }] })}
                className={cn(ghostBtn, "w-fit disabled:opacity-50")}
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t.automation.addQuick}
              </button>
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <Switch checked={d.bot.wait_message.enabled} onChange={(v) => setBot({ wait_message: { ...d.bot.wait_message, enabled: v } })} label={t.automation.wait} />
            <p className="text-xs text-muted">{t.automation.waitHint}</p>
            {d.bot.wait_message.enabled && (
              <div className="mt-3 grid gap-3">
                <div className="max-w-xs">
                  <Select
                    size="md"
                    label={t.automation.minutes}
                    value={String(d.bot.wait_message.minutes)}
                    onChange={(v) => setBot({ wait_message: { ...d.bot.wait_message, minutes: Number(v) } })}
                    options={WAIT_PRESETS.map((m) => ({ value: String(m), label: `${m} min` }))}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label>
                    <span className={labelCls}>{t.automation.text}</span>
                    <textarea value={d.bot.wait_message.text} onChange={(e) => setBot({ wait_message: { ...d.bot.wait_message, text: e.target.value } })} rows={2} maxLength={500} className={area} />
                  </label>
                  <label>
                    <span className={labelCls}>{t.automation.answerEn}</span>
                    <textarea value={d.bot.wait_message.text_en} onChange={(e) => setBot({ wait_message: { ...d.bot.wait_message, text_en: e.target.value } })} rows={2} maxLength={500} className={area} />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-line pt-4">
            <Switch checked={d.bot.auto_lead} onChange={(v) => setBot({ auto_lead: v })} label={t.automation.autoLead} />
            <p className="text-xs text-muted">{t.automation.autoLeadHint}</p>
          </div>
        </div>
      </Card>

      <Card title={t.ai.title} hint={t.ai.hint}>
        <Switch checked={d.bot.ai.enabled} onChange={(v) => setBot({ ai: { ...d.bot.ai, enabled: v } })} label={t.ai.enabled} />
        {d.bot.ai.enabled && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Select
              size="md"
              label={t.ai.mode}
              value={d.bot.ai.mode}
              onChange={(v) => setBot({ ai: { ...d.bot.ai, mode: v as ChatAiMode } })}
              options={(Object.keys(t.ai.modes) as ChatAiMode[]).map((k) => ({ value: k, label: t.ai.modes[k] }))}
            />
            <Select
              size="md"
              label={t.ai.provider}
              value={d.bot.ai.provider}
              onChange={(v) => setBot({ ai: { ...d.bot.ai, provider: v as ChatAiProvider } })}
              options={(Object.keys(t.ai.providers) as ChatAiProvider[]).map((k) => ({ value: k, label: t.ai.providers[k] }))}
            />
          </div>
        )}
        <p className="mt-3 text-sm text-muted">
          {t.ai.keys}{" "}
          <a href={`/${locale}/portal/integraciones`} className="font-semibold text-accent hover:underline">
            {t.ai.keysLink}
          </a>
          .
        </p>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* 6. Asignación */}
        <Card title={t.routing.title} hint={t.routing.hint}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              size="md"
              label={t.routing.mode}
              value={d.routing.mode}
              onChange={(v) => patch({ routing: { ...d.routing, mode: v as RoutingMode } })}
              options={(["off", "round_robin", "least_busy"] as RoutingMode[]).map((m) => ({ value: m, label: t.routing.modes[m] }))}
            />
            <label>
              <span className={labelCls}>{t.routing.maxChats}</span>
              <input
                type="number"
                min={1}
                max={50}
                value={d.routing.max_chats}
                onChange={(e) => patch({ routing: { ...d.routing, max_chats: Number(e.target.value) } })}
                className={small}
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-muted">{t.routing.maxHint}</p>
        </Card>

        {/* 7. Cierre automático */}
        <Card title={t.autoClose.title} hint={t.autoClose.hint}>
          <div className="flex flex-wrap items-end gap-2">
            {CLOSE_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={d.auto_close_minutes === n}
                onClick={() => patch({ auto_close_minutes: n })}
                className={cn(ghostBtn, d.auto_close_minutes === n && "bg-[var(--meta-active)] font-semibold text-accent ring-brand-green/40")}
              >
                {n === 0 ? t.autoClose.never : t.autoClose.presets.replace("{n}", String(n))}
              </button>
            ))}
            <label className="ml-1">
              <span className={labelCls}>{t.autoClose.minutes}</span>
              <input
                type="number"
                min={0}
                max={1440}
                value={d.auto_close_minutes}
                onChange={(e) => patch({ auto_close_minutes: Number(e.target.value) })}
                className={cn(small, "w-28")}
              />
            </label>
          </div>
        </Card>
      </div>

      {/* 8. Invitaciones */}
      <Card title={t.invites.title} hint={t.invites.hint}>
        <div className="grid gap-3 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center">
          <label>
            <span className={labelCls}>{t.invites.delay}</span>
            <input type="number" min={0} max={600} value={d.invite_delay} onChange={(e) => patch({ invite_delay: Number(e.target.value) })} className={small} />
          </label>
          <Switch checked={d.exit_intent} onChange={(v) => patch({ exit_intent: v })} label={t.invites.exitIntent} />
        </div>
        <div className="mt-4 grid gap-3">
          {d.invites.length === 0 && <p className="text-sm text-muted">{t.invites.empty}</p>}
          {d.invites.map((inv, i) => (
            <div key={i} className="grid gap-3 rounded-xl bg-card-soft/60 p-4 ring-1 ring-line md:grid-cols-[10rem_6rem_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end dark:bg-white/[0.03]">
              <label>
                <span className={labelCls}>{t.invites.path}</span>
                <input value={inv.path} onChange={(e) => setInvite(i, { path: e.target.value })} placeholder="/planes" spellCheck={false} className={cn(small, "font-mono")} />
              </label>
              <label>
                <span className={labelCls}>{t.invites.seconds}</span>
                <input type="number" min={0} max={600} value={inv.delay} onChange={(e) => setInvite(i, { delay: Number(e.target.value) })} className={small} />
              </label>
              <label>
                <span className={labelCls}>{t.invites.es}</span>
                <input value={inv.es} onChange={(e) => setInvite(i, { es: e.target.value })} maxLength={200} className={small} />
              </label>
              <label>
                <span className={labelCls}>{t.invites.en}</span>
                <input value={inv.en} onChange={(e) => setInvite(i, { en: e.target.value })} maxLength={200} className={small} />
              </label>
              <button type="button" onClick={() => patch({ invites: d.invites.filter((_, j) => j !== i) })} aria-label={`${t.remove} ${inv.path}`} className={iconBtn}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          <div>
            <button type="button" onClick={() => patch({ invites: [...d.invites, { path: "", delay: 20, es: "", en: "" }] })} className={ghostBtn}>
              <Plus className="h-4 w-4" aria-hidden />
              {t.invites.add}
            </button>
          </div>
        </div>
      </Card>

      {/* Barra de guardado */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:bg-card/95">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <p
            role="status"
            className={cn(
              "mr-auto text-sm",
              state.kind === "error" ? "font-semibold text-red-600 dark:text-red-400" : state.kind === "saved" ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-muted",
            )}
          >
            {state.kind === "error"
              ? t.error.replace("{detail}", state.detail ?? "—")
              : state.kind === "saved"
                ? t.saved
                : dirty
                  ? t.unsaved
                  : ""}
          </p>
          <button
            type="button"
            disabled={!dirty || state.kind === "busy"}
            onClick={() => {
              setD(baseline);
              setState({ kind: "idle" });
            }}
            className={cn(ghostBtn, "h-10 disabled:opacity-50")}
          >
            {t.discard}
          </button>
          <button type="button" disabled={!dirty || state.kind === "busy"} onClick={() => void save()} className={buttonClasses("primary", "md", "h-10 px-5 disabled:opacity-50")}>
            {state.kind === "busy" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {state.kind === "busy" ? t.saving : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
