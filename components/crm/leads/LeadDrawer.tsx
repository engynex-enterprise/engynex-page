"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AtSign,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCheck,
  Download,
  ExternalLink,
  FileText,
  GripVertical,
  Loader2,
  Mail,
  Paperclip,
  Pencil,
  Phone,
  Plus,
  SendHorizontal,
  SmilePlus,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ActivityReaction, Deal, DealStage, Lead, LeadActivity, LeadDocument, MeetingChannel } from "@/lib/supabase/types";
import { crmPlus } from "@/content/crmPlus";
import { crmCopy } from "@/content/crm";
import { leadDrawerCopy } from "@/content/leadDrawer";
import { services } from "@/content/services";
import { tierStyles } from "@/lib/tiers";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { AiPanel, AnswersPanel, ChatPanel, EmailsPanel, JourneyPanel, MeetingsPanel, OriginPanel, PanelLoading, TasksPanel } from "./drawer/panels";
import { leadFormCopy } from "@/content/leadForm";
import { LeadTimeline } from "@/components/crm/LeadDetail";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { Select } from "@/components/ui/Select";
import { inputClass } from "@/components/auth/inputClass";
import { formatBytes } from "@/lib/tickets";
import type { Employee } from "@/components/crm/CrmBoard";
import type { WorkspaceLead } from "./LeadsWorkspace";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Tab = keyof (typeof leadDrawerCopy)["es"]["tabs"];
const TABS: Tab[] = ["answers", "activity", "notes", "tasks", "meetings", "chat", "emails", "deals", "docs", "ai", "journey", "origin"];
const EMOJIS = ["👍", "👌", "🎉", "❤️", "🔥", "👀"];
const STAGES: DealStage[] = ["prospecting", "proposal", "negotiation", "won", "lost"];
const BUCKET = "portal-docs";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const cop = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

/**
 * Ficha lateral del cliente: datos de contacto, agendar llamada, editar, y
 * pestañas con todo lo de la ficha completa: respuestas y puntaje, historial,
 * notas (con @menciones y reacciones), tareas, citas, chat y WhatsApp,
 * correos, negocios, documentos, lectura con IA, recorrido y origen. Cada
 * pestaña consulta sus datos la primera vez que se abre.
 */
export function LeadDrawer({
  locale,
  lead,
  employees,
  me,
  canEdit,
  onClose,
  onChange,
}: {
  locale: Locale;
  lead: WorkspaceLead;
  employees: Employee[];
  me: { id: string; name: string };
  canEdit: boolean;
  onClose: () => void;
  onChange: (patch: Partial<WorkspaceLead>) => void;
}) {
  const t = crmPlus;
  const supabase = useMemo(() => createClient(), []);
  const d = leadDrawerCopy[locale];
  const tc = crmCopy[locale];
  const [tab, setTab] = useState<Tab>("answers");
  const [visited, setVisited] = useState<Set<Tab>>(() => new Set<Tab>(["answers"]));
  const [full, setFull] = useState<Lead | null>(null);
  const [counts, setCounts] = useState<Partial<Record<Tab, number>>>({});
  const setTaskCount = useCallback((n: number) => setCounts((c) => ({ ...c, tasks: n })), []);
  const [activities, setActivities] = useState<LeadActivity[] | null>(null);
  const [reactions, setReactions] = useState<ActivityReaction[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [docs, setDocs] = useState<LeadDocument[]>([]);
  const [mode, setMode] = useState<"view" | "edit" | "schedule">("view");
  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);

  const loadFull = useCallback(async () => {
    const { data } = await supabase.from("leads").select("*").eq("id", lead.id).maybeSingle();
    setFull((data as Lead | null) ?? null);
  }, [supabase, lead.id]);

  // Ficha completa del lead y contadores de las pestañas (solo conteos).
  useEffect(() => {
    const first = window.setTimeout(() => void loadFull(), 0);
    const head = { count: "exact" as const, head: true };
    void Promise.all([
      supabase.from("tasks").select("id", head).eq("lead_id", lead.id).eq("done", false),
      supabase.from("appointments").select("id", head).eq("lead_id", lead.id),
      supabase.from("chat_conversations").select("id", head).eq("lead_id", lead.id),
      supabase.from("email_queue").select("id", head).eq("lead_id", lead.id),
    ]).then(([tk, ap, ch, em]) => setCounts((c) => ({ ...c, tasks: tk.count ?? 0, meetings: ap.count ?? 0, chat: ch.count ?? 0, emails: em.count ?? 0 })));
    return () => window.clearTimeout(first);
  }, [supabase, lead.id, loadFull]);

  const openTab = (k: Tab) => {
    setTab(k);
    setVisited((v) => (v.has(k) ? v : new Set(v).add(k)));
  };
  const service = full?.service ? services.find((x) => x.slug === full.service)?.[locale].title ?? full.service : null;

  const loadAll = useMemo(
    () => async () => {
      const [a, d, docsRes] = await Promise.all([
        supabase.from("lead_activities").select("*").eq("lead_id", lead.id).order("created_at", { ascending: false }),
        supabase.from("deals").select("*").eq("lead_id", lead.id).order("created_at", { ascending: false }),
        supabase.from("lead_documents").select("*").eq("lead_id", lead.id).order("created_at", { ascending: false }),
      ]);
      const acts = (a.data ?? []) as LeadActivity[];
      setActivities(acts);
      setDeals((d.data ?? []) as Deal[]);
      setDocs((docsRes.data ?? []) as LeadDocument[]);
      const noteIds = acts.filter((x) => x.type === "note").map((x) => x.id);
      if (noteIds.length) {
        const { data } = await supabase.from("activity_reactions").select("*").in("activity_id", noteIds);
        setReactions((data ?? []) as ActivityReaction[]);
      }
    },
    [supabase, lead.id],
  );

  useEffect(() => {
    const first = window.setTimeout(() => void loadAll(), 0);
    const channel = supabase
      .channel(`lead-drawer-${lead.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lead_activities", filter: `lead_id=eq.${lead.id}` }, () => void loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_reactions" }, () => void loadAll())
      .subscribe();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener("keydown", onKey);
      void supabase.removeChannel(channel);
    };
  }, [supabase, lead.id, loadAll, onClose]);

  const renderPanel = (k: Tab) => {
    if (["activity", "notes", "deals", "docs"].includes(k) && activities === null) return <PanelLoading locale={locale} />;
    if (["answers", "origin", "tasks", "meetings", "chat", "emails", "ai", "journey"].includes(k) && !full) return <PanelLoading locale={locale} />;
    switch (k) {
      case "answers":
        return <AnswersPanel locale={locale} lead={full!} />;
      case "activity":
        return (
          <LeadTimeline
            locale={locale}
            leadId={lead.id}
            initial={(activities ?? []).filter((a) => a.type !== "note")}
            names={names}
            currentUserId={me.id}
            canWrite={false}
            isAdmin={false}
          />
        );
      case "notes":
        return (
          <Notes
            leadId={lead.id}
            notes={(activities ?? []).filter((a) => a.type === "note" && !((a.meta as Record<string, unknown> | null)?.auto))}
            reactions={reactions}
            names={names}
            employees={employees}
            me={me}
            canWrite={canEdit}
            onUpload={async (file) => {
              const doc = await uploadDoc(supabase, lead.id, file);
              if (doc) setDocs((x) => [doc, ...x]);
            }}
            onChanged={loadAll}
          />
        );
      case "tasks":
        return <TasksPanel locale={locale} lead={full!} canWrite={canEdit} meId={me.id} onCount={setTaskCount} />;
      case "meetings":
        return <MeetingsPanel locale={locale} lead={full!} />;
      case "chat":
        return <ChatPanel locale={locale} lead={full!} names={names} />;
      case "emails":
        return <EmailsPanel locale={locale} lead={full!} />;
      case "deals":
        return <Deals leadId={lead.id} deals={deals} canEdit={canEdit} onChanged={loadAll} />;
      case "docs":
        return <Docs leadId={lead.id} docs={docs} canEdit={canEdit} names={names} locale={locale} onChanged={loadAll} />;
      case "ai":
        return <AiPanel locale={locale} lead={full!} canRun={canEdit} onAnalyzed={() => void loadFull()} />;
      case "journey":
        return <JourneyPanel locale={locale} lead={full!} />;
      case "origin":
        return <OriginPanel locale={locale} lead={full!} />;
    }
  };

  return (
    <div className="fixed inset-y-3 right-3 z-50 flex w-[min(30rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_24px_64px_-12px_rgba(16,24,40,0.35),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card" role="dialog" aria-label={t.drawer.title}>
      {/* Encabezado */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <GripVertical className="h-4 w-4 text-muted" aria-hidden />
        <p className="flex-1 text-sm font-medium text-muted">{t.drawer.title}</p>
        <Link href={`/${locale}/portal/crm/${lead.id}`} aria-label={t.drawer.openFull} title={t.drawer.openFull} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
          <ExternalLink className="h-4 w-4" aria-hidden />
        </Link>
        <button type="button" onClick={onClose} aria-label={t.drawer.close} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Perfil */}
        <div className="px-5 pb-4 pt-5">
          {mode === "edit" ? (
            <EditProfile lead={lead} onDone={(patch) => { if (patch) onChange(patch); setMode("view"); }} />
          ) : (
            <div className="flex gap-4">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-deep-600 to-deep-800 text-2xl font-semibold text-white">{initialsOf(lead.name)}</span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-semibold text-heading">{lead.name}</h2>
                <ul className="mt-1.5 grid gap-1 text-sm text-body">
                  {lead.company && (
                    <li className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted" aria-hidden /><span className="truncate">{lead.company}</span></li>
                  )}
                  <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted" aria-hidden /><a href={`mailto:${lead.email}`} className="truncate hover:underline">{lead.email}</a></li>
                  <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted" aria-hidden />{lead.phone ? <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className="hover:underline">{lead.phone}</a> : t.drawer.noPhone}</li>
                </ul>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold", tierStyles[lead.tier].pill)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", tierStyles[lead.tier].dot)} aria-hidden />
                    {tc.tier[lead.tier]}
                  </span>
                  <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-[0.7rem] font-bold tabular-nums text-heading dark:bg-white/[0.06]">
                    {tc.lead.score} {lead.score}/100
                  </span>
                  {service && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--meta-active)] px-2.5 py-0.5 text-[0.7rem] font-bold text-accent ring-1 ring-brand-green-dark/25" title={d.service}>
                      <Briefcase className="h-3 w-3" aria-hidden />
                      {service}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          {mode !== "edit" && full?.request_summary && (
            <p className="mt-3 rounded-xl bg-surface-soft px-3 py-2 text-sm leading-snug text-body dark:bg-white/[0.05]">{full.request_summary}</p>
          )}
          {mode === "schedule" && <Schedule locale={locale} leadId={lead.id} onDone={(ok) => { setMode("view"); if (ok) { onChange({ status: "meeting" }); void loadAll(); } }} />}
          {mode === "view" && canEdit && (
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setMode("schedule")} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[10px] bg-action text-sm font-semibold text-deep-700 hover:bg-action-hover">
                <CalendarClock className="h-4 w-4" aria-hidden />
                {t.drawer.schedule}
              </button>
              <button type="button" onClick={() => setMode("edit")} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[10px] bg-card-soft text-sm font-semibold text-heading hover:brightness-95">
                <Pencil className="h-4 w-4" aria-hidden />
                {t.drawer.edit}
              </button>
            </div>
          )}
        </div>

        {/* Pestañas */}
        <div role="tablist" aria-label={d.tabsLabel} className="sticky top-0 z-10 flex overflow-x-auto border-b border-line bg-surface px-3 [scrollbar-width:none] dark:bg-card">
          {TABS.map((k) => {
            const n = k === "deals" ? deals.length : k === "docs" ? docs.length : counts[k];
            return (
              <button
                key={k}
                type="button"
                role="tab"
                id={`lead-tab-${k}`}
                aria-selected={tab === k}
                aria-controls={`lead-panel-${k}`}
                onClick={() => openTab(k)}
                className={cn("-mb-px shrink-0 whitespace-nowrap border-b-2 px-2.5 py-3 text-sm transition-colors", tab === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading")}
              >
                {d.tabs[k]}
                {!!n && <span className="ml-1 rounded-full bg-surface-soft px-1.5 py-px text-[0.68rem] font-semibold tabular-nums text-muted dark:bg-white/[0.08]">{n}</span>}
              </button>
            );
          })}
        </div>

        <div className="px-5 py-4">
          {TABS.filter((k) => visited.has(k)).map((k) => (
            <div key={k} role="tabpanel" id={`lead-panel-${k}`} aria-labelledby={`lead-tab-${k}`} hidden={tab !== k}>
              {renderPanel(k)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function uploadDoc(supabase: ReturnType<typeof createClient>, leadId: string, file: File): Promise<LeadDocument | null> {
  const safe = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-80);
  const path = `leads/${leadId}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined });
  if (error) return null;
  const { data } = await supabase
    .from("lead_documents")
    .insert({ lead_id: leadId, title: file.name.replace(/\.[^.]+$/, ""), path, size: file.size, mime: file.type || null })
    .select()
    .single();
  return (data as LeadDocument | null) ?? null;
}

/* ---------------- Editar perfil ---------------- */

function EditProfile({ lead, onDone }: { lead: WorkspaceLead; onDone: (patch?: Partial<WorkspaceLead>) => void }) {
  const t = crmPlus.drawer;
  const [form, setForm] = useState({ name: lead.name, email: lead.email, phone: lead.phone, company: lead.company ?? "" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const patch = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), company: form.company.trim() || null };
    const { error } = await createClient().from("leads").update(patch).eq("id", lead.id);
    setBusy(false);
    onDone(error ? undefined : (patch as Partial<Lead>));
  };
  return (
    <div className="grid gap-3">
      {(["name", "email", "phone", "company"] as const).map((k) => (
        <label key={k} className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{t.fields[k]}</span>
          <input value={form[k]} onChange={(event) => setForm((f) => ({ ...f, [k]: event.target.value }))} className={cn(inputClass, "h-10 text-sm")} />
        </label>
      ))}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[10px] bg-action text-sm font-semibold text-deep-700 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t.save}
        </button>
        <button type="button" onClick={() => onDone()} className="h-10 flex-1 rounded-[10px] bg-card-soft text-sm font-semibold text-heading">{t.cancel}</button>
      </div>
    </div>
  );
}

/* ---------------- Agendar ---------------- */

function Schedule({ locale, leadId, onDone }: { locale: Locale; leadId: string; onDone: (ok: boolean) => void }) {
  const t = crmPlus.drawer;
  const channels = leadFormCopy[locale].booking.channels;
  const [when, setWhen] = useState<string | null>(null);
  const [channel, setChannel] = useState<MeetingChannel>("meet");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const save = async () => {
    if (!when) return setError(t.past);
    setBusy(true);
    const { error: rpcError } = await createClient().rpc("staff_book_appointment", { p_lead: leadId, p_start: when, p_channel: channel, p_notes: notes || null });
    setBusy(false);
    if (rpcError) return setError(rpcError.message.includes("slot_taken") ? t.slotTaken : rpcError.message.includes("past") ? t.past : rpcError.message);
    onDone(true);
  };
  return (
    <div className="mt-4 grid gap-3 rounded-xl bg-card-soft p-3">
      <DateTimePicker label={t.scheduleWhen} value={when} onChange={setWhen} locale={locale} minDate={today} step={15} size="sm" />
      <Select size="md" label={t.scheduleChannel} value={channel} onChange={(v) => setChannel(v as MeetingChannel)} options={(Object.keys(channels) as MeetingChannel[]).map((k) => ({ value: k, label: channels[k] }))} />
      <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t.scheduleNotes} aria-label={t.scheduleNotes} className={cn(inputClass, "h-10 text-sm")} />
      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[10px] bg-action text-sm font-semibold text-deep-700 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t.scheduleConfirm}
        </button>
        <button type="button" onClick={() => onDone(false)} className="h-10 flex-1 rounded-[10px] bg-surface text-sm font-semibold text-heading dark:bg-card">{t.cancel}</button>
      </div>
    </div>
  );
}

/* ---------------- Notas con @menciones y reacciones ---------------- */

function Notes({
  leadId,
  notes,
  reactions,
  names,
  employees,
  me,
  canWrite,
  onUpload,
  onChanged,
}: {
  leadId: string;
  notes: LeadActivity[];
  reactions: ActivityReaction[];
  names: Record<string, string>;
  employees: Employee[];
  me: { id: string; name: string };
  canWrite: boolean;
  onUpload: (file: File) => Promise<void>;
  onChanged: () => Promise<void>;
}) {
  const t = crmPlus.notes;
  const supabase = useMemo(() => createClient(), []);
  const [body, setBody] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState<string | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);
  const [composer, setComposer] = useState<HTMLDivElement | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [now] = useState(() => Date.now());

  // "@abc" al final del texto → sugerencias.
  const at = /@([\p{L}]*)$/u.exec(body);
  const suggestions = at && dismissed !== body ? employees.filter((e) => e.id !== me.id && e.name.toLowerCase().includes(at[1].toLowerCase())).slice(0, 5) : [];

  const send = async () => {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    const ids = mentions.filter((id) => text.includes(`@${names[id]}`));
    await supabase.from("lead_activities").insert({ lead_id: leadId, author_id: me.id, type: "note", body: text, mentions: ids });
    setBusy(false);
    setBody("");
    setMentions([]);
    await onChanged();
  };

  const react = async (activityId: string, emoji: string) => {
    setPicker(null);
    const mine = reactions.some((r) => r.activity_id === activityId && r.user_id === me.id && r.emoji === emoji);
    if (mine) await supabase.from("activity_reactions").delete().eq("activity_id", activityId).eq("user_id", me.id).eq("emoji", emoji);
    else await supabase.from("activity_reactions").insert({ activity_id: activityId, emoji });
    await onChanged();
  };

  const ago = (iso: string) => {
    const m = Math.floor((now - new Date(iso).getTime()) / 60000);
    if (m < 60) return `${Math.max(1, m)} min`;
    if (m < 1440) return `${Math.floor(m / 60)} h`;
    if (m < 2880) return t.yesterday;
    return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(new Date(iso));
  };

  // Resalta las @menciones.
  const render = (text: string) => {
    const tokens = employees.map((e) => `@${e.name}`).sort((a, b) => b.length - a.length);
    if (!tokens.length) return text;
    const re = new RegExp(`(${tokens.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
    return text.split(re).map((part, i) => (tokens.includes(part) ? <span key={i} className="font-semibold text-accent">{part}</span> : part));
  };

  return (
    <div>
      {notes.length === 0 && <p className="py-6 text-center text-sm text-muted">{t.empty}</p>}
      <ol className="grid gap-5">
        {notes.map((n) => {
          const author = n.author_id ? names[n.author_id] ?? "—" : "Engynex";
          const grouped = EMOJIS.map((e) => ({ e, n: reactions.filter((r) => r.activity_id === n.id && r.emoji === e).length, mine: reactions.some((r) => r.activity_id === n.id && r.emoji === e && r.user_id === me.id) })).filter((x) => x.n > 0);
          return (
            <li key={n.id} className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-deep-700 text-xs font-bold text-white dark:bg-white dark:text-deep-700">{initialsOf(author)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-heading">{author}</span> <span className="text-xs text-muted">{ago(n.created_at)}</span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-body">{render(n.body ?? "")}</p>
                <div className="relative mt-1.5 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      setPickerAnchor(e.currentTarget);
                      setPicker((p) => (p === n.id ? null : n.id));
                    }}
                    aria-label={t.react}
                    aria-expanded={picker === n.id}
                    className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
                    <SmilePlus className="h-4 w-4" aria-hidden />
                  </button>
                  {grouped.map((g) => (
                    <button
                      key={g.e}
                      type="button"
                      onClick={() => react(n.id, g.e)}
                      aria-pressed={g.mine}
                      className={cn("inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs font-semibold", g.mine ? "bg-[var(--meta-active)] text-accent ring-1 ring-brand-green-dark/30" : "bg-card-soft text-heading")}
                    >
                      <span aria-hidden>{g.e}</span>
                      {g.n}
                    </button>
                  ))}
                  {picker === n.id && (
                    <FloatingPanel anchor={pickerAnchor} open onClose={() => setPicker(null)} role="menu" align="start" className="flex gap-1 rounded-full bg-surface p-1 shadow-[0_8px_24px_-6px_rgba(16,24,40,0.3),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card">
                      {EMOJIS.map((e) => (
                        <button key={e} type="button" role="menuitem" onClick={() => react(n.id, e)} className="grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-[var(--meta-hover)]">
                          {e}
                        </button>
                      ))}
                    </FloatingPanel>
                  )}
                  {n.mentions?.length > 0 && <CheckCheck className="ml-auto h-4 w-4 text-muted" aria-label="Notificado" />}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {canWrite && (
        <div ref={setComposer} className="relative mt-6 rounded-xl bg-card-soft p-3">
          {suggestions.length > 0 && (
            <FloatingPanel anchor={composer} open onClose={() => setDismissed(body)} role="listbox" placement="top" align="start" className="w-60 rounded-xl bg-surface p-1 shadow-[0_8px_24px_-6px_rgba(16,24,40,0.3),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card">
              <ul>
              {suggestions.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setBody((b) => b.replace(/@[\p{L}]*$/u, `@${e.name} `));
                      setMentions((m) => [...new Set([...m, e.id])]);
                    }}
                    className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-heading hover:bg-[var(--meta-hover)]"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-deep-700 text-[0.6rem] font-bold text-white">{initialsOf(e.name)}</span>
                    {e.name}
                  </button>
                </li>
              ))}
              </ul>
            </FloatingPanel>
          )}
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && suggestions.length === 0) {
                event.preventDefault();
                void send();
              }
            }}
            rows={2}
            maxLength={5000}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-heading outline-none placeholder:text-muted"
          />
          <div className="flex items-center gap-1">
            <input ref={fileRef} type="file" className="hidden" onChange={(event) => { const f = event.target.files?.[0]; if (f) void onUpload(f); event.target.value = ""; }} />
            <button type="button" onClick={() => fileRef.current?.click()} aria-label={t.attach} title={t.attach} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface hover:text-heading">
              <Paperclip className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" onClick={() => setBody((b) => `${b}${b && !b.endsWith(" ") ? " " : ""}@`)} aria-label={t.mention} title={t.mention} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface hover:text-heading">
              <AtSign className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" onClick={send} disabled={busy || !body.trim()} aria-label={t.send} className="ml-auto grid h-9 w-9 place-items-center rounded-[10px] bg-action text-deep-700 hover:bg-action-hover disabled:opacity-40">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <SendHorizontal className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Negocios ---------------- */

function Deals({ leadId, deals, canEdit, onChanged }: { leadId: string; deals: Deal[]; canEdit: boolean; onChanged: () => Promise<void> }) {
  const t = crmPlus.deals;
  const supabase = useMemo(() => createClient(), []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", value: "", probability: "30", close: "" });

  const open = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const totals = {
    open: open.reduce((s, d) => s + d.value_cop, 0),
    weighted: open.reduce((s, d) => s + (d.value_cop * d.probability) / 100, 0),
    won: deals.filter((d) => d.stage === "won").reduce((s, d) => s + d.value_cop, 0),
  };

  const create = async () => {
    if (!form.title.trim()) return;
    await supabase.from("deals").insert({
      lead_id: leadId,
      title: form.title.trim(),
      value_cop: Number(form.value.replace(/\D/g, "")) || 0,
      probability: Number(form.probability) || 0,
      expected_close: form.close || null,
    });
    setForm({ title: "", value: "", probability: "30", close: "" });
    setAdding(false);
    await onChanged();
  };

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted">{t.total.replace("{open}", cop(totals.open)).replace("{weighted}", cop(totals.weighted)).replace("{won}", cop(totals.won))}</p>
      {deals.length === 0 && !adding && <p className="py-4 text-center text-sm text-muted">{t.empty}</p>}
      {deals.map((d) => (
        <div key={d.id} className="rounded-xl border border-line p-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-heading">{d.title}</p>
              <p className="text-sm tabular-nums text-body">{cop(d.value_cop)} · {d.probability}%{d.expected_close ? ` · ${d.expected_close}` : ""}</p>
            </div>
            {canEdit && (
              <button type="button" onClick={async () => { await supabase.from("deals").delete().eq("id", d.id); await onChanged(); }} aria-label={t.delete} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-red-600">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
          <div className="mt-2">
            <Select
              size="sm"
              label={t.stage}
              value={d.stage}
              onChange={async (v) => { await supabase.from("deals").update({ stage: v as DealStage }).eq("id", d.id); await onChanged(); }}
              options={STAGES.map((s) => ({ value: s, label: t.stages[s] }))}
            />
          </div>
        </div>
      ))}
      {canEdit &&
        (adding ? (
          <div className="grid gap-2 rounded-xl bg-card-soft p-3">
            <input value={form.title} onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))} placeholder={t.title} aria-label={t.title} className={cn(inputClass, "h-10 text-sm")} />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.value} onChange={(event) => setForm((f) => ({ ...f, value: event.target.value }))} inputMode="numeric" placeholder={t.value} aria-label={t.value} className={cn(inputClass, "h-10 text-sm")} />
              <input value={form.probability} onChange={(event) => setForm((f) => ({ ...f, probability: event.target.value }))} type="number" min={0} max={100} placeholder={t.probability} aria-label={t.probability} className={cn(inputClass, "h-10 text-sm")} />
            </div>
            <input type="date" value={form.close} onChange={(event) => setForm((f) => ({ ...f, close: event.target.value }))} aria-label={t.close} className={cn(inputClass, "h-10 text-sm")} />
            <button type="button" onClick={create} className="h-10 rounded-[10px] bg-action text-sm font-semibold text-deep-700 hover:bg-action-hover">{t.create}</button>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-dashed border-line-strong text-sm font-semibold text-heading hover:bg-[var(--meta-hover)]">
            <Plus className="h-4 w-4" aria-hidden />
            {t.add}
          </button>
        ))}
    </div>
  );
}

/* ---------------- Documentos ---------------- */

function Docs({ leadId, docs, canEdit, names, locale, onChanged }: { leadId: string; docs: LeadDocument[]; canEdit: boolean; names: Record<string, string>; locale: Locale; onChanged: () => Promise<void> }) {
  const t = crmPlus.docs;
  const supabase = useMemo(() => createClient(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const download = async (d: LeadDocument) => {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(d.path, 60, { download: d.path.split("/").pop()?.replace(/^[0-9a-f-]{36}-/, "") });
    if (data?.signedUrl) window.location.assign(data.signedUrl);
  };
  return (
    <div className="grid gap-2">
      {canEdit && (
        <>
          <input ref={fileRef} type="file" className="hidden" onChange={async (event) => { const f = event.target.files?.[0]; event.target.value = ""; if (!f) return; setBusy(true); await uploadDoc(supabase, leadId, f); setBusy(false); await onChanged(); }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-dashed border-line-strong text-sm font-semibold text-heading hover:bg-[var(--meta-hover)] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
            {busy ? t.uploading : t.upload}
          </button>
        </>
      )}
      {docs.length === 0 && <p className="py-4 text-center text-sm text-muted">{t.empty}</p>}
      {docs.map((d) => (
        <div key={d.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
          <FileText className="h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-heading">{d.title}</p>
            <p className="text-xs text-muted">{formatBytes(d.size, locale)}{d.uploaded_by ? ` · ${names[d.uploaded_by] ?? ""}` : ""}</p>
          </div>
          <button type="button" onClick={() => download(d)} aria-label={t.download} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
            <Download className="h-4 w-4" aria-hidden />
          </button>
          {canEdit && (
            <button type="button" onClick={async () => { await supabase.from("lead_documents").delete().eq("id", d.id); await supabase.storage.from(BUCKET).remove([d.path]); await onChanged(); }} aria-label={t.delete} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-red-600">
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
