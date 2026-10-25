"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Check, CheckCircle2, Copy, FileText, Loader2, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { inputClass } from "@/components/auth/inputClass";
import { fmtDay, INVOICE_TONE, moneyCop } from "@/components/billing/format";
import { TestBadge } from "@/components/domains/OrderActions";
import { billingCopy } from "@/content/billing";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import type { ClientInvoice, InvoiceItem } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Draft = { id: string | null; concept: string; project_id: string; items: { description: string; quantity: string; unit_price: string }[]; tax_rate: string; due_date: string; notes: string };

const inDays = (n: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(new Date().getTime() + n * 86400_000));
const num = (s: string) => Number(s.replace(/[^\d.]/g, "")) || 0;

/** Pestaña «Facturas» de la cuenta: borradores, emisión, anulación y pagos manuales. */
export function AccountInvoices({
  locale,
  accountId,
  invoices,
  projects,
  canWrite,
}: {
  locale: Locale;
  accountId: string;
  invoices: ClientInvoice[];
  projects: { id: string; name: string }[];
  canWrite: boolean;
}) {
  const t = billingCopy[locale];
  const s = t.staff;
  const uid = useId();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [paying, setPaying] = useState<{ id: string; note: string } | null>(null);

  const startNew = () => {
    setErr(null);
    setDraft({ id: null, concept: "", project_id: "", items: [{ description: "", quantity: "1", unit_price: "" }], tax_rate: "19", due_date: inDays(15), notes: "" });
  };
  const startEdit = (i: ClientInvoice) => {
    setErr(null);
    setDraft({
      id: i.id,
      concept: i.concept,
      project_id: i.project_id ?? "",
      items: i.items.map((x) => ({ description: x.description, quantity: String(x.quantity), unit_price: String(x.unit_price) })),
      tax_rate: String(Number(i.tax_rate)),
      due_date: i.due_date ?? "",
      notes: i.notes ?? "",
    });
  };

  const items: InvoiceItem[] = (draft?.items ?? [])
    .filter((x) => x.description.trim() && num(x.unit_price) > 0)
    .map((x) => ({ description: x.description.trim(), quantity: num(x.quantity) || 1, unit_price: Math.round(num(x.unit_price)) }));
  const subtotal = items.reduce((n, x) => n + Math.round(x.quantity * x.unit_price), 0);
  const tax = Math.round((subtotal * num(draft?.tax_rate ?? "0")) / 100);

  const save = async (issue: boolean) => {
    if (!draft) return;
    if (draft.concept.trim().length < 2 || items.length === 0) return setErr(s.invalid);
    if (issue && !window.confirm(s.issueConfirm)) return;
    setBusy("save");
    setErr(null);
    const row = {
      concept: draft.concept.trim(),
      project_id: draft.project_id || null,
      items,
      tax_rate: Math.min(100, num(draft.tax_rate)),
      due_date: draft.due_date || null,
      notes: draft.notes.trim() || null,
      ...(issue ? { status: "issued" as const } : {}),
    };
    const db = createClient();
    const { error } = draft.id ? await db.from("client_invoices").update(row).eq("id", draft.id).eq("status", "draft") : await db.from("client_invoices").insert({ ...row, account_id: accountId });
    setBusy(null);
    if (error) return setErr(s.error);
    setDraft(null);
    router.refresh();
  };

  const act = async (i: ClientInvoice, kind: "issue" | "cancel" | "delete") => {
    if (!window.confirm(kind === "issue" ? s.issueConfirm : s.cancelConfirm)) return;
    setBusy(i.id);
    const db = createClient();
    const { error } =
      kind === "delete"
        ? await db.from("client_invoices").delete().eq("id", i.id).eq("status", "draft")
        : await db.from("client_invoices").update({ status: kind === "issue" ? "issued" : "cancelled" }).eq("id", i.id);
    setBusy(null);
    if (error) return setErr(s.error);
    router.refresh();
  };

  const markPaid = async () => {
    if (!paying) return;
    setBusy(paying.id);
    const paidAt = new Date().toISOString();
    const { error } = await createClient()
      .from("client_invoices")
      .update({ status: "paid", paid_at: paidAt, receipt: { manual: true, note: paying.note.trim() || null, paid_at: paidAt } })
      .eq("id", paying.id)
      .in("status", ["issued", "overdue"]);
    setBusy(null);
    if (error) return setErr(s.error);
    setPaying(null);
    router.refresh();
  };

  const copyLink = async (i: ClientInvoice) => {
    setBusy(i.id);
    const res = await fetch(`/api/invoices/${i.id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: "es" }) }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null;
    setBusy(null);
    if (!res?.ok || !body?.url) return setErr(body?.error === "payments_unavailable" ? t.unavailable : t.error);
    await navigator.clipboard.writeText(body.url).catch(() => null);
    setCopied(i.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const setItem = (n: number, k: keyof Draft["items"][number], v: string) =>
    setDraft((d) => (d ? { ...d, items: d.items.map((x, j) => (j === n ? { ...x, [k]: v } : x)) } : d));
  const small = "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50";
  const label = "mb-1.5 block text-sm font-medium text-heading";
  const input = cn(inputClass, "h-10 px-3 text-[0.92rem]");

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-heading">{s.title}</h2>
        {canWrite ? (
          !draft && (
            <button type="button" onClick={startNew} className={cn(buttonClasses("primary", "md"), "h-9 px-3.5")}>
              <Plus className="h-4 w-4" aria-hidden />
              {s.new}
            </button>
          )
        ) : (
          <p className="text-sm text-muted">{s.readOnly}</p>
        )}
      </div>

      {err && !draft && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {err}
        </p>
      )}

      {draft && (
        <section className="grid gap-4 rounded-xl border border-line bg-surface p-5 dark:bg-card">
          <h3 className="font-semibold text-heading">{draft.id ? s.edit : s.new}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-concept`} className={label}>{s.concept}</label>
              <input id={`${uid}-concept`} value={draft.concept} onChange={(e) => setDraft({ ...draft, concept: e.target.value })} maxLength={200} className={input} />
            </div>
            <Select
              size="md"
              label={s.project}
              value={draft.project_id}
              onChange={(v) => setDraft({ ...draft, project_id: v })}
              options={[{ value: "", label: s.noProject }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${uid}-tax`} className={label}>{s.taxRate}</label>
                <input id={`${uid}-tax`} inputMode="decimal" value={draft.tax_rate} onChange={(e) => setDraft({ ...draft, tax_rate: e.target.value })} className={input} />
              </div>
              <div>
                <label htmlFor={`${uid}-due`} className={label}>{s.dueDate}</label>
                <input id={`${uid}-due`} type="date" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} className={input} />
              </div>
            </div>
          </div>

          <fieldset className="grid gap-2">
            <legend className={label}>{s.items}</legend>
            {draft.items.map((x, n) => (
              <div key={n} className="grid grid-cols-[minmax(0,1fr)_4.5rem_8rem_2.25rem] items-center gap-2 max-sm:grid-cols-[minmax(0,1fr)_4rem_2.25rem]">
                <input aria-label={s.description} placeholder={s.description} value={x.description} onChange={(e) => setItem(n, "description", e.target.value)} className={cn(input, "max-sm:col-span-3")} />
                <input aria-label={s.qty} inputMode="decimal" value={x.quantity} onChange={(e) => setItem(n, "quantity", e.target.value)} className={cn(input, "text-right max-sm:order-2")} />
                <input aria-label={s.unit} placeholder={s.unit} inputMode="numeric" value={x.unit_price} onChange={(e) => setItem(n, "unit_price", e.target.value)} className={cn(input, "text-right max-sm:order-1")} />
                <button
                  type="button"
                  aria-label={s.remove}
                  disabled={draft.items.length === 1}
                  onClick={() => setDraft({ ...draft, items: draft.items.filter((_, j) => j !== n) })}
                  className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading disabled:opacity-30 max-sm:order-3"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setDraft({ ...draft, items: [...draft.items, { description: "", quantity: "1", unit_price: "" }] })} className={cn(small, "justify-self-start")}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {s.addItem}
            </button>
          </fieldset>

          <div>
            <label htmlFor={`${uid}-notes`} className={label}>{s.notes}</label>
            <textarea id={`${uid}-notes`} rows={2} maxLength={1000} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className={cn(inputClass, "h-auto py-2.5 text-[0.92rem]")} />
          </div>

          <dl className="ml-auto grid w-full max-w-xs gap-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted">{s.subtotal}</dt><dd className="tabular-nums text-heading">{moneyCop(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{s.tax}</dt><dd className="tabular-nums text-heading">{moneyCop(tax)}</dd></div>
            <div className="flex justify-between border-t border-line pt-1 font-semibold"><dt className="text-heading">{s.total}</dt><dd className="tabular-nums text-heading">{moneyCop(subtotal + tax)}</dd></div>
          </dl>

          {err && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{err}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setDraft(null)} className={cn(buttonClasses("dark", "md"), "h-9 px-3.5")}>{s.discard}</button>
            <button type="button" onClick={() => save(false)} disabled={busy === "save"} className={cn(buttonClasses("dark", "md"), "h-9 px-3.5 disabled:opacity-60")}>
              {busy === "save" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {s.saveDraft}
            </button>
            <button type="button" onClick={() => save(true)} disabled={busy === "save"} className={cn(buttonClasses("primary", "md"), "h-9 px-3.5 disabled:opacity-60")}>
              <Send className="h-4 w-4" aria-hidden />
              {s.issue}
            </button>
          </div>
        </section>
      )}

      {invoices.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line py-10 text-center text-sm text-muted">{s.empty}</p>
      ) : (
        <ul className="grid gap-2">
          {invoices.map((i) => (
            <li key={i.id} className="rounded-xl border border-line bg-surface p-4 dark:bg-card">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <div className="min-w-0 flex-1 basis-60">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-heading [overflow-wrap:anywhere]">#{i.number} · {i.concept}</span>
                    <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", INVOICE_TONE[i.status])}>{t.status[i.status]}</span>
                    {i.is_test && <TestBadge locale={locale} />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {i.issued_at ? `${t.cols.issued} ${fmtDay(locale, i.issued_at)}` : fmtDay(locale, i.created_at)}
                    {i.due_date && i.status !== "paid" && ` · ${t.cols.due} ${fmtDay(locale, i.due_date)}`}
                    {i.paid_at && ` · ${t.invoice.paidOn.replace("{date}", fmtDay(locale, i.paid_at))}`}
                  </p>
                </div>
                <p className="font-semibold tabular-nums text-heading">{moneyCop(i.total)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {i.status !== "draft" && (
                    <Link href={`/${locale}/portal/facturacion/${i.id}`} className={small}>
                      <FileText className="h-3.5 w-3.5" aria-hidden />
                      {s.open}
                    </Link>
                  )}
                  {canWrite && i.status === "draft" && (
                    <>
                      <button type="button" onClick={() => startEdit(i)} className={small}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        {s.edit}
                      </button>
                      <button type="button" onClick={() => act(i, "issue")} disabled={busy === i.id} className={small}>
                        <Send className="h-3.5 w-3.5" aria-hidden />
                        {s.issue}
                      </button>
                      <button type="button" onClick={() => act(i, "delete")} disabled={busy === i.id} className={small} aria-label={s.discard}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </>
                  )}
                  {canWrite && (i.status === "issued" || i.status === "overdue") && (
                    <>
                      <button type="button" onClick={() => copyLink(i)} disabled={busy === i.id} className={small}>
                        {copied === i.id ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
                        {copied === i.id ? s.copied : s.copyLink}
                      </button>
                      <button type="button" onClick={() => setPaying({ id: i.id, note: "" })} disabled={busy === i.id} className={small}>
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        {s.markPaid}
                      </button>
                      <button type="button" onClick={() => act(i, "cancel")} disabled={busy === i.id} className={small}>
                        <Ban className="h-3.5 w-3.5" aria-hidden />
                        {s.cancel}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {paying?.id === i.id && (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
                  <div className="min-w-0 flex-1 basis-60">
                    <label htmlFor={`${uid}-pay-${i.id}`} className={label}>{s.markPaidNote}</label>
                    <input id={`${uid}-pay-${i.id}`} value={paying.note} onChange={(e) => setPaying({ ...paying, note: e.target.value })} maxLength={200} className={input} />
                  </div>
                  <button type="button" onClick={() => setPaying(null)} className={cn(buttonClasses("dark", "md"), "h-10 px-3.5")}>{s.close}</button>
                  <button type="button" onClick={markPaid} disabled={busy === i.id} className={cn(buttonClasses("primary", "md"), "h-10 px-3.5 disabled:opacity-60")}>
                    {busy === i.id && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    {s.markPaidConfirm}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
