"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  CalendarCheck,
  Check,
  Loader2,
  Mail,
  MessageCircle,
  MessagesSquare,
  Phone,
  Sparkles,
  StickyNote,
  Trash2,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  ActivityType,
  Lead,
  LeadActivity,
  LeadStatus,
  Task,
} from "@/lib/supabase/types";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { composerTypes, crmCopy, pipeline, type ComposerType } from "@/content/crm";
import { leadFormCopy } from "@/content/leadForm";
import type { Employee } from "./CrmBoard";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const fmtDateTime = (locale: string, iso: string) =>
  new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(new Date(iso));

/* ======================== Controles del lead ======================== */

export function LeadControls({
  locale,
  lead,
  employees,
  canEdit,
}: {
  locale: Locale;
  lead: Pick<Lead, "id" | "status" | "assigned_to" | "value_cop" | "lost_reason">;
  employees: Employee[];
  canEdit: boolean;
}) {
  const t = crmCopy[locale];
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [owner, setOwner] = useState(lead.assigned_to ?? "");
  const [value, setValue] = useState(lead.value_cop ? String(lead.value_cop) : "");
  const [lostReason, setLostReason] = useState(lead.lost_reason ?? "");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const id = useId();

  const save = async (patch: Partial<Pick<Lead, "status" | "assigned_to" | "value_cop" | "lost_reason">>) => {
    setSaving("saving");
    const { error } = await createClient().from("leads").update(patch).eq("id", lead.id);
    setSaving(error ? "idle" : "saved");
    if (!error) router.refresh();
  };

  return (
    <div className="grid gap-4">
      <Select
        size="md"
        label={t.lead.status}
        value={status}
        onChange={(v) => {
          if (!canEdit) return;
          setStatus(v as LeadStatus);
          void save({ status: v as LeadStatus });
        }}
        options={pipeline.map((s) => ({ value: s, label: t.status[s] }))}
      />
      <Select
        size="md"
        label={t.lead.owner}
        value={owner}
        onChange={(v) => {
          if (!canEdit) return;
          setOwner(v);
          void save({ assigned_to: v || null });
        }}
        options={[{ value: "", label: t.lead.nobody }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
      />
      <div>
        <label htmlFor={`${id}-value`} className="mb-2 block text-sm font-semibold text-heading">
          {t.lead.value}
        </label>
        <input
          id={`${id}-value`}
          inputMode="numeric"
          value={value ? Number(value).toLocaleString("es-CO") : ""}
          onChange={(event) => setValue(event.target.value.replace(/\D/g, "").slice(0, 13))}
          onBlur={() => canEdit && void save({ value_cop: value ? Number(value) : null })}
          disabled={!canEdit}
          className={inputClass}
        />
      </div>
      {status === "lost" && (
        <div>
          <label htmlFor={`${id}-lost`} className="mb-2 block text-sm font-semibold text-heading">
            {t.lead.lostReason}
          </label>
          <input
            id={`${id}-lost`}
            value={lostReason}
            onChange={(event) => setLostReason(event.target.value)}
            onBlur={() => canEdit && void save({ lost_reason: lostReason.trim() || null })}
            placeholder={t.lead.lostReasonPlaceholder}
            disabled={!canEdit}
            className={inputClass}
          />
        </div>
      )}
      <p aria-live="polite" className="h-4 text-xs text-muted">
        {saving === "saving" ? "…" : saving === "saved" ? t.lead.saved : ""}
      </p>
    </div>
  );
}

/* ======================== Historial ======================== */

const activityIcons: Record<ActivityType, LucideIcon> = {
  note: StickyNote,
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  meeting: Users,
  status_change: ArrowRightLeft,
  assignment: UserCheck,
  created: Sparkles,
  appointment: CalendarCheck,
  chat: MessagesSquare,
};

export function LeadTimeline({
  locale,
  leadId,
  initial,
  names,
  currentUserId,
  canWrite,
  isAdmin,
}: {
  locale: Locale;
  leadId: string;
  initial: LeadActivity[];
  names: Record<string, string>;
  currentUserId: string;
  canWrite: boolean;
  isAdmin: boolean;
}) {
  const t = crmCopy[locale];
  const channels = leadFormCopy[locale].booking.channels;
  const [items, setItems] = useState(initial);
  const [type, setType] = useState<ComposerType>("note");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  // Tiempo real: actividad de otros asesores (o automática) en este lead.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`lead-${leadId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lead_activities", filter: `lead_id=eq.${leadId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const removed = (payload.old as { id: string }).id;
            setItems((list) => list.filter((a) => a.id !== removed));
          } else if (payload.eventType === "INSERT") {
            const row = payload.new as LeadActivity;
            setItems((list) => (list.some((a) => a.id === row.id) ? list : [row, ...list]));
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [leadId]);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    const { data, error } = await createClient()
      .from("lead_activities")
      .insert({ lead_id: leadId, type, body: body.trim(), author_id: currentUserId })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setItems((list) => (list.some((a) => a.id === data.id) ? list : [data, ...list]));
      setBody("");
    }
  };

  const remove = async (activityId: string) => {
    const { error } = await createClient().from("lead_activities").delete().eq("id", activityId);
    if (!error) setItems((list) => list.filter((a) => a.id !== activityId));
  };

  const describe = (a: LeadActivity) => {
    const meta = (a.meta ?? {}) as Record<string, string>;
    switch (a.type) {
      case "created":
        return t.lead.activity.created
          .replace("{score}", meta.score ?? "")
          .replace("{tier}", t.tier[meta.tier as keyof typeof t.tier] ?? meta.tier);
      case "status_change":
        return t.lead.activity.status_change
          .replace("{from}", t.status[meta.from as LeadStatus] ?? meta.from)
          .replace("{to}", t.status[meta.to as LeadStatus] ?? meta.to);
      case "assignment":
        return meta.to ? t.lead.activity.assignment.replace("{to}", names[meta.to] ?? "—") : t.lead.activity.unassigned;
      case "appointment":
        return t.lead.activity.appointment
          .replace("{date}", meta.starts_at ? fmtDateTime(locale, meta.starts_at) : "")
          .replace("{channel}", channels[meta.channel as keyof typeof channels] ?? meta.channel);
      case "chat":
        return t.lead.activity.chat;
      default:
        return t.lead.composerTypes[a.type as ComposerType];
    }
  };

  return (
    <div>
      {canWrite && (
        <form onSubmit={add} className="rounded-2xl bg-surface-soft p-3 dark:bg-white/[0.04]">
          <div role="group" aria-label={t.lead.timelineTitle} className="flex flex-wrap gap-1.5">
            {composerTypes.map((k) => {
              const Icon = activityIcons[k];
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={type === k}
                  onClick={() => setType(k)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
                    type === k ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "text-heading hover:bg-surface dark:hover:bg-white/10",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {t.lead.composerTypes[k]}
                </button>
              );
            })}
          </div>
          <label className="sr-only" htmlFor={`composer-${leadId}`}>
            {t.lead.composerPlaceholder}
          </label>
          <textarea
            id={`composer-${leadId}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            maxLength={5000}
            placeholder={t.lead.composerPlaceholder}
            className="mt-3 w-full resize-y rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm text-heading outline-none focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card"
          />
          <div className="mt-2 flex justify-end">
            <button type="submit" disabled={saving || !body.trim()} className={buttonClasses("primary", "md", "disabled:opacity-50")}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t.lead.add}
            </button>
          </div>
        </form>
      )}

      <ol className="mt-6 grid gap-0">
        {items.map((a, i) => {
          const Icon = activityIcons[a.type];
          const manual = composerTypes.includes(a.type as ComposerType);
          const author = a.author_id ? names[a.author_id] ?? "—" : t.lead.system;
          return (
            <li key={a.id} className="relative flex gap-4 pb-6">
              {i < items.length - 1 && (
                <span aria-hidden className="absolute left-[1.0625rem] top-9 h-[calc(100%-2.25rem)] w-px bg-line" />
              )}
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                  manual ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "bg-surface-soft text-accent dark:bg-white/[0.08]",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-sm text-heading">
                  <span className="font-bold">{describe(a)}</span>{" "}
                  <span className="text-muted">
                    · {t.lead.by.replace("{name}", author)} · {fmtDateTime(locale, a.created_at)}
                  </span>
                </p>
                {a.body && <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-body">{a.body}</p>}
                {a.type === "chat" && typeof (a.meta as Record<string, unknown> | null)?.conversation_id === "string" && (
                  <Link
                    href={`/${locale}/portal/chat?c=${(a.meta as Record<string, string>).conversation_id}`}
                    className="mt-1.5 inline-block text-xs font-semibold text-accent hover:underline"
                  >
                    {t.lead.activity.openChat}
                  </Link>
                )}
                {manual && (a.author_id === currentUserId || isAdmin) && (
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    {t.lead.deleteNote}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ======================== Tareas ======================== */

export function LeadTasks({
  locale,
  leadId,
  initial,
  canWrite,
  defaultAssignee,
}: {
  locale: Locale;
  leadId: string;
  initial: Task[];
  canWrite: boolean;
  defaultAssignee: string | null;
}) {
  const t = crmCopy[locale].lead;
  const [tasks, setTasks] = useState(initial);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const id = useId();

  const open = useMemo(() => tasks.filter((task) => !task.done), [tasks]);
  // Hora de referencia para marcar tareas vencidas (se fija al montar).
  const [now] = useState(() => Date.now());

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (title.trim().length < 2) return;
    setSaving(true);
    const { data, error } = await createClient()
      .from("tasks")
      .insert({ lead_id: leadId, title: title.trim(), due_at: due, assigned_to: defaultAssignee })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setTasks((list) => [...list, data]);
      setTitle("");
      setDue(null);
    }
  };

  const toggle = async (task: Task) => {
    setTasks((list) => list.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)));
    const { error } = await createClient().from("tasks").update({ done: !task.done }).eq("id", task.id);
    if (error) setTasks((list) => list.map((x) => (x.id === task.id ? task : x)));
  };

  return (
    <div>
      {open.length === 0 ? (
        <p className="text-sm text-muted">{t.noTasks}</p>
      ) : (
        <ul className="grid gap-2">
          {open.map((task) => {
            const overdue = task.due_at && Date.parse(task.due_at) < now;
            return (
              <li key={task.id} className="flex items-start gap-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={task.done}
                  aria-label={task.title}
                  onClick={() => toggle(task)}
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-line-strong hover:border-deep-700"
                >
                  {task.done && <Check className="h-3 w-3" strokeWidth={3} />}
                </button>
                <div className="min-w-0">
                  <p className="text-sm text-heading">{task.title}</p>
                  {task.due_at && (
                    <p className={cn("text-xs", overdue ? "font-semibold text-red-600 dark:text-red-400" : "text-muted")}>
                      {t.due} {fmtDateTime(locale, task.due_at)}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {canWrite && (
        <form onSubmit={add} className="mt-5 grid gap-2 border-t border-line pt-5">
          <label htmlFor={`${id}-title`} className="text-sm font-semibold text-heading">
            {t.newTask}
          </label>
          <input
            id={`${id}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t.taskPlaceholder}
            className={cn(inputClass, "h-11")}
          />
          <DateTimePicker label={t.due} value={due} onChange={setDue} locale={locale} size="sm" clearLabel="—" />
          <button type="submit" disabled={saving || title.trim().length < 2} className={buttonClasses("dark", "md", "disabled:opacity-50")}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t.addTask}
          </button>
        </form>
      )}
    </div>
  );
}
