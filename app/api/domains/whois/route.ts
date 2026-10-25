import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLES = ["client", "provider", "admin", "sales", "support", "marketing"] as const;
const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Datos del titular (WHOIS) del cliente que inició sesión. */
export async function GET() {
  const session = await apiProfile([...ROLES]);
  if (!session) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const db = createAdminClient();
  const [{ data }, { data: p }] = await Promise.all([
    db.from("client_whois").select("*").eq("user_id", session.profile.id).maybeSingle(),
    db.from("profiles").select("phone").eq("id", session.profile.id).maybeSingle(),
  ]);
  return NextResponse.json({ whois: data ?? null, email: session.profile.email, name: session.profile.full_name, phone: p?.phone ?? null });
}

export async function PUT(request: Request) {
  const session = await apiProfile([...ROLES]);
  if (!session) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const row = {
    user_id: session.profile.id,
    entity_type: b.entity_type === "organization" ? ("organization" as const) : ("individual" as const),
    first_name: s(b.first_name, 60),
    last_name: s(b.last_name, 60),
    company: s(b.company, 120) || null,
    document_id: s(b.document_id, 30) || null,
    email: s(b.email, 160).toLowerCase() || session.profile.email,
    phone: s(b.phone, 20),
    address: s(b.address, 160),
    city: s(b.city, 80),
    state: s(b.state, 80),
    zip: s(b.zip, 12),
    country: (s(b.country, 2) || "CO").toUpperCase(),
    // Datos nuevos → perfiles nuevos en el registrador para las próximas compras.
    registrar_ids: {},
  };
  const missing = (["first_name", "last_name", "phone", "address", "city", "state", "zip"] as const).filter((k) => !row[k] || String(row[k]).length < 2);
  if (missing.length || (row.entity_type === "organization" && !row.company)) return NextResponse.json({ error: "invalid", missing }, { status: 422 });
  const { error } = await createAdminClient().from("client_whois").upsert(row, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "server" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
