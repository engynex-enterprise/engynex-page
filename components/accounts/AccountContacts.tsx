"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Pencil, Phone, Plus, Star, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { accountDetailCopy } from "@/content/accountDetail";
import type { Locale } from "@/i18n/config";
import type { AccountContact } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Draft = { id?: string; name: string; role: string; email: string; phone: string };
const empty: Draft = { name: "", role: "", email: "", phone: "" };

/** Personas de la empresa: alta, edición, principal y baja. */
export function AccountContacts({ locale, accountId, contacts }: { locale: Locale; accountId: string; contacts: AccountContact[] }) {
  const t = accountDetailCopy[locale].contacts;
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  const save = async () => {
    if (!draft?.name.trim()) return;
    setBusy(true);
    const row = { name: draft.name.trim(), role: draft.role.trim() || null, email: draft.email.trim() || null, phone: draft.phone.trim() || null };
    const { error } = draft.id
      ? await supabase.from("account_contacts").update(row).eq("id", draft.id)
      : await supabase.from("account_contacts").insert({ ...row, profile_id: accountId, is_primary: contacts.length === 0 });
    setBusy(false);
    if (!error) {
      setDraft(null);
      router.refresh();
    }
  };
  const makePrimary = async (id: string) => {
    await supabase.from("account_contacts").update({ is_primary: false }).eq("profile_id", accountId).neq("id", id);
    await supabase.from("account_contacts").update({ is_primary: true }).eq("id", id);
    router.refresh();
  };
  const remove = async (id: string) => {
    if (!window.confirm(t.confirm)) return;
    await supabase.from("account_contacts").delete().eq("id", id);
    router.refresh();
  };

  const input =
    "h-9 w-full rounded-[10px] border border-line-strong bg-surface px-3 text-sm text-heading outline-none focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green";
  const icon = "grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading";

  return (
    <section className="rounded-xl border border-line bg-surface p-5 dark:bg-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[0.98rem] font-semibold text-heading">{t.title}</h3>
        {!draft && (
          <button type="button" onClick={() => setDraft(empty)} className="inline-flex h-8 items-center gap-1 rounded-[10px] px-2.5 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
            <Plus className="h-4 w-4" aria-hidden />
            {t.add}
          </button>
        )}
      </div>

      {contacts.length === 0 && !draft && <p className="text-sm text-muted">{t.empty}</p>}

      <ul className="grid gap-1">
        {[...contacts]
          .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.name.localeCompare(b.name))
          .map((c) =>
            draft?.id === c.id ? null : (
              <li key={c.id} className="group flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-[var(--meta-hover)]">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-heading">
                    <span className="truncate">{c.name}</span>
                    {c.is_primary && <span className="rounded-full bg-[var(--meta-active)] px-2 py-0.5 text-[0.7rem] font-medium">{t.primary}</span>}
                  </p>
                  {c.role && <p className="text-xs text-muted">{c.role}</p>}
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-heading hover:underline">
                        <Mail className="h-3 w-3" aria-hidden />
                        {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 text-heading hover:underline">
                        <Phone className="h-3 w-3" aria-hidden />
                        {c.phone}
                      </a>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  {!c.is_primary && (
                    <button type="button" onClick={() => makePrimary(c.id)} className={icon} aria-label={t.makePrimary} title={t.makePrimary}>
                      <Star className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDraft({ id: c.id, name: c.name, role: c.role ?? "", email: c.email ?? "", phone: c.phone ?? "" })}
                    className={icon}
                    aria-label={t.edit.replace("{name}", c.name)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => remove(c.id)} className={cn(icon, "hover:text-red-600")} aria-label={t.remove.replace("{name}", c.name)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ),
          )}
      </ul>

      {draft && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="mt-2 grid gap-2 rounded-lg bg-[var(--meta-active)]/40 p-3 sm:grid-cols-2"
        >
          {(["name", "role", "email", "phone"] as const).map((k) => (
            <label key={k} className="grid gap-1">
              <span className="text-xs text-muted">{t[k]}</span>
              <input
                type={k === "email" ? "email" : k === "phone" ? "tel" : "text"}
                value={draft[k]}
                required={k === "name"}
                onChange={(e) => setDraft((d) => (d ? { ...d, [k]: e.target.value } : d))}
                className={input}
              />
            </label>
          ))}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={busy || !draft.name.trim()} className="h-9 rounded-[10px] bg-brand-green px-4 text-sm font-semibold text-deep-700 hover:brightness-95 disabled:opacity-60">
              {t.save}
            </button>
            <button type="button" onClick={() => setDraft(null)} className="h-9 rounded-[10px] px-3 text-sm text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
              {t.cancel}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
