import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { quoteDomain, renewalPriceCop, wompiCheckoutUrl } from "@/lib/domains";
import { apiProfile } from "@/lib/apiAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/site";

type Body = { domain?: string; domain_id?: string; kind?: "register" | "renewal"; locale?: string; accept?: boolean };

/**
 * Crea el pedido (compra o renovación) del cliente que inició sesión y
 * devuelve la URL de pago de Wompi. Requiere cuenta y datos del titular.
 */
export async function POST(request: Request) {
  const session = await apiProfile(["client", "provider", "admin", "sales", "support", "marketing"]);
  if (!session) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Body;
  const locale = body.locale === "en" ? "en" : "es";
  const db = createAdminClient();
  const user = session.profile;

  const { data: whois } = await db.from("client_whois").select("first_name, last_name, phone, document_id").eq("user_id", user.id).maybeSingle();
  if (!whois) return NextResponse.json({ error: "whois_required" }, { status: 422 });

  let domain: string;
  let price: number;
  let itemId: string | null = null;
  let costCents: number | null = null;
  let currency: string | null = null;
  let domainId: string | null = null;
  const kind = body.kind === "renewal" ? "renewal" : "register";

  if (kind === "renewal") {
    const { data: d } = await db.from("client_domains").select("*").eq("id", body.domain_id ?? "").eq("owner_id", user.id).maybeSingle();
    if (!d || !["active", "expiring", "expired"].includes(d.status)) return NextResponse.json({ error: "unavailable" }, { status: 409 });
    const quote = await renewalPriceCop(d.domain.slice(d.domain.indexOf(".") + 1)).catch(() => null);
    if (!quote) return NextResponse.json({ error: "unavailable" }, { status: 409 });
    domain = d.domain;
    price = quote.price;
    itemId = quote.itemId;
    domainId = d.id;
    // Un solo pedido de renovación abierto por dominio.
    await db.from("domain_orders").update({ status: "cancelled" }).eq("domain_id", d.id).eq("kind", "renewal").eq("status", "pending_payment");
  } else {
    if (!body.accept) return NextResponse.json({ error: "invalid" }, { status: 422 });
    const quote = await quoteDomain(String(body.domain ?? "").slice(0, 253)).catch(() => null);
    if (!quote) return NextResponse.json({ error: "unavailable" }, { status: 409 });
    domain = quote.domain;
    price = quote.price;
    itemId = quote.itemId;
    costCents = quote.costCents;
    currency = quote.currency;
  }

  const reference = `DOM-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${randomBytes(4).toString("hex").toUpperCase()}`;
  const origin = process.env.NODE_ENV === "production" ? siteConfig.url : new URL(request.url).origin;
  const name = `${whois.first_name} ${whois.last_name}`.trim();
  const checkout = await wompiCheckoutUrl({ reference, amountCop: price, email: user.email, name, phone: whois.phone, redirectUrl: `${origin}/${locale}/dominios/pedido/${reference}` });
  if (!checkout) return NextResponse.json({ error: "payments_unavailable" }, { status: 503 });

  const { error } = await db.from("domain_orders").insert({
    reference,
    kind,
    domain,
    domain_id: domainId,
    user_id: user.id,
    item_id: itemId,
    price_cop: price,
    cost_cents: costCents,
    cost_currency: currency,
    name,
    email: user.email,
    phone: whois.phone,
    legal_id: whois.document_id,
    status: "pending_payment",
  });
  if (error) {
    console.error("domain order", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json({ reference, url: checkout });
}
