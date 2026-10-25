import { NextResponse } from "next/server";
import { verifyWompiEvent, type WompiEvent } from "@/lib/domains";
import { applyWompiTransaction } from "@/lib/domainOrders";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DomainOrder } from "@/lib/supabase/types";

/**
 * Webhook de Wompi (transaction.updated). Verifica el checksum y aplica el
 * resultado al pedido (registro o renovación si se aprobó).
 * Wompi reintenta si no recibe 200, así que todo es idempotente.
 */
export async function POST(request: Request) {
  const event = (await request.json().catch(() => null)) as WompiEvent | null;
  if (!event || !(await verifyWompiEvent(event, request.headers.get("x-event-checksum")))) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }
  const tx = event.data.transaction;
  if (event.event !== "transaction.updated" || !tx?.reference?.startsWith("DOM-")) return NextResponse.json({ ok: true });

  const supabase = createAdminClient();
  const { data: order } = await supabase.from("domain_orders").select("*").eq("reference", tx.reference).maybeSingle();
  if (!order) return NextResponse.json({ ok: true });
  await applyWompiTransaction(supabase, order as DomainOrder, tx);
  return NextResponse.json({ ok: true });
}
