import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|monitor|curl|wget/i;

function deviceFrom(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|kindle|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

function browserFrom(ua: string) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Otro";
}

function osFrom(ua: string) {
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Otro";
}

/**
 * Recibe los eventos de la analítica propia (solo llegan si el visitante dio
 * consentimiento). Añade el país desde los encabezados del hosting y el tipo
 * de dispositivo; no guarda la IP.
 */
export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );

  if (body.type === "view") {
    const country =
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      null;
    const { data, error } = await supabase.rpc("track_page_view", {
      p: { ...body, device: deviceFrom(ua), browser: browserFrom(ua), os: osFrom(ua), country },
    });
    if (error) return new NextResponse(null, { status: 400 });
    return NextResponse.json({ id: data });
  }

  if (body.type === "event") {
    await supabase.rpc("track_event", { p: body as never });
    return new NextResponse(null, { status: 204 });
  }

  if (body.type === "leave") {
    await supabase.rpc("track_page_leave", { p: body as never });
    return new NextResponse(null, { status: 204 });
  }

  if (body.type === "forget" && typeof body.visitor_id === "string") {
    await supabase.rpc("forget_visitor", { p_visitor: body.visitor_id });
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, { status: 400 });
}
