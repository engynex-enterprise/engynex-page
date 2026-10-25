"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { rulesCopy, type ActionType, type RuleAction, type RuleEntity } from "@/content/rules";
import { ruleEditorCopy } from "@/content/ruleEditor";
import { crmCopy, pipeline } from "@/content/crm";
import { ticketsCopy } from "@/content/tickets";
import { ticketPriorities, ticketStatuses } from "@/lib/tickets";
import { Select } from "@/components/ui/Select";
import { inputClass } from "@/components/auth/inputClass";
import type { Locale } from "@/i18n/config";
import type { WaTemplate } from "@/lib/supabase/types";
import { Chips } from "./RuleConditions";
import { ACTION_ICONS } from "./icons";
import { cn } from "@/lib/utils";

export type TextField = "title" | "body" | "subject" | "cta_label" | "cta_url" | "tag" | "url";
const ROLE_KEYS = ["admin", "sales", "marketing", "support"];

export const defaultAction = (type: ActionType): RuleAction => {
  switch (type) {
    case "assign":
      return { type, roles: ["sales"] };
    case "task":
      return { type, title: "Hacer seguimiento a {nombre}", due_minutes: 1440, assign_to: "owner", priority: "medium", task_type: "follow_up" };
    case "notify":
      return { type, to: "owner", roles: ["admin"], title: "", body: "" };
    case "email":
      return { type, to: "contact", subject: "", body: "" };
    case "whatsapp":
      return { type, template_id: "", params: [] };
    case "status":
      return { type, status: "" };
    case "stage":
      return { type, stage: "" };
    case "priority":
      return { type, priority: "" };
    case "tag":
      return { type, tag: "" };
    case "note":
      return { type, body: "" };
    case "followup":
      return { type, mode: "enroll" };
    case "deal":
      return { type, title: "{empresa} · {nombre}", close_days: 30 };
    case "webhook":
      return { type, url: "" };
    case "team_chat":
      return { type, body: "", channels: [] };
  }
};

/** Una acción del "Entonces…": cabecera con orden y quitar, y sus campos. */
export function RuleActionCard({
  locale,
  action: a,
  index,
  count,
  entity,
  employees,
  templates,
  disabled,
  onChange,
  onRemove,
  onMove,
  onFocusField,
}: {
  locale: Locale;
  action: RuleAction;
  index: number;
  count: number;
  entity: RuleEntity;
  employees: { id: string; name: string }[];
  templates: WaTemplate[];
  disabled: boolean;
  onChange: (patch: Partial<RuleAction>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onFocusField: (field: TextField) => void;
}) {
  const t = rulesCopy;
  const e = ruleEditorCopy;
  const crm = crmCopy[locale];
  const tk = ticketsCopy[locale];
  const Icon = ACTION_ICONS[a.type];

  const text = (field: TextField, label: string, multiline = false, placeholder?: string) => {
    const common = {
      value: (a[field] as string | undefined) ?? "",
      onFocus: () => onFocusField(field),
      onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ [field]: ev.target.value } as Partial<RuleAction>),
      disabled,
      placeholder,
    };
    return (
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
        {multiline ? (
          <textarea {...common} rows={4} maxLength={field === "body" ? 4000 : 2000} className={cn(inputClass, "h-auto resize-y py-2.5 text-sm leading-relaxed")} />
        ) : (
          <input {...common} maxLength={field === "cta_url" || field === "url" ? 500 : 200} className={cn(inputClass, "h-10 text-sm")} />
        )}
      </label>
    );
  };
  const select = (label: string, value: string, onValue: (v: string) => void, options: { value: string; label: string }[], placeholder?: string) => (
    <Select size="md" label={label} value={value} onChange={onValue} options={options} placeholder={placeholder} />
  );
  const roles = () => (
    <Chips options={ROLE_KEYS.map((r) => ({ value: r, label: t.actions.roles[r] }))} value={a.roles ?? []} onChange={(v) => onChange({ roles: v })} disabled={disabled} />
  );
  const person = (label: string) =>
    select(label, a.user_id ?? "", (v) => onChange({ user_id: v }), employees.map((x) => ({ value: x.id, label: x.name })), "—");
  const priorityOptions =
    entity === "task"
      ? (["urgent", "high", "medium", "low"] as const).map((p) => ({ value: p, label: t.conditions.priorityNames[p] }))
      : ticketPriorities.map((p) => ({ value: p, label: t.conditions.priorityNames[p] }));

  const fields = () => {
    switch (a.type) {
      case "assign":
        return (
          <div className="grid gap-3">
            {select(t.actions.to, a.user_id !== undefined ? "user" : "roles", (v) => onChange(v === "user" ? { user_id: employees[0]?.id ?? "" } : { user_id: undefined }), [
              { value: "roles", label: t.actions.roundRobin },
              { value: "user", label: t.actions.person },
            ])}
            {a.user_id !== undefined ? person(t.actions.person) : roles()}
            <label className="flex items-center gap-2 text-sm text-heading">
              <input type="checkbox" checked={!!a.force} disabled={disabled} onChange={(ev) => onChange({ force: ev.target.checked || undefined })} className="h-4 w-4 accent-[#467316]" />
              {t.actions.force}
            </label>
          </div>
        );
      case "task":
        return (
          <div className="grid gap-3">
            {text("title", t.actions.taskTitle)}
            {text("body", t.actions.taskBody, true)}
            <div className="grid gap-3 sm:grid-cols-2">
              {select(t.actions.due, String(a.due_minutes ?? 1440), (v) => onChange({ due_minutes: Number(v) }), Object.entries(t.actions.dueOptions).map(([value, label]) => ({ value, label })))}
              {select(t.actions.to, a.assign_to ?? "owner", (v) => onChange({ assign_to: v as "owner" | "user" }), [
                { value: "owner", label: t.actions.toOwner },
                { value: "user", label: t.actions.toUser },
              ])}
              {select(t.actions.priority, a.priority ?? "medium", (v) => onChange({ priority: v }), (["urgent", "high", "medium", "low"] as const).map((p) => ({ value: p, label: t.conditions.priorityNames[p] })))}
              {select(t.actions.taskType, a.task_type ?? "follow_up", (v) => onChange({ task_type: v }), Object.entries(t.actions.taskTypes).map(([value, label]) => ({ value, label })))}
            </div>
            {a.assign_to === "user" && person(t.actions.toUser)}
          </div>
        );
      case "notify":
        return (
          <div className="grid gap-3">
            {select(t.actions.to, a.to ?? "owner", (v) => onChange({ to: v as RuleAction["to"] }), [
              { value: "owner", label: t.actions.toOwner },
              { value: "roles", label: t.actions.toRoles },
              { value: "user", label: t.actions.toUser },
            ])}
            {a.to === "owner" && (
              <div>
                <p className="mb-1.5 text-xs text-muted">{e.ownerFallback}</p>
                {roles()}
              </div>
            )}
            {a.to === "roles" && roles()}
            {a.to === "user" && person(t.actions.toUser)}
            {text("title", t.actions.titleLabel)}
            {text("body", t.actions.bodyLabel, true)}
          </div>
        );
      case "email":
        return (
          <div className="grid gap-3">
            {select(t.actions.to, a.to ?? "contact", (v) => onChange({ to: v as RuleAction["to"] }), [
              { value: "contact", label: t.actions.toContact },
              { value: "owner", label: t.actions.toOwnerEmail },
              { value: "user", label: t.actions.toUserEmail },
              { value: "team", label: t.actions.toTeam },
            ])}
            {a.to === "user" && person(t.actions.toUserEmail)}
            {text("subject", t.actions.subject)}
            {text("body", t.actions.bodyLabel, true)}
            {(a.to ?? "contact") === "contact" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {text("cta_label", t.actions.ctaLabel)}
                {text("cta_url", t.actions.ctaUrl)}
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
            {select(
              t.actions.template,
              a.template_id ?? "",
              (v) => onChange({ template_id: v, params: Array(templates.find((x) => x.id === v)?.variables ?? 0).fill("{primer_nombre}") }),
              templates.map((x) => ({ value: x.id, label: `${x.name} · ${x.language}` })),
              "—",
            )}
            {tpl &&
              Array.from({ length: tpl.variables }, (_, n) => (
                <label key={n} className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">{t.actions.templateParam.replace("{n}", String(n + 1))}</span>
                  <input
                    value={a.params?.[n] ?? ""}
                    disabled={disabled}
                    onChange={(ev) => {
                      const params = [...(a.params ?? [])];
                      params[n] = ev.target.value;
                      onChange({ params });
                    }}
                    className={cn(inputClass, "h-10 text-sm")}
                  />
                </label>
              ))}
          </div>
        );
      }
      case "status": {
        const options =
          entity === "ticket"
            ? ticketStatuses.map((s) => ({ value: s, label: tk.staffStatus[s] }))
            : entity === "task"
              ? Object.entries(e.taskStatuses).map(([value, label]) => ({ value, label }))
              : entity === "chat"
                ? Object.entries(e.chatStatuses).map(([value, label]) => ({ value, label }))
                : pipeline.map((s) => ({ value: s, label: crm.status[s] }));
        return select(t.actions.status, a.status ?? "", (v) => onChange({ status: v }), options, "—");
      }
      case "stage": {
        const keys = entity === "deal" ? ["prospecting", "proposal", "negotiation", "won", "lost"] : ["onboarding", "active", "at_risk", "paused", "churned"];
        return select(t.actions.stage, a.stage ?? "", (v) => onChange({ stage: v }), keys.map((k) => ({ value: k, label: t.conditions.stageNames[k] })), "—");
      }
      case "priority":
        return select(t.actions.priority, a.priority ?? "", (v) => onChange({ priority: v }), priorityOptions, "—");
      case "tag":
        return text("tag", t.actions.tag);
      case "note":
        return text("body", t.actions.noteBody, true);
      case "followup":
        return select(t.actions.followupMode, a.mode ?? "enroll", (v) => onChange({ mode: v as "enroll" | "stop" }), Object.entries(t.actions.followupModes).map(([value, label]) => ({ value, label })));
      case "deal":
        return (
          <div className="grid gap-3">
            {text("title", t.actions.dealTitle)}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">{t.actions.dealValue}</span>
                <input
                  type="number"
                  min={0}
                  value={a.value ?? ""}
                  disabled={disabled}
                  onChange={(ev) => onChange({ value: ev.target.value === "" ? undefined : Math.max(0, Number(ev.target.value)) })}
                  className={cn(inputClass, "h-10 text-sm tabular-nums")}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">{t.actions.dealClose}</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={a.close_days ?? 30}
                  disabled={disabled}
                  onChange={(ev) => onChange({ close_days: Math.max(1, Math.min(365, Number(ev.target.value) || 30)) })}
                  className={cn(inputClass, "h-10 text-sm tabular-nums")}
                />
              </label>
            </div>
          </div>
        );
      case "webhook":
        return (
          <div className="grid gap-2">
            {text("url", t.actions.webhookUrl, false, "https://hooks.zapier.com/…")}
            <p className="text-xs text-muted">{t.actions.webhookHint}</p>
          </div>
        );
      case "team_chat":
        return (
          <div className="grid gap-2">
            <span className="block text-xs font-medium text-muted">{t.actions.teamChatChannels}</span>
            <Chips
              options={["slack", "teams", "google_chat"].map((c) => ({ value: c, label: t.actions.teamChatNames[c] }))}
              value={a.channels ?? []}
              onChange={(v) => onChange({ channels: v })}
              disabled={disabled}
            />
            <p className="text-xs text-muted">{(a.channels ?? []).length ? "" : t.actions.teamChatAll}</p>
            {text("body", t.actions.bodyLabel, true)}
            <p className="text-xs text-muted">{t.actions.teamChatHint}</p>
          </div>
        );
    }
  };

  const iconBtn = "grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading disabled:opacity-30";
  return (
    <li className="rounded-xl border border-line bg-surface p-4 dark:bg-card">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--meta-active)] text-xs font-semibold tabular-nums text-heading">{index + 1}</span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-deep-700/[0.06] text-heading dark:bg-white/[0.08]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-heading">{t.actions.types[a.type].label}</span>
          <span className="block text-xs text-muted">{t.actions.types[a.type].desc}</span>
        </span>
        {!disabled && (
          <span className="flex items-center">
            <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={e.moveUp} className={iconBtn}>
              <ArrowUp className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={e.moveDown} className={iconBtn}>
              <ArrowDown className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" onClick={onRemove} aria-label={t.actions.remove} className={cn(iconBtn, "hover:text-red-600")}>
              <X className="h-4 w-4" aria-hidden />
            </button>
          </span>
        )}
      </div>
      {fields()}
    </li>
  );
}
