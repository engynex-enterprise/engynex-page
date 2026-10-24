import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/i18n/config";
import { refreshSession } from "@/lib/supabase/proxy";

function detectLocale(request: NextRequest): string {
  const accept = request.headers.get("accept-language")?.toLowerCase() ?? "";
  for (const part of accept.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2);
    if ((locales as readonly string[]).includes(code)) return code;
  }
  return defaultLocale;
}

/** ¿Trae la petición una cookie de sesión de Supabase (sb-…-auth-token)? */
function hasSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Idioma: toda ruta pública lleva /es o /en.
  const locale = locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (!locale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${detectLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const isPortal = pathname.startsWith(`/${locale}/portal`);
  const response = NextResponse.next({ request });

  // 2. Sesión: solo se refresca si hay cookie de Supabase (las visitas
  //    anónimas no hacen ninguna llamada extra).
  if (!hasSessionCookie(request)) {
    if (isPortal) return redirectToLogin(request, locale);
    return response;
  }
  const user = await refreshSession(request, response);

  // 3. El portal exige sesión. El rol se comprueba en el layout del portal.
  if (isPortal && !user) return redirectToLogin(request, locale);

  return response;
}

function redirectToLogin(request: NextRequest, locale: string) {
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/acceso`;
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Excluye archivos estáticos, API y assets con extensión.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
