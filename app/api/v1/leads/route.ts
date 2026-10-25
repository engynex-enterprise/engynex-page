import { NextResponse } from "next/server";
import { apiError, apiKeyAuth, clampLimit, isoOrNull, jsonBody, str } from "@/lib/apiKeyAuth";

const FIELDS = "id, name, email, phone, company, problem_category, tier, score, status, source, created_at";
const CATEGORIES = ["sales", "web", "automation", "system", "support", "other", "none"];
const SOURCES = ["web", "chat", "whatsapp", "manual", "import", "referral"] as const;
type Source = (typeof SOURCES)[number];

/** GET /api/v1/leads?since=ISO&limit=50 — leads más recientes primero. */
export async function GET(request: Request) {
  const auth = await apiKeyAuth(request, "leads:read");
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  let query = auth.admin.from("leads").select(FIELDS).order("created_at", { ascending: false }).limit(clampLimit(url.searchParams.get("limit")));
  const since = isoOrNull(url.searchParams.get("since"));
  if (since) query = query.gte("created_at", since);
  const status = url.searchParams.get("status");
  if (status) query = query.eq("status", status as "new");
  const { data, error } = await query;
  if (error) return apiError("server_error", 500);
  return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/v1/leads — crea un lead (mismo puntaje que el formulario).
 * Requiere consent: true (la persona aceptó ser contactada).
 */
export async function POST(request: Request) {
  const auth = await apiKeyAuth(request, "leads:write");
  if ("error" in auth) return auth.error;
  const body = await jsonBody(request);
  if (!body) return apiError("invalid_json", 400);
  if (body.consent !== true) return apiError("consent_required", 422);
  const category = str(body.problem_category, 40) ?? "other";
  const p = {
    name: str(body.name, 120),
    email: str(body.email, 200),
    phone: str(body.phone, 30),
    company: str(body.company, 160) ?? null,
    problem_category: CATEGORIES.includes(category) ? category : "other",
    problem_text: str(body.message ?? body.problem_text, 2000) ?? null,
    budget: str(body.budget, 20) ?? "unknown",
    decision: str(body.decision, 20) ?? "other",
    timeline: str(body.timeline, 20) ?? "browsing",
    consent: true,
    locale: str(body.locale, 5) === "en" ? "en" : "es",
  };
  if (!p.name || !p.email || !p.phone) return apiError("missing_fields", 422, "name, email y phone son obligatorios");

  const { data, error } = await auth.admin.rpc("submit_lead", { p });
  if (error) {
    const known = ["invalid_category", "invalid_budget", "invalid_decision", "invalid_timeline", "rate_limited"].find((k) => error.message.includes(k));
    if (known) return apiError(known, known === "rate_limited" ? 429 : 422);
    return apiError("invalid", 422, error.message.slice(0, 200));
  }
  const lead = data as { id: string; tier: string; score: number };
  // Fuente: una de las del CRM; por defecto "import" (llegó por la API).
  const source = (SOURCES as readonly string[]).includes(str(body.source, 20) ?? "") ? (body.source as Source) : "import";
  await auth.admin.from("leads").update({ source } as never).eq("id", lead.id);
  const { data: row } = await auth.admin.from("leads").select(FIELDS).eq("id", lead.id).maybeSingle();
  return NextResponse.json({ data: row ?? lead }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
