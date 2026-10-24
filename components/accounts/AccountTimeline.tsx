"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, CalendarDays, FileText, LifeBuoy, Loader2, Mail, MapPin, MessageSquareText, PhoneCall, Pin, PinOff, Trash2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { accountDetailCopy } from "@/content/accountDetail";
import { accountsProCopy } from "@/content/accountsPro";
import { ticketsCopy } from "@/content/tickets";
import type { Locale } from "@/i18n/config";
import { money } from "@/lib/accounts";
import type { AccountEvent, AccountNoteKind } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const NOTE_KINDS: AccountNoteKind[] = ["note", "call", "meeting", "email", "visit"];
const TYPES = ["note", "ticket", "document", "meeting", "email", "deal"] as const;

const noteIcon: Record<string, typeof MessageSquareText> = { note: MessageSquareText, call: PhoneCall, meeting: Users, email: Mail, visit: MapPin };
const typeIcon: Record<string, typeof MessageSquareText> = { ticket: LifeBuoy, document: FileText, meeting: CalendarDays, email: Mail, deal: Briefcase };

/**
 * Actividad de la cuenta: notas del equipo (llamadas, visitas…) y todo lo que
 * pasó en el portal, el CRM y el correo, filtrable por tipo.
 */
export function AccountTimeline({
  locale,
  accountId,
  events,
  names,
  meId,
  admin,
}: {
  locale: Locale;
  accountId: string;
  events: AccountEvent[];
  names: Record<string, string>;
  meId: string;
  admin: boolean;
}) {
  const t = accountDetailCopy[locale];
  const p = accountsProCopy[locale];
  const tk = ticketsCopy[locale];
  const router = useRouter();
  const [kind, setKind] = useState<AccountNoteKind>("note");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const supabase = createClient();
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));

  const add = async () => {
    if (!body.trim()) return;
    setBusy(true);
    const { error: e } = await supabase.from("account_notes").insert({ profile_id: accountId, kind, body: body.trim(), author_id: meId });
    setBusy(false);
    setError(!!e);
    if (!e) {
      setBody("");
      router.refresh();
    }
  };
  const pin = async (id: string, pinned: boolean) => {
    await supabase.from("account_notes").update({ pinned }).eq("id", Number(id));
    router.refresh();
  };
  const remove = async (id: string) => {
    if (!window.confirm(t.activity.confirm)) return;
    await supabase.from("account_notes").delete().eq("id", Number(id));
    router.refresh();
  };

  const counts = Object.fromEntries(TYPES.map((x) => [x, events.filter((e) => e.type === x).length]));
  const shown = filter === "all" ? events : events.filter((e) => e.type === filter);

  const describe = (e: AccountEvent) => {
    if (e.type === "ticket") return { label: `${t.activity.events.ticket} · ${tk.staffStatus[e.sub ?? ""] ?? e.sub}`, text: e.title };
    if (e.type === "document") return { label: `${t.activity.events.document} · ${tk.docs.kinds[e.sub ?? ""] ?? e.sub}`, text: e.title };
    if (e.type === "meeting") return { label: `${t.activity.events.meeting} · ${t.statuses[e.sub ?? ""] ?? e.sub}`, text: tk.home.channels[e.title ?? ""] ?? e.title };
    if (e.type === "email") return { label: t.activity.events.email, text: e.title };
    if (e.type === "deal") {
      const [title, value] = (e.title ?? "").split(/ · (?=\d+$)/);
      return { label: `${t.activity.events.deal} · ${e.sub}`, text: value ? `${title} · ${money(Number(value), locale)}` : title };
    }
    return { label: p.noteKinds[e.sub ?? "note"], text: e.title };
  };

  return (
    <div className="grid gap-5">
      <section className="rounded-xl border border-line bg-surface p-5 dark:bg-card">
        <div className="mb-3 flex flex-wrap gap-1" role="radiogroup" aria-label={t.activity.types.note}>
          {NOTE_KINDS.map((k) => {
            const Icon = noteIcon[k];
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm",
                  kind === k ? "bg-deep-700 font-medium text-white dark:bg-brand-green dark:text-deep-700" : "text-muted ring-1 ring-line hover:text-heading",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {p.noteKinds[k]}
              </button>
            );
          })}
        </div>
        <label className="sr-only" htmlFor="account-note">{t.activity.placeholder}</label>
        <textarea
          id="account-note"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void add();
          }}
          rows={3}
          maxLength={4000}
          placeholder={t.activity.placeholder}
          className="w-full resize-y rounded-[10px] border border-line-strong bg-surface px-3 py-2 text-sm leading-relaxed text-heading outline-none focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green"
        />
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={add} disabled={busy || !body.trim()} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-brand-green px-4 text-sm font-semibold text-deep-700 hover:brightness-95 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t.activity.add}
          </button>
          <span className="text-xs text-muted">Ctrl/⌘ + Enter</span>
          {error && <span role="alert" className="text-sm text-red-600 dark:text-red-400">{t.activity.error}</span>}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5 dark:bg-card">
        <div className="mb-4 flex flex-wrap gap-1.5">
          {(["all", ...TYPES] as const)
            .filter((x) => x === "all" || counts[x] > 0)
            .map((x) => (
              <button
                key={x}
                type="button"
                aria-pressed={filter === x}
                onClick={() => setFilter(x)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm",
                  filter === x ? "bg-[var(--meta-active)] font-semibold text-heading" : "text-muted hover:bg-[var(--meta-hover)] hover:text-heading",
                )}
              >
                {x === "all" ? t.activity.all : t.activity.types[x]}
                <span className="tabular-nums text-xs text-muted">{x === "all" ? events.length : counts[x]}</span>
              </button>
            ))}
        </div>

        {shown.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{t.activity.empty}</p>
        ) : (
          <ol className="relative grid gap-0">
            {shown.map((e) => {
              const Icon = e.type === "note" ? noteIcon[e.sub ?? "note"] ?? MessageSquareText : typeIcon[e.type];
              const d = describe(e);
              const mine = e.type === "note" && (e.actor === meId || admin);
              return (
                <li key={`${e.type}-${e.id}`} className="group relative flex gap-3 pb-5 last:pb-0">
                  <span className="absolute bottom-0 left-4 top-9 w-px bg-line group-last:hidden" aria-hidden />
                  <span className={cn("relative grid h-8 w-8 shrink-0 place-items-center rounded-full", e.type === "note" ? "bg-[var(--meta-active)] text-heading" : "bg-card-soft text-muted dark:bg-white/[0.06]")}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                      <span className="font-medium text-heading">{d.label}</span>
                      <span>{fmt(e.at)}</span>
                      {e.actor && names[e.actor] && <span>{t.activity.by.replace("{name}", names[e.actor])}</span>}
                      {e.pinned && (
                        <span className="inline-flex items-center gap-0.5 text-accent">
                          <Pin className="h-3 w-3" aria-hidden />
                        </span>
                      )}
                    </p>
                    {e.type === "ticket" && e.ref ? (
                      <Link href={`/${locale}/portal/soporte/${e.ref}`} className="mt-0.5 block truncate text-sm font-medium text-heading hover:underline">
                        {d.text}
                      </Link>
                    ) : (
                      <p className={cn("mt-0.5 text-sm text-heading", e.type === "note" ? "whitespace-pre-wrap leading-relaxed" : "truncate")}>{d.text}</p>
                    )}
                  </div>
                  {mine && (
                    <div className="flex shrink-0 items-start opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => pin(e.id, !e.pinned)}
                        aria-label={e.pinned ? t.activity.unpin : t.activity.pin}
                        title={e.pinned ? t.activity.unpin : t.activity.pin}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading"
                      >
                        {e.pinned ? <PinOff className="h-4 w-4" aria-hidden /> : <Pin className="h-4 w-4" aria-hidden />}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(e.id)}
                        aria-label={t.activity.remove}
                        title={t.activity.remove}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
