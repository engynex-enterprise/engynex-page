import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Refresca la sesión de Supabase dentro del proxy y copia las cookies
 * renovadas a la respuesta que el proxy ya decidió (seguir, redirigir…).
 * Devuelve el usuario, o null si no hay sesión.
 */
export async function refreshSession(
  request: NextRequest,
  response: NextResponse,
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  // getUser() valida el token con Supabase (getSession() no lo hace).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
