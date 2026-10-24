import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/** Empleados activos (para asignar leads y tareas). */
export async function listEmployees(supabase: SupabaseClient<Database>) {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("kind", "employee")
    .eq("active", true)
    .order("full_name");
  return (data ?? []).map((p) => ({ id: p.id, name: p.full_name ?? p.email }));
}
