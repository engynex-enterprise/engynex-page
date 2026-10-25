import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";

/**
 * Cliente de Supabase para componentes de servidor, server actions y route
 * handlers. Actúa con la sesión del usuario (cookies), así que las reglas RLS
 * deciden qué puede ver y cambiar.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un componente de servidor: no puede escribir
            // cookies. El proxy refresca la sesión en cada petición.
          }
        },
      },
    },
  );
}
