import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiScope } from "@/lib/supabase/types";

/** Máximo de peticiones por clave y por hora (por instancia del servidor). */
export const API_RATE_LIMIT = 600;
const hits = new Map<string, { start: number; n: number }>();

export const apiError = (error: string, status: number, detail?: string) =>
  NextResponse.json(detail ? { error, detail } : { error }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * API pública (/api/v1): valida la clave "Authorization: Bearer egx_…" y el
 * permiso. Devuelve el cliente con la clave secreta (las rutas filtran lo que
 * exponen) o una respuesta de error lista para devolver.
 */
export async function apiKeyAuth(request: Request, scope: ApiScope) {
  const header = request.headers.get("authorization") ?? "";
  const key = header.match(/^Bearer\s+(egx_[a-f0-9]{48})$/i)?.[1];
  if (!key) return { error: apiError("invalid_key", 401) } as const;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("api_key_check", { p_key: key, p_scope: scope });
  if (error) return { error: apiError("server_error", 500) } as const;
  const check = data as { ok: boolean; error?: string; id?: string };
  if (!check.ok) return { error: apiError(check.error ?? "invalid_key", check.error === "missing_scope" ? 403 : 401) } as const;

  const now = Date.now();
  const slot = hits.get(check.id!);
  if (!slot || now - slot.start > 3_600_000) hits.set(check.id!, { start: now, n: 1 });
  else if (++slot.n > API_RATE_LIMIT) return { error: apiError("rate_limited", 429) } as const;

  return { admin, keyId: check.id! } as const;
}

/** Lee el cuerpo JSON (objeto) o null. */
export async function jsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
export const clampLimit = (v: string | null, def = 50) => Math.max(1, Math.min(100, Number(v) || def));
export const isoOrNull = (v: string | null) => (v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);
