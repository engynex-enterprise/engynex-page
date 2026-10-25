import { NextResponse } from "next/server";
import { searchDomains } from "@/lib/domains";

/** Límite por IP: 20 búsquedas por minuto (por instancia del servidor). */
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 20;
}

/** Búsqueda pública de dominios: disponibilidad y precio en COP. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  if (q.length < 1 || q.length > 80) return NextResponse.json({ error: "invalid" }, { status: 422 });
  try {
    const res = await searchDomains(q);
    if (!res) return NextResponse.json({ error: "invalid" }, { status: 422 });
    return NextResponse.json(res, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("domain search", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
