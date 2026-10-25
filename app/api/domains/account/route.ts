import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Límite por IP: 5 cuentas por hora (por instancia). */
const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
};

/**
 * Cuenta de cliente creada por el propio cliente al comprar un dominio.
 * Se crea con la clave secreta mediante self_signup_client (marca
 * `created_by: self_signup`; el registro público de Supabase sigue cerrado).
 * Queda como cliente.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const b = (await request.json().catch(() => ({}))) as { full_name?: string; email?: string; password?: string; phone?: string; website?: string };
  if (b.website) return NextResponse.json({ ok: true }); // trampa para bots
  const fullName = String(b.full_name ?? "").trim().slice(0, 120);
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  const password = String(b.password ?? "");
  const phone = String(b.phone ?? "").trim().slice(0, 30);
  if (fullName.length < 3 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 8) {
    return NextResponse.json({ error: "invalid" }, { status: 422 });
  }
  // Se crea en la base (self_signup_client): el API de administración de Auth
  // aplica app_metadata después del insert y handle_new_user exige created_by.
  const { error } = await createAdminClient().rpc("self_signup_client", { p_email: email, p_password: password, p_full_name: fullName, p_phone: phone || null });
  if (error) {
    const exists = error.code === "23505" || /email_exists/.test(error.message);
    return NextResponse.json({ error: exists ? "exists" : error.code === "22023" ? "invalid" : "server" }, { status: exists ? 409 : error.code === "22023" ? 422 : 500 });
  }
  return NextResponse.json({ ok: true });
}
