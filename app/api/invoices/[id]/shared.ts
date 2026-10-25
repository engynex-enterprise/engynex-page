import "server-only";
import { apiProfile } from "@/lib/apiAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientInvoice } from "@/lib/supabase/types";

const STAFF = new Set(["admin", "sales", "support", "marketing"]);

/** Factura emitida, si quien llama es su titular o del equipo. */
export async function ownInvoice(id: string) {
  const session = await apiProfile(["client", "provider", "admin", "sales", "support", "marketing"]);
  if (!session) return { status: 401 as const };
  const db = createAdminClient();
  const { data } = await db.from("client_invoices").select("*").eq("id", id).maybeSingle();
  const invoice = data as ClientInvoice | null;
  const staff = STAFF.has(session.profile.role);
  if (!invoice || (!staff && (invoice.account_id !== session.profile.id || invoice.status === "draft"))) return { status: 404 as const };
  return { status: 200 as const, db, invoice };
}
