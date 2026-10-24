"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { accountDetailCopy } from "@/content/accountDetail";
import type { Locale } from "@/i18n/config";
import { money } from "@/lib/accounts";
import type { AccountDetails } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Form = {
  plan: string;
  services: string;
  monthly_value: string;
  contract_start: string;
  renewal_date: string;
  tax_id: string;
  website: string;
  address: string;
  city: string;
  industry: string;
  tags: string;
  notes: string;
};

const toForm = (d: AccountDetails): Form => ({
  plan: d.plan ?? "",
  services: d.services.join(", "),
  monthly_value: d.monthly_value ? String(d.monthly_value) : "",
  contract_start: d.contract_start ?? "",
  renewal_date: d.renewal_date ?? "",
  tax_id: d.tax_id ?? "",
  website: d.website ?? "",
  address: d.address ?? "",
  city: d.city ?? "",
  industry: d.industry ?? "",
  tags: d.tags.join(", "),
  notes: d.notes ?? "",
});

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const orNull = (s: string) => s.trim() || null;

/** Ficha comercial: se ve como lista y se edita en el mismo lugar. */
export function AccountProfileCard({ locale, details }: { locale: Locale; details: AccountDetails }) {
  const t = accountDetailCopy[locale].profile;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form>(() => toForm(details));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const fmtDate = (d: string | null) =>
    d ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`)) : t.empty;

  const save = async () => {
    setState("saving");
    const { error } = await createClient()
      .from("account_details")
      .update({
        plan: orNull(form.plan),
        services: list(form.services),
        monthly_value: Math.max(0, Math.round(Number(form.monthly_value.replace(/[^\d]/g, "")) || 0)),
        contract_start: orNull(form.contract_start),
        renewal_date: orNull(form.renewal_date),
        tax_id: orNull(form.tax_id),
        website: orNull(form.website),
        address: orNull(form.address),
        city: orNull(form.city),
        industry: orNull(form.industry),
        tags: list(form.tags),
        notes: orNull(form.notes),
      })
      .eq("profile_id", details.profile_id);
    if (error) return setState("error");
    setState("saved");
    setEditing(false);
    router.refresh();
  };

  const input =
    "h-10 w-full rounded-[10px] border border-line-strong bg-surface px-3 text-sm text-heading outline-none focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green";
  const field = (key: keyof Form, label: string, opts: { type?: string; hint?: string; wide?: boolean } = {}) => (
    <label key={key} className={cn("grid gap-1", opts.wide && "sm:col-span-2")}>
      <span className="text-xs font-medium text-muted">
        {label}
        {opts.hint && <span className="font-normal"> · {opts.hint}</span>}
      </span>
      {key === "notes" ? (
        <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={4} maxLength={4000} className={cn(input, "h-auto resize-y py-2 leading-relaxed")} />
      ) : (
        <input
          type={opts.type ?? "text"}
          inputMode={key === "monthly_value" ? "numeric" : undefined}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className={input}
        />
      )}
    </label>
  );

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: t.plan, value: details.plan ?? t.empty },
    { label: t.monthly, value: details.monthly_value ? money(details.monthly_value, locale) : t.empty },
    { label: t.contractStart, value: fmtDate(details.contract_start) },
    { label: t.renewal, value: fmtDate(details.renewal_date) },
    { label: t.taxId, value: details.tax_id ?? t.empty },
    {
      label: t.website,
      value: details.website ? (
        <a href={/^https?:\/\//.test(details.website) ? details.website : `https://${details.website}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          {details.website.replace(/^https?:\/\//, "")}
        </a>
      ) : (
        t.empty
      ),
    },
    { label: t.address, value: [details.address, details.city].filter(Boolean).join(", ") || t.empty },
    { label: t.industry, value: details.industry ?? t.empty },
  ];

  return (
    <section className="rounded-xl border border-line bg-surface p-5 dark:bg-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[0.98rem] font-semibold text-heading">{t.title}</h3>
        {!editing ? (
          <div className="flex items-center gap-3">
            {state === "saved" && (
              <span role="status" className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" aria-hidden />
                {t.saved}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setForm(toForm(details));
                setState("idle");
                setEditing(true);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {t.edit}
            </button>
          </div>
        ) : null}
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          {field("plan", t.plan)}
          {field("monthly_value", t.monthly)}
          {field("contract_start", t.contractStart, { type: "date" })}
          {field("renewal_date", t.renewal, { type: "date" })}
          {field("tax_id", t.taxId)}
          {field("website", t.website)}
          {field("address", t.address)}
          {field("city", t.city)}
          {field("industry", t.industry)}
          {field("services", t.services, { hint: t.servicesHint })}
          {field("tags", t.tags, { hint: t.tagsHint, wide: true })}
          {field("notes", t.notes, { wide: true })}
          <div className="flex items-center gap-2 sm:col-span-2">
            <button type="submit" disabled={state === "saving"} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-brand-green px-4 text-sm font-semibold text-deep-700 hover:brightness-95 disabled:opacity-60">
              {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t.save}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="h-9 rounded-[10px] px-3 text-sm text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
              {t.cancel}
            </button>
            {state === "error" && <span role="alert" className="text-sm text-red-600 dark:text-red-400">{t.error}</span>}
          </div>
        </form>
      ) : (
        <>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.label} className="min-w-0">
                <dt className="text-xs text-muted">{r.label}</dt>
                <dd className="truncate text-heading">{r.value}</dd>
              </div>
            ))}
          </dl>
          {(details.services.length > 0 || details.tags.length > 0) && (
            <div className="mt-4 grid gap-3 border-t border-line pt-4 text-sm">
              {details.services.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-muted">{t.services}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {details.services.map((s) => (
                      <span key={s} className="rounded-full bg-[var(--meta-active)] px-2.5 py-0.5 text-xs font-medium text-heading">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {details.tags.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-muted">{t.tags}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {details.tags.map((s) => (
                      <span key={s} className="rounded-full px-2.5 py-0.5 text-xs text-heading ring-1 ring-line">#{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {details.notes && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-1 text-xs text-muted">{t.notes}</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">{details.notes}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
