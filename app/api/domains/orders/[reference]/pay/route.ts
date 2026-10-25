import { NextResponse } from "next/server";
import { wompiCheckoutUrl } from "@/lib/domains";
import { siteConfig } from "@/lib/site";
import { ownOrder } from "../shared";

/** Enlace de pago (Wompi) de un pedido pendiente: para pagar después o compartirlo. */
export async function POST(request: Request, ctx: { params: Promise<{ reference: string }> }) {
  const r = await ownOrder((await ctx.params).reference);
  if (r.status !== 200) return NextResponse.json({ error: r.status === 401 ? "login_required" : "not_found" }, { status: r.status });
  const o = r.order;
  if (o.status !== "pending_payment" || o.payment_id) return NextResponse.json({ error: "not_payable" }, { status: 409 });
  const origin = process.env.NODE_ENV === "production" ? siteConfig.url : new URL(request.url).origin;
  const url = await wompiCheckoutUrl({ reference: o.reference, amountCop: o.price_cop, email: o.email, name: o.name, phone: o.phone, redirectUrl: `${origin}/es/dominios/pedido/${o.reference}` });
  if (!url) return NextResponse.json({ error: "payments_unavailable" }, { status: 503 });
  return NextResponse.json({ url });
}
