"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Send, Trash2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { WaCampaign, WaParam, WaSegment, WaTemplate } from "@/lib/supabase/types";
import { campaignsCopy } from "@/content/campaigns";
import { crmCopy, pipeline } from "@/content/crm";
import { leadFormCopy, problemKeys } from "@/content/leadForm";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { TemplatePreview } from "./TemplatePreview";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const TIERS = ["green", "yellow", "red"] as const;
const DAYS = ["", "7", "30", "90", "180", "365"] as const;

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
      <legend className="mb-2 text-xs font-semibold text-muted">{legend}</legend>
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
                "h-9 rounded-full px-3.5 text-sm font-semibold ring-1 transition-colors",
                on
                  ? "bg-deep-700 text-white ring-deep-700 dark:bg-white dark:text-deep-700 dark:ring-white"
                  : "text-heading ring-line-strong hover:bg-surface-soft dark:hover:bg-white/[0.06]",
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

/**
 * Crear o editar una campaña: plantilla, variables, audiencia (con conteo en
 * vivo) y envío inmediato o programado, con vista previa al estilo WhatsApp.
 */
export function CampaignEditor({
  locale,
  templates,
  campaign,
  ready,
}: {
  locale: Locale;
  templates: WaTemplate[];
  campaign: WaCampaign | null;
  ready: boolean;
}) {
  const t = campaignsCopy[locale].editor;
  const crm = crmCopy[locale];
  const form = leadFormCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const nameId = useId();

  const [name, setName] = useState(campaign?.name ?? "");
  const [templateId, setTemplateId] = useState(campaign?.template_id ?? "");
  const [params, setParams] = useState<WaParam[]>((campaign?.params as WaParam[] | undefined) ?? []);
  const initialSegment = (campaign?.segment ?? {}) as WaSegment;
  const [segment, setSegment] = useState<WaSegment>({
    tiers: initialSegment.tiers ?? [],
    statuses: initialSegment.statuses ?? [],
    problems: initialSegment.problems ?? [],
    days: initialSegment.days ?? null,
  });
  const [mode, setMode] = useState<"now" | "later">(campaign?.status === "scheduled" ? "later" : "now");
  const [when, setWhen] = useState<string | null>(campaign?.scheduled_at ?? null);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const template = templates.find((x) => x.id === templateId) ?? null;
  const vars = template?.variables ?? 0;
  const slots: WaParam[] = Array.from({ length: vars }, (_, i) => params[i] ?? { source: "first_name" });

  // Conteo de audiencia en vivo.
  const segmentKey = JSON.stringify(segment);
  useEffect(() => {
    const id = window.setTimeout(async () => {
      const { data } = await supabase.rpc("wa_audience_count", { p_segment: JSON.parse(segmentKey) });
      setCount(data ?? 0);
    }, 300);
    return () => window.clearTimeout(id);
  }, [segmentKey, supabase]);

  const sampleValues = slots.map((p) => {
    if (p.source === "static") return p.value ?? "";
    if (p.source === "company") return p.fallback || "Acme S.A.S.";
    if (p.source === "name") return `${t.sample} Gómez`;
    return t.sample;
  });

  const setSlot = (i: number, patch: Partial<WaParam>) =>
    setParams(() => slots.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const validate = (status: "draft" | "scheduled" | "send") => {
    if (!name.trim()) return t.errors.name;
    if (status === "draft") return null;
    if (!template) return t.errors.template;
    if (slots.some((p) => p.source === "static" && !p.value?.trim())) return t.errors.params;
    if (!count) return t.errors.audience;
    if (status === "scheduled" && (!when || new Date(when) <= new Date())) return t.errors.when;
    return null;
  };

  const save = async (status: "draft" | "scheduled") => {
    const row = {
      name: name.trim(),
      template_id: templateId || null,
      params: slots,
      segment: { ...segment, days: segment.days || null },
      status,
      scheduled_at: status === "scheduled" ? when : null,
    };
    if (campaign) {
      const { error: e } = await supabase.from("wa_campaigns").update(row).eq("id", campaign.id);
      if (e) throw e;
      return campaign.id;
    }
    const { data, error: e } = await supabase.from("wa_campaigns").insert(row).select("id").single();
    if (e) throw e;
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

  const card = "rounded-lg bg-surface p-6 shadow-meta dark:bg-card";
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="grid content-start gap-6">
        {/* Nombre y plantilla */}
        <section className={card}>
          <label htmlFor={nameId} className="mb-1.5 block text-sm font-semibold text-heading">
            {t.name}
          </label>
          <input
            id={nameId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            placeholder={t.namePlaceholder}
            className={inputClass}
          />
          <div className="mt-5">
            {templates.length === 0 ? (
              <p className="rounded-lg bg-surface-soft p-4 text-sm text-muted dark:bg-white/[0.05]">{t.noTemplates}</p>
            ) : (
              <Select
                size="md"
                label={t.template}
                value={templateId}
                onChange={setTemplateId}
                placeholder={t.templateHint}
                options={templates.map((x) => ({ value: x.id, label: `${x.name} · ${x.language}` }))}
              />
            )}
          </div>
        </section>

        {/* Variables */}
        {vars > 0 && (
          <section className={card}>
            <h2 className="text-base text-heading">{t.variables}</h2>
            <div className="mt-4 grid gap-4">
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
                    <label>
                      <span className="mb-1.5 block text-xs font-semibold text-muted">{t.staticValue}</span>
                      <input
                        value={p.value ?? ""}
                        onChange={(event) => setSlot(i, { value: event.target.value })}
                        maxLength={200}
                        className={cn(inputClass, "h-11 text-sm")}
                      />
                    </label>
                  ) : (
                    <label>
                      <span className="mb-1.5 block text-xs font-semibold text-muted">{t.fallback}</span>
                      <input
                        value={p.fallback ?? ""}
                        onChange={(event) => setSlot(i, { fallback: event.target.value })}
                        maxLength={200}
                        placeholder="—"
                        className={cn(inputClass, "h-11 text-sm")}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Audiencia */}
        <section className={card}>
          <h2 className="text-base text-heading">{t.audience}</h2>
          <p className="mt-1 text-sm text-muted">{t.audienceHint}</p>
          <div className="mt-5 grid gap-5">
            <Chips
              legend={t.tiers}
              options={TIERS.map((k) => ({ value: k, label: crm.tier[k] }))}
              value={segment.tiers ?? []}
              onChange={(tiers) => setSegment((s) => ({ ...s, tiers }))}
            />
            <Chips
              legend={t.statuses}
              options={pipeline.map((k) => ({ value: k, label: crm.status[k] }))}
              value={segment.statuses ?? []}
              onChange={(statuses) => setSegment((s) => ({ ...s, statuses }))}
            />
            <Chips
              legend={t.problems}
              options={problemKeys.map((k) => ({ value: k, label: form.steps.problem.options[k] }))}
              value={segment.problems ?? []}
              onChange={(problems) => setSegment((s) => ({ ...s, problems }))}
            />
            <div className="max-w-xs">
              <Select
                size="md"
                label={t.days}
                value={segment.days ? String(segment.days) : ""}
                onChange={(v) => setSegment((s) => ({ ...s, days: v ? Number(v) : null }))}
                options={DAYS.map((d) => ({ value: d, label: d ? t.daysOption.replace("{n}", d) : t.anyTime }))}
              />
            </div>
          </div>
          <p className="mt-6 flex items-center gap-2 rounded-lg bg-surface-soft px-4 py-3 text-sm font-bold text-heading dark:bg-white/[0.05]" aria-live="polite">
            <Users className="h-4 w-4 text-accent" aria-hidden />
            {count === null ? "…" : count === 1 ? t.countOne : t.count.replace("{n}", count.toLocaleString(locale))}
          </p>
        </section>

        {/* Cuándo */}
        <section className={card}>
          <h2 className="text-base text-heading">{t.schedule}</h2>
          <div role="radiogroup" aria-label={t.schedule} className="mt-4 inline-flex rounded-full bg-surface-soft p-1 dark:bg-white/[0.06]">
            {(["now", "later"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "h-9 rounded-full px-4 text-sm font-semibold transition-colors",
                  mode === m ? "bg-surface text-heading shadow-sm dark:bg-card" : "text-muted hover:text-heading",
                )}
              >
                {m === "now" ? t.now : t.later}
              </button>
            ))}
          </div>
          {mode === "later" && (
            <div className="mt-4 max-w-sm">
              <DateTimePicker label={t.when} value={when} onChange={setWhen} locale={locale} minDate={minDate} step={15} />
            </div>
          )}
        </section>
      </div>

      {/* Vista previa y acciones */}
      <aside className="grid content-start gap-4 xl:sticky xl:top-24">
        <section className={card}>
          <h2 className="text-base text-heading">{t.preview}</h2>
          <div className="mt-4">
            {template ? (
              <TemplatePreview template={template} values={sampleValues} caption={t.previewFor.replace("{name}", t.sample)} />
            ) : (
              <p className="text-sm text-muted">{t.templateHint}</p>
            )}
          </div>
        </section>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
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
            <button
              type="button"
              onClick={remove}
              disabled={!!busy}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t.delete}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
