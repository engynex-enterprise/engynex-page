"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, CreditCard, Loader2, RefreshCw } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const COPY = {
  es: {
    verify: "Verificar pago",
    pay: "Pagar ahora",
    copy: "Copiar enlace de pago",
    copied: "Enlace copiado",
    stillPending: "Wompi aún no reporta el pago.",
    noKey: "Sin llave privada de Wompi no se puede consultar.",
    approved: "¡Pago confirmado!",
    declined: "El pago fue rechazado.",
    error: "No se pudo completar. Intenta de nuevo.",
    unavailable: "Pagos en línea no disponibles por ahora.",
    test: "Prueba",
  },
  en: {
    verify: "Check payment",
    pay: "Pay now",
    copy: "Copy payment link",
    copied: "Link copied",
    stillPending: "Wompi hasn't reported the payment yet.",
    noKey: "Without Wompi's private key we can't check.",
    approved: "Payment confirmed!",
    declined: "The payment was declined.",
    error: "Couldn't complete. Try again.",
    unavailable: "Online payments unavailable for now.",
    test: "Test",
  },
} as const;

/** Insignia de pedido pagado con llaves de prueba (sandbox). */
export function TestBadge({ locale }: { locale: Locale }) {
  return <span className="ml-1.5 rounded-full bg-violet-100 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-violet-800 dark:bg-violet-500/15 dark:text-violet-300">{COPY[locale].test}</span>;
}

/**
 * Acciones de un pedido sin pagar: consultar el pago en Wompi, pagarlo
 * (cliente) o copiar su enlace de pago para enviarlo (equipo).
 */
export function OrderActions({
  locale,
  reference,
  status,
  payable,
  variant,
  canVerify = true,
}: {
  locale: Locale;
  reference: string;
  status: string;
  /** Pendiente y sin intento de pago previo. */
  payable: boolean;
  variant: "client" | "staff";
  canVerify?: boolean;
}) {
  const t = COPY[locale];
  const router = useRouter();
  const [busy, setBusy] = useState<"verify" | "pay" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  if (!["pending_payment", "declined"].includes(status)) return null;

  const verify = async () => {
    setBusy("verify");
    setMsg(null);
    const res = await fetch(`/api/domains/orders/${reference}/verify`, { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { status?: string } | null;
    setBusy(null);
    if (!res?.ok) return setMsg(t.error);
    if (body?.status === "pending_payment") setMsg(canVerify ? t.stillPending : t.noKey);
    else setMsg(body?.status === "declined" ? t.declined : t.approved);
    router.refresh();
  };
  const pay = async () => {
    setBusy("pay");
    setMsg(null);
    const res = await fetch(`/api/domains/orders/${reference}/pay`, { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null;
    setBusy(null);
    if (!res?.ok || !body?.url) return setMsg(body?.error === "payments_unavailable" ? t.unavailable : t.error);
    if (variant === "client") {
      window.location.href = body.url;
      return;
    }
    await navigator.clipboard.writeText(body.url).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btn = "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {payable && status === "pending_payment" && (
        <button type="button" onClick={pay} disabled={!!busy} className={cn(btn, variant === "client" ? "bg-brand-green text-deep-700 ring-0 hover:brightness-95" : "text-heading")}>
          {busy === "pay" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : variant === "client" ? <CreditCard className="h-3.5 w-3.5" aria-hidden /> : copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {variant === "client" ? t.pay : copied ? t.copied : t.copy}
        </button>
      )}
      <button type="button" onClick={verify} disabled={!!busy} className={cn(btn, "text-heading")}>
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
