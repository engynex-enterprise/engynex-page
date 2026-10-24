"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AutomationRule, Json, WaTemplate } from "@/lib/supabase/types";
import {
  ACTIONS_BY_ENTITY,
  rulesCopy,
  TRIGGERS,
  VARIABLES,
  type ActionType,
  type ConditionKey,
  type RuleAction,
  type TriggerKey,
} from "@/content/rules";
import { crmCopy, pipeline } from "@/content/crm";
import { leadFormCopy, problemKeys } from "@/content/leadForm";
import { ticketsCopy } from "@/content/tickets";
import { ticketPriorities, ticketStatuses } from "@/lib/tickets";
import { Select } from "@/components/ui/Select";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { ACTION_ICONS, GROUP_ICONS } from "./RulesList";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Conditions = Partial<Record<ConditionKey, string[]>>;
const ROLE_KEYS = ["admin", "sales", "marketing", "support"];

const defaultAction = (type: ActionType): RuleAction => {
  switch (type) {
    case "assign":
      return { type, roles: ["sales"] };
    case "task":
      return { type, title: "Hacer seguimiento a {nombre}", due_minutes: 1440, assign_to: "owner" };
    case "notify":
      return { type, to: "owner", roles: ["admin"], title: "", body: "" };
    case "email":
      return { type, to: "contact", subject: "", body: "" };
    case "whatsapp":
      return { type, template_id: "", params: [] };
    case "status":
      return { type, status: "" };
    case "tag":
      return { type, tag: "" };
  }
};

function Chips({ options, value, onChange }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
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
              "inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm font-semibold transition-colors",
              on ? "bg-[var(--meta-active)] text-accent ring-1 ring-brand-green-dark/30" : "bg-card-soft text-heading hover:brightness-95",
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

/**
 * Editor de una automatización, con el esquema de Meta Business Suite:
 * Cuando… → Solo si… → Entonces…, y un resumen a la derecha.
 */
export function RuleEditor({
  locale,
  rule,
  employees,
  templates,
  canEdit,
}: {
  locale: Locale;
  rule: AutomationRule | null;
  employees: { id: string; name: string }[];
  templates: WaTemplate[];
  canEdit: boolean;
}) {
  const t = rulesCopy;
  const crm = crmCopy[locale];
  const form = leadFormCopy[locale];
  const tk = ticketsCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState(rule?.name ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [trigger, setTrigger] = useState<TriggerKey>((rule?.trigger as TriggerKey) ?? "lead_created");
  const initialParams = (rule?.params ?? {}) as Record<string, number>;
  const [param, setParam] = useState<number | null>(() => {
    const p = TRIGGERS[(rule?.trigger as TriggerKey) ?? "lead_created"].param;
    return p ? (initialParams[p.key] ?? p.default) : null;
  });
  const [conditions, setConditions] = useState<Conditions>((rule?.conditions ?? {}) as Conditions);
  const [actions, setActions] = useState<RuleAction[]>((rule?.actions ?? []) as RuleAction[]);
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const lastField = useRef<{ index: number; field: keyof RuleAction } | null>(null);

  const meta = TRIGGERS[trigger];
  const entity = meta.entity;
  const allowed = ACTIONS_BY_ENTITY[entity];

  const chooseTrigger = (key: TriggerKey) => {
    setTrigger(key);
    setParam(TRIGGERS[key].param?.default ?? null);
    // Solo las condiciones y acciones que tienen sentido para el nuevo disparador.
    setConditions((c) => Object.fromEntries(Object.entries(c).filter(([k]) => TRIGGERS[key].conditions.includes(k as ConditionKey))));
    setActions((list) => list.filter((a) => ACTIONS_BY_ENTITY[TRIGGERS[key].entity].includes(a.type)));
  };

  const setAction = (index: number, patch: Partial<RuleAction>) =>
    setActions((list) => list.map((a, i) => (i === index ? { ...a, ...patch } : a)));

  const insertVariable = (v: string) => {
    const target = lastField.current;
    if (!target) return;
    const current = (actions[target.index]?.[target.field] as string | undefined) ?? "";
    setAction(target.index, { [target.field]: `${current}{${v}}` } as Partial<RuleAction>);
  };

  const textField = (index: number, field: "title" | "body" | "subject" | "cta_label" | "cta_url" | "tag", label: string, multiline = false) => {
    const value = (actions[index][field] as string | undefined) ?? "";
    const common = {
      value,
      onFocus: () => (lastField.current = { index, field }),
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAction(index, { [field]: event.target.value } as Partial<RuleAction>),
      disabled: !canEdit,
      "aria-label": label,
    };
    return (
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
        {multiline ? (
          <textarea {...common} rows={4} maxLength={2000} className={cn(inputClass, "h-auto resize-y py-2.5 text-sm leading-relaxed")} />
        ) : (
          <input {...common} maxLength={field === "cta_url" ? 300 : 200} className={cn(inputClass, "h-10 text-sm")} />
        )}
      </label>
    );
  };

  const roleChips = (index: number) => (
    <Chips
      options={ROLE_KEYS.map((r) => ({ value: r, label: t.actions.roles[r] }))}
      value={actions[index].roles ?? []}
      onChange={(roles) => setAction(index, { roles })}
    />
  );
  const personSelect = (index: number, label: string) => (
    <Select
      size="md"
      label={label}
      value={actions[index].user_id ?? ""}
      onChange={(v) => setAction(index, { user_id: v })}
      options={employees.map((e) => ({ value: e.id, label: e.name }))}
      placeholder="—"
    />
  );

  const actionFields = (a: RuleAction, i: number) => {
    switch (a.type) {
      case "assign":
        return (
          <div className="grid gap-3">
            <Select
              size="md"
              label={t.actions.to}
              value={a.user_id ? "user" : "roles"}
              onChange={(v) => setAction(i, v === "user" ? { user_id: employees[0]?.id ?? "" } : { user_id: undefined })}
              options={[
                { value: "roles", label: t.actions.roundRobin },
                { value: "user", label: t.actions.person },
              ]}
            />
            {a.user_id !== undefined ? personSelect(i, t.actions.person) : roleChips(i)}
          </div>
        );
      case "task":
        return (
          <div className="grid gap-3">
            {textField(i, "title", t.actions.taskTitle)}
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                size="md"
                label={t.actions.due}
                value={String(a.due_minutes ?? 1440)}
                onChange={(v) => setAction(i, { due_minutes: Number(v) })}
                options={Object.entries(t.actions.dueOptions).map(([value, label]) => ({ value, label }))}
              />
              <Select
                size="md"
                label={t.actions.to}
                value={a.assign_to ?? "owner"}
                onChange={(v) => setAction(i, { assign_to: v as "owner" | "user" })}
                options={[
                  { value: "owner", label: t.actions.toOwner },
                  { value: "user", label: t.actions.toUser },
                ]}
              />
            </div>
            {a.assign_to === "user" && personSelect(i, t.actions.toUser)}
          </div>
        );
      case "notify":
        return (
          <div className="grid gap-3">
            <Select
              size="md"
              label={t.actions.to}
              value={a.to ?? "owner"}
              onChange={(v) => setAction(i, { to: v as RuleAction["to"] })}
              options={[
                { value: "owner", label: t.actions.toOwner },
                { value: "roles", label: t.actions.toRoles },
                { value: "user", label: t.actions.toUser },
              ]}
            />
            {a.to === "roles" && roleChips(i)}
            {a.to === "user" && personSelect(i, t.actions.toUser)}
            {textField(i, "title", t.actions.titleLabel)}
            {textField(i, "body", t.actions.bodyLabel, true)}
          </div>
        );
      case "email":
        return (
          <div className="grid gap-3">
            <Select
              size="md"
              label={t.actions.to}
              value={a.to ?? "contact"}
              onChange={(v) => setAction(i, { to: v as RuleAction["to"] })}
              options={[
                { value: "contact", label: t.actions.toContact },
                { value: "team", label: t.actions.toTeam },
              ]}
            />
            {textField(i, "subject", t.actions.subject)}
            {textField(i, "body", t.actions.bodyLabel, true)}
            {a.to !== "team" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {textField(i, "cta_label", t.actions.ctaLabel)}
                {textField(i, "cta_url", t.actions.ctaUrl)}
              </div>
            )}
          </div>
        );
      case "whatsapp": {
        const tpl = templates.find((x) => x.id === a.template_id);
        return templates.length === 0 ? (
          <p className="text-sm text-muted">{t.actions.noTemplates}</p>
        ) : (
          <div className="grid gap-3">
            <Select
              size="md"
              label={t.actions.template}
              value={a.template_id ?? ""}
              onChange={(v) => setAction(i, { template_id: v, params: Array(templates.find((x) => x.id === v)?.variables ?? 0).fill("{primer_nombre}") })}
              options={templates.map((x) => ({ value: x.id, label: `${x.name} · ${x.language}` }))}
              placeholder="—"
            />
            {tpl &&
              Array.from({ length: tpl.variables }, (_, n) => (
                <label key={n} className="block">
                  <span className="mb-1 block text-xs font-semibold text-muted">{t.actions.templateParam.replace("{n}", String(n + 1))}</span>
                  <input
                    value={a.params?.[n] ?? ""}
                    onChange={(event) => {
                      const params = [...(a.params ?? [])];
                      params[n] = event.target.value;
                      setAction(i, { params });
                    }}
                    className={cn(inputClass, "h-10 text-sm")}
                  />
                </label>
              ))}
          </div>
        );
      }
      case "status":
        return (
          <Select
            size="md"
            label={t.actions.status}
            value={a.status ?? ""}
            onChange={(v) => setAction(i, { status: v })}
            placeholder="—"
            options={
              entity === "ticket"
                ? ticketStatuses.map((s) => ({ value: s, label: tk.staffStatus[s] }))
                : pipeline.map((s) => ({ value: s, label: crm.status[s] }))
            }
          />
        );
      case "tag":
        return textField(i, "tag", t.actions.tag);
    }
  };

  const conditionOptions: Record<ConditionKey, { value: string; label: string }[]> = {
    tiers: (["green", "yellow", "red"] as const).map((k) => ({ value: k, label: crm.tier[k] })),
    statuses: pipeline.map((k) => ({ value: k, label: crm.status[k] })),
    problems: problemKeys.map((k) => ({ value: k, label: form.steps.problem.options[k] })),
    priorities: ticketPriorities.map((k) => ({ value: k, label: t.conditions.priorityNames[k] })),
    channels: ["web", "whatsapp"].map((k) => ({ value: k, label: t.conditions.channelNames[k] })),
  };

  // Resumen en lenguaje natural.
  const summaryWhen = `${t.triggers[trigger].label}${meta.param && param ? ` (${param} ${meta.param.unit})` : ""}`;
  const summaryIf = meta.conditions
    .filter((k) => (conditions[k] ?? []).length > 0)
    .map((k) => `${t.conditions[k]}: ${(conditions[k] ?? []).map((v) => conditionOptions[k].find((o) => o.value === v)?.label ?? v).join(", ")}`);

  const save = async () => {
    if (!name.trim()) return setError(t.editor.errors.name);
    if (actions.length === 0) return setError(t.editor.errors.actions);
    setError(null);
    setBusy(true);
    const row = {
      name: name.trim(),
      description: description.trim() || null,
      trigger,
      params: (meta.param && param ? { [meta.param.key]: param } : {}) as Json,
      conditions: Object.fromEntries(Object.entries(conditions).filter(([, v]) => (v ?? []).length > 0)) as Json,
      actions: actions as unknown as Json,
      enabled,
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

  const remove = async () => {
    if (!rule || !window.confirm(t.confirmDelete)) return;
    await supabase.from("automation_rules").delete().eq("id", rule.id);
    router.push(`/${locale}/portal/automatizaciones`);
    router.refresh();
  };

  const card = "rounded-lg bg-surface p-5 shadow-meta sm:p-6 dark:bg-card";
  const step = (n: number, title: string) => (
    <h2 className="flex items-center gap-3 text-lg font-bold text-heading">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-deep-700 text-sm text-white dark:bg-white dark:text-deep-700">{n}</span>
      {title}
    </h2>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <fieldset disabled={!canEdit} className="grid min-w-0 content-start gap-4">
        {/* 1. Cuándo */}
        <section className={card}>
          {step(1, t.editor.when)}
          <div className="mt-5 grid gap-5">
            {(["sales", "meetings", "service", "chat"] as const).map((group) => {
              const g = GROUP_ICONS[group];
              const GIcon = g.icon;
              return (
                <div key={group}>
                  <p className="mb-2 text-sm font-semibold text-muted">{t.groups[group]}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(Object.keys(TRIGGERS) as TriggerKey[])
                      .filter((k) => TRIGGERS[k].group === group)
                      .map((k) => {
                        const on = k === trigger;
                        return (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={on}
                            onClick={() => chooseTrigger(k)}
                            className={cn(
                              "flex items-start gap-3 rounded-lg p-3 text-left transition-colors",
                              on ? "bg-[var(--meta-active)] ring-2 ring-brand-green-dark/40" : "bg-card-soft/60 hover:bg-[var(--meta-hover)]",
                            )}
                          >
                            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full text-white", g.tone)}>
                              <GIcon className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-heading">{t.triggers[k].label}</span>
                              <span className="mt-0.5 block text-xs leading-snug text-muted">{t.triggers[k].desc}</span>
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              );
            })}
            {meta.param && (
              <label className="block max-w-xs">
                <span className="mb-1 block text-sm font-semibold text-heading">{meta.param.label}</span>
                <input
                  type="number"
                  min={1}
                  max={meta.param.key === "minutes" ? 1440 : meta.param.key === "hours" ? 168 : 90}
                  value={param ?? ""}
                  onChange={(event) => setParam(Number(event.target.value) || null)}
                  className={cn(inputClass, "h-10 text-sm")}
                />
              </label>
            )}
          </div>
        </section>

        {/* 2. Solo si */}
        {meta.conditions.length > 0 && (
          <section className={card}>
            {step(2, t.conditions.title)}
            <p className="mt-1 text-sm text-muted">{t.conditions.hint}</p>
            <div className="mt-4 grid gap-4">
              {meta.conditions.map((k) => (
                <div key={k}>
                  <p className="mb-2 text-sm font-semibold text-heading">{t.conditions[k]}</p>
                  <Chips options={conditionOptions[k]} value={conditions[k] ?? []} onChange={(v) => setConditions((c) => ({ ...c, [k]: v }))} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Entonces */}
        <section className={card}>
          {step(meta.conditions.length > 0 ? 3 : 2, t.actions.title)}
          <ol className="mt-5 grid gap-3">
            {actions.map((a, i) => {
              const Icon = ACTION_ICONS[a.type];
              return (
                <li key={i} className="rounded-lg border border-line p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-card-soft text-heading">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-heading">{t.actions.types[a.type].label}</span>
                      <span className="block text-xs text-muted">{t.actions.types[a.type].desc}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActions((list) => list.filter((_, j) => j !== i))}
                      aria-label={t.actions.remove}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-[var(--meta-hover)] hover:text-red-600"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  {actionFields(a, i)}
                </li>
              );
            })}
          </ol>
          <div className="relative mt-3">
            <button type="button" onClick={() => setAdding((v) => !v)} aria-expanded={adding} className={buttonClasses("outline", "md", "h-10")}>
              <Plus className="h-4 w-4" aria-hidden />
              {t.actions.add}
            </button>
            {adding && (
              <div className="absolute left-0 top-12 z-20 w-80 rounded-lg bg-surface p-1.5 shadow-[0_12px_28px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:bg-card">
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
                      className="flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-[var(--meta-hover)]"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card-soft text-heading">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-heading">{t.actions.types[type].label}</span>
                        <span className="block text-xs text-muted">{t.actions.types[type].desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs font-semibold text-muted">{t.actions.variables}</p>
            <p className="text-xs text-muted">{t.actions.variablesHint}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {VARIABLES[entity].map((v) => (
                <button
                  key={v}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertVariable(v)}
                  className="rounded-md bg-card-soft px-2 py-1 font-mono text-xs text-heading hover:brightness-95"
                >
                  {`{${v}}`}
                </button>
              ))}
            </div>
          </div>
        </section>
      </fieldset>

      {/* Resumen */}
      <aside className="grid content-start gap-4 xl:sticky xl:top-20">
        <section className={card}>
          <h2 className="text-lg font-bold text-heading">{t.editor.summary}</h2>
          <div className="mt-4 grid gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">{t.editor.name}</span>
              <input value={name} onChange={(event) => setName(event.target.value)} disabled={!canEdit} maxLength={120} placeholder={t.editor.namePlaceholder} className={cn(inputClass, "h-10 text-sm")} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">{t.editor.description}</span>
              <input value={description} onChange={(event) => setDescription(event.target.value)} disabled={!canEdit} maxLength={300} className={cn(inputClass, "h-10 text-sm")} />
            </label>
          </div>
          <div className="mt-5 rounded-lg bg-card-soft p-4 text-sm leading-relaxed text-heading">
            <p>
              <span className="font-bold">{t.editor.when}</span> {summaryWhen.toLowerCase()}
            </p>
            {summaryIf.length > 0 && (
              <p className="mt-2">
                <span className="font-bold">{t.conditions.title}</span> {summaryIf.join(" · ")}
              </p>
            )}
            <p className="mt-2 font-bold">{t.actions.title}</p>
            <ol className="mt-1 list-decimal pl-5">
              {actions.map((a, i) => (
                <li key={i}>{t.actions.types[a.type].label}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted">{meta.instant ? t.editor.instant : t.editor.periodic}</p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-heading">{t.editor.enabled}</span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={t.editor.enabled}
              disabled={!canEdit}
              onClick={() => setEnabled((v) => !v)}
              className={cn("relative h-7 w-12 rounded-full transition-colors", enabled ? "bg-emerald-500" : "bg-line-strong dark:bg-white/20")}
            >
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left]", enabled ? "left-6" : "left-1")} />
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {canEdit && (
            <div className="mt-4 grid gap-2">
              <button type="button" onClick={save} disabled={busy} className={buttonClasses("primary", "md", "w-full disabled:opacity-60")}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : saved ? <Check className="h-4 w-4" aria-hidden /> : null}
                {busy ? t.editor.saving : saved ? t.editor.saved : t.editor.save}
              </button>
              {rule && (
                <button type="button" onClick={remove} className="inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold text-red-600 hover:bg-[var(--meta-hover)]">
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t.delete}
                </button>
              )}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
