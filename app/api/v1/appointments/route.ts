import { NextResponse } from "next/server";
import { apiError, apiKeyAuth, clampLimit, isoOrNull } from "@/lib/apiKeyAuth";

/** GET /api/v1/appointments?from=ISO&to=ISO&limit=50 — reuniones con su lead. */
export async function GET(request: Request) {
  const auth = await apiKeyAuth(request, "appointments:read");
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  let query = auth.admin
    .from("appointments")
    .select("id, starts_at, ends_at, channel, status, kind, meeting_url, location, lead:leads(id, name, email, phone, company)")
    .order("starts_at", { ascending: true })
    .limit(clampLimit(url.searchParams.get("limit")));
  const from = isoOrNull(url.searchParams.get("from"));
  const to = isoOrNull(url.searchParams.get("to"));
  if (from) query = query.gte("starts_at", from);
  if (to) query = query.lte("starts_at", to);
  const { data, error } = await query;
  if (error) return apiError("server_error", 500, error.message.slice(0, 200));
  return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
}
