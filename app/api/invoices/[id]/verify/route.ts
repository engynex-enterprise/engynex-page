import { NextResponse } from "next/server";
import { verifyInvoicePayment } from "@/lib/invoices";
import { ownInvoice } from "../shared";

/** Consulta en Wompi el pago de la factura (titular o equipo). */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const r = await ownInvoice((await ctx.params).id);
  if (r.status !== 200) return NextResponse.json({ error: r.status === 401 ? "login_required" : "not_found" }, { status: r.status });
  const body = (await request.json().catch(() => ({}))) as { transaction_id?: string };
  const status = await verifyInvoicePayment(r.db, r.invoice, body.transaction_id ?? null);
  return NextResponse.json({ status });
}
