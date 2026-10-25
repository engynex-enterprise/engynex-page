import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Cliente con la clave secreta: SALTA las reglas RLS. Solo para tareas del
 * servidor que no actúan en nombre de un usuario (guardar un lead desde el
 * formulario público, webhooks, tareas programadas). Nunca se importa desde
 * código de cliente (`server-only` lo impide en el build).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Falta SUPABASE_SECRET_KEY en las variables de entorno del servidor.",
    );
  }
  return createClient<Database>(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
