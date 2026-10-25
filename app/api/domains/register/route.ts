import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import { attemptRegistration } from "@/lib/domainOrders";
import type { DomainOrder } from "@/lib/supabase/types";
import { createAdminClient } from "@/lib/supabase/admin";

/** Registrar (o reintentar) en Hostinger un pedido ya pagado. Solo admin. */
export async function POST(request: Request) {
  if (!(await apiProfile(["admin"]))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = (await request.json().catch(() => ({}))) as { id?: string };
  const supabase = createAdminClient();
  const { data: order } = await supabase.from("domain_orders").select("*").eq("id", id ?? "").maybeSingle();
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!["paid", "failed", "manual"].includes(order.status) || !order.item_id) return NextResponse.json({ error: "not_ready" }, { status: 409 });
  const result = await attemptRegistration(supabase, { ...(order as DomainOrder), register_attempts: 0 });
  if (result === "skipped") return NextResponse.json({ error: "missing_hostinger_token" }, { status: 409 });
  const { data: after } = await supabase.from("domain_orders").select("status, error").eq("id", order.id).maybeSingle();
  return result === "failed" ? NextResponse.json({ error: after?.error ?? "failed" }, { status: 502 }) : NextResponse.json({ ok: true, status: after?.status });
}
