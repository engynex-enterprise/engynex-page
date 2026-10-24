"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Check, CheckCircle2, Copy, Download, ExternalLink, Loader2, Mail, MessageCircle, Phone, UserX, Video, X, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AppointmentKind, MeetingChannel } from "@/lib/supabase/types";
import { agendaProCopy } from "@/content/agendaPro";
import { agendaWorkspaceCopy } from "@/content/agendaWorkspace";
import { Select } from "@/components/ui/Select";
import { buttonClasses } from "@/components/ui/Button";
import { tierStyles } from "@/lib/tiers";
import { SlotPicker } from "./pickers";
import { TZ, channelIcon, kindDot, statusTone, type AgendaRow } from "./shared";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const KINDS: AppointmentKind[] = ["discovery", "demo", "proposal", "followup", "support", "other"];
const CHANNELS: MeetingChannel[] = ["meet", "call", "whatsapp", "in_person"];
const label = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-muted";
const field =
  "w-full rounded-[10px] bg-[#f4f4f5] px-3 text-sm text-heading outline-none ring-1 ring-transparent placeholder:text-muted focus:bg-surface focus:ring-line-strong dark:bg-white/[0.06]";
const softBtn = "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]";

/** Fecha en formato de calendarios (20261026T130000Z). */
const calStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/**
 * Panel de una reunión: datos editables, accesos (unirse, Google Calendar,
 * .ics, contactar) y acciones: reprogramar, cancelar avisando al cliente y
 * cerrar la reunión con su resultado y una tarea de seguimiento.
 */
export function AppointmentDrawer({
  locale,
  item: a,
  employees,
  now,
  initialClose,
  onClose,
  onChanged,
}: {
  locale: Locale;
  item: AgendaRow;
  employees: { id: string; name: string }[];
  now: number;
  /** Abrir directamente en "cerrar reunión" con ese resultado. */
  initialClose?: "done" | "no_show";
  onClose: () => void;
  onChanged: (message: string, patch?: Partial<AgendaRow>) => void;
}) {
  const t = agendaWorkspaceCopy[locale];
  const d = t.drawer;
  const p = agendaProCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"view" | "reschedule" | "cancel" | "close">(
    initialClose || (a.status === "scheduled" && Date.parse(a.ends_at) < now) ? "close" : "view",
  );
  const [form, setForm] = useState({ meeting_url: a.meeting_url ?? "", location: a.location ?? "", notes: a.notes ?? "" });
  const [when, setWhen] = useState<string | null>(null);
  const [notify, setNotify] = useState(true);
  const [reason, setReason] = useState("");
  const [outcome, setOutcome] = useState(a.outcome ?? "");
  const [closeAs, setCloseAs] = useState<"done" | "no_show">(initialClose ?? "done");
  const [followup, setFollowup] = useState("3");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !(event.target as HTMLElement).closest("textarea, input")) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fail = (message: string) => setError(t.errors[message] ?? t.errors.generic.replace("{detail}", message));
  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>, done: string, patch?: Partial<AgendaRow>) => {
    setBusy(true);
    setError(null);
    const { error: e } = await fn();
    setBusy(false);
    if (e) return fail(e.message);
    onChanged(done, patch);
  };
  /** Cambios simples de la reunión (canal, tipo, anfitrión, enlace, lugar, notas). */
  const save = (patch: Partial<Omit<AgendaRow, "lead" | "id" | "lead_id" | "created_at">>) =>
    void run(() => supabase.from("appointments").update(patch).eq("id", a.id), d.saved, patch);

  const upcoming = a.status === "scheduled" && Date.parse(a.ends_at) >= now;
  const minutes = Math.round((Date.parse(a.ends_at) - Date.parse(a.starts_at)) / 60000);
  const whenText = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date(a.starts_at));
  const endText = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date(a.ends_at));
  const Icon = channelIcon[a.channel];
  const lead = a.lead;
  const digits = (lead?.phone ?? "").replace(/\D/g, "");
  const wa = digits.length === 10 ? `57${digits}` : digits;
  const title = `${p.kinds[a.kind]} · ${lead?.name ?? "Engynex"}`;
  const details = [a.meeting_url, a.location, a.notes].filter(Boolean).join("\n");
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${calStamp(a.starts_at)}/${calStamp(a.ends_at)}&details=${encodeURIComponent(details)}${a.location ? `&location=${encodeURIComponent(a.location)}` : ""}`;

  const downloadIcs = () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Engynex//Agenda//ES",
      "BEGIN:VEVENT",
      `UID:${a.id}@engynex.com`,
      `DTSTAMP:${calStamp(new Date(now).toISOString())}`,
      `DTSTART:${calStamp(a.starts_at)}`,
      `DTEND:${calStamp(a.ends_at)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${details.replace(/\n/g, "\\n")}`,
      ...(a.location ? [`LOCATION:${a.location}`] : []),
      ...(a.meeting_url ? [`URL:${a.meeting_url}`] : []),
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `reunion-${(lead?.name ?? "engynex").replace(/\s+/g, "-").toLowerCase()}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label={title}
        className="fixed inset-y-3 right-3 z-50 flex w-[min(32rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_24px_64px_-12px_rgba(16,24,40,0.35),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card"
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", kindDot[a.kind])} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">{p.kinds[a.kind]}</p>
            <h2 className="text-lg font-semibold first-letter:uppercase text-heading">{whenText}</h2>
            <p className="text-sm text-muted">
              {endText} · {t.minutes.replace("{n}", String(minutes))}
              {a.reschedule_count > 0 && ` · ${t.rescheduled.replace("{n}", String(a.reschedule_count))}`}
            </p>
          </div>
          <span className={cn("mt-1 rounded-md px-2 py-0.5 text-xs font-semibold no-underline", statusTone[a.status].replace("line-through", ""))}>{p.statuses[a.status]}</span>
          <button type="button" onClick={onClose} aria-label={d.close} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Accesos */}
          <div className="flex flex-wrap gap-2 border-b border-line px-5 py-4">
            {a.meeting_url && upcoming && (
              <a href={a.meeting_url} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "md", "h-9 px-4")}>
                <Video className="h-4 w-4" aria-hidden />
                {t.join}
              </a>
            )}
            {a.meeting_url && (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(a.meeting_url!);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
                className={softBtn}
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied ? d.copied : d.copy}
              </button>
            )}
            <a href={google} target="_blank" rel="noopener noreferrer" className={softBtn}>
              <CalendarPlus className="h-4 w-4" aria-hidden />
              {d.google}
            </a>
            <button type="button" onClick={downloadIcs} className={softBtn}>
              <Download className="h-4 w-4" aria-hidden />
              {d.ics}
            </button>
          </div>

          {/* Cliente */}
          {lead && (
            <section className="border-b border-line px-5 py-4">
              <span className={label}>{d.lead}</span>
              <div className="flex items-center gap-3">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", tierStyles[lead.tier].dot)} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-heading">{lead.name}</p>
                  <p className="truncate text-xs text-muted">{[lead.company, lead.email, lead.phone].filter(Boolean).join(" · ")}</p>
                </div>
                <Link href={`/${locale}/portal/crm/${lead.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                  {d.openLead}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
              <div className="mt-3 flex gap-2">
                <a href={`tel:${lead.phone}`} className={softBtn} aria-label={lead.phone}>
                  <Phone className="h-4 w-4" aria-hidden />
                </a>
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className={softBtn} aria-label="WhatsApp">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                </a>
                <a href={`mailto:${lead.email}`} className={softBtn} aria-label={lead.email}>
                  <Mail className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </section>
          )}

          {/* Acción en curso */}
          {mode === "reschedule" && (
            <section className="grid gap-3 border-b border-line bg-[#fafafa] px-5 py-4 dark:bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-heading">{d.rescheduleTitle}</h3>
              <SlotPicker locale={locale} value={when} onChange={setWhen} duration={minutes} labels={{ day: d.day, noSlots: d.noSlots, otherTime: d.otherTime }} />
              <label className="flex items-center gap-2 text-sm text-body">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-brand-green-dark" />
                {d.notify}
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setMode("view")} className={softBtn}>{d.keep}</button>
                <button
                  type="button"
                  disabled={busy || !when}
                  onClick={() => run(() => supabase.rpc("staff_reschedule", { p_id: a.id, p_start: when!, p_notify: notify }), d.saved)}
                  className={buttonClasses("primary", "md", "h-9 px-4 disabled:opacity-50")}
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {d.reschedule}
                </button>
              </div>
            </section>
          )}
          {mode === "cancel" && (
            <section className="grid gap-3 border-b border-line bg-red-50/50 px-5 py-4 dark:bg-red-500/5">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={500} placeholder={d.cancelReason} aria-label={d.cancelReason} className={cn(field, "resize-none py-2.5")} />
              <label className="flex items-center gap-2 text-sm text-body">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-brand-green-dark" />
                {d.notify}
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setMode("view")} className={softBtn}>{d.keep}</button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => supabase.rpc("staff_cancel", { p_id: a.id, p_reason: reason || null, p_notify: notify }), p.statuses.cancelled)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {d.confirmCancel}
                </button>
              </div>
            </section>
          )}
          {mode === "close" && (
            <section className="grid gap-3 border-b border-line bg-[var(--meta-active)]/40 px-5 py-4">
              <h3 className="text-sm font-semibold text-heading">{d.closeTitle}</h3>
              <div className="flex gap-1 rounded-[10px] bg-surface p-1 ring-1 ring-line dark:bg-card">
                {(["done", "no_show"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={closeAs === k}
                    onClick={() => setCloseAs(k)}
                    className={cn("inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm", closeAs === k ? "bg-[var(--meta-hover)] font-semibold text-heading" : "text-muted")}
                  >
                    {k === "done" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden /> : <UserX className="h-4 w-4 text-amber-600" aria-hidden />}
                    {k === "done" ? t.markDone : t.markNoShow}
                  </button>
                ))}
              </div>
              <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={3} maxLength={2000} placeholder={d.outcomePlaceholder} aria-label={d.outcome} className={cn(field, "resize-none py-2.5")} />
              <Select
                size="md"
                label={d.followup}
                value={followup}
                onChange={setFollowup}
                options={Object.entries(d.followups).map(([value, text]) => ({ value, label: text }))}
              />
              <div className="flex justify-end gap-2">
                {upcoming && <button type="button" onClick={() => setMode("view")} className={softBtn}>{d.keep}</button>}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        supabase.rpc("appointment_close", {
                          p_id: a.id,
                          p_status: closeAs,
                          p_outcome: outcome || null,
                          p_followup_days: followup === "none" ? null : Number(followup),
                        }),
                      p.statuses[closeAs],
                    )
                  }
                  className={buttonClasses("primary", "md", "h-9 px-4 disabled:opacity-50")}
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {d.save}
                </button>
              </div>
            </section>
          )}

          {/* Datos */}
          <section className="grid gap-4 px-5 py-5">
            {a.outcome && a.status !== "scheduled" && (
              <div>
                <span className={label}>{d.outcomeLabel}</span>
                <p className="whitespace-pre-line rounded-xl bg-[var(--meta-active)]/50 px-3.5 py-2.5 text-sm text-heading">{a.outcome}</p>
              </div>
            )}
            {a.cancel_reason && a.status === "cancelled" && (
              <div>
                <span className={label}>{d.cancelReasonLabel}</span>
                <p className="text-sm text-heading">{a.cancel_reason}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Select size="md" label={d.kind} value={a.kind} onChange={(v) => save({ kind: v as AppointmentKind })} options={KINDS.map((k) => ({ value: k, label: p.kinds[k] }))} />
              <Select size="md" label={d.channel} value={a.channel} onChange={(v) => save({ channel: v as MeetingChannel })} options={CHANNELS.map((k) => ({ value: k, label: p.channels[k] }))} />
              <div className="col-span-2">
                <Select
                  size="md"
                  label={d.host}
                  value={a.host_id ?? ""}
                  onChange={(v) => save({ host_id: v || null })}
                  options={[{ value: "", label: "—" }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
                />
              </div>
            </div>
            <div>
              <span className={cn(label, "flex items-center gap-1.5")}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {a.channel === "in_person" ? d.location : d.link}
              </span>
              {a.channel === "in_person" ? (
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} onBlur={() => form.location !== (a.location ?? "") && save({ location: form.location || null })} placeholder={d.locationPlaceholder} maxLength={300} className={cn(field, "h-10")} />
              ) : (
                <input type="url" value={form.meeting_url} onChange={(e) => setForm((f) => ({ ...f, meeting_url: e.target.value }))} onBlur={() => form.meeting_url !== (a.meeting_url ?? "") && save({ meeting_url: form.meeting_url || null })} placeholder={d.linkPlaceholder} maxLength={500} className={cn(field, "h-10")} />
              )}
            </div>
            <div>
              <span className={label}>{d.notes}</span>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} onBlur={() => form.notes !== (a.notes ?? "") && save({ notes: form.notes || null })} rows={3} maxLength={1000} placeholder={d.notesPlaceholder} className={cn(field, "resize-none py-2.5")} />
            </div>
            {error && (
              <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </section>
        </div>

        {/* Acciones */}
        {a.status === "scheduled" && mode === "view" && (
          <div className="flex flex-wrap gap-2 border-t border-line px-5 py-3">
            {upcoming && (
              <button type="button" onClick={() => setMode("reschedule")} className={softBtn}>
                <CalendarPlus className="h-4 w-4" aria-hidden />
                {d.reschedule}
              </button>
            )}
            <button type="button" onClick={() => setMode("close")} className={softBtn}>
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {t.markDone}
            </button>
            <button type="button" onClick={() => setMode("cancel")} className={cn(softBtn, "ml-auto text-red-600 dark:text-red-400")}>
              <XCircle className="h-4 w-4" aria-hidden />
              {d.cancel}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
