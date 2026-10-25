import { NextResponse } from "next/server";
import { wompiCheckoutUrl } from "@/lib/domains";
import { siteConfig } from "@/lib/site";
import { ownInvoice } from "../shared";

/** Enlace de pago (Wompi) de una factura emitida o vencida. */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const r = await ownInvoice((await ctx.params).id);
  if (r.status !== 200) return NextResponse.json({ error: r.status === 401 ? "login_required" : "not_found" }, { status: r.status });
  const inv = r.invoice;
  if (!["issued", "overdue"].includes(inv.status) || !inv.payment_reference || inv.total <= 0) return NextResponse.json({ error: "not_payable" }, { status: 409 });
  const body = (await request.json().catch(() => ({}))) as { locale?: string };
  const locale = body.locale === "en" ? "en" : "es";
  const [{ data: profile }, { data: billing }] = await Promise.all([
    r.db.from("profiles").select("email, full_name, phone").eq("id", inv.account_id).maybeSingle(),
    r.db.from("client_billing").select("legal_name, email, phone").eq("user_id", inv.account_id).maybeSingle(),
  ]);
  const origin = process.env.NODE_ENV === "production" ? siteConfig.url : new URL(request.url).origin;
  const url = await wompiCheckoutUrl({
    reference: inv.payment_reference,
    amountCop: inv.total,
    email: billing?.email ?? profile?.email ?? "",
    name: billing?.legal_name ?? profile?.full_name ?? profile?.email ?? "Cliente",
    phone: billing?.phone ?? profile?.phone ?? null,
    redirectUrl: `${origin}/${locale}/portal/facturacion/${inv.id}`,
  });
  if (!url) return NextResponse.json({ error: "payments_unavailable" }, { status: 503 });
  return NextResponse.json({ url });
}
