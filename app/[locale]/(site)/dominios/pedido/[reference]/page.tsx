import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Globe2, Loader2, MessageCircle, XCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { OrderAutoRefresh } from "@/components/domains/OrderAutoRefresh";
import { domainSearchCopy } from "@/content/domainSearch";
import { isLocale } from "@/i18n/config";
import { localizedHref, siteConfig } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyOrderPayment } from "@/lib/domainOrders";
import type { DomainOrder } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pedido de dominio", robots: { index: false } };

type Order = { domain: string; status: string; price_cop: number; created_at: string; registered_at: string | null };

const STEPS = ["pending_payment", "paid", "registering", "registered"] as const;

export default async function DomainOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; reference: string }>;
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const { locale, reference } = await params;
  const sp = await searchParams;
  if (!isLocale(locale) || !/^DOM-[0-9]{6}-[A-F0-9]{8}$/.test(reference)) notFound();
  const t = domainSearchCopy[locale];
  const supabase = await createClient();
  // Si sigue esperando el pago, se consulta a Wompi (no depende del webhook).
  const admin = createAdminClient();
  const { data: raw } = await admin.from("domain_orders").select("*").eq("reference", reference).maybeSingle();
  const checkedAgo = raw?.payment_checked_at ? Date.parse(new Date().toISOString()) - Date.parse(raw.payment_checked_at) : Infinity;
  const txId = typeof sp.id === "string" ? sp.id : null;
  if (raw && raw.status === "pending_payment" && (txId || checkedAgo > 8000)) await verifyOrderPayment(admin, raw as DomainOrder, txId).catch(() => null);
  const { data } = await supabase.rpc("domain_order_status", { p_reference: reference });
  const order = data as Order | null;
  const back = localizedHref(locale, "servicios/desarrollo-web");

  if (!order) {
    return (
      <Container className="py-24 text-center">
        <p className="text-lg text-muted">{t.order.notFound}</p>
        <Link href={`${back}#dominios`} className={cn(buttonClasses("primary", "md"), "mt-6")}>
          {t.order.retry}
        </Link>
      </Container>
    );
  }

  const s = t.order.statuses[order.status] ?? t.order.statuses.manual;
  const bad = order.status === "declined" || order.status === "cancelled";
  // "failed" también se refresca: la tarea programada reintenta sola.
  const active = ["pending_payment", "paid", "registering", "failed", "manual"].includes(order.status);
  const reached = order.status === "failed" ? 2 : Math.max(0, STEPS.indexOf(order.status as (typeof STEPS)[number]));
  const Icon = order.status === "registered" ? CheckCircle2 : bad ? XCircle : active ? Loader2 : Clock;

  return (
    <Container className="py-16 sm:py-24">
      <OrderAutoRefresh active={active} />
      <div className="mx-auto max-w-2xl">
        <Link href={back} className="text-sm font-medium text-muted hover:text-heading">
          ← {t.order.back}
        </Link>
        <div className="mt-6 rounded-[2rem] bg-surface-soft p-8 text-center sm:p-12 dark:bg-white/[0.04]">
          <span className={cn("mx-auto grid h-16 w-16 place-items-center rounded-full", order.status === "registered" ? "bg-brand-green text-deep-700" : bad ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" : "bg-white text-heading dark:bg-white/10")}>
            <Icon className={cn("h-8 w-8", active && "animate-spin")} aria-hidden />
          </span>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-base font-semibold text-heading dark:bg-white/10">
            <Globe2 className="h-4 w-4" aria-hidden />
            {order.domain}
          </p>
          <h1 className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)] font-bold leading-tight text-heading">{s.title}</h1>
          <p className="mt-2 text-base text-muted">{s.body}</p>

          {!bad && (
            <ol className="mx-auto mt-10 grid max-w-md grid-cols-4 gap-2" aria-label={t.order.title.replace("{reference}", reference)}>
              {STEPS.map((step, i) => (
                <li key={step} className="text-center">
                  <span className={cn("block h-1.5 rounded-full", i <= reached ? "bg-brand-green" : "bg-line")} />
                  <span className={cn("mt-2 block text-[0.7rem] leading-tight", i <= reached ? "font-semibold text-heading" : "text-muted")}>{t.order.statuses[step].title}</span>
                </li>
              ))}
            </ol>
          )}

          <p className="mt-10 text-xs text-muted">{t.order.title.replace("{reference}", reference)}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {order.status === "registered" && (
              <Link href={localizedHref(locale, "portal/dominios")} className={buttonClasses("primary", "md")}>
                {t.order.manage}
              </Link>
            )}
            {bad && (
              <Link href={`${back}#dominios`} className={buttonClasses("primary", "md")}>
                {t.order.retry}
              </Link>
            )}
            <a href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(`${reference} · ${order.domain}`)}`} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "md")}>
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t.order.help}
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
