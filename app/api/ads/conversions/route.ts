import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { defaultConversionNames, getIntegrations, type IntegrationConfig } from "@/lib/integrations";

/**
 * Conversiones offline para Google Ads, en el formato de la plantilla
 * "Conversiones de clics" de Google. En Google Ads: Objetivos → Conversiones →
 * Cargas → Programar → HTTPS, con esta URL y el usuario/contraseña definidos
 * en el portal (Integraciones). Google la descarga a diario.
 *
 * Los nombres deben coincidir con las acciones de conversión creadas en
 * Google Ads (tipo "Importar → Conversiones de clics").
 */
const names = (c: IntegrationConfig) => ({
  qualified: c.ads_conversion_qualified || defaultConversionNames.qualified,
  meeting: c.ads_conversion_meeting || defaultConversionNames.meeting,
  won: c.ads_conversion_won || defaultConversionNames.won,
});

function authorized(header: string | null, c: IntegrationConfig) {
  const user = c.ads_feed_user;
  const password = c.ads_feed_password;
  if (!user || !password || !header?.startsWith("Basic ")) return false;
  const given = Buffer.from(header.slice(6), "base64");
  const expected = Buffer.from(`${user}:${password}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** "yyyy-MM-dd HH:mm:ss" en hora de Colombia (la zona va en la cabecera). */
function bogotaTime(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

const csv = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export async function GET(request: Request) {
  const config = await getIntegrations();
  if (!authorized(request.headers.get("authorization"), config)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="engynex-ads"' },
    });
  }

  if (!process.env.SUPABASE_SECRET_KEY) {
    return new Response("Not configured: SUPABASE_SECRET_KEY", { status: 503 });
  }
  const { data, error } = await createAdminClient().rpc("ads_offline_conversions", { p_days: 90 });
  if (error) return new Response(error.message, { status: 500 });

  const label = names(config);
  const lines = [
    "Parameters:TimeZone=America/Bogota",
    "Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency",
    ...(data ?? []).map((row) =>
      [
        csv(row.gclid),
        csv(label[row.kind as keyof typeof label] ?? row.kind),
        bogotaTime(row.converted_at),
        row.value != null ? String(row.value) : "",
        row.value != null ? "COP" : "",
      ].join(","),
    ),
  ];

  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
