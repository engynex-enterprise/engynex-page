import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/supabase/types";

/**
 * Para rutas /api del portal: la sesión del usuario y su rol. Devuelve null si
 * no hay sesión, la cuenta está inactiva o el rol no está en la lista.
 */
export async function apiProfile(roles: AppRole[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, active, full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !profile.active || !roles.includes(profile.role)) return null;
  return { supabase, profile };
}
