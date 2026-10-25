import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { getIntegrations, type IntegrationConfig } from "@/lib/integrations";

/**
 * Venta de dominios.
 *  - Disponibilidad y precios: API de Hostinger (catálogo DOMAIN). Sin token,
 *    se consulta el registro público RDAP y se usan precios de referencia.
 *  - Cobro: Wompi (checkout web con firma de integridad).
 *  - Registro: Hostinger, al aprobarse el pago (webhook de Wompi).
 * Docs: https://developers.hostinger.com · https://docs.wompi.co
 */
const HOSTINGER = "https://developers.hostinger.com";
export const DEFAULT_TLDS = ["com", "co", "com.co", "net", "org", "online", "store", "tech", "site", "shop"];

/** Precios de referencia (COP/año) cuando aún no hay token de Hostinger. */
const FALLBACK_COP: Record<string, number> = {
  com: 79000, co: 129000, "com.co": 69000, net: 89000, org: 89000, online: 49000, store: 59000, tech: 79000, site: 49000, shop: 59000,
};

export type DomainResult = {
  domain: string;
  tld: string;
  available: boolean;
  /** Precio de venta del primer año, en COP. */
  price: number | null;
  /** Precio de renovación anual, en COP. */
  renewal: number | null;
  exact: boolean;
  suggestion: boolean;
  restriction: string | null;
};

type CatalogPrice = { itemId: string; cents: number; renewalCents: number; currency: string };

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** "https://www.Mi-Empresa.co/" → { name: "mi-empresa", tld: "co" }. */
export function parseQuery(raw: string): { name: string; tld: string | null } | null {
  const clean = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#\s]/)[0]
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.-]/g, "");
  if (!clean) return null;
  const [name, ...rest] = clean.split(".");
  if (!LABEL.test(name)) return null;
  const tld = rest.join(".") || null;
  if (tld && !/^[a-z]{2,10}(\.[a-z]{2,10})?$/.test(tld)) return { name, tld: null };
  return { name, tld };
}

const tldsFrom = (c: IntegrationConfig) =>
  (c.domain_tlds ? c.domain_tlds.split(",").map((t) => t.trim().replace(/^\./, "")).filter(Boolean) : DEFAULT_TLDS).slice(0, 20);

/** Precio de venta en COP: costo × TRM × (1 + margen), redondeado a miles. */
function toCop(cents: number, currency: string, c: IntegrationConfig) {
  const usdCop = Number(c.domain_usd_cop) || 4200;
  const margin = Number(c.domain_margin_pct ?? 30) || 0;
  // El catálogo de Hostinger viene en la moneda de la cuenta (normalmente USD).
  const base = currency.toUpperCase() === "COP" ? cents / 100 : (cents / 100) * usdCop;
  return Math.ceil((base * (1 + margin / 100)) / 1000) * 1000;
}

async function hostinger<T>(token: string, path: string, init?: RequestInit & { next?: { revalidate: number } }): Promise<T> {
  const res = await fetch(`${HOSTINGER}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string; error?: string; errors?: Record<string, string[] | string> } | null;
    // Todos los errores de validación, no solo el primero.
    const details = body?.errors ? Object.values(body.errors).flat().filter((m, i, a) => a.indexOf(m) === i) : [];
    const text = details.length ? details.join(" · ") : body?.message ?? body?.error ?? "";
    throw new Error(`hostinger ${res.status}${text ? `: ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

type CatalogItem = { id: string; name: string; category: string; metadata?: Record<string, unknown> | null; prices: { id: string; currency: string; price: number; first_period_price?: number; period: number; period_unit: string }[] };

/** TLD de un artículo del catálogo (metadatos, nombre o id del precio). */
function catalogTld(item: CatalogItem): string | null {
  const meta = item.metadata ?? {};
  for (const k of ["tld", "extension", "domain_extension"]) {
    const v = meta[k];
    if (typeof v === "string" && v) return v.replace(/^\./, "").toLowerCase();
  }
  const fromName = item.name.match(/\.([a-z]{2,10}(?:\.[a-z]{2,10})?)\b/i);
  if (fromName) return fromName[1].toLowerCase();
  const fromId = item.id.match(/domain-([a-z0-9-]+)$/);
  return fromId ? fromId[1].replace(/-/g, ".") : null;
}

/** Precio de 1 año por TLD, del catálogo de Hostinger (se guarda 1 hora). */
async function catalog(token: string): Promise<Map<string, CatalogPrice>> {
  const items = await hostinger<CatalogItem[]>(token, "/api/billing/v1/catalog?category=DOMAIN", { next: { revalidate: 3600 } });
  const map = new Map<string, CatalogPrice>();
  for (const item of items) {
    const tld = catalogTld(item);
    const yearly = item.prices.find((p) => p.period === 1 && p.period_unit === "year");
    if (!tld || !yearly || map.has(tld)) continue;
    map.set(tld, { itemId: yearly.id, cents: yearly.first_period_price || yearly.price, renewalCents: yearly.price, currency: yearly.currency });
  }
  return map;
}

/** Servidores RDAP de cada TLD según IANA (se guarda un día). */
async function rdapServers(): Promise<Map<string, string>> {
  const res = await fetch("https://data.iana.org/rdap/dns.json", { next: { revalidate: 86400 } });
  const data = (await res.json()) as { services: [string[], string[]][] };
  const map = new Map<string, string>();
  for (const [tlds, urls] of data.services) for (const t of tlds) map.set(t, urls[0].endsWith("/") ? urls[0] : `${urls[0]}/`);
  return map;
}

/**
 * ¿Libre? Consulta el RDAP del registro de la extensión (404 = libre).
 * Para extensiones sin RDAP (p. ej. .co) mira el DNS: sin servidores de
 * nombres es muy probable que esté libre (verificación aproximada).
 */
async function publicAvailability(domain: string, tld: string): Promise<{ available: boolean | null; approx: boolean }> {
  try {
    const servers = await rdapServers();
    const base = servers.get(tld.split(".").pop()!) ?? null;
    if (base && !tld.includes(".")) {
      const res = await fetch(`${base}domain/${domain}`, { headers: { Accept: "application/rdap+json" }, signal: AbortSignal.timeout(6000), cache: "no-store" });
      if (res.status === 404) return { available: true, approx: false };
      if (res.ok) return { available: false, approx: false };
    }
  } catch {
    // sigue con DNS
  }
  // DNS sobre HTTPS (Cloudflare): NXDOMAIN (Status 3) = sin delegación.
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const j = (await res.json()) as { Status?: number };
    if (j.Status === 3) return { available: true, approx: true };
    if (j.Status === 0) return { available: false, approx: true };
    return { available: null, approx: true };
  } catch {
    return { available: null, approx: true };
  }
}

export type SearchResponse = { query: string; results: DomainResult[]; source: "hostinger" | "rdap"; purchasable: boolean };

export async function searchDomains(raw: string): Promise<SearchResponse | null> {
  const q = parseQuery(raw);
  if (!q) return null;
  const c = await getIntegrations();
  const tlds = tldsFrom(c);
  const wanted = q.tld && !tlds.includes(q.tld) ? [q.tld, ...tlds] : tlds;
  const exactTld = q.tld ?? tlds[0];
  const purchasable = !!(c.wompi_public_key && c.wompi_integrity_secret);

  if (c.hostinger_api_token) {
    const token = c.hostinger_api_token;
    const [prices, main, alternatives] = await Promise.all([
      catalog(token),
      hostinger<{ domain: string | null; is_available: boolean; is_alternative: boolean; restriction: string | null }[]>(token, "/api/domains/v1/availability", {
        method: "POST",
        body: JSON.stringify({ domain: q.name, tlds: wanted.slice(0, 15) }),
        cache: "no-store",
      }),
      hostinger<{ domain: string | null; is_available: boolean; is_alternative: boolean; restriction: string | null }[]>(token, "/api/domains/v1/availability", {
        method: "POST",
        body: JSON.stringify({ domain: q.name, tlds: [exactTld], with_alternatives: true }),
        cache: "no-store",
      }).catch(() => []),
    ]);
    const seen = new Set<string>();
    const results: DomainResult[] = [];
    for (const r of [...main, ...alternatives]) {
      if (!r.domain || seen.has(r.domain)) continue;
      seen.add(r.domain);
      const tld = r.domain.slice(r.domain.indexOf(".") + 1);
      const p = prices.get(tld);
      results.push({
        domain: r.domain,
        tld,
        available: r.is_available && !!p,
        price: p ? toCop(p.cents, p.currency, c) : null,
        renewal: p ? toCop(p.renewalCents, p.currency, c) : null,
        exact: r.domain === `${q.name}.${exactTld}`,
        suggestion: r.is_alternative,
        restriction: r.restriction,
      });
    }
    return { query: `${q.name}.${exactTld}`, results: sortResults(results), source: "hostinger", purchasable };
  }

  // Sin token: registro público RDAP y precios de referencia.
  const checks = await Promise.all(
    wanted.slice(0, 10).map(async (tld) => {
      const domain = `${q.name}.${tld}`;
      const { available, approx } = await publicAvailability(domain, tld);
      const price = FALLBACK_COP[tld] ?? null;
      return {
        domain,
        tld,
        available: available === true && price !== null,
        price,
        renewal: price,
        exact: tld === exactTld,
        suggestion: false,
        restriction: available === null ? "unverified" : approx ? "approx" : null,
      } satisfies DomainResult;
    }),
  );
  return { query: `${q.name}.${exactTld}`, results: sortResults(checks), source: "rdap", purchasable: false };
}

const sortResults = (r: DomainResult[]) =>
  r.sort((a, b) => Number(b.exact) - Number(a.exact) || Number(b.available) - Number(a.available) || Number(a.suggestion) - Number(b.suggestion) || (a.price ?? 1e12) - (b.price ?? 1e12));

/** Vuelve a confirmar disponibilidad y precio de un dominio antes de cobrar. */
export async function quoteDomain(domain: string): Promise<{ domain: string; price: number; itemId: string | null; costCents: number | null; currency: string | null } | null> {
  const q = parseQuery(domain);
  if (!q?.tld) return null;
  const res = await searchDomains(`${q.name}.${q.tld}`);
  const hit = res?.results.find((r) => r.domain === `${q.name}.${q.tld}`);
  if (!hit?.available || !hit.price) return null;
  const c = await getIntegrations();
  if (!c.hostinger_api_token) return { domain: hit.domain, price: hit.price, itemId: null, costCents: null, currency: null };
  const p = (await catalog(c.hostinger_api_token)).get(q.tld);
  return { domain: hit.domain, price: hit.price, itemId: p?.itemId ?? null, costCents: p?.cents ?? null, currency: p?.currency ?? null };
}

type WhoisProfile = { id: number; tld: string; country: string; entity_type: "individual" | "organization"; is_default: boolean; whois_details: Record<string, unknown>; tld_details?: Record<string, unknown> | null };

/**
 * Perfil de contacto WHOIS (titular) para una extensión. Hostinger exige uno
 * por extensión: si no existe, se crea copiando los datos del perfil por
 * defecto de la cuenta (el de la empresa) y queda como predeterminado.
 */
export async function ensureWhoisProfile(token: string, tld: string): Promise<number> {
  const profiles = await hostinger<WhoisProfile[]>(token, "/api/domains/v1/whois", { cache: "no-store" });
  const own = profiles.filter((p) => p.tld === tld);
  const existing = own.find((p) => p.is_default) ?? own[0];
  if (existing) return existing.id;
  const template = profiles.find((p) => p.is_default) ?? profiles[0];
  if (!template) throw new Error("No hay ningún perfil WHOIS en la cuenta de Hostinger: crea uno en hPanel → Dominios → Perfiles WHOIS.");
  const created = await hostinger<WhoisProfile>(token, "/api/domains/v1/whois", {
    method: "POST",
    body: JSON.stringify({
      tld,
      country: template.country,
      entity_type: template.entity_type,
      whois_details: template.whois_details,
      ...(template.tld_details && Object.keys(template.tld_details).length ? { tld_details: template.tld_details } : {}),
    }),
    cache: "no-store",
  });
  await hostinger(token, `/api/domains/v1/whois/default/${created.id}`, { method: "PUT", cache: "no-store" }).catch(() => null);
  return created.id;
}

/** Datos del titular tal como los guarda el cliente (tabla client_whois). */
export type CustomerWhois = {
  entity_type: "individual" | "organization";
  first_name: string;
  last_name: string;
  company: string | null;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

/**
 * Crea en Hostinger el perfil WHOIS del cliente para una extensión (el
 * dominio queda a su nombre). Las claves con sufijo de país (state_co,
 * zip_co) son las que usa Hostinger para Colombia.
 */
export async function createCustomerWhois(tld: string, w: CustomerWhois): Promise<number> {
  const c = await getIntegrations();
  if (!c.hostinger_api_token) throw new Error("missing_hostinger_token");
  const cc = w.country.toLowerCase();
  const digits = w.phone.replace(/\D/g, "");
  const phone = digits.length > 10 && digits.startsWith("57") ? digits.slice(2) : digits;
  const details: Record<string, string> = {
    first_name: w.first_name,
    last_name: w.last_name,
    email: w.email,
    address: w.address,
    city: w.city,
    country_code: w.country,
    phone_cc: w.country === "CO" ? "57" : "",
    phone_number: phone,
    [`state_${cc}`]: w.state,
    [`zip_${cc}`]: w.zip,
  };
  if (w.entity_type === "organization" && w.company) details.company_name = w.company;
  const created = await hostinger<{ id: number }>(c.hostinger_api_token, "/api/domains/v1/whois", {
    method: "POST",
    body: JSON.stringify({ tld, country: w.country, entity_type: w.entity_type, whois_details: details }),
    cache: "no-store",
  });
  return created.id;
}

/** Registra el dominio en Hostinger (cobra al método de pago de la cuenta). */
export async function registerDomain(domain: string, itemId: string, contactId?: number) {
  const c = await getIntegrations();
  if (!c.hostinger_api_token) throw new Error("missing_hostinger_token");
  const tld = domain.slice(domain.indexOf(".") + 1);
  const contact = contactId ?? (await ensureWhoisProfile(c.hostinger_api_token, tld));
  return hostinger<{ id: number; status: string; subscription_id?: string | null; message?: string }>(c.hostinger_api_token, "/api/domains/v1/portfolio", {
    method: "POST",
    body: JSON.stringify({ domain, item_id: itemId, domain_contacts: { owner_id: contact, admin_id: contact, billing_id: contact, tech_id: contact } }),
    cache: "no-store",
  });
}

// ---------------------------------------------------------------------------
// Gestión del dominio (portal del cliente)
// ---------------------------------------------------------------------------

async function token() {
  const c = await getIntegrations();
  if (!c.hostinger_api_token) throw new Error("missing_hostinger_token");
  return c.hostinger_api_token;
}
const enc = encodeURIComponent;

export type DomainDetails = {
  domain: string;
  status: string;
  is_privacy_protection_allowed: boolean;
  is_privacy_protected: boolean;
  is_lockable: boolean;
  is_locked: boolean;
  name_servers: Record<string, string> | null;
  expires_at?: string | null;
};
export type DnsRecord = { name: string; type: string; ttl: number; records: { content: string; is_disabled?: boolean }[] };

export const getDomainDetails = async (domain: string) => hostinger<DomainDetails>(await token(), `/api/domains/v1/portfolio/${enc(domain)}`, { cache: "no-store" });
export const getRenewalInfo = async (domain: string) =>
  hostinger<{ domain: string; status: string; expires_at: string }>(await token(), `/api/domains/v1/portfolio/${enc(domain)}/renewal`, { cache: "no-store" });
export const setPrivacy = async (domain: string, on: boolean) =>
  hostinger(await token(), `/api/domains/v1/portfolio/${enc(domain)}/privacy-protection`, { method: on ? "PUT" : "DELETE", cache: "no-store" });
export const setLock = async (domain: string, on: boolean) =>
  hostinger(await token(), `/api/domains/v1/portfolio/${enc(domain)}/domain-lock`, { method: on ? "PUT" : "DELETE", cache: "no-store" });
export const setNameservers = async (domain: string, ns: { ns1: string; ns2: string; ns3?: string; ns4?: string }) =>
  hostinger(await token(), `/api/domains/v1/portfolio/${enc(domain)}/nameservers`, { method: "PUT", body: JSON.stringify(ns), cache: "no-store" });
export const getAuthCode = async (domain: string) =>
  hostinger<{ auth_code: string }>(await token(), `/api/domains/v1/portfolio/${enc(domain)}/auth-code`, { cache: "no-store" });
export const getDnsZone = async (domain: string) => hostinger<DnsRecord[]>(await token(), `/api/dns/v1/zones/${enc(domain)}`, { cache: "no-store" });
export const updateDnsZone = async (domain: string, zone: { name: string; type: string; ttl?: number; records: { content: string }[] }[], overwrite = true) =>
  hostinger(await token(), `/api/dns/v1/zones/${enc(domain)}`, { method: "PUT", body: JSON.stringify({ overwrite, zone }), cache: "no-store" });
export const deleteDnsRecords = async (domain: string, filters: { name: string; type: string }[]) =>
  hostinger(await token(), `/api/dns/v1/zones/${enc(domain)}`, { method: "DELETE", body: JSON.stringify({ filters }), cache: "no-store" });

type Subscription = { id: string; name: string; status: string; is_auto_renewed: boolean; renewal_price: number; currency_code: string; expires_at: string | null; next_billing_at: string | null };
export const listSubscriptions = async () => hostinger<Subscription[]>(await token(), "/api/billing/v1/subscriptions", { cache: "no-store" });
/** Suscripción de Hostinger de un dominio (por id guardado o por nombre). */
export async function findDomainSubscription(domain: string, id?: string | null) {
  const subs = await listSubscriptions();
  return subs.find((s) => (id && s.id === id) || s.name?.toLowerCase().includes(domain)) ?? null;
}
export const disableAutoRenewal = async (subscriptionId: string) =>
  hostinger(await token(), `/api/billing/v1/subscriptions/${enc(subscriptionId)}/auto-renewal/disable`, { method: "DELETE", cache: "no-store" });
export const renewSubscription = async (subscriptionId: string) =>
  hostinger<{ id: number; status: string; subscription_id?: string | null }>(await token(), `/api/billing/v1/subscriptions/${enc(subscriptionId)}/renew`, { method: "POST", body: "{}", cache: "no-store" });

/** Precio de renovación (COP) de una extensión, con el margen configurado. */
export async function renewalPriceCop(tld: string): Promise<{ price: number; itemId: string | null } | null> {
  const c = await getIntegrations();
  if (!c.hostinger_api_token) return FALLBACK_COP[tld] ? { price: FALLBACK_COP[tld], itemId: null } : null;
  const p = (await catalog(c.hostinger_api_token)).get(tld);
  return p ? { price: toCop(p.renewalCents, p.currency, c), itemId: p.itemId } : null;
}

/** Dominios de la cuenta de Hostinger (para confirmar registros en proceso). */
export async function listHostingerDomains() {
  const c = await getIntegrations();
  if (!c.hostinger_api_token) return null;
  return hostinger<{ domain: string | null; status: string }[]>(c.hostinger_api_token, "/api/domains/v1/portfolio", { cache: "no-store" });
}

// ---------------------------------------------------------------------------
// Wompi
// ---------------------------------------------------------------------------

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

function isPublicHttps(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !/^(localhost|127\.|0\.0\.0\.0|\[::1\]|.*\.local$)/.test(u.hostname);
  } catch {
    return false;
  }
}

/** URL del checkout web de Wompi para un pedido (monto en COP). */
export async function wompiCheckoutUrl(o: { reference: string; amountCop: number; email: string; name: string; phone?: string | null; redirectUrl: string }) {
  const c = await getIntegrations();
  if (!c.wompi_public_key || !c.wompi_integrity_secret) return null;
  const cents = o.amountCop * 100;
  const params = new URLSearchParams({
    "public-key": c.wompi_public_key,
    currency: "COP",
    "amount-in-cents": String(cents),
    reference: o.reference,
    "signature:integrity": sha256(`${o.reference}${cents}COP${c.wompi_integrity_secret}`),
    "customer-data:email": o.email,
    "customer-data:full-name": o.name,
  });
  // Wompi (CloudFront) bloquea con 403 las direcciones de regreso locales:
  // solo se envía si es pública y https (en desarrollo el pago termina en Wompi).
  if (isPublicHttps(o.redirectUrl)) params.set("redirect-url", o.redirectUrl);
  const phone = o.phone?.replace(/\D/g, "").slice(-10);
  if (phone && phone.length >= 7) {
    params.set("customer-data:phone-number", phone);
    params.set("customer-data:phone-number-prefix", "+57");
  }
  return `https://checkout.wompi.co/p/?${params.toString()}`;
}

export type WompiTransaction = { id: string; status: string; reference: string; amount_in_cents: number; currency: string; payment_method_type?: string; created_at?: string; finalized_at?: string | null };

/** ¿Las llaves de Wompi son de pruebas (sandbox)? */
export async function wompiIsSandbox() {
  const c = await getIntegrations();
  return (c.wompi_public_key ?? "").startsWith("pub_test_");
}

/**
 * Consulta en Wompi las transacciones de una referencia (requiere la llave
 * privada). Devuelve la más relevante: aprobada si hay, si no la más reciente.
 */
export async function findWompiTransaction(reference: string): Promise<WompiTransaction | null> {
  const c = await getIntegrations();
  if (!c.wompi_private_key) return null;
  const base = c.wompi_private_key.startsWith("prv_test_") ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1";
  const res = await fetch(`${base}/transactions?reference=${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${c.wompi_private_key}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`wompi ${res.status}`);
  const body = (await res.json()) as { data?: WompiTransaction[] };
  const list = (body.data ?? []).filter((t) => t.reference === reference);
  return list.find((t) => t.status === "APPROVED") ?? list.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0] ?? null;
}

/**
 * Una transacción por su id (API pública de Wompi, sin llave privada).
 * Wompi agrega ?id=<transacción> a la dirección de regreso.
 */
export async function getWompiTransaction(id: string): Promise<WompiTransaction | null> {
  if (!/^[0-9]+-[0-9]+-[0-9]+$/.test(id)) return null;
  const base = (await wompiIsSandbox()) ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1";
  const res = await fetch(`${base}/transactions/${id}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  return ((await res.json()) as { data?: WompiTransaction }).data ?? null;
}

type WompiEvent = {
  event: string;
  data: { transaction?: { id: string; status: string; reference: string; amount_in_cents: number; currency: string } } & Record<string, unknown>;
  signature?: { properties: string[]; checksum: string };
  timestamp?: number;
};

/** Verifica el checksum de un evento de Wompi (propiedades + timestamp + secreto). */
export async function verifyWompiEvent(body: WompiEvent, headerChecksum: string | null) {
  const c = await getIntegrations();
  if (!c.wompi_events_secret || !body.signature?.properties || body.timestamp === undefined) return false;
  const values = body.signature.properties.map((path) =>
    path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), body.data),
  );
  const expected = sha256(`${values.map((v) => String(v ?? "")).join("")}${body.timestamp}${c.wompi_events_secret}`);
  const got = (headerChecksum || body.signature.checksum || "").toLowerCase();
  return got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

export type { WompiEvent };
