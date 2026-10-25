import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { apiProfile } from "@/lib/apiAuth";

/** Tras cambiar una etiqueta pública, el sitio la toma sin esperar la caché. */
export async function POST() {
  if (!(await apiProfile(["admin"]))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  revalidateTag("integrations", "max");
  return NextResponse.json({ ok: true });
}
