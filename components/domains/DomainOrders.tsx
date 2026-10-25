"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OrderActions, TestBadge } from "@/components/domains/OrderActions";
import { domainOrdersCopy } from "@/content/domainOrders";
import type { Locale } from "@/i18n/config";
import type { DomainOrder, DomainOrderStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const TONE: Record<DomainOrderStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  manual: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  paid: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  registering: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  registered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  declined: "bg-surface-soft text-muted dark:bg-white/[0.06]",
  cancelled: "bg-surface-soft text-muted dark:bg-white/[0.06]",
};

/** Pedidos de dominio: filtros, búsqueda y acciones (registrar, marcar, cancelar). */
export function DomainOrders({ locale, orders, admin }: { locale: Locale; orders: DomainOrder[]; admin: boolean }) {
  const t = domainOrdersCopy[locale];
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"open" | "done" | "all">("open");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const money = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
  const fmt = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));

  const open = (o: DomainOrder) => ["pending_payment", "manual", "paid", "registering", "failed"].includes(o.status);
  const list = orders
    .filter((o) => (tab === "all" ? true : tab === "open" ? open(o) : !open(o)))
    .filter((o) => !q.trim() || [o.domain, o.name, o.email, o.reference].some((v) => v.toLowerCase().includes(q.trim().toLowerCase())));

  const register = async (o: DomainOrder) => {
    setBusy(o.id);
    setMsg(null);
    const res = await fetch("/api/domains/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: o.id }) });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(null);
    setMsg(res.ok ? t.registered : `${t.registerFailed}: ${body.error ?? res.status}`);
    router.refresh();
  };
  const setStatus = async (o: DomainOrder, status: DomainOrderStatus) => {
    setBusy(o.id);
    await createClient()
      .from("domain_orders")
      .update(status === "registered" ? { status, registered_at: new Date().toISOString() } : status === "paid" ? { status, paid_at: new Date().toISOString() } : { status })
      .eq("id", o.id);
    setBusy(null);
    router.refresh();
  };

  const kpis = [
    { key: "open", value: orders.filter(open).length },
    { key: "registered", value: orders.filter((o) => o.status === "registered").length },
    { key: "revenue", value: money(orders.filter((o) => o.paid_at && !o.is_test).reduce((n, o) => n + o.price_cop, 0)) },
    { key: "attention", value: orders.filter((o) => o.status === "failed" || o.status === "manual" || o.status === "paid").length, alert: true },
  ] as const;

  return (
    <div>
      <div className="grid border-b border-line sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.key} className="border-b border-line px-6 py-4 sm:border-r lg:border-b-0 lg:[&:nth-child(4n)]:border-r-0">
            <p className="text-sm text-muted">{t.kpis[k.key]}</p>
            <p className={cn("mt-1 text-[1.6rem] font-semibold leading-none tabular-nums", "alert" in k && k.value ? "text-red-600 dark:text-red-400" : "text-heading")}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 border-b border-line px-4 sm:px-6">
        <nav className="-mb-px flex gap-1" aria-label={t.title}>
          {(["open", "done", "all"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={tab === k}
              onClick={() => setTab(k)}
              className={cn("border-b-2 px-3 py-3.5 text-[0.94rem]", tab === k ? "border-brand-green-dark font-semibold text-heading dark:border-brand-green" : "border-transparent text-muted hover:text-heading")}
            >
              {t.tabs[k]}
            </button>
          ))}
        </nav>
        <div className="relative my-2 ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="domain-order-search" className="sr-only">{t.search}</label>
          <input id="domain-order-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className="h-9 w-64 rounded-[10px] bg-transparent pl-9 pr-3 text-sm text-heading outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand-green-dark" />
        </div>
      </div>
      <div className="px-4 py-5 sm:px-6">
        {msg && <p role="status" className="mb-3 text-sm text-muted">{msg}</p>}
        {list.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">{t.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface dark:bg-card">
            <table className="w-full min-w-[60rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                  {(["domain", "customer", "price", "status", "date", "actions"] as const).map((c) => (
                    <th key={c} scope="col" className={cn("px-4 py-2.5 font-medium", c === "price" && "text-right")}>{t.cols[c]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} className="border-b border-line last:border-0 hover:bg-[var(--meta-hover)]">
                    <td className="px-4 py-3">
                      <span className="block font-semibold text-heading">
                        {o.domain}
                        {o.is_test && <TestBadge locale={locale} />}
                      </span>
                      <span className="block font-mono text-xs text-muted">{o.reference}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-heading">{o.name}</span>
                      <span className="block text-xs text-muted">{[o.email, o.phone, o.legal_id].filter(Boolean).join(" · ")}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-heading">{money(o.price_cop)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", TONE[o.status])}>{t.statuses[o.status]}</span>
                      {o.error && <span className="mt-1 block max-w-[16rem] truncate text-xs text-red-600 dark:text-red-400" title={o.error}>{o.error}</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{fmt(o.created_at)}</td>
                    <td className="px-4 py-3">
                      {["pending_payment", "declined"].includes(o.status) && (
                        <div className="mb-1.5">
                          <OrderActions locale={locale} reference={o.reference} status={o.status} payable={!o.payment_id} variant="staff" />
                        </div>
                      )}
                      {admin && (
                        <div className="flex flex-wrap gap-1.5">
                          {busy === o.id && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />}
                          {["paid", "failed", "manual"].includes(o.status) && o.item_id && (
                            <button type="button" onClick={() => register(o)} disabled={!!busy} className="rounded-lg bg-brand-green px-2.5 py-1 text-xs font-semibold text-deep-700 hover:brightness-95 disabled:opacity-50">
                              {t.actions.register}
                            </button>
                          )}
                          {o.status === "manual" && (
                            <button type="button" onClick={() => setStatus(o, "paid")} disabled={!!busy} className="rounded-lg px-2.5 py-1 text-xs font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                              {t.actions.paid}
                            </button>
                          )}
                          {o.status !== "registered" && o.status !== "cancelled" && (
                            <button type="button" onClick={() => setStatus(o, "registered")} disabled={!!busy} className="rounded-lg px-2.5 py-1 text-xs font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]">
                              {t.actions.markRegistered}
                            </button>
                          )}
                          {["pending_payment", "manual"].includes(o.status) && (
                            <button type="button" onClick={() => window.confirm(t.actions.confirmCancel) && setStatus(o, "cancelled")} disabled={!!busy} className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                              {t.actions.cancel}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted">{t.hint}</p>
      </div>
    </div>
  );
}
