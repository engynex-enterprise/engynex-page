import { NextResponse } from "next/server";
import { verifyOrderPayment } from "@/lib/domainOrders";
import { ownOrder } from "../shared";

/** Consulta en Wompi el pago del pedido y lo aplica (dueño o equipo). */
export async function POST(_req: Request, ctx: { params: Promise<{ reference: string }> }) {
  const r = await ownOrder((await ctx.params).reference);
  if (r.status !== 200) return NextResponse.json({ error: r.status === 401 ? "login_required" : "not_found" }, { status: r.status });
  const status = await verifyOrderPayment(r.db, r.order);
  return NextResponse.json({ status });
}
