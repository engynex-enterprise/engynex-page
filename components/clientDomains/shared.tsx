"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { clientDomainsCopy } from "@/content/clientDomains";
import type { Locale } from "@/i18n/config";
import type { ClientDomainStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export const STATUS_TONE: Record<ClientDomainStatus, string> = {
  pending: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  expiring: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  expired: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  transferred: "bg-surface-soft text-muted dark:bg-white/[0.06]",
  cancelled: "bg-surface-soft text-muted dark:bg-white/[0.06]",
};

/** Días que faltan para una fecha, desde `now` (ms, calculado en el servidor). */
export const daysLeft = (iso: string | null, now: number) => (iso ? Math.ceil((new Date(iso).getTime() - now) / 86400_000) : null);

export const moneyCop = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

export const fmtDate = (locale: string, iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(iso));

/** Tono del vencimiento: rojo ≤ 7 días, ámbar ≤ 30, normal después. */
export const expiryTone = (d: number | null) =>
  d === null ? "text-muted" : d <= 7 ? "text-red-600 dark:text-red-400" : d <= 30 ? "text-amber-700 dark:text-amber-400" : "text-body";

export function StatusChip({ locale, status }: { locale: Locale; status: ClientDomainStatus }) {
  return (
    <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_TONE[status])}>{clientDomainsCopy[locale].status[status]}</span>
  );
}

export function ExpiryText({ locale, iso, now }: { locale: Locale; iso: string | null; now: number }) {
  const t = clientDomainsCopy[locale];
  if (!iso) return <span className="text-muted">—</span>;
  const d = daysLeft(iso, now)!;
  const rel = d > 0 ? t.inDays.replace("{n}", String(d)) : d === 0 ? t.today : t.daysAgo.replace("{n}", String(-d));
  return (
    <span className={expiryTone(d)}>
      {t.expiresOn.replace("{date}", fmtDate(locale, iso))} <span className="whitespace-nowrap">({rel})</span>
    </span>
  );
}

/** Interruptor accesible (role="switch"). */
export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50", checked ? "bg-brand-green-dark dark:bg-brand-green" : "bg-line-strong")}
    >
      <span className={cn("absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}

/** Cambia la renovación automática (no toca el registrador). */
export function AutoRenewSwitch({ locale, domainId, initial }: { locale: Locale; domainId: string; initial: boolean }) {
  const t = clientDomainsCopy[locale];
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <Switch
      checked={on}
      disabled={busy}
      label={t.autoRenew}
      onChange={async (v) => {
        setBusy(true);
        setOn(v);
        const res = await fetch(`/api/domains/manage/${domainId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "auto_renew", on: v }) }).catch(() => null);
        if (!res?.ok) setOn(!v);
        setBusy(false);
      }}
    />
  );
}

/**
 * Botón "Renovar": confirma en una ventana y lleva al pago de Wompi.
 * `autoOpen` abre la confirmación al llegar desde el correo (?renovar=1).
 */
export function RenewButton({
  locale,
  domainId,
  domain,
  price,
  autoOpen = false,
  primary = false,
}: {
  locale: Locale;
  domainId: string;
  domain: string;
  price: number | null;
  autoOpen?: boolean;
  primary?: boolean;
}) {
  const t = clientDomainsCopy[locale];
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (autoOpen && d && !d.open) d.showModal();
  }, [autoOpen]);

  const pay = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/domains/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "renewal", domain_id: domainId, locale }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { url?: string } | null;
    if (res?.ok && body?.url) {
      window.location.href = body.url;
      return;
    }
    setBusy(false);
    setError(res?.status === 503 ? t.renewUnavailable : res?.status === 422 ? t.renewWhois : t.renewError);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={cn(primary ? buttonClasses("primary", "md") : "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]")}
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        {primary ? t.renewNow : t.renew}
      </button>
      <dialog
        ref={ref}
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-3xl bg-surface p-0 text-body shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:bg-card"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-heading [overflow-wrap:anywhere]">{t.renewConfirmTitle.replace("{domain}", domain)}</h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label={t.cancel} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-card-soft hover:text-heading">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">{t.renewConfirmBody}</p>
          {price != null && (
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-surface-soft px-4 py-3 dark:bg-white/[0.04]">
              <span className="text-sm text-muted">{t.renewPrice}</span>
              <span className="text-lg font-bold tabular-nums text-heading">{moneyCop(price)} COP</span>
            </div>
          )}
          {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => ref.current?.close()} className={buttonClasses("outline", "md")}>
              {t.cancel}
            </button>
            <button type="button" onClick={pay} disabled={busy} className={cn(buttonClasses("primary", "md"), "disabled:opacity-60")}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {busy ? t.renewing : t.continue}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
