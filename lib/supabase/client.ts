import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Cliente de Supabase para componentes de cliente. Usa la clave publicable:
 * todo lo que hace pasa por las reglas RLS de la base de datos.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
