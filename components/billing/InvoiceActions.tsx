"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import { billingCopy } from "@/content/billing";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Pagar una factura en Wompi o consultar su pago (titular o equipo). */
export function InvoiceActions({ locale, id, status, size = "sm" }: { locale: Locale; id: string; status: string; size?: "sm" | "md" }) {
  const t = billingCopy[locale];
  const router = useRouter();
  const [busy, setBusy] = useState<"pay" | "verify" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  if (!["issued", "overdue"].includes(status)) return null;

  const pay = async () => {
    setBusy("pay");
    setMsg(null);
    const res = await fetch(`/api/invoices/${id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale }) }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (res?.ok && body?.url) {
      window.location.href = body.url;
      return;
    }
    setBusy(null);
    setMsg(body?.error === "payments_unavailable" ? t.unavailable : t.error);
  };
  const verify = async () => {
    setBusy("verify");
    setMsg(null);
    const res = await fetch(`/api/invoices/${id}/verify`, { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { status?: string } | null;
    setBusy(null);
    if (!res?.ok) return setMsg(t.error);
    setMsg(body?.status === "paid" ? t.approved : t.stillPending);
    router.refresh();
  };

  const btn = size === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-4 text-sm";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" onClick={pay} disabled={!!busy} className={cn("inline-flex items-center gap-1.5 rounded-lg bg-brand-green font-semibold text-deep-700 hover:brightness-95 disabled:opacity-50", btn)}>
        {busy === "pay" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CreditCard className="h-3.5 w-3.5" aria-hidden />}
        {t.pay}
      </button>
      <button type="button" onClick={verify} disabled={!!busy} className={cn("inline-flex items-center gap-1.5 rounded-lg font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50", btn)}>
        {busy === "verify" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden />}
        {t.verify}
      </button>
      {msg && (
        <span role="status" className="basis-full text-xs text-muted">
          {msg}
        </span>
      )}
    </div>
  );
}
