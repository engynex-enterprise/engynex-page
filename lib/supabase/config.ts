/**
 * Dirección y clave publicable del proyecto de Supabase. Son públicas por
 * diseño (viajan en el JavaScript del navegador y todo pasa por RLS), así que
 * quedan aquí como respaldo: el sitio funciona aunque el hosting no entregue
 * las variables NEXT_PUBLIC_* al compilar. La clave secreta NUNCA va aquí:
 * sigue solo en SUPABASE_SECRET_KEY del servidor.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdmmxaaydsqmxfknpaqw.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_pSIGXvitjOQ4kP6kJUW5cg_EDBMG8bx";
