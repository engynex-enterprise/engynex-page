"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Search, Trash2, X, Zap } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import type { TicketMacro, TicketStatus } from "@/lib/supabase/types";
import { ticketsCopy } from "@/content/tickets";
import { supportMacrosCopy } from "@/content/supportMacros";
import { ticketStatuses, ticketStatusTone } from "@/lib/tickets";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const VARS = ["nombre", "numero", "asunto"] as const;

type Draft = { id?: string; title: string; body: string; set_status: TicketStatus | "" };

/** Crear, editar y eliminar respuestas rápidas del equipo de soporte. */
export function MacrosManager({ locale, initial }: { locale: Locale; initial: TicketMacro[] }) {
  const t = supportMacrosCopy[locale];
  const tk = ticketsCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [macros, setMacros] = useState(initial);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const term = q.trim().toLowerCase();
  const rows = macros.filter((m) => !term || `${m.title} ${m.body}`.toLowerCase().includes(term));
  const sample = (body: string) => VARS.reduce((s, v) => s.replaceAll(`{${v}}`, t.sample[v]), body);

  const remove = async (m: TicketMacro) => {
    if (!window.confirm(t.confirmDelete.replace("{title}", m.title))) return;
    const { error } = await supabase.from("ticket_macros").delete().eq("id", m.id);
    if (!error) {
      setMacros((list) => list.filter((x) => x.id !== m.id));
      router.refresh();
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted">{t.subtitle}</p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search}
              aria-label={t.search}
              className="h-9 w-52 rounded-[10px] bg-transparent pl-9 pr-3 text-sm text-heading outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand-green-dark"
            />
          </div>
          <button
            type="button"
            onClick={() => setDraft({ title: "", body: "", set_status: "" })}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-deep-700 px-3.5 text-sm font-semibold text-white hover:bg-deep-600 dark:bg-brand-green dark:text-deep-950"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t.new}
          </button>
        </div>
      </div>

      {macros.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line py-12 text-center text-sm text-muted">{t.empty}</p>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">{t.noResults}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((m) => (
            <li key={m.id} className="flex flex-col rounded-xl border border-line bg-surface p-5 dark:bg-card">
              <div className="flex items-start gap-2">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <h2 className="min-w-0 flex-1 text-[0.98rem] font-semibold text-heading">{m.title}</h2>
                <button
                  type="button"
                  onClick={() => setDraft({ id: m.id, title: m.title, body: m.body, set_status: m.set_status ?? "" })}
                  aria-label={`${t.edit}: ${m.title}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => void remove(m)}
                  aria-label={`${t.delete}: ${m.title}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-body">{m.body}</p>
              {m.set_status && (
                <span className={cn("mt-3 self-start rounded-full px-2.5 py-0.5 text-xs font-semibold", ticketStatusTone[m.set_status])}>
                  {t.setsStatus.replace("{status}", tk.staffStatus[m.set_status])}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <MacroDialog
          locale={locale}
          draft={draft}
          sample={sample}
          onClose={() => setDraft(null)}
          onSaved={(m) => {
            setMacros((list) => {
              const next = list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [...list, m];
              return next.sort((a, b) => a.title.localeCompare(b.title));
            });
            setDraft(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function MacroDialog({
  locale,
  draft,
  sample,
  onClose,
  onSaved,
}: {
  locale: Locale;
  draft: Draft;
  sample: (body: string) => string;
  onClose: () => void;
  onSaved: (m: TicketMacro) => void;
}) {
  const t = supportMacrosCopy[locale];
  const tk = ticketsCopy[locale];
  const supabase = useMemo(() => createClient(), []);
  const [d, setD] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const body = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();

  const insert = (v: string) => {
    const el = body.current;
    const token = `{${v}}`;
    if (!el) return setD((x) => ({ ...x, body: x.body + token }));
    const start = el.selectionStart ?? d.body.length;
    const end = el.selectionEnd ?? start;
    const next = d.body.slice(0, start) + token + d.body.slice(end);
    setD((x) => ({ ...x, body: next }));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const save = async () => {
    if (!d.title.trim() || !d.body.trim()) return setError(t.form.required);
    setBusy(true);
    const row = { title: d.title.trim().slice(0, 80), body: d.body.trim().slice(0, 5000), set_status: d.set_status || null };
    const res = d.id
      ? await supabase.from("ticket_macros").update(row).eq("id", d.id).select("*").single()
      : await supabase.from("ticket_macros").insert(row).select("*").single();
    setBusy(false);
    if (res.error || !res.data) return setError(t.form.error);
    onSaved(res.data as TicketMacro);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4" onMouseDown={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="grid max-h-[calc(100vh-2rem)] w-full max-w-2xl gap-4 overflow-y-auto rounded-2xl bg-surface p-5 shadow-2xl dark:bg-card"
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-base font-semibold text-heading">
            {d.id ? t.form.editTitle : t.form.newTitle}
          </h2>
          <button type="button" onClick={onClose} aria-label={t.form.cancel} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--meta-hover)]">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <label className="grid gap-1.5 text-sm">
          <span className="text-muted">{t.form.title}</span>
          <input
            autoFocus
            value={d.title}
            maxLength={80}
            onChange={(e) => setD({ ...d, title: e.target.value })}
            placeholder={t.form.titlePlaceholder}
            className="h-10 rounded-[10px] bg-transparent px-3 text-heading outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand-green-dark"
          />
        </label>
        <div className="grid gap-1.5 text-sm">
          <label htmlFor={`${titleId}-body`} className="text-muted">
            {t.form.body}
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted">{t.form.vars}:</span>
            {VARS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insert(v)}
                title={t.vars[v]}
                className="rounded-md bg-[var(--meta-active)] px-2 py-0.5 font-mono text-xs text-heading hover:brightness-95"
              >
                {`{${v}}`}
              </button>
            ))}
          </div>
          <textarea
            id={`${titleId}-body`}
            ref={body}
            value={d.body}
            maxLength={5000}
            rows={7}
            onChange={(e) => setD({ ...d, body: e.target.value })}
            placeholder={t.form.bodyPlaceholder}
            className="resize-y rounded-[10px] bg-transparent px-3 py-2.5 leading-relaxed text-heading outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand-green-dark"
          />
          <span className="text-right text-xs text-muted">{t.chars.replace("{n}", String(d.body.length))}</span>
        </div>
        <Select
          size="md"
          label={t.form.setStatus}
          value={d.set_status}
          onChange={(v) => setD({ ...d, set_status: v as TicketStatus | "" })}
          options={[{ value: "", label: t.form.keep }, ...ticketStatuses.map((s) => ({ value: s, label: tk.staffStatus[s] }))]}
        />
        {d.body.trim() && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-muted">{t.form.preview}</p>
            <p className="whitespace-pre-wrap rounded-xl bg-[var(--meta-active)]/50 px-4 py-3 text-sm leading-relaxed text-heading">{sample(d.body)}</p>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-[10px] px-4 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
            {t.form.cancel}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-deep-700 px-4 text-sm font-semibold text-white hover:bg-deep-600 disabled:opacity-50 dark:bg-brand-green dark:text-deep-950"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t.form.save}
          </button>
        </div>
      </form>
    </div>
  );
}
