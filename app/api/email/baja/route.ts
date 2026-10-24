import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Baja con un clic (encabezado List-Unsubscribe de Gmail y Outlook): el
 * cliente de correo hace POST aquí. Un GET lleva a la página de confirmación.
 */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.json({ ok: false }, { status: 400 });
  const supabase = await createClient();
  const { data } = await supabase.rpc("email_unsubscribe", { p_token: token });
  return NextResponse.json({ ok: data === true });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("l") === "en" ? "en" : "es";
  return NextResponse.redirect(new URL(`/${locale}/baja?t=${url.searchParams.get("t") ?? ""}`, url));
}
