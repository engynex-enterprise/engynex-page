"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, RotateCcw, Send, Trash2, X } from "lucide-react";
import { inputClass } from "@/components/auth/inputClass";
import { buttonClasses } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { UpdatesFeed } from "@/components/projects/ProjectTimeline";
import { fmtDay, milestoneState, PROJECT_STATUSES, ProgressBar, ProjectStatusChip } from "@/components/projects/shared";
import { projectsCopy } from "@/content/projects";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import type { ClientProject, ProjectMilestone, ProjectStatus, ProjectUpdate } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };
const field = cn(inputClass, "h-10 text-sm");
const area = cn(inputClass, "h-auto py-2.5 text-sm");
const small = "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50";

/** Proyectos de un cliente vistos por el equipo: crear, editar hitos y publicar novedades. */
export function ProjectsManager({
  locale,
  accountId,
  projects,
  milestones,
  updates,
  employees,
  services,
  names,
  today,
}: {
  locale: Locale;
  accountId: string;
  projects: ClientProject[];
  milestones: ProjectMilestone[];
  updates: ProjectUpdate[];
  employees: { id: string; name: string }[];
  services: Option[];
  names: Record<string, string>;
  today: string;
}) {
  const t = projectsCopy[locale].staff;
  const [creating, setCreating] = useState(false);

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{t.progressHint}</p>
        {!creating && (
          <button type="button" onClick={() => setCreating(true)} className={cn(buttonClasses("primary", "md"), "h-9 px-3.5")}>
            <Plus className="h-4 w-4" aria-hidden />
            {t.new}
          </button>
        )}
      </div>
      {creating && (
        <section className="rounded-xl border border-line bg-surface p-5 dark:bg-card">
          <h3 className="mb-4 text-[0.98rem] font-semibold text-heading">{t.new}</h3>
          <ProjectForm locale={locale} accountId={accountId} employees={employees} services={services} onDone={() => setCreating(false)} />
        </section>
      )}
      {projects.length === 0 && !creating && <p className="rounded-xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">{t.empty}</p>}
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          locale={locale}
          project={p}
          milestones={milestones.filter((m) => m.project_id === p.id)}
          updates={updates.filter((u) => u.project_id === p.id)}
          employees={employees}
          services={services}
          names={names}
          today={today}
        />
      ))}
    </div>
  );
}

function ProjectForm({
  locale,
  accountId,
  project,
  employees,
  services,
  onDone,
}: {
  locale: Locale;
  accountId: string;
  project?: ClientProject;
  employees: { id: string; name: string }[];
  services: Option[];
  onDone: () => void;
}) {
  const t = projectsCopy[locale];
  const s = t.staff;
  const router = useRouter();
  const [form, setForm] = useState({
    name: project?.name ?? "",
    description: project?.description ?? "",
    service: project?.service_slug ?? "",
    status: project?.status ?? ("planning" as ProjectStatus),
    start: project?.start_date ?? "",
    due: project?.due_date ?? "",
    manager: project?.manager_id ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return;
    setBusy(true);
    setError(false);
    const values = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      service_slug: form.service || null,
      status: form.status,
      start_date: form.start || null,
      due_date: form.due || null,
      manager_id: form.manager || null,
    };
    const supabase = createClient();
    const { error } = project
      ? await supabase.from("client_projects").update(values).eq("id", project.id)
      : await supabase.from("client_projects").insert({ ...values, account_id: accountId });
    setBusy(false);
    if (error) return setError(true);
    onDone();
    router.refresh();
  };

  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium text-heading sm:col-span-2">
        {s.name}
        <input value={form.name} onChange={(e) => set("name")(e.target.value)} required minLength={2} maxLength={120} className={cn(field, "mt-1.5")} />
      </label>
      <label className="text-sm font-medium text-heading sm:col-span-2">
        {s.description}
        <textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={3} maxLength={2000} className={cn(area, "mt-1.5")} />
      </label>
      <Select label={s.service} size="md" options={[{ value: "", label: s.noService }, ...services]} value={form.service} onChange={set("service")} />
      <Select label={s.status} size="md" options={PROJECT_STATUSES.map((v) => ({ value: v, label: t.statuses[v] }))} value={form.status} onChange={set("status")} />
      <label className="text-sm font-medium text-heading">
        {s.start}
        <input type="date" value={form.start} onChange={(e) => set("start")(e.target.value)} className={cn(field, "mt-1.5")} />
      </label>
      <label className="text-sm font-medium text-heading">
        {s.due}
        <input type="date" value={form.due} onChange={(e) => set("due")(e.target.value)} className={cn(field, "mt-1.5")} />
      </label>
      <Select
        label={s.manager}
        size="md"
        className="sm:col-span-2"
        options={[{ value: "", label: s.noManager }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
        value={form.manager}
        onChange={set("manager")}
      />
      <div className="flex flex-wrap items-center justify-end gap-2 sm:col-span-2">
        {error && (
          <span role="alert" className="mr-auto text-sm text-red-700 dark:text-red-400">
            {s.error}
          </span>
        )}
        <button type="button" onClick={onDone} className={cn(buttonClasses("outline", "md"), "h-9 px-3.5")}>
          {s.cancel}
        </button>
        <button type="submit" disabled={busy} className={cn(buttonClasses("dark", "md"), "h-9 px-3.5")}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {busy ? s.saving : s.save}
        </button>
      </div>
    </form>
  );
}

function ProjectCard({
  locale,
  project,
  milestones,
  updates,
  employees,
  services,
  names,
  today,
}: {
  locale: Locale;
  project: ClientProject;
  milestones: ProjectMilestone[];
  updates: ProjectUpdate[];
  employees: { id: string; name: string }[];
  services: Option[];
  names: Record<string, string>;
  today: string;
}) {
  const t = projectsCopy[locale];
  const s = t.staff;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const manager = employees.find((e) => e.id === project.manager_id)?.name;
  const service = services.find((o) => o.value === project.service_slug)?.label;

  const remove = async () => {
    if (!window.confirm(s.confirmDelete)) return;
    setBusy(true);
    await createClient().from("client_projects").delete().eq("id", project.id);
    setBusy(false);
    router.refresh();
  };

  return (
    <section className="rounded-xl border border-line bg-surface dark:bg-card">
      <div className="p-5">
        {editing ? (
          <ProjectForm locale={locale} accountId={project.account_id} project={project} employees={employees} services={services} onDone={() => setEditing(false)} />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-heading [overflow-wrap:anywhere]">{project.name}</h3>
                  <ProjectStatusChip locale={locale} status={project.status} />
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  {[service, manager && `${s.manager}: ${manager}`, `${fmtDay(locale, project.start_date)} → ${fmtDay(locale, project.due_date)}`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setEditing(true)} className={small}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  {s.edit}
                </button>
                <button type="button" onClick={remove} disabled={busy} className={cn(small, "text-red-700 dark:text-red-400")} aria-label={s.delete} title={s.delete}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>
            {project.description && <p className="mt-2 whitespace-pre-line text-sm text-body">{project.description}</p>}
            <div className="mt-3 max-w-md">
              <ProgressBar value={project.progress} label={t.progress} />
            </div>
          </>
        )}
      </div>

      <div className="border-t border-line p-5">
        <h4 className="mb-3 text-sm font-semibold text-heading">{s.milestones}</h4>
        <MilestonesEditor locale={locale} projectId={project.id} milestones={milestones} today={today} />
      </div>

      <div className="border-t border-line p-5">
        <h4 className="mb-3 text-sm font-semibold text-heading">{s.updates}</h4>
        <UpdateComposer locale={locale} projectId={project.id} />
        <div className="mt-5">
          <UpdatesFeed locale={locale} updates={updates} names={names} staff />
        </div>
      </div>
    </section>
  );
}

function MilestonesEditor({ locale, projectId, milestones, today }: { locale: Locale; projectId: string; milestones: ProjectMilestone[]; today: string }) {
  const s = projectsCopy[locale].staff;
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [approval, setApproval] = useState(false);
  const [busy, setBusy] = useState(false);
  const sorted = [...milestones].sort((a, b) => a.position - b.position);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const position = (sorted.at(-1)?.position ?? -1) + 1;
    await createClient()
      .from("project_milestones")
      .insert({ project_id: projectId, title: title.trim(), due_date: due || null, position, needs_approval: approval, approval_status: approval ? "pending" : null });
    setBusy(false);
    setTitle("");
    setDue("");
    setApproval(false);
    router.refresh();
  };

  const move = async (i: number, dir: -1 | 1) => {
    const a = sorted[i];
    const b = sorted[i + dir];
    if (!a || !b) return;
    const supabase = createClient();
    // Posiciones explícitas por si dos hitos comparten la misma.
    await Promise.all([
      supabase.from("project_milestones").update({ position: i + dir }).eq("id", a.id),
      supabase.from("project_milestones").update({ position: i }).eq("id", b.id),
    ]);
    router.refresh();
  };

  return (
    <div>
      {sorted.length > 0 && (
        <ol className="mb-4 divide-y divide-line rounded-lg border border-line">
          {sorted.map((m, i) => (
            <MilestoneRow
              key={`${m.id}:${m.title}:${m.due_date}:${m.description}`}
              locale={locale}
              milestone={m}
              index={i}
              last={i === sorted.length - 1}
              today={today}
              onMove={(dir) => move(i, dir)}
            />
          ))}
        </ol>
      )}
      <form onSubmit={add} className="flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] flex-1 text-xs font-medium text-muted">
          {s.milestoneTitle}
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} className={cn(field, "mt-1")} />
        </label>
        <label className="text-xs font-medium text-muted">
          {s.milestoneDue}
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={cn(field, "mt-1 block w-auto")} />
        </label>
        <label className="flex h-10 items-center gap-2 text-sm text-heading">
          <input type="checkbox" checked={approval} onChange={(e) => setApproval(e.target.checked)} className="h-4 w-4 accent-[var(--color-deep-700)]" />
          {s.needsApproval}
        </label>
        <button type="submit" disabled={busy || !title.trim()} className={cn(buttonClasses("dark", "md"), "h-10 px-3.5")}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
          {s.addMilestone}
        </button>
      </form>
    </div>
  );
}

function MilestoneRow({
  locale,
  milestone: m,
  index,
  last,
  today,
  onMove,
}: {
  locale: Locale;
  milestone: ProjectMilestone;
  index: number;
  last: boolean;
  today: string;
  onMove: (dir: -1 | 1) => void;
}) {
  const t = projectsCopy[locale];
  const s = t.staff;
  const router = useRouter();
  const [title, setTitle] = useState(m.title);
  const [due, setDue] = useState(m.due_date ?? "");
  const [desc, setDesc] = useState(m.description ?? "");
  const [busy, setBusy] = useState(false);
  const dirty = title !== m.title || due !== (m.due_date ?? "") || desc !== (m.description ?? "");
  const state = milestoneState(m, today);

  const patch = async (values: Partial<Omit<ProjectMilestone, "id">>) => {
    setBusy(true);
    await createClient().from("project_milestones").update(values).eq("id", m.id);
    setBusy(false);
    router.refresh();
  };
  const remove = async () => {
    setBusy(true);
    await createClient().from("project_milestones").delete().eq("id", m.id);
    setBusy(false);
    router.refresh();
  };

  return (
    <li className="p-3">
      <div className="flex flex-wrap items-start gap-2">
        <span
          className={cn(
            "mt-2 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.7rem] font-semibold tabular-nums",
            state === "done"
              ? "bg-brand-green-dark text-white dark:bg-brand-green dark:text-deep-700"
              : state === "overdue"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                : "bg-[var(--meta-active)] text-heading",
          )}
          title={t[state]}
        >
          {state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
        </span>
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} aria-label={s.milestoneTitle} className={field} />
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label={s.milestoneDue} className={field} />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={1}
            maxLength={2000}
            placeholder={s.milestoneDesc}
            aria-label={s.milestoneDesc}
            className={cn(area, "sm:col-span-2")}
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-8">
        {dirty && (
          <button
            type="button"
            disabled={busy || !title.trim()}
            onClick={() => patch({ title: title.trim(), due_date: due || null, description: desc.trim() || null })}
            className={cn(small, "bg-deep-700 text-white ring-0 hover:bg-deep-600 dark:bg-white dark:text-deep-700")}
          >
            {s.save}
          </button>
        )}
        <button type="button" disabled={busy} onClick={() => patch({ done_at: m.done_at ? null : new Date().toISOString() })} className={small}>
          {m.done_at ? <RotateCcw className="h-3.5 w-3.5" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
          {m.done_at ? s.markUndone : s.markDone}
        </button>
        <label className={cn(small, "cursor-pointer")}>
          <input
            type="checkbox"
            checked={m.needs_approval}
            disabled={busy}
            onChange={(e) =>
              patch(e.target.checked ? { needs_approval: true, approval_status: "pending", client_comment: null, reviewed_at: null } : { needs_approval: false, approval_status: null })
            }
            className="h-3.5 w-3.5 accent-[var(--color-deep-700)]"
          />
          {s.needsApproval}
        </label>
        <button type="button" disabled={busy || index === 0} onClick={() => onMove(-1)} className={small} aria-label={s.moveUp} title={s.moveUp}>
          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button type="button" disabled={busy || last} onClick={() => onMove(1)} className={small} aria-label={s.moveDown} title={s.moveDown}>
          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button type="button" disabled={busy} onClick={remove} className={cn(small, "text-red-700 dark:text-red-400")} aria-label={s.remove} title={s.remove}>
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
        {m.done_at && <span className="text-xs text-muted">{t.doneOn.replace("{date}", fmtDay(locale, m.done_at))}</span>}
      </div>
      {m.needs_approval && m.approval_status && (
        <p
          className={cn(
            "ml-8 mt-2 rounded-lg px-3 py-2 text-sm",
            m.approval_status === "approved"
              ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200"
              : m.approval_status === "changes_requested"
                ? "bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
                : "bg-violet-50 text-violet-900 dark:bg-violet-500/10 dark:text-violet-200",
          )}
        >
          <span className="font-semibold">{s.clientSaid} </span>
          {s.approvalStates[m.approval_status]}
          {m.client_comment && <> — «{m.client_comment}»</>}
        </p>
      )}
    </li>
  );
}

function UpdateComposer({ locale, projectId }: { locale: Locale; projectId: string }) {
  const t = projectsCopy[locale];
  const s = t.staff;
  const router = useRouter();
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [kind, setKind] = useState("update");
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(false);
    const { error } = await createClient().rpc("project_post_update", {
      p_project: projectId,
      p_body: body.trim(),
      p_kind: kind,
      p_link: link.trim() || null,
      p_visible: visible,
    });
    setBusy(false);
    if (error) return setError(true);
    setBody("");
    setLink("");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem]">
      <label className="text-xs font-medium text-muted sm:col-span-2">
        {s.updateBody}
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={4000} className={cn(area, "mt-1")} />
      </label>
      <label className="text-xs font-medium text-muted">
        {s.updateLink}
        <input type="url" value={link} onChange={(e) => setLink(e.target.value)} maxLength={500} placeholder="https://" className={cn(field, "mt-1")} />
      </label>
      <Select
        label={s.updateKind}
        size="md"
        options={(["update", "delivery", "question"] as const).map((k) => ({ value: k, label: t.kinds[k] }))}
        value={kind}
        onChange={setKind}
        className="self-end"
      />
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-heading">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4 accent-[var(--color-deep-700)]" />
          {s.visible}
        </label>
        {error && (
          <span role="alert" className="text-sm text-red-700 dark:text-red-400">
            {s.error}
          </span>
        )}
        <button type="submit" disabled={busy || !body.trim()} className={cn(buttonClasses("dark", "md"), "ml-auto h-9 px-3.5")}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          {busy ? s.publishing : s.publish}
        </button>
      </div>
    </form>
  );
}
