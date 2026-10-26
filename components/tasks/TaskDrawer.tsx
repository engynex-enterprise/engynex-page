"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2, Repeat, SendHorizontal, Trash2, X } from "lucide-react";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistItem, LeadTier, TaskComment, TaskPriority, TaskRecurrence, TaskStatus, TaskType } from "@/lib/supabase/types";
import { tasksProCopy } from "@/content/tasksPro";
import { tasksWorkspaceCopy } from "@/content/tasksWorkspace";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { tierStyles } from "@/lib/tiers";
import { PRIORITIES, STATUSES, TYPES, fmtDue, type TaskRow } from "./shared";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Reminder = "none" | "at" | "m15" | "h1" | "d1" | "custom";
const OFFSETS: Record<Exclude<Reminder, "none" | "custom">, number> = { at: 0, m15: 15, h1: 60, d1: 1440 };
const RECURRENCES: TaskRecurrence[] = ["none", "daily", "weekdays", "weekly", "monthly"];

const label = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-muted";
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

/**
 * Panel lateral de una tarea: todo se guarda al cambiarlo (estado, prioridad,
 * responsable, fecha, recordatorio, repetición, lead, etiquetas y pasos) y
 * abajo van los comentarios en vivo.
 */
export function TaskDrawer({
  locale,
  task,
  employees,
  me,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  locale: Locale;
  task: TaskRow;
  employees: { id: string; name: string }[];
  me: string;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<TaskRow>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (task: TaskRow) => void;
}) {
  const t = tasksWorkspaceCopy[locale];
  const d = t.drawer;
  const p = tasksProCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState("");
  const [tag, setTag] = useState("");
  const [leadInput, setLeadInput] = useState<HTMLInputElement | null>(null);
  const [leadQuery, setLeadQuery] = useState("");
  const [hits, setHits] = useState<{ id: string; name: string; email: string; tier: LeadTier }[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const save = (patch: Partial<TaskRow>) => onUpdate(task.id, patch);

  // Comentarios: carga y en vivo.
  useEffect(() => {
    let alive = true;
    void supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", task.id)
      .order("id")
      .then(({ data }) => alive && setComments(data ?? []));
    const channel = supabase
      .channel(`task-comments-${task.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${task.id}` }, (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as { id: number };
          setComments((list) => list?.filter((c) => c.id !== old.id) ?? list);
        } else {
          const row = payload.new as TaskComment;
          setComments((list) => (list && !list.some((c) => c.id === row.id) ? [...list, row] : list));
        }
      })
      .subscribe();
    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase, task.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !(event.target as HTMLElement).closest("textarea, input")) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Recordatorio actual expresado como opción.
  const reminder: Reminder = !task.reminder_at
    ? "none"
    : !task.due_at
      ? "custom"
      : ((Object.entries(OFFSETS).find(([, m]) => Date.parse(task.due_at!) - Date.parse(task.reminder_at!) === m * 60_000)?.[0] as Reminder) ?? "custom");
  const setReminder = (value: Reminder, due = task.due_at) => {
    if (value === "none" || value === "custom") return save({ reminder_at: value === "none" ? null : task.reminder_at });
    if (!due) return;
    save({ reminder_at: new Date(Date.parse(due) - OFFSETS[value] * 60_000).toISOString() });
  };

  const checklist = task.checklist ?? [];
  const setChecklist = (next: ChecklistItem[]) => save({ checklist: next });
  const doneSteps = checklist.filter((c) => c.done).length;

  const findLead = (q: string) => {
    setLeadQuery(q);
    window.clearTimeout(timer.current);
    const term = q.trim().replace(/[%,()]/g, "");
    if (term.length < 2) return setHits([]);
    timer.current = window.setTimeout(async () => {
      const { data } = await supabase.from("leads").select("id, name, email, tier").or(`name.ilike.%${term}%,email.ilike.%${term}%`).limit(6);
      setHits((data ?? []) as typeof hits);
    }, 250);
  };

  const sendComment = async () => {
    const body = comment.trim();
    if (!body) return;
    setSending(true);
    const { data, error } = await supabase.from("task_comments").insert({ task_id: task.id, body, author_id: me }).select().single();
    setSending(false);
    if (!error && data) {
      setComment("");
      setComments((list) => (list && !list.some((c) => c.id === data.id) ? [...list, data] : list));
      save({ comments: task.comments + 1 });
    }
  };

  const fmt = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label={task.title}
        className="fixed inset-y-3 right-3 z-50 flex w-[min(32rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_24px_64px_-12px_rgba(16,24,40,0.35),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card"
      >
        {/* Encabezado */}
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <button
            type="button"
            onClick={() => save({ status: task.done ? "todo" : "done", done: !task.done })}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium",
              task.done ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30" : "text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]",
            )}
          >
            <Check className="h-4 w-4" aria-hidden />
            {task.done ? p.statuses.done : t.complete}
          </button>
          <span className="flex-1" />
          <button type="button" onClick={() => onDuplicate(task)} aria-label={d.duplicate} title={d.duplicate} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
            <Copy className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => window.confirm(d.confirm) && onDelete(task.id)}
            aria-label={d.delete}
            title={d.delete}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={onClose} aria-label={d.close} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-4 px-5 py-5">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim().length >= 2 && title.trim() !== task.title && save({ title: title.trim() })}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), (e.target as HTMLTextAreaElement).blur())}
              rows={1}
              maxLength={300}
              aria-label={d.title}
              className={cn("w-full resize-none bg-transparent text-xl font-semibold leading-snug text-heading outline-none [field-sizing:content]", task.done && "text-muted line-through")}
            />

            {/* Propiedades */}
            <div className="grid grid-cols-2 gap-3">
              <Select
                size="md"
                label={d.status}
                value={task.status}
                onChange={(v) => save({ status: v as TaskStatus, done: v === "done" })}
                options={STATUSES.map((s) => ({ value: s, label: p.statuses[s] }))}
              />
              <Select size="md" label={d.priority} value={task.priority} onChange={(v) => save({ priority: v as TaskPriority })} options={PRIORITIES.map((x) => ({ value: x, label: p.priorities[x] }))} />
              <Select
                size="md"
                label={d.assignee}
                value={task.assigned_to ?? ""}
                onChange={(v) => save({ assigned_to: v || null })}
                options={[{ value: "", label: p.unassigned }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
              />
              <Select size="md" label={d.type} value={task.type} onChange={(v) => save({ type: v as TaskType })} options={TYPES.map((x) => ({ value: x, label: p.types[x] }))} />
              <div className="col-span-2">
                <DateTimePicker
                  size="md"
                  label={d.due}
                  value={task.due_at}
                  onChange={(v) => {
                    // El recordatorio relativo se mueve con la fecha.
                    const offset = reminder !== "none" && reminder !== "custom" ? OFFSETS[reminder] : null;
                    save({ due_at: v, ...(offset !== null ? { reminder_at: v ? new Date(Date.parse(v) - offset * 60_000).toISOString() : null } : {}) });
                  }}
                  locale={locale}
                  clearLabel="×"
                />
              </div>
              <div>
                <Select
                  size="md"
                  label={d.reminder}
                  value={reminder}
                  onChange={(v) => setReminder(v as Reminder)}
                  options={[
                    ...(["none", "at", "m15", "h1", "d1"] as const).map((x) => ({ value: x, label: d.reminders[x] })),
                    ...(reminder === "custom" && task.reminder_at ? [{ value: "custom", label: fmtDue(locale, task.reminder_at) }] : []),
                  ]}
                />
                {!task.due_at && reminder === "none" && <p className="mt-1 text-xs text-muted">{d.reminderNeedsDue}</p>}
              </div>
              <div>
                <Select size="md" label={d.recurrence} value={task.recurrence} onChange={(v) => save({ recurrence: v as TaskRecurrence })} options={RECURRENCES.map((x) => ({ value: x, label: p.recurrences[x] }))} />
                {task.recurrence !== "none" && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <Repeat className="h-3 w-3" aria-hidden />
                    {d.recurrenceHint}
                  </p>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <span className={label}>{d.description}</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => description !== (task.description ?? "") && save({ description: description.trim() || null })}
                rows={3}
                maxLength={5000}
                placeholder={d.descriptionPlaceholder}
                aria-label={d.description}
                className="w-full resize-none rounded-xl bg-[#f4f4f5] px-3.5 py-2.5 text-sm leading-relaxed text-heading outline-none ring-1 ring-transparent [field-sizing:content] focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]"
              />
            </div>

            {/* Pasos */}
            <div>
              <span className={cn(label, "flex items-center justify-between")}>
                {d.checklist}
                {checklist.length > 0 && <span className="normal-case tracking-normal">{p.checklist.replace("{done}", String(doneSteps)).replace("{total}", String(checklist.length))}</span>}
              </span>
              {checklist.length > 0 && (
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-card-soft dark:bg-white/10">
                  <div className="h-full rounded-full bg-brand-green-dark dark:bg-brand-green" style={{ width: `${(doneSteps / checklist.length) * 100}%` }} />
                </div>
              )}
              <ul className="grid gap-1">
                {checklist.map((item) => (
                  <li key={item.id} className="group flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-[var(--meta-hover)]">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => setChecklist(checklist.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c)))}
                      className="h-4 w-4 rounded accent-brand-green-dark"
                      aria-label={item.title}
                    />
                    <span className={cn("flex-1 text-sm", item.done ? "text-muted line-through" : "text-heading")}>{item.title}</span>
                    <button
                      type="button"
                      onClick={() => setChecklist(checklist.filter((c) => c.id !== item.id))}
                      aria-label={d.unlink}
                      className="grid h-6 w-6 place-items-center rounded-md text-muted opacity-0 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              <input
                value={step}
                onChange={(e) => setStep(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || !step.trim()) return;
                  e.preventDefault();
                  setChecklist([...checklist, { id: crypto.randomUUID(), title: step.trim().slice(0, 200), done: false }]);
                  setStep("");
                }}
                placeholder={d.addStep}
                aria-label={d.addStep}
                className="mt-1 h-9 w-full rounded-lg bg-transparent px-2 text-sm text-heading outline-none placeholder:text-muted focus:bg-[#f4f4f5] dark:focus:bg-white/[0.06]"
              />
            </div>

            {/* Lead y ticket */}
            <div>
              <span className={label}>{d.lead}</span>
              {task.lead_id ? (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 ring-1 ring-line">
                  <Link href={`/${locale}/portal/crm/${task.lead_id}`} className="min-w-0 flex-1 truncate text-sm font-medium text-heading hover:underline">
                    {task.lead_name ?? "—"}
                  </Link>
                  <button type="button" onClick={() => save({ lead_id: null, lead_name: null })} className="text-xs font-semibold text-muted hover:text-red-600">
                    {d.unlink}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    ref={setLeadInput}
                    value={leadQuery}
                    onChange={(e) => findLead(e.target.value)}
                    placeholder={d.leadSearch}
                    aria-label={d.lead}
                    className="h-10 w-full rounded-[10px] bg-[#f4f4f5] px-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]"
                  />
                  {hits.length > 0 && (
                    <FloatingPanel anchor={leadInput} open onClose={() => setHits([])} align="start" matchWidth className="rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card">
                      <ul>
                        {hits.map((h) => (
                          <li key={h.id}>
                            <button
                              type="button"
                              onClick={() => {
                                save({ lead_id: h.id, lead_name: h.name });
                                setHits([]);
                                setLeadQuery("");
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-[var(--meta-hover)]"
                            >
                              <span className={cn("h-2 w-2 rounded-full", tierStyles[h.tier].dot)} aria-hidden />
                              <span className="min-w-0 flex-1 truncate text-sm text-heading">{h.name}</span>
                              <span className="truncate text-xs text-muted">{h.email}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </FloatingPanel>
                  )}
                </div>
              )}
              {task.ticket_id && (
                <Link href={`/${locale}/portal/soporte/${task.ticket_id}`} className="mt-2 inline-block text-sm font-semibold text-accent hover:underline">
                  {d.ticket.replace("{n}", String(task.ticket_number ?? ""))}
                </Link>
              )}
            </div>

            {/* Etiquetas */}
            <div>
              <span className={label}>{d.tags}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {task.tags.map((x) => (
                  <span key={x} className="inline-flex h-7 items-center gap-1 rounded-lg bg-card-soft pl-2.5 pr-1 text-xs font-medium text-heading dark:bg-white/[0.08]">
                    #{x}
                    <button type="button" onClick={() => save({ tags: task.tags.filter((y) => y !== x) })} aria-label={`${d.unlink} ${x}`} className="grid h-5 w-5 place-items-center rounded text-muted hover:text-heading">
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </span>
                ))}
                <input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  onKeyDown={(e) => {
                    const v = tag.trim().toLowerCase().replace(/^#/, "").slice(0, 30);
                    if (e.key !== "Enter" || !v) return;
                    e.preventDefault();
                    if (!task.tags.includes(v)) save({ tags: [...task.tags, v] });
                    setTag("");
                  }}
                  placeholder={d.addTag}
                  aria-label={d.addTag}
                  className="h-7 min-w-[9rem] flex-1 rounded-lg bg-transparent px-2 text-xs text-heading outline-none placeholder:text-muted focus:bg-[#f4f4f5] dark:focus:bg-white/[0.06]"
                />
              </div>
            </div>

            <p className="text-xs text-muted">
              {d.created.replace("{name}", task.created_by ? names[task.created_by] ?? "—" : "Engynex").replace("{date}", fmt(task.created_at))}
              {task.done && task.completed_at && <> · {d.completed.replace("{date}", fmt(task.completed_at))}</>}
            </p>
          </div>

          {/* Comentarios */}
          <section className="border-t border-line px-5 py-4">
            <h3 className={label}>{d.comments}</h3>
            {comments === null ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted">{d.noComments}</p>
            ) : (
              <ol className="grid gap-3">
                {comments.map((c) => {
                  const who = c.author_id ? names[c.author_id] ?? "—" : "—";
                  return (
                    <li key={c.id} className="flex gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-deep-700/10 text-[0.65rem] font-bold text-deep-700 dark:bg-white/10 dark:text-white">{initials(who)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted">
                          <span className="font-medium text-heading">{who}</span> · {fmt(c.created_at)}
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-heading">{c.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendComment();
          }}
          className="flex items-end gap-2 border-t border-line px-4 py-3"
        >
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendComment();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={d.commentPlaceholder}
            aria-label={d.comments}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-xl bg-[#f4f4f5] px-3.5 py-2.5 text-sm text-heading outline-none ring-1 ring-transparent [field-sizing:content] focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]"
          />
          <button type="submit" disabled={sending || !comment.trim()} aria-label={d.send} className="grid h-10 w-10 place-items-center rounded-[10px] bg-deep-700 text-white disabled:opacity-40 dark:bg-brand-green dark:text-deep-950">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <SendHorizontal className="h-4 w-4" aria-hidden />}
          </button>
        </form>
      </div>
    </>
  );
}

