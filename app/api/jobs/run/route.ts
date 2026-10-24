import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import { getIntegrations, hasSecretKey } from "@/lib/integrations";
import { runJobs } from "@/lib/jobs";

export const maxDuration = 60;

/**
 * Tareas programadas. La llama el programador de la base de datos (o Vercel
 * Cron) cada 5 minutos con `Authorization: Bearer <clave de tareas>`, o un
 * administrador con el botón "Ejecutar ahora" de Integraciones.
 */
async function run(request: Request) {
  if (!hasSecretKey()) return NextResponse.json({ error: "missing SUPABASE_SECRET_KEY" }, { status: 503 });
  const { cron_secret } = await getIntegrations();
  const bearer = request.headers.get("authorization");
  const viaCron = !!cron_secret && bearer === `Bearer ${cron_secret}`;
  if (!viaCron && !(await apiProfile(["admin"]))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const summary = await runJobs();
  return NextResponse.json({ ok: true, at: new Date().toISOString(), summary });
}

export const GET = run;
export const POST = run;
