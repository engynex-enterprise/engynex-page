import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/lib/supabase/types";
import type { Locale } from "@/i18n/config";

/**
 * Usuario y perfil de la petición actual (memorizado por petición: el layout
 * y la página comparten una sola consulta).
 */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return { supabase, user, profile: (profile as Profile | null) ?? null };
});

/**
 * Exige sesión activa (y, si se indica, uno de los roles). Si no cumple,
 * redirige: sin sesión → acceso; sin permiso → inicio del portal.
 */
export async function requireProfile(locale: Locale, roles?: AppRole[]) {
  const session = await getSession();
  if (!session.user || !session.profile || !session.profile.active) {
    redirect(`/${locale}/acceso`);
  }
  if (roles && !roles.includes(session.profile.role)) {
    redirect(`/${locale}/portal`);
  }
  return session as typeof session & { profile: Profile };
}

/** Ruta del portal según el tipo de cuenta. */
export const portalHome = (locale: Locale) => `/${locale}/portal`;
