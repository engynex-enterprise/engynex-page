import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLocale } from "@/i18n/config";

/**
 * Destino de los enlaces de correo de Supabase (recuperar contraseña).
 * Canjea el código por una sesión y lleva al usuario a `next`, que solo
 * puede ser una ruta interna del mismo idioma.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "es";
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "";
  const next =
    nextParam.startsWith(`/${locale}/`) && !nextParam.startsWith("//")
      ? nextParam
      : `/${locale}/portal`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(
    new URL(`/${locale}/acceso?error=expired`, url.origin),
  );
}
