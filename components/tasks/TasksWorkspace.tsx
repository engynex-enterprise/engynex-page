"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, KanbanSquare, List, ListFilter, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskPriority, TaskType } from "@/lib/supabase/types";
import { tasksProCopy } from "@/content/tasksPro";
import { tasksWorkspaceCopy } from "@/content/tasksWorkspace";
import { Select } from "@/components/ui/Select";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { inputClass } from "@/components/auth/inputClass";
import { buttonClasses } from "@/components/ui/Button";
import { TaskListView } from "./TaskListView";
import { TaskBoardView } from "./TaskBoardView";
import { TaskCalendarView } from "./TaskCalendarView";
import { TaskDrawer } from "./TaskDrawer";
import { PRIORITIES, TASK_SELECT, TYPES, dayKey, toTaskRow, type TaskRow } from "./shared";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Scope = "mine" | "all" | "created" | "unassigned" | "done";
type View = "list" | "board" | "calendar";
type Workload = { id: string; name: string; open: number; overdue: number };

/** Columnas de la tabla (lo que no es columna se queda solo en la vista). */
const LOCAL_FIELDS = ["lead_name", "ticket_number", "comments"] as const;

const iconBtn = "grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-heading transition-colors hover:bg-[var(--meta-hover)]";
const menu = "absolute z-30 mt-2 rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card";
const typing = (el: EventTarget | null) => {
  const node = el as HTMLElement | null;
  return !!node && (node.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName));
};

/** "hoy", "mañana" y "!prioridad" dentro del texto rápido. */
function parseQuick(text: string, now: number) {
  let title = ` ${text} `;
  let due: string | null = null;
  let priority: TaskPriority | null = null;
  const at = (offsetDays: number, time: string) => new Date(`${dayKey(now + offsetDays * 86_400_000)}T${time}:00-05:00`).toISOString();
  if (/\s(hoy|today)\s/i.test(title)) due = at(0, "17:00");
  if (/\s(mañana|manana|tomorrow)\s/i.test(title)) due = at(1, "09:00");
  const p = /\s!(urgente|urgent|alta|high|media|medium|baja|low)\s/i.exec(title);
  if (p) {
    const k = p[1].toLowerCase();
    priority = k.startsWith("urg") ? "urgent" : k === "alta" || k === "high" ? "high" : k === "baja" || k === "low" ? "low" : "medium";
  }
  title = title.replace(/\s(hoy|today|mañana|manana|tomorrow)(?=\s)/gi, " ").replace(/\s!\w+(?=\s)/g, " ").replace(/\s+/g, " ").trim();
  return { title, due, priority };
}

/**
 * Espacio de tareas: pestañas (mías, todas, creadas por mí, sin asignar,
 * completadas), búsqueda y filtros, tres vistas (lista, tablero, calendario),
 * alta rápida, acciones en lote, carga del equipo y el panel de cada tarea.
 * Todo en vivo.
 */
export function TasksWorkspace({
  locale,
  initial,
  employees,
  me,
  workload,
  initialView,
  initialOpen,
}: {
  locale: Locale;
  initial: TaskRow[];
  employees: { id: string; name: string }[];
  me: string;
  workload: Workload[];
  initialView: View;
  initialOpen: string | null;
}) {
  const t = tasksWorkspaceCopy[locale];
  const p = tasksProCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState(initial);
  const [scope, setScope] = useState<Scope>("mine");
  const [view, setView] = useState<View>(initialView);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ priority: "", type: "", assignee: "", tag: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(initialOpen);
  const [creating, setCreating] = useState(false);
  const [quick, setQuick] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const searchRef = useRef<HTMLInputElement>(null);
  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const flash = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((c) => (c === text ? null : c)), 4000);
  }, []);

  const setUrl = (key: string, value: string | null) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState(null, "", url);
  };
  const open = useCallback((id: string | null) => {
    setOpenId(id);
    setUrl("t", id);
  }, []);

  // En vivo: cambios de cualquier persona (y las tareas que nacen al repetir).
  useEffect(() => {
    const fetchRow = async (id: string) => {
      const { data } = await supabase.from("tasks").select(TASK_SELECT).eq("id", id).maybeSingle();
      if (data) setTasks((list) => [toTaskRow(data), ...list.filter((x) => x.id !== id)]);
    };
    const channel = supabase
      .channel("tasks-workspace")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as { id: string };
          setTasks((list) => list.filter((x) => x.id !== old.id));
        } else if (payload.eventType === "INSERT") {
          void fetchRow((payload.new as Task).id);
        } else {
          const row = payload.new as Task;
          setTasks((list) => {
            const prev = list.find((x) => x.id === row.id);
            if (!prev) return list;
            // Si cambió el lead, hay que traer su nombre.
            if (prev.lead_id !== row.lead_id) void fetchRow(row.id);
            return list.map((x) => (x.id === row.id ? { ...x, ...row } : x));
          });
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  /** Cambio optimista + guardado. */
  const update = useCallback(
    async (id: string, patch: Partial<TaskRow>) => {
      const before = tasks.find((x) => x.id === id);
      setTasks((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      const db = Object.fromEntries(Object.entries(patch).filter(([k]) => !(LOCAL_FIELDS as readonly string[]).includes(k))) as Partial<Task>;
      if (Object.keys(db).length === 0) return;
      const { error } = await supabase.from("tasks").update(db).eq("id", id);
      if (error) {
        if (before) setTasks((list) => list.map((x) => (x.id === id ? before : x)));
        flash(t.errors.generic.replace("{detail}", error.message));
      }
    },
    [supabase, tasks, flash, t.errors.generic],
  );

  const create = async (fields: Partial<Task> & { title: string }) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert({ assigned_to: me, ...fields, created_by: me })
      .select(TASK_SELECT)
      .single();
    if (error || !data) return flash(t.errors.generic.replace("{detail}", error?.message ?? "—"));
    const row = toTaskRow(data);
    setTasks((list) => [row, ...list.filter((x) => x.id !== row.id)]);
    return row;
  };

  const remove = async (ids: string[]) => {
    const keep = tasks;
    setTasks((list) => list.filter((x) => !ids.includes(x.id)));
    setSelected(new Set());
    if (openId && ids.includes(openId)) open(null);
    const { error } = await supabase.from("tasks").delete().in("id", ids);
    if (error) {
      setTasks(keep);
      flash(t.errors.generic.replace("{detail}", error.message));
    }
  };

  const duplicate = async (task: TaskRow) => {
    const row = await create({
      title: `${task.title} ${t.drawer.copy}`.slice(0, 300),
      description: task.description,
      due_at: task.due_at,
      assigned_to: task.assigned_to,
      lead_id: task.lead_id,
      priority: task.priority,
      type: task.type,
      tags: task.tags,
      checklist: task.checklist.map((c) => ({ ...c, id: crypto.randomUUID(), done: false })),
    });
    if (row) open(row.id);
  };

  // Atajos: N nueva tarea, / buscar.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || typing(event.target)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setCreating(true);
      } else if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-filter]")) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filterOpen]);

  /* ---------------- Qué se ve ---------------- */

  const inScope = useCallback(
    (x: TaskRow) =>
      scope === "done"
        ? x.done
        : scope === "mine"
          ? x.assigned_to === me
          : scope === "created"
            ? x.created_by === me
            : scope === "unassigned"
              ? !x.assigned_to
              : true,
    [scope, me],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter(inScope)
      .filter((x) => !filters.priority || x.priority === filters.priority)
      .filter((x) => !filters.type || x.type === filters.type)
      .filter((x) => !filters.assignee || (filters.assignee === "none" ? !x.assigned_to : x.assigned_to === filters.assignee))
      .filter((x) => !filters.tag || x.tags.includes(filters.tag))
      .filter((x) => !q || [x.title, x.description, x.lead_name, ...x.tags].some((v) => v?.toLowerCase().includes(q)));
  }, [tasks, inScope, filters, query]);
  // La lista oculta las completadas (salvo en su pestaña); tablero y calendario las muestran.
  const listTasks = scope === "done" ? filtered : filtered.filter((x) => !x.done);
  const counts = useMemo(() => {
    const c = {} as Record<Scope, number>;
    for (const s of ["mine", "all", "created", "unassigned", "done"] as Scope[]) {
      c[s] = tasks.filter((x) =>
        s === "done" ? x.done : !x.done && (s === "mine" ? x.assigned_to === me : s === "created" ? x.created_by === me : s === "unassigned" ? !x.assigned_to : true),
      ).length;
    }
    return c;
  }, [tasks, me]);
  const allTags = useMemo(() => [...new Set(tasks.flatMap((x) => x.tags))].sort(), [tasks]);
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const openTask = tasks.find((x) => x.id === openId) ?? null;

  const bulk = async (patch: Partial<Task>) => {
    const ids = [...selected];
    setTasks((list) => list.map((x) => (selected.has(x.id) ? { ...x, ...patch } : x)));
    setSelected(new Set());
    const { error } = await supabase.from("tasks").update(patch).in("id", ids);
    if (error) flash(t.errors.generic.replace("{detail}", error.message));
  };
  const postponeSelected = async () => {
    const ids = [...selected];
    setSelected(new Set());
    await Promise.all(
      ids.map((id) => {
        const x = tasks.find((y) => y.id === id);
        const base = x?.due_at ? Date.parse(x.due_at) : now;
        return update(id, { due_at: new Date(Math.max(base, now) + 86_400_000).toISOString() });
      }),
    );
  };

  const viewProps = { locale, tasks: view === "list" ? listTasks : filtered, names, onOpen: open, onUpdate: (id: string, patch: Partial<Task>) => void update(id, patch) };

  return (
    <div className="px-4 py-4 sm:px-6">
      {/* Pestañas */}
      <div role="tablist" aria-label={t.scopes.mine} className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:-mx-6 sm:px-6">
        {(Object.keys(t.scopes) as Scope[]).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={scope === s}
            onClick={() => {
              setScope(s);
              setSelected(new Set());
            }}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[0.94rem] transition-colors",
              scope === s ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading",
            )}
          >
            {t.scopes[s]}
            {counts[s] > 0 && s !== "done" && <span className="rounded-md bg-card-soft px-1.5 text-xs tabular-nums text-muted dark:bg-white/10">{counts[s]}</span>}
          </button>
        ))}
      </div>

      {/* Barra de herramientas */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">{t.search}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            className="h-10 w-full rounded-[10px] bg-[#f4f4f5] pl-9 pr-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]"
          />
        </label>
        <div className="relative" data-filter>
          <button type="button" onClick={() => setFilterOpen((v) => !v)} aria-expanded={filterOpen} aria-label={t.filter} className={cn(iconBtn, "relative", activeFilters && "bg-[var(--meta-active)] text-accent")}>
            <ListFilter className="h-[18px] w-[18px]" aria-hidden />
            {activeFilters > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-green-dark" />}
          </button>
          {filterOpen && (
            <div className={cn(menu, "left-0 grid w-72 gap-3 p-3")}>
              <Select size="md" label={t.filters.priority} value={filters.priority} onChange={(v) => setFilters((f) => ({ ...f, priority: v }))} options={[{ value: "", label: t.filters.any }, ...PRIORITIES.map((x) => ({ value: x, label: p.priorities[x] }))]} />
              <Select size="md" label={t.filters.type} value={filters.type} onChange={(v) => setFilters((f) => ({ ...f, type: v }))} options={[{ value: "", label: t.filters.any }, ...TYPES.map((x) => ({ value: x, label: p.types[x] }))]} />
              <Select
                size="md"
                label={t.filters.assignee}
                value={filters.assignee}
                onChange={(v) => setFilters((f) => ({ ...f, assignee: v }))}
                options={[{ value: "", label: t.filters.anyone }, { value: "none", label: p.unassigned }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
              />
              {allTags.length > 0 && (
                <Select size="md" label={t.filters.tag} value={filters.tag} onChange={(v) => setFilters((f) => ({ ...f, tag: v }))} options={[{ value: "", label: t.filters.any }, ...allTags.map((x) => ({ value: x, label: `#${x}` }))]} />
              )}
              {activeFilters > 0 && (
                <button type="button" onClick={() => setFilters({ priority: "", type: "", assignee: "", tag: "" })} className="text-left text-sm font-semibold text-accent hover:underline">
                  {t.filters.clear}
                </button>
              )}
            </div>
          )}
        </div>
        {toast && (
          <span role="status" className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {toast}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center rounded-[10px] p-0.5" role="group" aria-label={t.views.list}>
            {(
              [
                ["list", List],
                ["board", KanbanSquare],
                ["calendar", CalendarDays],
              ] as const
            ).map(([v, Icon]) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setView(v);
                  setUrl("v", v === "list" ? null : v);
                }}
                aria-pressed={view === v}
                aria-label={t.views[v]}
                title={t.views[v]}
                className={cn(iconBtn, view === v && "bg-[var(--meta-hover)]")}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            title="N"
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--meta-active)] px-4 text-sm font-semibold text-accent ring-1 ring-brand-green/40 hover:brightness-95"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t.newTask}
          </button>
        </div>
      </div>

      {/* Carga del equipo */}
      {scope === "all" && workload.length > 0 && view === "list" && (
        <div className="mb-5 rounded-xl border border-line p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-[0.95rem] font-semibold text-heading">{t.workload}</h2>
            <p className="text-xs text-muted">{t.workloadHint}</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {workload.map((w) => {
              const max = Math.max(...workload.map((x) => x.open), 1);
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, assignee: f.assignee === w.id ? "" : w.id }))}
                    aria-pressed={filters.assignee === w.id}
                    className={cn("w-full rounded-lg px-2 py-1.5 text-left hover:bg-[var(--meta-hover)]", filters.assignee === w.id && "bg-[var(--meta-active)]")}
                  >
                    <span className="flex justify-between text-sm">
                      <span className="truncate text-heading">{w.name}</span>
                      <span className="tabular-nums text-muted">
                        {w.open}
                        {w.overdue > 0 && <span className="text-red-600 dark:text-red-400"> · {w.overdue}</span>}
                      </span>
                    </span>
                    <span className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-card-soft dark:bg-white/10">
                      <span className="h-full bg-red-500" style={{ width: `${(w.overdue / max) * 100}%` }} />
                      <span className="h-full bg-deep-700 dark:bg-[#9fb0d8]" style={{ width: `${((w.open - w.overdue) / max) * 100}%` }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Alta rápida */}
      {view === "list" && scope !== "done" && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const parsed = parseQuick(quick, now);
            if (parsed.title.length < 2) return;
            setQuick("");
            await create({
              title: parsed.title.slice(0, 300),
              due_at: parsed.due,
              ...(parsed.priority ? { priority: parsed.priority } : {}),
              assigned_to: scope === "unassigned" ? null : me,
            });
          }}
          className="mb-5 flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-3 focus-within:border-brand-green-dark focus-within:ring-2 focus-within:ring-brand-green/20"
        >
          <Plus className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder={t.quickAdd}
            aria-label={t.newTask}
            maxLength={300}
            className="h-11 flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-muted focus-visible:outline-none"
          />
        </form>
      )}

      {/* Acciones en lote */}
      {selected.size > 0 && view === "list" && (
        <div className="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--meta-active)] px-3 py-2 text-sm shadow-sm">
          <span className="font-semibold text-heading">{t.selected.replace("{n}", String(selected.size))}</span>
          <button type="button" onClick={() => bulk({ status: "done", done: true })} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-medium text-heading hover:bg-surface/70">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {t.bulk.complete}
          </button>
          <button type="button" onClick={() => void postponeSelected()} className="inline-flex h-8 items-center rounded-lg px-2.5 font-medium text-heading hover:bg-surface/70">
            {t.bulk.postpone}
          </button>
          <div className="w-44">
            <Select size="sm" label={t.bulk.assign} value="" placeholder={t.bulk.assign} onChange={(v) => v && bulk({ assigned_to: v === "none" ? null : v })} options={[{ value: "none", label: p.unassigned }, ...employees.map((e) => ({ value: e.id, label: e.name }))]} />
          </div>
          <div className="w-36">
            <Select size="sm" label={t.bulk.priority} value="" placeholder={t.bulk.priority} onChange={(v) => v && bulk({ priority: v as TaskPriority })} options={PRIORITIES.map((x) => ({ value: x, label: p.priorities[x] }))} />
          </div>
          <button
            type="button"
            onClick={() => window.confirm(t.confirmDelete.replace("{n}", String(selected.size))) && void remove([...selected])}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-medium text-red-600 hover:bg-surface/70 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t.bulk.delete}
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm font-medium text-muted hover:text-heading">
            {t.bulk.clear}
          </button>
        </div>
      )}

      {/* Vista */}
      {view === "list" ? (
        listTasks.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">{activeFilters || query ? t.emptyFiltered : t.empty}</p>
        ) : (
          <TaskListView
            {...viewProps}
            selected={selected}
            onSelect={(id) =>
              setSelected((s) => {
                const next = new Set(s);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            onSelectMany={(ids, on) =>
              setSelected((s) => {
                const next = new Set(s);
                for (const id of ids) {
                  if (on) next.add(id);
                  else next.delete(id);
                }
                return next;
              })
            }
            now={now}
            openId={openId}
          />
        )
      ) : view === "board" ? (
        <TaskBoardView {...viewProps} />
      ) : (
        <TaskCalendarView {...viewProps} />
      )}

      <p className="mt-6 text-xs text-muted max-sm:hidden">{t.shortcuts}</p>

      {openTask && (
        <TaskDrawer
          key={openTask.id}
          locale={locale}
          task={openTask}
          employees={employees}
          me={me}
          onClose={() => open(null)}
          onUpdate={(id, patch) => void update(id, patch)}
          onDelete={(id) => void remove([id])}
          onDuplicate={(task) => void duplicate(task)}
        />
      )}
      {creating && (
        <NewTaskDialog
          locale={locale}
          employees={employees}
          me={me}
          onClose={() => setCreating(false)}
          onCreate={async (fields) => {
            const row = await create(fields);
            if (row) {
              setCreating(false);
              open(row.id);
            }
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nueva tarea                                                        */
/* ------------------------------------------------------------------ */

function NewTaskDialog({
  locale,
  employees,
  me,
  onClose,
  onCreate,
}: {
  locale: Locale;
  employees: { id: string; name: string }[];
  me: string;
  onClose: () => void;
  onCreate: (fields: Partial<Task> & { title: string }) => Promise<void>;
}) {
  const t = tasksWorkspaceCopy[locale];
  const p = tasksProCopy[locale];
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: me,
    due_at: null as string | null,
    priority: "medium" as TaskPriority,
    type: "other" as TaskType,
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4" onMouseDown={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          if (form.title.trim().length < 2) return;
          setBusy(true);
          await onCreate({ ...form, title: form.title.trim(), description: form.description.trim() || null, assigned_to: form.assigned_to || null });
          setBusy(false);
        }}
        className="grid w-full max-w-lg gap-4 rounded-2xl bg-surface p-5 shadow-2xl dark:bg-card"
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-base font-semibold text-heading">{t.dialog.title}</h2>
          <button type="button" onClick={onClose} aria-label={t.dialog.cancel} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--meta-hover)]">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <input
          autoFocus
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          maxLength={300}
          placeholder={t.dialog.name}
          aria-label={t.dialog.name}
          className={cn(inputClass, "h-12 text-base")}
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          maxLength={5000}
          placeholder={t.drawer.descriptionPlaceholder}
          aria-label={t.drawer.description}
          className={cn(inputClass, "h-auto resize-none py-2.5 text-sm")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select size="md" label={t.drawer.assignee} value={form.assigned_to} onChange={(v) => setForm((f) => ({ ...f, assigned_to: v }))} options={[{ value: "", label: p.unassigned }, ...employees.map((e) => ({ value: e.id, label: e.name }))]} />
          <Select size="md" label={t.drawer.priority} value={form.priority} onChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))} options={PRIORITIES.map((x) => ({ value: x, label: p.priorities[x] }))} />
          <Select size="md" label={t.drawer.type} value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v as TaskType }))} options={TYPES.map((x) => ({ value: x, label: p.types[x] }))} />
          <DateTimePicker size="md" label={t.drawer.due} value={form.due_at} onChange={(v) => setForm((f) => ({ ...f, due_at: v }))} locale={locale} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-[10px] px-4 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
            {t.dialog.cancel}
          </button>
          <button type="submit" disabled={busy || form.title.trim().length < 2} className={buttonClasses("primary", "md", "h-10 px-5 disabled:opacity-50")}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t.dialog.create}
          </button>
        </div>
      </form>
    </div>
  );
}
