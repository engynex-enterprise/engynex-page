import { NextResponse } from "next/server";
import { apiError, apiKeyAuth, clampLimit, isoOrNull, jsonBody, str } from "@/lib/apiKeyAuth";

const FIELDS = "id, number, name, email, company, category, priority, subject, status, source, created_at, resolved_at";

/** GET /api/v1/tickets?since=ISO&status=open&limit=50 */
export async function GET(request: Request) {
  const auth = await apiKeyAuth(request, "tickets:read");
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  let query = auth.admin.from("tickets").select(FIELDS).order("created_at", { ascending: false }).limit(clampLimit(url.searchParams.get("limit")));
  const since = isoOrNull(url.searchParams.get("since"));
  if (since) query = query.gte("created_at", since);
  const status = url.searchParams.get("status");
  if (status) query = query.eq("status", status as "open");
  const { data, error } = await query;
  if (error) return apiError("server_error", 500);
  return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
}

/** POST /api/v1/tickets — abre una solicitud de soporte. */
export async function POST(request: Request) {
  const auth = await apiKeyAuth(request, "tickets:write");
  if ("error" in auth) return auth.error;
  const body = await jsonBody(request);
  if (!body) return apiError("invalid_json", 400);
  const p = {
    name: str(body.name, 120),
    email: str(body.email, 200),
    phone: str(body.phone, 40) ?? null,
    company: str(body.company, 160) ?? null,
    category: str(body.category, 40) ?? "other-technical",
    priority: str(body.priority, 10) ?? "medium",
    affected: str(body.affected, 120) ?? null,
    subject: str(body.subject, 200),
    description: str(body.description, 5000),
  };
  if (!p.name || !p.email || !p.description) return apiError("missing_fields", 422, "name, email y description son obligatorios");
  const { data, error } = await auth.admin.rpc("submit_ticket", { p });
  if (error) {
    if (error.message.includes("rate_limited")) return apiError("rate_limited", 429);
    return apiError("invalid", 422, error.message.slice(0, 200));
  }
  const ticket = data as { id: string; number: number };
  const { data: row } = await auth.admin.from("tickets").select(FIELDS).eq("id", ticket.id).maybeSingle();
  return NextResponse.json({ data: row ?? ticket }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
