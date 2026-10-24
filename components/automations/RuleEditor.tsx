"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Hourglass, Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AutomationRule, Json, WaTemplate } from "@/lib/supabase/types";
import {
  ACTIONS_BY_ENTITY,
  CONDITION_OPTIONS,
  rulesCopy,
  TRIGGERS,
  VARIABLES,
  type ConditionKey,
  type RuleAction,
  type RuleConditions as Conditions,
  type TriggerKey,
} from "@/content/rules";
import { ruleEditorCopy } from "@/content/ruleEditor";
import { crmCopy, pipeline } from "@/content/crm";
import { leadFormCopy, problemKeys } from "@/content/leadForm";
import { ticketCategories } from "@/lib/ticketCategories";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import type { Locale } from "@/i18n/config";
import { RuleTriggerPicker } from "./RuleTriggerPicker";
import { RuleConditions } from "./RuleConditions";
import { RuleActionCard, defaultAction, type TextField } from "./RuleActionCard";
import { RulePreview } from "./RulePreview";
import { ACTION_ICONS } from "./icons";
import { cn } from "@/lib/utils";

const isEmpty = (v: unknown) => v === undefined || v === null || v === false || (Array.isArray(v) && v.length === 0);

/**
 * Editor de una automatización, como un flujo: Cuando → Solo si… → Esperar →
 * Entonces…, con ajustes, resumen y prueba sobre un elemento real a la derecha.
 */
export function RuleEditor({
  locale,
  rule,
  employees,
  templates,
  folders,
  canEdit,
  extra,
}: {
  locale: Locale;
  rule: AutomationRule | null;
  employees: { id: string; name: string }[];
  templates: WaTemplate[];
  folders: string[];
  canEdit: boolean;
  /** Paneles extra bajo la columna derecha (estadísticas, ejecuciones). */
  extra?: React.ReactNode;
}) {
  const t = rulesCopy;
  const e = ruleEditorCopy;
  const crm = crmCopy[locale];
  const form = leadFormCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const initialTrigger = (rule?.trigger as TriggerKey) ?? "lead_created";
  const [name, setName] = useState(rule?.name ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [trigger, setTrigger] = useState<TriggerKey>(initialTrigger);
  const [param, setParam] = useState<number | null>(() => {
    const p = TRIGGERS[initialTrigger].param;
    return p ? (((rule?.params ?? {}) as Record<string, number>)[p.key] ?? p.default) : null;
  });
  const [conditions, setConditions] = useState<Conditions>((rule?.conditions ?? {}) as Conditions);
  const [delay, setDelay] = useState(rule?.delay_minutes ?? 0);
  const [actions, setActions] = useState<RuleAction[]>((rule?.actions ?? []) as RuleAction[]);
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [folder, setFolder] = useState(rule?.folder ?? t.groups[TRIGGERS[initialTrigger].group]);
  const [maxPerDay, setMaxPerDay] = useState<number | null>(rule?.max_per_day ?? null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<false | "save" | "dup">(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const lastField = useRef<{ index: number; field: TextField } | null>(null);

  const meta = TRIGGERS[trigger];
  const entity = meta.entity;
  const allowed = ACTIONS_BY_ENTITY[entity];

  // Opciones de cada condición con lista, según el tipo de elemento.
  const listOptions = useMemo(() => {
    const names = t.conditions;
    const opts = (keys: readonly string[], dict: Record<string, string>) => keys.map((k) => ({ value: k, label: dict[k] ?? k }));
    return {
      tiers: opts(CONDITION_OPTIONS.tiers ?? [], { ...names.tierNames, ...crm.tier }),
      statuses: pipeline.map((k) => ({ value: k, label: crm.status[k] })),
      problems: problemKeys.map((k) => ({ value: k, label: form.steps.problem.options[k] })),
      priorities: opts(entity === "task" ? ["urgent", "high", "medium", "low"] : ["critical", "high", "medium", "low"], names.priorityNames),
      channels: opts(entity === "appointment" ? ["meet", "call", "whatsapp", "in_person"] : ["web", "whatsapp", "messenger", "instagram"], names.channelNames),
      sources: opts(CONDITION_OPTIONS.sources ?? [], names.sourceNames),
      categories: ticketCategories(locale),
      stages: opts(entity === "deal" ? ["prospecting", "proposal", "negotiation", "won", "lost"] : ["onboarding", "active", "at_risk", "paused", "churned"], names.stageNames),
      kinds: opts(CONDITION_OPTIONS.kinds ?? [], names.kindNames),
    };
  }, [entity, crm, form, locale, t.conditions]);

  const chooseTrigger = (key: TriggerKey) => {
    setTrigger(key);
    setParam(TRIGGERS[key].param?.default ?? null);
    // Solo las condiciones y acciones que tienen sentido para el nuevo disparador.
    setConditions((c) => Object.fromEntries(Object.entries(c).filter(([k]) => TRIGGERS[key].conditions.includes(k as ConditionKey))) as Conditions);
    setActions((list) => list.filter((a) => ACTIONS_BY_ENTITY[TRIGGERS[key].entity].includes(a.type)));
    if (!rule && Object.values(t.groups).includes(folder)) setFolder(t.groups[TRIGGERS[key].group]);
  };

  const setAction = (index: number, patch: Partial<RuleAction>) => setActions((list) => list.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  const moveAction = (index: number, dir: -1 | 1) =>
    setActions((list) => {
      const next = [...list];
      const j = index + dir;
      if (j < 0 || j >= next.length) return list;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  const insertVariable = (v: string) => {
    const target = lastField.current;
    if (!target || !actions[target.index]) return;
    const current = (actions[target.index][target.field] as string | undefined) ?? "";
    setAction(target.index, { [target.field]: `${current}{${v}}` } as Partial<RuleAction>);
  };

  const cleanConditions = () =>
    Object.fromEntries(Object.entries(conditions).filter(([k, v]) => meta.conditions.includes(k as ConditionKey) && !isEmpty(v))) as Conditions;
  const draft = { trigger, conditions: cleanConditions() as Json, actions: actions as unknown as Json };

  // Resumen en lenguaje natural.
  const delayLabel = t.editor.delayOptions[String(delay)] ?? `${delay} min`;
  const condLabel = (k: ConditionKey, v: unknown): string => {
    if (Array.isArray(v)) {
      const list = (listOptions as Record<string, { value: string; label: string }[]>)[k];
      return `${t.conditions[k as keyof typeof t.conditions] as string}: ${v.map((x) => list?.find((o) => o.value === x)?.label ?? x).join(", ")}`;
    }
    if (k === "owner") return t.conditions.ownerOptions[String(v)];
    if (k === "business_hours" || k === "outside_hours") return t.conditions[k];
    return `${t.conditions[k as keyof typeof t.conditions] as string}: ${Number(v).toLocaleString(locale)}`;
  };
  const summaryIf = Object.entries(cleanConditions()).map(([k, v]) => condLabel(k as ConditionKey, v));

  const save = async () => {
    if (!name.trim()) return setError(t.editor.errors.name);
    if (actions.length === 0) return setError(t.editor.errors.actions);
    if (actions.some((a) => a.type === "webhook" && !/^https:\/\/\S+$/.test(a.url ?? ""))) return setError(t.editor.errors.webhook);
    setError(null);
    setBusy("save");
    const row = {
      name: name.trim(),
      description: description.trim() || null,
      trigger,
      params: (meta.param && param ? { [meta.param.key]: param } : {}) as Json,
      conditions: cleanConditions() as Json,
      actions: actions as unknown as Json,
      enabled,
      delay_minutes: delay,
      max_per_day: maxPerDay,
      folder: folder.trim() || null,
    };
    const { data, error: dbError } = rule
      ? await supabase.from("automation_rules").update(row).eq("id", rule.id).select("id").single()
      : await supabase.from("automation_rules").insert(row).select("id").single();
    setBusy(false);
    if (dbError || !data) return setError(t.editor.errors.generic);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
    if (!rule) router.replace(`/${locale}/portal/automatizaciones/${data.id}`);
    router.refresh();
  };

  const duplicate = async () => {
    if (!rule) return;
    setBusy("dup");
    const { data, error: rpcError } = await supabase.rpc("automation_duplicate", { p_rule: rule.id });
    setBusy(false);
    if (rpcError || !data) return setError(t.editor.errors.generic);
    router.push(`/${locale}/portal/automatizaciones/${data}`);
  };

  const remove = async () => {
    if (!rule || !window.confirm(e.confirmDelete)) return;
    await supabase.from("automation_rules").delete().eq("id", rule.id);
    router.push(`/${locale}/portal/automatizaciones`);
    router.refresh();
  };

  const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";
  const field = "mb-1 block text-xs font-medium text-muted";
  const steps: { key: keyof typeof e.steps; show: boolean }[] = [
    { key: "when", show: true },
    { key: "conditions", show: meta.conditions.length > 0 },
    { key: "wait", show: true },
    { key: "then", show: true },
  ];
  const visible = steps.filter((s) => s.show).map((s) => s.key);
  const stepHead = (key: keyof typeof e.steps, hint?: string) => (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-deep-700 text-xs font-semibold text-white dark:bg-brand-green dark:text-deep-700">
        {visible.indexOf(key) + 1}
      </span>
      <div>
        <h2 className="text-[0.98rem] font-semibold leading-7 text-heading">{e.steps[key]}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
  // Línea que une los pasos del flujo.
  const connector = <div className="ml-[2.1rem] h-5 w-px bg-line-strong" aria-hidden />;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
      <fieldset disabled={!canEdit} className="min-w-0">
        <legend className="sr-only">{name || t.editor.newTitle}</legend>
        {!canEdit && <p className="mb-4 rounded-lg bg-[var(--meta-active)]/60 px-4 py-3 text-sm text-heading">{e.readOnly}</p>}

        {/* 1. Cuando */}
        <section className={card}>
          {stepHead("when")}
          <RuleTriggerPicker value={trigger} onChange={chooseTrigger} param={param} onParam={setParam} disabled={!canEdit} />
        </section>

        {/* 2. Solo si */}
        {meta.conditions.length > 0 && (
          <>
            {connector}
            <section className={card}>
              {stepHead("conditions", t.conditions.hint)}
              <RuleConditions keys={meta.conditions} value={conditions} onChange={setConditions} options={listOptions} disabled={!canEdit} />
            </section>
          </>
        )}

        {/* 3. Esperar */}
        {connector}
        <section className={card}>
          {stepHead("wait", t.editor.delayHint)}
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t.editor.delay}>
            {Object.entries(t.editor.delayOptions).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={delay === Number(value)}
                onClick={() => setDelay(Number(value))}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm transition-colors",
                  delay === Number(value) ? "bg-[var(--meta-active)] font-semibold text-accent ring-1 ring-brand-green-dark/40" : "text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]",
                )}
              >
                {delay === Number(value) && Number(value) > 0 && <Hourglass className="h-3.5 w-3.5" aria-hidden />}
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* 4. Entonces */}
        {connector}
        <section className={card}>
          {stepHead("then")}
          {actions.length === 0 && <p className="mb-3 rounded-lg border border-dashed border-line-strong px-4 py-5 text-center text-sm text-muted">{e.noActions}</p>}
          <ol className="grid gap-3">
            {actions.map((a, i) => (
              <RuleActionCard
                key={i}
                locale={locale}
                action={a}
                index={i}
                count={actions.length}
                entity={entity}
                employees={employees}
                templates={templates}
                disabled={!canEdit}
                onChange={(patch) => setAction(i, patch)}
                onRemove={() => setActions((list) => list.filter((_, j) => j !== i))}
                onMove={(dir) => moveAction(i, dir)}
                onFocusField={(f) => (lastField.current = { index: i, field: f })}
              />
            ))}
          </ol>
          {canEdit && (
            <div className="relative mt-3">
              <button type="button" onClick={() => setAdding((v) => !v)} aria-expanded={adding} className={buttonClasses("outline", "md", "h-10")}>
                <Plus className="h-4 w-4" aria-hidden />
                {t.actions.add}
              </button>
              {adding && (
                <div className="absolute left-0 top-12 z-20 grid w-[min(36rem,calc(100vw-3rem))] gap-1 rounded-xl border border-line bg-surface p-1.5 shadow-[0_12px_28px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] sm:grid-cols-2 dark:bg-card">
                  {allowed.map((type) => {
                    const Icon = ACTION_ICONS[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setActions((list) => [...list, defaultAction(type)]);
                          setAdding(false);
                        }}
                        className="flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-[var(--meta-hover)]"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-deep-700/[0.06] text-heading dark:bg-white/[0.08]">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-heading">{t.actions.types[type].label}</span>
                          <span className="block text-xs leading-snug text-muted">{t.actions.types[type].desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs font-medium text-heading">{t.actions.variables}</p>
            <p className="text-xs text-muted">{t.actions.variablesHint}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {VARIABLES[entity].map((v) => (
                <button
                  key={v}
                  type="button"
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => insertVariable(v)}
                  className="rounded-md bg-[var(--meta-active)] px-2 py-1 font-mono text-xs text-heading hover:brightness-95"
                >
                  {`{${v}}`}
                </button>
              ))}
            </div>
          </div>
        </section>
      </fieldset>

      {/* Columna derecha */}
      <aside className="grid content-start gap-5 xl:sticky xl:top-20">
        <section className={card}>
          <h2 className="text-[0.98rem] font-semibold text-heading">{e.settings}</h2>
          <div className="mt-4 grid gap-3">
            <label className="block">
              <span className={field}>{t.editor.name}</span>
              <input value={name} onChange={(ev) => setName(ev.target.value)} disabled={!canEdit} maxLength={120} placeholder={t.editor.namePlaceholder} className={cn(inputClass, "h-10 text-sm")} />
            </label>
            <label className="block">
              <span className={field}>{t.editor.description}</span>
              <textarea value={description} onChange={(ev) => setDescription(ev.target.value)} disabled={!canEdit} maxLength={300} rows={2} className={cn(inputClass, "h-auto resize-y py-2 text-sm")} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={field}>{t.editor.folder}</span>
                <input
                  value={folder}
                  onChange={(ev) => setFolder(ev.target.value)}
                  disabled={!canEdit}
                  maxLength={40}
                  list="rule-folders"
                  placeholder={e.folderPlaceholder}
                  className={cn(inputClass, "h-10 text-sm")}
                />
                <datalist id="rule-folders">
                  {[...new Set([...folders, ...Object.values(t.groups)])].map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </label>
              <label className="block">
                <span className={field}>{t.editor.maxPerDay}</span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={maxPerDay ?? ""}
                  onChange={(ev) => setMaxPerDay(ev.target.value === "" ? null : Math.max(1, Math.min(10000, Number(ev.target.value))))}
                  disabled={!canEdit}
                  placeholder={e.maxPlaceholder}
                  className={cn(inputClass, "h-10 text-sm tabular-nums")}
                />
              </label>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-sm font-medium text-heading">{t.editor.enabled}</span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={t.editor.enabled}
                disabled={!canEdit}
                onClick={() => setEnabled((v) => !v)}
                className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", enabled ? "bg-brand-green-dark dark:bg-brand-green" : "bg-line-strong dark:bg-white/20")}
              >
                <span className={cn("absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", enabled ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
            {rule?.template_key && <p className="text-xs text-muted">{e.template}</p>}
          </div>

          {/* Resumen */}
          <div className="mt-4 rounded-lg bg-[var(--meta-active)]/60 p-4 text-sm leading-relaxed text-heading">
            <p>
              <span className="font-semibold">{e.steps.when}</span> {t.triggers[trigger].label.toLowerCase()}
              {meta.param && param ? ` (${param} ${meta.param.unit})` : ""}
            </p>
            <p className="mt-1.5">
              <span className="font-semibold">{t.conditions.title}</span> {summaryIf.length ? summaryIf.join(" · ") : e.summaryAny}
            </p>
            {delay > 0 && <p className="mt-1.5">{e.summaryWait.replace("{t}", delayLabel.toLowerCase())}</p>}
            <p className="mt-1.5 font-semibold">{t.actions.title}</p>
            <ol className="mt-1 list-decimal pl-5">
              {actions.map((a, i) => (
                <li key={i}>{t.actions.types[a.type].label}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted">{meta.instant ? (delay > 0 ? e.summaryWait.replace("{t}", delayLabel.toLowerCase()) : t.editor.instant) : t.editor.periodic}</p>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {canEdit && (
            <div className="mt-4 grid gap-2">
              <button type="button" onClick={save} disabled={!!busy} className={buttonClasses("primary", "md", "w-full disabled:opacity-60")}>
                {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : saved ? <Check className="h-4 w-4" aria-hidden /> : null}
                {busy === "save" ? t.editor.saving : saved ? t.editor.saved : t.editor.save}
              </button>
              {rule && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={duplicate}
                    disabled={!!busy}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50"
                  >
                    {busy === "dup" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                    {busy === "dup" ? e.duplicating : e.duplicate}
                  </button>
                  <button type="button" onClick={remove} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] text-sm font-medium text-red-600 ring-1 ring-line hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" aria-hidden />
                    {e.delete}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <RulePreview key={trigger} trigger={trigger} rule={draft} ruleId={rule?.id ?? null} canRun={canEdit} />
        {extra}
      </aside>
    </div>
  );
}

