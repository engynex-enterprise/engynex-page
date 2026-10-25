import "server-only";
import { getIntegrations } from "@/lib/integrations";
import {
  findWompiTransaction,
  getWompiTransaction,
  wompiIsSandbox,
  createCustomerWhois,
  disableAutoRenewal,
  findDomainSubscription,
  getRenewalInfo,
  listHostingerDomains,
  registerDomain,
  renewSubscription,
  renewalPriceCop,
  setPrivacy,
  type CustomerWhois,
  type WompiTransaction,
} from "@/lib/domains";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientDomain, DomainOrder } from "@/lib/supabase/types";
import { siteConfig } from "@/lib/site";

/**
 * Pedidos de dominio en autoservicio: registro a nombre del cliente,
 * renovación pagada por el cliente y mantenimiento automático (tarea
 * programada). Nadie del equipo tiene que intervenir.
 */
export const MAX_ATTEMPTS = 3;
/** Días antes del vencimiento en que se avisa y se ofrece renovar. */
export const REMINDER_DAYS = [30, 15, 7, 3, 1];

type Db = ReturnType<typeof createAdminClient>;
type Result = "registered" | "registering" | "renewed" | "failed" | "skipped";

const firstName = (name: string) => name.split(" ")[0];
const tldOf = (domain: string) => domain.slice(domain.indexOf(".") + 1);
const portalDomain = (id: string) => `${siteConfig.url}/es/portal/dominios/${id}`;
const yearLater = (from = new Date()) => new Date(from.getTime() + 365 * 86400_000).toISOString();

export function notifyTeam(db: Db, title: string, body: string) {
  return db.rpc("notify", { p_roles: ["admin", "sales"], p_user: null, p_kind: "lead", p_title: title, p_body: body, p_link: "/es/portal/dominios" });
}

export function emailCustomer(db: Db, to: string, subject: string, body: string, cta?: { label: string; url: string }) {
  return db.from("email_queue").insert({
    kind: "custom",
    to_email: to,
    payload: { subject, body, cta_label: cta?.label ?? "Ver mis dominios", cta_url: cta?.url ?? `${siteConfig.url}/es/portal/dominios`, locale: "es" },
  });
}

/** Perfil WHOIS del cliente en Hostinger para la extensión (se crea una vez). */
async function customerContact(db: Db, userId: string, tld: string): Promise<number | undefined> {
  const { data: w } = await db.from("client_whois").select("*").eq("user_id", userId).maybeSingle();
  if (!w) return undefined;
  const ids = (w.registrar_ids ?? {}) as Record<string, number>;
  if (ids[tld]) return ids[tld];
  const id = await createCustomerWhois(tld, w as unknown as CustomerWhois);
  await db.from("client_whois").update({ registrar_ids: { ...ids, [tld]: id } }).eq("user_id", userId);
  return id;
}

/**
 * Deja el dominio en el portal del cliente: vencimiento real, suscripción
 * (con la renovación automática de Hostinger apagada: se renueva solo cuando
 * el cliente paga) y privacidad WHOIS activada si la extensión lo permite.
 */
async function finalizeRegistration(db: Db, order: DomainOrder, subscriptionId?: string | null) {
  const info = await getRenewalInfo(order.domain).catch(() => null);
  const sub = await findDomainSubscription(order.domain, subscriptionId).catch(() => null);
  if (sub?.id && sub.is_auto_renewed) await disableAutoRenewal(sub.id).catch(() => null);
  await setPrivacy(order.domain, true).catch(() => null);
  const renewal = await renewalPriceCop(tldOf(order.domain)).catch(() => null);

  const row = {
    owner_id: order.user_id!,
    domain: order.domain,
    status: "active" as const,
    registered_at: new Date().toISOString(),
    expires_at: info?.expires_at ? new Date(info.expires_at.replace(" ", "T") + "Z").toISOString() : yearLater(),
    subscription_id: sub?.id ?? subscriptionId ?? null,
    renewal_price_cop: renewal?.price ?? order.price_cop,
    order_id: order.id,
    last_synced_at: new Date().toISOString(),
    is_test: false,
  };
  const { data: domain } = await db.from("client_domains").upsert(row, { onConflict: "domain" }).select("id").single();
  await db
    .from("domain_orders")
    .update({ status: "registered", registered_at: new Date().toISOString(), error: null, domain_id: domain?.id ?? null, registrar_subscription_id: row.subscription_id })
    .eq("id", order.id);
  await emailCustomer(
    db,
    order.email,
    `¡${order.domain} ya es tuyo!`,
    `Hola ${firstName(order.name)},\n\nTu dominio ${order.domain} quedó registrado a tu nombre. Desde tu portal puedes configurar los DNS, conectarlo a tu sitio o a tu correo y ver su renovación.`,
    domain?.id ? { label: "Administrar mi dominio", url: portalDomain(domain.id) } : undefined,
  );
  await notifyTeam(db, `🌐 Dominio vendido: ${order.domain}`, `${order.name} · ${order.email}`);
}

async function finalizeRenewal(db: Db, order: DomainOrder) {
  const info = await getRenewalInfo(order.domain).catch(() => null);
  const { data: d } = await db.from("client_domains").select("*").eq("id", order.domain_id!).maybeSingle();
  const expires = info?.expires_at ? new Date(info.expires_at.replace(" ", "T") + "Z").toISOString() : yearLater(d?.expires_at ? new Date(d.expires_at) : new Date());
  await db.from("client_domains").update({ status: "active", expires_at: expires, last_reminder_days: null, last_synced_at: new Date().toISOString() }).eq("id", order.domain_id!);
  await db.from("domain_orders").update({ status: "registered", registered_at: new Date().toISOString(), error: null }).eq("id", order.id);
  await emailCustomer(db, order.email, `Renovamos ${order.domain}`, `Hola ${firstName(order.name)},\n\nTu dominio ${order.domain} quedó renovado hasta el ${new Date(expires).toLocaleDateString("es-CO")}.`, {
    label: "Ver mi dominio",
    url: portalDomain(order.domain_id!),
  });
}

/**
 * Ejecuta un pedido pagado: registra (a nombre del cliente) o renueva. Si
 * Hostinger deja el cobro en proceso (202), la tarea programada lo confirma.
 * Si falla, cuenta el intento; la tarea reintenta hasta MAX_ATTEMPTS.
 */
export async function attemptRegistration(db: Db, order: DomainOrder): Promise<Result> {
  const c = await getIntegrations();
  if (!c.hostinger_api_token) return "skipped";
  const attempts = order.register_attempts + 1;
  await db.from("domain_orders").update({ status: "registering", register_attempts: attempts, last_attempt_at: new Date().toISOString() }).eq("id", order.id);
  try {
    if (order.kind === "renewal") {
      const { data: d } = await db.from("client_domains").select("subscription_id").eq("id", order.domain_id!).maybeSingle();
      const sub = d?.subscription_id ?? (await findDomainSubscription(order.domain).catch(() => null))?.id;
      if (!sub) throw new Error("No se encontró la suscripción del dominio en Hostinger");
      const res = await renewSubscription(sub);
      await db.from("domain_orders").update({ registrar_order_id: String(res.id), registrar_status: res.status }).eq("id", order.id);
      if (res.status === "completed") {
        await finalizeRenewal(db, order);
        return "renewed";
      }
      return "registering";
    }

    if (!order.item_id) throw new Error("El pedido no tiene el artículo del catálogo de Hostinger");
    const contact = order.user_id ? await customerContact(db, order.user_id, tldOf(order.domain)) : undefined;
    const res = await registerDomain(order.domain, order.item_id, contact);
    await db.from("domain_orders").update({ registrar_order_id: String(res.id), registrar_status: res.status, registrar_subscription_id: res.subscription_id ?? null }).eq("id", order.id);
    if (res.status === "completed") {
      await finalizeRegistration(db, order, res.subscription_id);
      return "registered";
    }
    return "registering";
  } catch (e) {
    const msg = (e instanceof Error ? e.message : String(e)).slice(0, 500);
    await db.from("domain_orders").update({ status: "failed", error: msg }).eq("id", order.id);
    if (attempts >= MAX_ATTEMPTS) {
      await notifyTeam(db, `❌ No se pudo ${order.kind === "renewal" ? "renovar" : "registrar"} ${order.domain}`, `Pagado. ${attempts} intentos. ${msg.slice(0, 180)}`);
      await emailCustomer(
        db,
        order.email,
        `Estamos terminando tu pedido de ${order.domain}`,
        `Hola ${firstName(order.name)},\n\nTu pago está seguro. Hubo un inconveniente con el registrador y nuestro equipo ya lo está resolviendo; te avisamos en cuanto quede listo.`,
      );
    }
    return "failed";
  }
}

/**
 * Aplica el resultado de una transacción de Wompi a un pedido (desde el
 * webhook o desde la consulta activa). Idempotente: si ya se aplicó, no hace
 * nada. Un pago aprobado dispara el registro o la renovación; con llaves de
 * prueba y "Proteger pruebas" encendido, se marca pagado sin comprar.
 */
export async function applyWompiTransaction(db: Db, order: DomainOrder, tx: WompiTransaction): Promise<string> {
  if (["paid", "registering", "registered"].includes(order.status)) return order.status;
  if (tx.status !== "APPROVED") {
    if (["DECLINED", "ERROR", "VOIDED"].includes(tx.status)) {
      await db.from("domain_orders").update({ status: "declined", payment_id: tx.id, payment_status: tx.status }).eq("id", order.id);
      return "declined";
    }
    return order.status;
  }
  if (tx.amount_in_cents !== order.price_cop * 100 || tx.currency !== "COP") {
    await db.from("domain_orders").update({ status: "failed", payment_id: tx.id, payment_status: tx.status, error: "monto distinto al pedido" }).eq("id", order.id);
    await notifyTeam(db, `⚠️ Pago de dominio con monto distinto: ${order.domain}`, `Referencia ${order.reference}`);
    return "failed";
  }

  const sandbox = await wompiIsSandbox();
  const paidAt = new Date().toISOString();
  const receipt = { transaction_id: tx.id, amount_cop: tx.amount_in_cents / 100, status: tx.status, method: tx.payment_method_type ?? null, paid_at: paidAt, test: sandbox };
  // Solo un proceso gana la transición (evita registrar dos veces).
  const { data: claimed } = await db
    .from("domain_orders")
    .update({ status: "paid", payment_id: tx.id, payment_status: tx.status, paid_at: paidAt, receipt, is_test: sandbox })
    .eq("id", order.id)
    .in("status", ["pending_payment", "manual", "declined", "cancelled"])
    .select("*")
    .maybeSingle();
  if (!claimed) return "paid";

  await emailCustomer(
    db,
    order.email,
    `Recibimos tu pago: ${order.domain}`,
    `Hola ${firstName(order.name)},\n\nRecibimos tu pago por ${order.kind === "renewal" ? "la renovación de " : ""}${order.domain}. En unos minutos queda listo y te avisamos por este medio.`,
  );

  const c = await getIntegrations();
  if (sandbox && c.domain_test_safe !== "off") {
    await simulateTestOrder(db, claimed as DomainOrder);
    return "registered";
  }
  const result = await attemptRegistration(db, claimed as DomainOrder);
  if (result === "skipped") await notifyTeam(db, `⚠️ Dominio pagado sin Hostinger conectado: ${order.domain}`, "Conecta Hostinger en Integraciones: el pedido se completa solo al conectarlo.");
  return result;
}

/**
 * Pago de prueba con "Proteger pruebas": no se compra en Hostinger, pero el
 * flujo se completa para poder probarlo (el dominio aparece en el portal del
 * cliente marcado como prueba; las acciones del registrador no aplican).
 */
async function simulateTestOrder(db: Db, order: DomainOrder) {
  const note = "Pago de prueba: simulado, no se compró en Hostinger (Integraciones → Proteger pruebas).";
  if (order.kind === "renewal" && order.domain_id) {
    const { data: d } = await db.from("client_domains").select("expires_at").eq("id", order.domain_id).maybeSingle();
    await db.from("client_domains").update({ status: "active", expires_at: yearLater(d?.expires_at ? new Date(d.expires_at) : new Date()), last_reminder_days: null }).eq("id", order.domain_id);
    await db.from("domain_orders").update({ status: "registered", registered_at: new Date().toISOString(), error: note }).eq("id", order.id);
    return;
  }
  let domainId: string | null = null;
  if (order.user_id) {
    const { data: existing } = await db.from("client_domains").select("id, is_test").eq("domain", order.domain).maybeSingle();
    if (!existing || existing.is_test) {
      const { data } = await db
        .from("client_domains")
        .upsert(
          { owner_id: order.user_id, domain: order.domain, status: "active", registered_at: new Date().toISOString(), expires_at: yearLater(), renewal_price_cop: order.price_cop, order_id: order.id, is_test: true },
          { onConflict: "domain" },
        )
        .select("id")
        .single();
      domainId = data?.id ?? null;
    }
  }
  await db.from("domain_orders").update({ status: "registered", registered_at: new Date().toISOString(), error: note, domain_id: domainId }).eq("id", order.id);
}

/**
 * Consulta activa del pago en Wompi: por el id de la transacción (API
 * pública, el que llega en ?id= al volver del pago) o por la referencia
 * (requiere la llave privada).
 */
export async function verifyOrderPayment(db: Db, order: DomainOrder, transactionId?: string | null): Promise<string> {
  if (order.status !== "pending_payment" && order.status !== "declined") return order.status;
  await db.from("domain_orders").update({ payment_checked_at: new Date().toISOString() }).eq("id", order.id);
  let tx = transactionId ? await getWompiTransaction(transactionId).catch(() => null) : null;
  if (tx && tx.reference !== order.reference) tx = null;
  tx ??= await findWompiTransaction(order.reference).catch(() => null);
  return tx ? applyWompiTransaction(db, order, tx) : order.status;
}

/**
 * Tarea programada (cada 5 min). Todo sin intervención:
 *  - Pagados sin ejecutar → se registran o renuevan; fallidos → reintento.
 *  - "Registrando" → se confirma contra Hostinger.
 *  - Recordatorios de renovación (30, 15, 7, 3 y 1 días) con enlace de pago.
 *  - Vencidos → estado "vencido". Sin pagar 48 h → pedido cancelado.
 */
export async function reconcileDomainOrders(budgetMs = 20_000) {
  const started = Date.now();
  const db = createAdminClient();
  const c = await getIntegrations();
  const summary = { registered: 0, retried: 0, confirmed: 0, cancelled: 0, reminders: 0, expired: 0 };

  const cutoff = new Date(Date.now() - 48 * 3600_000).toISOString();
  const { data: stale } = await db.from("domain_orders").update({ status: "cancelled" }).eq("status", "pending_payment").lt("created_at", cutoff).select("id");
  summary.cancelled = stale?.length ?? 0;

  // Vencimientos y recordatorios (no necesitan a Hostinger).
  const now = Date.now();
  const { data: domains } = await db.from("client_domains").select("*").in("status", ["active", "expiring"]).not("expires_at", "is", null).limit(500);
  for (const d of (domains ?? []) as ClientDomain[]) {
    const days = Math.ceil((new Date(d.expires_at!).getTime() - now) / 86400_000);
    if (days < 0) {
      await db.from("client_domains").update({ status: "expired" }).eq("id", d.id);
      summary.expired++;
      continue;
    }
    const due = REMINDER_DAYS.filter((r) => days <= r).sort((a, b) => a - b)[0];
    if (due === undefined || d.last_reminder_days === due) continue;
    const { data: owner } = await db.from("profiles").select("email, full_name").eq("id", d.owner_id).maybeSingle();
    if (!owner) continue;
    const price = d.renewal_price_cop ? `$${d.renewal_price_cop.toLocaleString("es-CO")} COP` : "";
    await emailCustomer(
      db,
      owner.email,
      days <= 3 ? `⚠️ ${d.domain} vence en ${days} día${days === 1 ? "" : "s"}` : `${d.domain} vence en ${days} días`,
      `Hola ${firstName(owner.full_name ?? owner.email)},\n\nTu dominio ${d.domain} vence el ${new Date(d.expires_at!).toLocaleDateString("es-CO")}. ${
        d.auto_renew ? "Renuévalo con un clic para no perderlo" : "Tienes la renovación automática apagada; si quieres conservarlo, renuévalo"
      }${price ? ` (${price} por un año)` : ""}.`,
      { label: "Renovar ahora", url: `${portalDomain(d.id)}?renovar=1` },
    );
    await db.from("client_domains").update({ last_reminder_days: due, status: days <= 7 ? "expiring" : "active" }).eq("id", d.id);
    summary.reminders++;
    if (Date.now() - started > budgetMs) return summary;
  }

  // Pagos que el webhook no alcanzó a confirmar: se consultan en Wompi.
  if (c.wompi_private_key) {
    const { data: unpaid } = await db
      .from("domain_orders")
      .select("*")
      .eq("status", "pending_payment")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(20);
    for (const o of (unpaid ?? []) as DomainOrder[]) {
      if (Date.now() - started > budgetMs) break;
      await verifyOrderPayment(db, o);
    }
  }

  if (!c.hostinger_api_token) return summary;

  // El webhook ejecuta al instante; aquí solo lo que lleva un rato esperando.
  const paidBefore = new Date(Date.now() - 2 * 60_000).toISOString();
  const retryBefore = new Date(Date.now() - 10 * 60_000).toISOString();
  let pendingQuery = db
    .from("domain_orders")
    .select("*")
    .or(`and(status.eq.paid,paid_at.lt.${paidBefore}),and(status.eq.failed,register_attempts.lt.${MAX_ATTEMPTS},last_attempt_at.lt.${retryBefore})`)
    .not("paid_at", "is", null);
  // Con "Proteger pruebas" encendido, los pagos de prueba no se registran.
  if (c.domain_test_safe !== "off") pendingQuery = pendingQuery.eq("is_test", false);
  const { data: pending } = await pendingQuery.order("paid_at").limit(10);
  const { data: registering } = await db.from("domain_orders").select("*").eq("status", "registering").limit(50);
  if (!pending?.length && !registering?.length) return summary;

  // Lo que ya está en la cuenta de Hostinger no se vuelve a comprar.
  const owned = await listHostingerDomains().catch(() => null);
  const ownedNames = new Set((owned ?? []).filter((d) => d.status !== "failed" && d.status !== "deleted").map((d) => d.domain));
  for (const order of (pending ?? []) as DomainOrder[]) {
    if (Date.now() - started > budgetMs) break;
    if (order.kind === "register" && ownedNames.has(order.domain)) {
      await finalizeRegistration(db, order, order.registrar_subscription_id);
      summary.confirmed++;
      continue;
    }
    const r = await attemptRegistration(db, order);
    if (r === "registered" || r === "renewed") summary.registered++;
    else summary.retried++;
  }

  for (const order of (registering ?? []) as DomainOrder[]) {
    if (Date.now() - started > budgetMs) break;
    if (order.kind === "renewal") {
      const info = await getRenewalInfo(order.domain).catch(() => null);
      const { data: d } = await db.from("client_domains").select("expires_at").eq("id", order.domain_id!).maybeSingle();
      if (info?.expires_at && d?.expires_at && new Date(info.expires_at.replace(" ", "T") + "Z") > new Date(d.expires_at)) {
        await finalizeRenewal(db, order);
        summary.confirmed++;
      }
      continue;
    }
    const hit = owned?.find((d) => d.domain === order.domain);
    if (hit && ["active", "pending_setup", "pending_verification"].includes(hit.status)) {
      await finalizeRegistration(db, order, order.registrar_subscription_id);
      summary.confirmed++;
    } else if (hit?.status === "failed") {
      await db.from("domain_orders").update({ status: "failed", error: "Hostinger marcó el registro como fallido" }).eq("id", order.id);
    }
  }
  return summary;
}
