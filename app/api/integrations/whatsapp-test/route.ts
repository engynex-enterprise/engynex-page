import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import { phoneInfo, whatsappMissing } from "@/lib/whatsapp";
import { hasSecretKey } from "@/lib/integrations";

/** "Probar conexión" de Integraciones: consulta el número en Meta. */
export async function POST() {
  const session = await apiProfile(["admin"]);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  // Sin la clave secreta el servidor no puede leer lo guardado en el portal.
  if (!hasSecretKey()) return NextResponse.json({ missing: ["SUPABASE_SECRET_KEY"] }, { status: 409 });
  const missing = await whatsappMissing();
  if (missing.length) return NextResponse.json({ missing }, { status: 409 });
  try {
    const info = await phoneInfo();
    return NextResponse.json({ name: info.verified_name, phone: info.display_phone_number, quality: info.quality_rating });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
