import "server-only";
import { findWompiTransaction, getWompiTransaction, wompiIsSandbox, type WompiTransaction } from "@/lib/domains";
import { getIntegrations } from "@/lib/integrations";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientInvoice } from "@/lib/supabase/types";
import { siteConfig } from "@/lib/site";

/**
 * Facturas del cliente: pago con Wompi (referencia INV-…), confirmación por
 * webhook o consulta activa, vencimientos y recordatorios automáticos.
 */
type Db = ReturnType<typeof createAdminClient>;

const money = (v: number) => `$${v.toLocaleString("es-CO")} COP`;
const invoiceUrl = (id: string) => `${siteConfig.url}/es/portal/facturacion/${id}`;
/** Hoy en Bogotá (YYYY-MM-DD). */
const todayBogota = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

async function customerContact(db: Db, accountId: string) {
  const [{ data: p }, { data: b }] = await Promise.all([
    db.from("profiles").select("email, full_name").eq("id", accountId).maybeSingle(),
    db.from("client_billing").select("email").eq("user_id", accountId).maybeSingle(),
  ]);
  return { email: b?.email ?? p?.email ?? null, first: (p?.full_name ?? p?.email ?? "").split(" ")[0] };
}

function emailTo(db: Db, to: string, subject: string, body: string, cta: { label: string; url: string }) {
  return db.from("email_queue").insert({ kind: "custom", to_email: to, payload: { subject, body, cta_label: cta.label, cta_url: cta.url, locale: "es" } });
}

/**
 * Aplica una transacción de Wompi a una factura (webhook o consulta activa).
 * Idempotente: solo un proceso gana la transición a "pagada".
 */
export async function applyInvoiceTransaction(db: Db, invoice: ClientInvoice, tx: WompiTransaction): Promise<string> {
  if (invoice.status === "paid" || invoice.status === "cancelled" || invoice.status === "draft") return invoice.status;
  if (tx.status !== "APPROVED") return invoice.status;
  if (tx.amount_in_cents !== invoice.total * 100 || tx.currency !== "COP") {
    await db.rpc("notify", {
      p_roles: ["admin", "sales"],
      p_user: null,
      p_kind: "ticket",
      p_title: `⚠️ Pago con monto distinto: factura #${invoice.number}`,
      p_body: `Referencia ${invoice.payment_reference}`,
      p_link: `/es/portal/clientes/${invoice.account_id}?tab=invoices`,
    });
    return invoice.status;
  }
  const sandbox = await wompiIsSandbox();
  const paidAt = new Date().toISOString();
  const receipt = { transaction_id: tx.id, amount_cop: tx.amount_in_cents / 100, status: tx.status, method: tx.payment_method_type ?? null, paid_at: paidAt, test: sandbox };
  const { data: claimed } = await db
    .from("client_invoices")
    .update({ status: "paid", paid_at: paidAt, payment_id: tx.id, receipt, is_test: sandbox })
    .eq("id", invoice.id)
    .in("status", ["issued", "overdue"])
    .select("id")
    .maybeSingle();
  if (!claimed) return "paid";

  await db.rpc("notify", {
    p_roles: ["admin", "sales"],
    p_user: null,
    p_kind: "ticket",
    p_title: `💰 Factura #${invoice.number} pagada${sandbox ? " (prueba)" : ""}`,
    p_body: `${invoice.concept} · ${money(invoice.total)}`,
    p_link: `/es/portal/clientes/${invoice.account_id}?tab=invoices`,
  });
  const c = await customerContact(db, invoice.account_id);
  if (c.email) {
    await emailTo(
      db,
      c.email,
      `Recibimos tu pago: factura #${invoice.number}`,
      `Hola ${c.first},\n\nRecibimos tu pago de ${money(invoice.total)} por «${invoice.concept}». Gracias. Puedes ver y descargar el comprobante en tu portal.`,
      { label: "Ver comprobante", url: invoiceUrl(invoice.id) },
    );
  }
  return "paid";
}

/** Consulta el pago en Wompi: por id de transacción (?id=) o por referencia (llave privada). */
export async function verifyInvoicePayment(db: Db, invoice: ClientInvoice, txId?: string | null): Promise<string> {
  if (!["issued", "overdue"].includes(invoice.status) || !invoice.payment_reference) return invoice.status;
  let tx = txId ? await getWompiTransaction(txId).catch(() => null) : null;
  if (tx && tx.reference !== invoice.payment_reference) tx = null;
  tx ??= await findWompiTransaction(invoice.payment_reference).catch(() => null);
  return tx ? applyInvoiceTransaction(db, invoice, tx) : invoice.status;
}

/**
 * Tarea programada: marca vencidas, envía recordatorios (3 días antes y el día
 * del vencimiento) y consulta pagos pendientes en Wompi.
 */
export async function reconcileInvoices(budgetMs = 10_000) {
  const started = Date.now();
  const db = createAdminClient();
  const c = await getIntegrations();
  const today = todayBogota();
  const summary = { overdue: 0, reminders: 0, paid: 0 };

  const { data: overdue } = await db.from("client_invoices").update({ status: "overdue" }).eq("status", "issued").lt("due_date", today).select("*");
  for (const inv of (overdue ?? []) as ClientInvoice[]) {
    summary.overdue++;
    const ct = await customerContact(db, inv.account_id);
    if (ct.email) {
      await emailTo(db, ct.email, `Factura #${inv.number} vencida`, `Hola ${ct.first},\n\nLa factura #${inv.number} por «${inv.concept}» (${money(inv.total)}) venció. Puedes pagarla en línea desde tu portal.`, {
        label: "Pagar ahora",
        url: invoiceUrl(inv.id),
      });
    }
  }

  // Recordatorio 3 días antes y el día del vencimiento (una vez por día).
  const in3 = new Date(Date.parse(`${today}T12:00:00Z`) + 3 * 86400_000).toISOString().slice(0, 10);
  const { data: due } = await db.from("client_invoices").select("*").eq("status", "issued").in("due_date", [today, in3]);
  for (const inv of (due ?? []) as ClientInvoice[]) {
    if (inv.reminded_at && inv.reminded_at.slice(0, 10) === today) continue;
    const ct = await customerContact(db, inv.account_id);
    if (!ct.email) continue;
    const isToday = inv.due_date === today;
    await emailTo(
      db,
      ct.email,
      isToday ? `Hoy vence la factura #${inv.number}` : `La factura #${inv.number} vence en 3 días`,
      `Hola ${ct.first},\n\nTe recordamos la factura #${inv.number} por «${inv.concept}» (${money(inv.total)}), con vencimiento ${isToday ? "hoy" : `el ${inv.due_date}`}. Págala en línea con PSE, tarjeta o Nequi.`,
      { label: "Pagar ahora", url: invoiceUrl(inv.id) },
    );
    await db.from("client_invoices").update({ reminded_at: new Date().toISOString() }).eq("id", inv.id);
    summary.reminders++;
  }

  if (c.wompi_private_key) {
    const { data: open } = await db.from("client_invoices").select("*").in("status", ["issued", "overdue"]).limit(30);
    for (const inv of (open ?? []) as ClientInvoice[]) {
      if (Date.now() - started > budgetMs) break;
      if ((await verifyInvoicePayment(db, inv)) === "paid") summary.paid++;
    }
  }
  return summary;
}
