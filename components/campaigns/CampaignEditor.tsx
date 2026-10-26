"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bold, BookmarkPlus, CalendarClock, CheckCircle2, Circle, Italic, Link2, Loader2, Send, Smile, Sparkles, Trash2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CampaignChannel, CampaignSegment, Json, WaCampaign, WaParam, WaSegment, WaTemplate } from "@/lib/supabase/types";
import { campaignsCopy } from "@/content/campaigns";
import { campaignEditorCopy } from "@/content/campaignEditor";
import { campaignsProCopy } from "@/content/campaignsPro";
import { crmCopy, pipeline } from "@/content/crm";
import { crmPlus } from "@/content/crmPlus";
import { leadFormCopy, problemKeys } from "@/content/leadForm";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { buttonClasses } from "@/components/ui/Button";
import { TemplatePreview } from "./TemplatePreview";
import { VariablePicker } from "./VariablePicker";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { renderVars, sampleVars } from "@/lib/campaignVars";
import { ChannelIcon } from "./shared";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const TIERS = ["green", "yellow", "red"] as const;
const DAYS = ["", "7", "30", "90", "180", "365"] as const;
const EXCLUDE = ["", "3", "7", "14", "30"] as const;
const THROTTLE = ["", "50", "100", "200", "500"] as const;
const EMOJIS = ["👋", "🙌", "🚀", "✅", "📅", "🕒", "💻", "📈", "💡", "🎉", "⭐", "🔥", "👉", "📌", "🤝", "🎁"];
/** Palabras que los filtros de spam miran con lupa. */
const SPAM_WORDS = ["gratis", "100%", "$$$", "urgente", "gana dinero", "oferta exclusiva", "sin costo alguno", "haz clic aquí", "free", "click here", "act now"];
type MailField = "subject" | "subject_b" | "preheader" | "body" | "cta_label" | "cta_url";

const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
const field =
  "w-full rounded-[10px] bg-[#f4f4f5] px-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]";
const softBtn = "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50";

function Chips({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium uppercase tracking-[0.06em] text-muted">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
              className={cn(
                "h-8 rounded-lg px-3 text-sm ring-1 transition-colors",
                on ? "bg-[var(--meta-active)] font-semibold text-accent ring-brand-green/50" : "text-heading ring-line hover:bg-[var(--meta-hover)]",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

type Audience = { count: number; sample: { id: string; name: string; company: string | null; contact: string }[] };

/**
 * Crear o editar una campaña de WhatsApp (plantilla + variables) o de correo
 * (asunto, mensaje con variables y botón con UTM): audiencia con conteo y
 * muestra en vivo, segmentos guardados, vista previa, prueba y envío
 * inmediato o programado.
 */
export function CampaignEditor({
  locale,
  channel,
  templates,
  campaign,
  ready,
  employees,
  segments,
}: {
  locale: Locale;
  channel: CampaignChannel;
  templates: WaTemplate[];
  campaign: WaCampaign | null;
  /** El canal está configurado (WhatsApp o Resend). */
  ready: boolean;
  employees: { id: string; name: string }[];
  segments: CampaignSegment[];
}) {
  const t = campaignsCopy[locale].editor;
  const e = campaignEditorCopy[locale];
  const crm = crmCopy[locale];
  const form = leadFormCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const nameId = useId();
  const refs = useRef<Partial<Record<MailField, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const isEmail = channel === "email";

  const [name, setName] = useState(campaign?.name ?? "");
  const [templateId, setTemplateId] = useState(campaign?.template_id ?? "");
  const [params, setParams] = useState<WaParam[]>((campaign?.params as WaParam[] | undefined) ?? []);
  const [mail, setMail] = useState({
    subject: campaign?.subject ?? "",
    preheader: campaign?.preheader ?? "",
    body: campaign?.body ?? "",
    cta_label: campaign?.cta_label ?? "",
    cta_url: campaign?.cta_url ?? "",
    utm: campaign?.utm ?? true,
    subject_b: campaign?.subject_b ?? "",
  });
  const [abOn, setAbOn] = useState(!!campaign?.subject_b);
  const [throttle, setThrottle] = useState(campaign?.throttle_per_hour ? String(campaign.throttle_per_hour) : "");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const [tested, setTested] = useState(false);
  const initialSegment = (campaign?.segment ?? {}) as WaSegment;
  const [segment, setSegment] = useState<WaSegment>({
    tiers: initialSegment.tiers ?? [],
    statuses: initialSegment.statuses ?? [],
    problems: initialSegment.problems ?? [],
    sources: initialSegment.sources ?? [],
    owners: initialSegment.owners ?? [],
    days: initialSegment.days ?? null,
    exclude_days: initialSegment.exclude_days ?? null,
  });
  const [savedSegments, setSavedSegments] = useState(segments);
  const [segmentName, setSegmentName] = useState<string | null>(null);
  const [mode, setMode] = useState<"now" | "later">(campaign?.status === "scheduled" ? "later" : "now");
  const [when, setWhen] = useState<string | null>(campaign?.scheduled_at ?? null);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  const template = templates.find((x) => x.id === templateId) ?? null;
  const vars = template?.variables ?? 0;
  const slots: WaParam[] = Array.from({ length: vars }, (_, i) => params[i] ?? { source: "first_name" });
  const count = audience?.count ?? null;

  // Audiencia en vivo (conteo y algunos nombres).
  const segmentKey = JSON.stringify(segment);
  useEffect(() => {
    const id = window.setTimeout(async () => {
      const { data } = await supabase.rpc("campaign_audience", { p_segment: JSON.parse(segmentKey), p_channel: channel, p_limit: 5 });
      setAudience((data as unknown as Audience) ?? { count: 0, sample: [] });
    }, 300);
    return () => window.clearTimeout(id);
  }, [segmentKey, supabase, channel]);

  // Vista previa del correo (con pausa mientras se escribe).
  const mailKey = JSON.stringify([mail.subject, mail.preheader, mail.body, mail.cta_label, mail.cta_url]);
  useEffect(() => {
    if (!isEmail) return;
    const id = window.setTimeout(async () => {
      const [subject, preheader, body, cta_label, cta_url] = JSON.parse(mailKey) as string[];
      const res = await fetch("/api/email/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "campaign", locale, campaign: { subject, preheader, body, cta_label, cta_url } }),
      });
      if (res.ok) setPreview(await res.json());
    }, 600);
    return () => window.clearTimeout(id);
  }, [mailKey, isEmail, locale]);

  const samples = sampleVars(locale);
  const sourceVar: Record<string, string> = {
    first_name: "nombre",
    name: "nombre_completo",
    company: "empresa",
    owner: "asesor",
    need: "necesidad",
    booking_link: "enlace_agenda",
    quote_link: "enlace_cotizar",
  };
  const sampleValues = slots.map((p) => (p.source === "static" ? (p.value ?? "") : samples[sourceVar[p.source]] || p.fallback || "-"));
  const setSlot = (i: number, patch: Partial<WaParam>) => setParams(() => slots.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  /** Inserta texto donde está el cursor del campo (o al final). */
  const insertAt = (key: MailField, before: string, after = "") => {
    const el = refs.current[key];
    const value = mail[key];
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    setMail((m) => ({ ...m, [key]: value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end) }));
    window.setTimeout(() => {
      el?.focus();
      const pos = start === end ? start + before.length : end + before.length + after.length;
      el?.setSelectionRange(pos, pos);
    }, 0);
  };
  const applyPreset = (key: string) => {
    const preset = e.presets.items[key];
    if (!preset) return;
    if ((mail.subject || mail.body) && !window.confirm(e.presets.confirm)) return;
    setMail((m) => ({ ...m, subject: preset.subject, preheader: preset.preheader, body: preset.body, cta_label: preset.cta_label, cta_url: preset.cta_url }));
  };

  const validate = (status: "draft" | "scheduled" | "send") => {
    if (!name.trim()) return t.errors.name;
    if (status === "draft") return null;
    if (isEmail) {
      if (!mail.subject.trim()) return e.errors.subject;
      if (!mail.body.trim()) return e.errors.body;
      if (mail.cta_url && !/^(https:\/\/|\{enlace_)/.test(mail.cta_url.trim())) return e.errors.ctaUrl;
      if (abOn && !mail.subject_b.trim()) return e.errors.subject;
    } else {
      if (!template) return t.errors.template;
      if (slots.some((p) => p.source === "static" && !p.value?.trim())) return t.errors.params;
    }
    if (!count) return t.errors.audience;
    if (status === "scheduled" && (!when || new Date(when) <= new Date())) return t.errors.when;
    return null;
  };

  const save = async (status: "draft" | "scheduled") => {
    const row = {
      name: name.trim(),
      channel,
      template_id: isEmail ? null : templateId || null,
      params: isEmail ? [] : slots,
      segment: { ...segment, days: segment.days || null, exclude_days: segment.exclude_days || null },
      status,
      scheduled_at: status === "scheduled" ? when : null,
      subject: isEmail ? mail.subject.trim() || null : null,
      preheader: isEmail ? mail.preheader.trim() || null : null,
      body: isEmail ? mail.body.trim() || null : null,
      cta_label: isEmail ? mail.cta_label.trim() || null : null,
      cta_url: isEmail ? mail.cta_url.trim() || null : null,
      utm: mail.utm,
      subject_b: isEmail && abOn ? mail.subject_b.trim() || null : null,
      throttle_per_hour: isEmail && throttle ? Number(throttle) : null,
    };
    if (campaign) {
      const { error: err } = await supabase.from("wa_campaigns").update(row as unknown as Partial<WaCampaign>).eq("id", campaign.id);
      if (err) throw err;
      return campaign.id;
    }
    const { data, error: err } = await supabase
      .from("wa_campaigns")
      .insert(row as unknown as Partial<WaCampaign> & { name: string })
      .select("id")
      .single();
    if (err) throw err;
    return data.id;
  };

  const run = async (action: "draft" | "scheduled" | "send") => {
    const problem = validate(action);
    if (problem) return setError(problem);
    if (action === "send") {
      if (!ready) return setError(t.errors.not_configured);
      if (!window.confirm(t.confirmSend.replace("{n}", String(count)))) return;
    }
    setError(null);
    setNotice(null);
    setBusy(action);
    try {
      const id = await save(action === "scheduled" ? "scheduled" : "draft");
      if (action === "send") {
        if (isEmail) {
          // El correo se arma aquí y sale con las tareas programadas (cada pocos minutos).
          const { error: err } = await supabase.rpc("campaign_queue", { p_campaign: id });
          if (err) throw err;
        } else {
          const res = await fetch("/api/whatsapp/dispatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campaign: id }),
          });
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok && res.status !== 504) {
            setError(data.error === "not_configured" ? t.errors.not_configured : (data.error ?? t.errors.generic));
            setBusy(null);
            if (!campaign) router.replace(`/${locale}/portal/campanas/${id}`);
            return;
          }
        }
      }
      if (action === "draft" && campaign) {
        setNotice(t.saved);
        router.refresh();
      } else {
        router.push(`/${locale}/portal/campanas/${id}`);
        router.refresh();
      }
    } catch {
      setError(t.errors.generic);
    }
    setBusy(null);
  };

  const remove = async () => {
    if (!campaign) return;
    setBusy("delete");
    await supabase.from("wa_campaigns").delete().eq("id", campaign.id);
    router.push(`/${locale}/portal/campanas`);
    router.refresh();
  };

  const unschedule = async () => {
    if (!campaign) return;
    setBusy("cancel");
    await supabase.from("wa_campaigns").update({ status: "draft", scheduled_at: null }).eq("id", campaign.id);
    setMode("now");
    setBusy(null);
    router.refresh();
  };

  const saveSegment = async () => {
    if (!segmentName?.trim()) return;
    const { data, error: err } = await supabase
      .from("campaign_segments")
      .insert({ name: segmentName.trim().slice(0, 80), segment: segment as unknown as Json })
      .select()
      .single();
    if (err) return setError(t.errors.generic);
    setSavedSegments((list) => [...list, data as CampaignSegment]);
    setSegmentName(null);
    setNotice(e.audience.segmentSaved);
  };

  const test = async () => {
    setBusy("test");
    setTestResult(null);
    const res = isEmail
      ? await fetch("/api/email/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "campaign", locale, test: true, campaign: { ...mail, subject: mail.subject } }),
        })
      : await fetch("/api/whatsapp/test-send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template: templateId, phone: testPhone, values: sampleValues }),
        });
    const data = (await res.json().catch(() => ({}))) as { to?: string; error?: string; detail?: string };
    setBusy(null);
    if (res.ok) setTested(true);
    setTestResult(
      res.ok
        ? { ok: true, text: e.preview.testSent.replace("{to}", data.to ?? "") }
        : { ok: false, text: e.preview.testErrors[data.error ?? ""] ?? e.preview.testErrors.generic.replace("{detail}", data.detail ?? data.error ?? "—") },
    );
  };

  const utmExample = (() => {
    const url = mail.cta_url.trim();
    if (!url || !mail.utm || /utm_source=/i.test(url) || url.includes("{")) return null;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "campana";
    return `${url}${url.includes("?") ? "&" : "?"}utm_source=engynex&utm_medium=email&utm_campaign=${slug}`;
  })();
  const sources = crmPlus.sources;
  const allText = [mail.subject, mail.subject_b, mail.preheader, mail.body].join(" ").toLowerCase();
  const spamFound = SPAM_WORDS.filter((w) => allText.includes(w));
  const subjectLen = renderVars(mail.subject, samples).length;
  const checks = isEmail
    ? [
        { ok: subjectLen > 0 && subjectLen <= 60, warn: subjectLen > 60, text: e.check.subjectLength.replace("{n}", String(subjectLen)) },
        { ok: /\{[a-z_]+/.test(mail.subject + mail.body), text: e.check.personalized },
        { ok: !!mail.cta_label.trim() && !!mail.cta_url.trim(), text: e.check.cta },
        { ok: spamFound.length === 0, warn: spamFound.length > 0, text: spamFound.length ? e.check.spamFound.replace("{words}", spamFound.join(", ")) : e.check.spam },
        { ok: !!count, warn: count === 0, text: e.check.audience },
        { ok: ready, warn: !ready, text: e.check.ready },
        { ok: tested, text: e.check.tested },
        { ok: true, text: e.check.unsubscribe },
      ]
    : [
        { ok: !!template, text: t.template },
        { ok: !!count, warn: count === 0, text: e.check.audience },
        { ok: ready, warn: !ready, text: e.check.ready },
        { ok: tested, text: e.check.tested },
      ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="grid content-start gap-5">
        {/* Nombre y canal */}
        <section className={card}>
          <div className="mb-4 flex items-center gap-2.5">
            <ChannelIcon channel={channel} />
            <span className="text-sm font-semibold text-heading">{campaignsProCopy[locale].channels[channel]}</span>
            <span className="text-xs text-muted">· {campaignsProCopy[locale].channelHints[channel]}</span>
          </div>
          <label htmlFor={nameId} className="mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-muted">
            {t.name}
          </label>
          <input id={nameId} value={name} onChange={(ev) => setName(ev.target.value)} maxLength={120} placeholder={t.namePlaceholder} className={cn(field, "h-11")} />
        </section>

        {/* Contenido */}
        {isEmail ? (
          <section className={cn(card, "grid gap-4")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[0.98rem] font-semibold text-heading">{e.content}</h2>
            </div>
            {/* Plantillas de inicio */}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted">
                <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
                {e.presets.title}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(e.presets.items).map(([key, preset]) => (
                  <button key={key} type="button" onClick={() => applyPreset(key)} className="h-8 rounded-lg px-3 text-sm text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={"mb-1.5 flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-[0.06em] text-muted"}>
                <span>{abOn ? e.ab.subjectA : e.email.subject}</span>
                <VariablePicker locale={locale} onPick={(tok) => insertAt("subject", tok)} />
              </div>
              <input ref={(el) => { refs.current.subject = el; }} value={mail.subject} onChange={(ev) => setMail((m) => ({ ...m, subject: ev.target.value }))} maxLength={200} placeholder={e.email.subjectPlaceholder} aria-label={e.email.subject} className={cn(field, "h-11")} />
              <label className="mt-2 flex items-center gap-2 text-sm text-body">
                <input type="checkbox" checked={abOn} onChange={(ev) => setAbOn(ev.target.checked)} className="h-4 w-4 accent-brand-green-dark" />
                {e.ab.toggle}
              </label>
              {abOn && (
                <div className="mt-2">
                  <div className={"mb-1.5 flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-[0.06em] text-muted"}>
                    <span>{e.ab.subjectB}</span>
                    <VariablePicker locale={locale} onPick={(tok) => insertAt("subject_b", tok)} />
                  </div>
                  <input ref={(el) => { refs.current.subject_b = el; }} value={mail.subject_b} onChange={(ev) => setMail((m) => ({ ...m, subject_b: ev.target.value }))} maxLength={200} aria-label={e.ab.subjectB} className={cn(field, "h-11")} />
                  <p className="mt-1 text-xs text-muted">{e.ab.hint}</p>
                </div>
              )}
            </div>
            <div>
              <div className={"mb-1.5 flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-[0.06em] text-muted"}>
                <span>{e.email.preheader}</span>
                <VariablePicker locale={locale} onPick={(tok) => insertAt("preheader", tok)} />
              </div>
              <input ref={(el) => { refs.current.preheader = el; }} value={mail.preheader} onChange={(ev) => setMail((m) => ({ ...m, preheader: ev.target.value }))} maxLength={200} aria-label={e.email.preheader} className={cn(field, "h-11")} />
              <span className="mt-1 block text-xs text-muted">{e.email.preheaderHint}</span>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.06em] text-muted">{e.email.body}</p>
              {/* Barra de formato */}
              <div className="flex flex-wrap items-center gap-1 rounded-t-[10px] border border-b-0 border-line bg-surface px-1.5 py-1 dark:bg-card">
                <button type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => insertAt("body", "**", "**")} aria-label={e.toolbar.bold} title={e.toolbar.bold} className="grid h-7 w-7 place-items-center rounded-md text-heading hover:bg-[var(--meta-hover)]">
                  <Bold className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => insertAt("body", "_", "_")} aria-label={e.toolbar.italic} title={e.toolbar.italic} className="grid h-7 w-7 place-items-center rounded-md text-heading hover:bg-[var(--meta-hover)]">
                  <Italic className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => insertAt("body", "https://")} aria-label={e.toolbar.link} title={e.toolbar.link} className="grid h-7 w-7 place-items-center rounded-md text-heading hover:bg-[var(--meta-hover)]">
                  <Link2 className="h-4 w-4" aria-hidden />
                </button>
                <div className="relative">
                  <button type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={(ev) => { setEmojiAnchor(ev.currentTarget); setEmojiOpen((v) => !v); }} aria-expanded={emojiOpen} aria-label={e.toolbar.emoji} title={e.toolbar.emoji} className="grid h-7 w-7 place-items-center rounded-md text-heading hover:bg-[var(--meta-hover)]">
                    <Smile className="h-4 w-4" aria-hidden />
                  </button>
                  {emojiOpen && (
                    <FloatingPanel anchor={emojiAnchor} open onClose={() => setEmojiOpen(false)} align="start" className="grid w-56 grid-cols-8 gap-0.5 rounded-xl bg-surface p-2 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card">
                      {EMOJIS.map((em) => (
                        <button key={em} type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => { insertAt("body", em); setEmojiOpen(false); }} className="grid h-6 w-6 place-items-center rounded text-base hover:bg-[var(--meta-hover)]" aria-label={em}>
                          {em}
                        </button>
                      ))}
                    </FloatingPanel>
                  )}
                </div>
                <span className="mx-1 h-5 w-px bg-line" aria-hidden />
                <VariablePicker locale={locale} align="left" onPick={(tok) => insertAt("body", tok)} />
              </div>
              <textarea
                ref={(el) => { refs.current.body = el; }}
                value={mail.body}
                onChange={(ev) => setMail((m) => ({ ...m, body: ev.target.value }))}
                rows={11}
                maxLength={10000}
                placeholder={e.email.bodyPlaceholder}
                aria-label={e.email.body}
                className={cn(field, "resize-y rounded-t-none py-3 leading-relaxed")}
              />
              <p className="mt-1 text-xs text-muted">{e.email.bodyHint}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[14rem_minmax(0,1fr)]">
              <div>
                <div className={"mb-1.5 flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-[0.06em] text-muted"}>
                  <span>{e.email.ctaLabel}</span>
                </div>
                <input ref={(el) => { refs.current.cta_label = el; }} value={mail.cta_label} onChange={(ev) => setMail((m) => ({ ...m, cta_label: ev.target.value }))} maxLength={80} aria-label={e.email.ctaLabel} className={cn(field, "h-11")} />
              </div>
              <div>
                <div className={"mb-1.5 flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-[0.06em] text-muted"}>
                  <span>{e.email.ctaUrl}</span>
                  <VariablePicker locale={locale} only={["enlace_agenda", "enlace_cotizar"]} onPick={(tok) => setMail((m) => ({ ...m, cta_url: tok }))} />
                </div>
                <input ref={(el) => { refs.current.cta_url = el; }} value={mail.cta_url} onChange={(ev) => setMail((m) => ({ ...m, cta_url: ev.target.value }))} maxLength={500} placeholder="https://engynex.com/es/planes" aria-label={e.email.ctaUrl} className={cn(field, "h-11")} />
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm text-body">
              <input type="checkbox" checked={mail.utm} onChange={(ev) => setMail((m) => ({ ...m, utm: ev.target.checked }))} className="mt-0.5 h-4 w-4 accent-brand-green-dark" />
              <span>
                {e.email.utm}
                {utmExample && <span className="mt-0.5 block break-all font-mono text-[0.7rem] text-muted">{e.email.utmExample.replace("{url}", utmExample)}</span>}
              </span>
            </label>
          </section>
        ) : (
          <section className={cn(card, "grid gap-4")}>
            <h2 className="text-[0.98rem] font-semibold text-heading">{e.content}</h2>
            {templates.length === 0 ? (
              <p className="rounded-lg bg-card-soft p-4 text-sm text-muted dark:bg-white/[0.05]">{t.noTemplates}</p>
            ) : (
              <Select size="md" label={t.template} value={templateId} onChange={setTemplateId} placeholder={t.templateHint} options={templates.map((x) => ({ value: x.id, label: `${x.name} · ${x.language}` }))} />
            )}
            {vars > 0 && (
              <div className="grid gap-4">
                <h3 className="text-sm font-semibold text-heading">{t.variables}</h3>
                {slots.map((p, i) => (
                  <div key={i} className="grid gap-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-end">
                    <Select
                      size="md"
                      label={`${t.variable} {{${i + 1}}}`}
                      value={p.source}
                      onChange={(v) => setSlot(i, { source: v as WaParam["source"] })}
                      options={(Object.keys(t.sources) as WaParam["source"][]).map((k) => ({ value: k, label: t.sources[k] }))}
                    />
                    {p.source === "static" ? (
                      <input value={p.value ?? ""} onChange={(ev) => setSlot(i, { value: ev.target.value })} maxLength={200} placeholder={t.staticValue} aria-label={t.staticValue} className={cn(field, "h-12")} />
                    ) : (
                      <input value={p.fallback ?? ""} onChange={(ev) => setSlot(i, { fallback: ev.target.value })} maxLength={200} placeholder={t.fallback} aria-label={t.fallback} className={cn(field, "h-12")} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Audiencia */}
        <section className={card}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[0.98rem] font-semibold text-heading">{e.audience.title}</h2>
              <p className="mt-0.5 text-sm text-muted">{isEmail ? e.audience.hintEmail : e.audience.hintWhatsapp}</p>
            </div>
            {savedSegments.length > 0 && (
              <div className="w-60">
                <Select
                  size="sm"
                  label={e.audience.loadSegment}
                  value=""
                  placeholder={e.audience.loadSegment}
                  onChange={(id) => {
                    const s = savedSegments.find((x) => x.id === id);
                    if (s) setSegment({ tiers: [], statuses: [], problems: [], sources: [], owners: [], days: null, exclude_days: null, ...(s.segment as WaSegment) });
                  }}
                  options={savedSegments.map((s) => ({ value: s.id, label: s.name }))}
                />
              </div>
            )}
          </div>
          <div className="mt-5 grid gap-5">
            <Chips legend={t.tiers} options={TIERS.map((k) => ({ value: k, label: crm.tier[k] }))} value={segment.tiers ?? []} onChange={(tiers) => setSegment((s) => ({ ...s, tiers }))} />
            <Chips legend={t.statuses} options={pipeline.map((k) => ({ value: k, label: crm.status[k] }))} value={segment.statuses ?? []} onChange={(statuses) => setSegment((s) => ({ ...s, statuses }))} />
            <Chips legend={t.problems} options={problemKeys.map((k) => ({ value: k, label: form.steps.problem.options[k] }))} value={segment.problems ?? []} onChange={(problems) => setSegment((s) => ({ ...s, problems }))} />
            <Chips legend={e.audience.sources} options={Object.entries(sources).map(([value, label]) => ({ value, label }))} value={segment.sources ?? []} onChange={(v) => setSegment((s) => ({ ...s, sources: v }))} />
            {employees.length > 0 && (
              <Chips legend={e.audience.owners} options={employees.map((x) => ({ value: x.id, label: x.name }))} value={segment.owners ?? []} onChange={(owners) => setSegment((s) => ({ ...s, owners }))} />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                size="md"
                label={t.days}
                value={segment.days ? String(segment.days) : ""}
                onChange={(v) => setSegment((s) => ({ ...s, days: v ? Number(v) : null }))}
                options={DAYS.map((d) => ({ value: d, label: d ? t.daysOption.replace("{n}", d) : t.anyTime }))}
              />
              <Select
                size="md"
                label={e.audience.exclude}
                value={segment.exclude_days ? String(segment.exclude_days) : ""}
                onChange={(v) => setSegment((s) => ({ ...s, exclude_days: v ? Number(v) : null }))}
                options={EXCLUDE.map((d) => ({ value: d, label: d ? e.audience.excludeOption.replace("{n}", d) : e.audience.excludeNone }))}
              />
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-[var(--meta-active)]/50 px-4 py-3" aria-live="polite">
            <p className="flex items-center gap-2 text-sm font-semibold text-heading">
              <Users className="h-4 w-4 text-accent" aria-hidden />
              {count === null ? "…" : count === 1 ? t.countOne : t.count.replace("{n}", count.toLocaleString(locale))}
            </p>
            {audience && audience.sample.length > 0 && (
              <p className="mt-1 truncate text-xs text-muted">
                {e.audience.sample}: {audience.sample.map((x) => x.name).join(", ")}
                {audience.count > audience.sample.length ? "…" : ""}
              </p>
            )}
            {audience && audience.count === 0 && <p className="mt-1 text-xs text-muted">{e.audience.noOne}</p>}
          </div>
          <div className="mt-3">
            {segmentName === null ? (
              <button type="button" onClick={() => setSegmentName("")} className={softBtn}>
                <BookmarkPlus className="h-4 w-4" aria-hidden />
                {e.audience.saveSegment}
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <input autoFocus value={segmentName} onChange={(ev) => setSegmentName(ev.target.value)} maxLength={80} placeholder={e.audience.segmentName} aria-label={e.audience.segmentName} className={cn(field, "h-9 max-w-xs")} />
                <button type="button" onClick={() => void saveSegment()} disabled={!segmentName.trim()} className={softBtn}>
                  {e.audience.save}
                </button>
                <button type="button" onClick={() => setSegmentName(null)} className="h-9 px-2 text-sm text-muted hover:text-heading">
                  {e.audience.cancel}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Cuándo */}
        <section className={card}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{t.schedule}</h2>
          <div role="radiogroup" aria-label={t.schedule} className="mt-3 inline-flex rounded-[10px] bg-card-soft p-1 dark:bg-white/[0.06]">
            {(["now", "later"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={cn("h-9 rounded-lg px-4 text-sm transition-colors", mode === m ? "bg-surface font-semibold text-heading shadow-sm dark:bg-card" : "text-muted hover:text-heading")}
              >
                {m === "now" ? t.now : t.later}
              </button>
            ))}
          </div>
          {mode === "later" && (
            <div className="mt-4 max-w-sm">
              <DateTimePicker label={t.when} value={when} onChange={setWhen} locale={locale} minDate={today} step={15} />
            </div>
          )}
          {isEmail && (
            <div className="mt-4 max-w-sm">
              <Select
                size="md"
                label={e.throttle.label}
                value={throttle}
                onChange={setThrottle}
                options={THROTTLE.map((n) => ({ value: n, label: n ? e.throttle.perHour.replace("{n}", n) : e.throttle.all }))}
              />
              <p className="mt-1 text-xs text-muted">{e.throttle.hint}</p>
            </div>
          )}
          {isEmail && mode === "now" && <p className="mt-3 text-xs text-muted">{e.emailQueued}</p>}
        </section>
      </div>

      {/* Vista previa, prueba y acciones */}
      <aside className="grid content-start gap-4 xl:sticky xl:top-24">
        <section className={card}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{e.preview.title}</h2>
          <div className="mt-3">
            {isEmail ? (
              preview ? (
                <>
                  <p className="mb-2 truncate text-sm">
                    <span className="text-muted">{e.email.subject}:</span> <span className="font-medium text-heading">{preview.subject}</span>
                  </p>
                  <iframe title={preview.subject} srcDoc={preview.html} sandbox="" className="h-[30rem] w-full rounded-xl bg-white ring-1 ring-line" />
                </>
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-muted" aria-hidden />
              )
            ) : template ? (
              <TemplatePreview template={template} values={sampleValues} caption={t.previewFor.replace("{name}", t.sample)} />
            ) : (
              <p className="text-sm text-muted">{t.templateHint}</p>
            )}
          </div>
          {(isEmail || template) && (
            <div className="mt-4 grid gap-2 border-t border-line pt-4">
              {!isEmail && (
                <input value={testPhone} onChange={(ev) => setTestPhone(ev.target.value)} inputMode="tel" placeholder={e.preview.testPhone} aria-label={e.preview.testPhone} className={cn(field, "h-10")} />
              )}
              <button type="button" onClick={() => void test()} disabled={busy === "test" || (!isEmail && testPhone.replace(/\D/g, "").length < 10)} className={softBtn}>
                {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                {isEmail ? e.preview.testEmail : e.preview.test}
              </button>
              {testResult && <p className={cn("text-xs font-medium", testResult.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400")}>{testResult.text}</p>}
            </div>
          )}
        </section>

        <section className={card}>
          <h2 className="mb-2 text-sm font-semibold text-heading">{e.check.title}</h2>
          <ul className="grid gap-1.5">
            {checks.map((c) => (
              <li key={c.text} className="flex items-start gap-2 text-sm">
                {c.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                ) : c.warn ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-line-strong" aria-hidden />
                )}
                <span className={c.ok ? "text-heading" : "text-muted"}>{c.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="px-1 text-sm font-semibold text-heading">
            {notice}
          </p>
        )}

        <div className="grid gap-2">
          {mode === "now" ? (
            <button type="button" onClick={() => run("send")} disabled={!!busy} className={buttonClasses("primary", "lg", "w-full disabled:opacity-60")}>
              {busy === "send" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-5 w-5" aria-hidden />}
              {count === 1 ? t.sendActionOne : t.sendAction.replace("{n}", (count ?? 0).toLocaleString(locale))}
            </button>
          ) : (
            <button type="button" onClick={() => run("scheduled")} disabled={!!busy} className={buttonClasses("primary", "lg", "w-full disabled:opacity-60")}>
              {busy === "scheduled" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <CalendarClock className="h-5 w-5" aria-hidden />}
              {t.scheduleAction}
            </button>
          )}
          <button type="button" onClick={() => run("draft")} disabled={!!busy} className={buttonClasses("outline", "md", "w-full disabled:opacity-60")}>
            {busy === "draft" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t.saveDraft}
          </button>
          {campaign?.status === "scheduled" && (
            <button type="button" onClick={unschedule} disabled={!!busy} className={buttonClasses("outline", "md", "w-full")}>
              {t.cancel}
            </button>
          )}
          {campaign && campaign.status !== "scheduled" && (
            <button type="button" onClick={remove} disabled={!!busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
              <Trash2 className="h-4 w-4" aria-hidden />
              {t.delete}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
