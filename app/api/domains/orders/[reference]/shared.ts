import "server-only";
import { apiProfile } from "@/lib/apiAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DomainOrder } from "@/lib/supabase/types";

const STAFF = new Set(["admin", "sales", "support", "marketing"]);

/** Pedido por referencia, si quien llama es su dueño o del equipo. */
export async function ownOrder(reference: string) {
  const session = await apiProfile(["client", "provider", "admin", "sales", "support", "marketing"]);
  if (!session) return { status: 401 as const };
  const db = createAdminClient();
  const { data } = await db.from("domain_orders").select("*").eq("reference", reference).maybeSingle();
  const order = data as DomainOrder | null;
  if (!order || (order.user_id !== session.profile.id && !STAFF.has(session.profile.role))) return { status: 404 as const };
  return { status: 200 as const, db, order };
}
