import { NextResponse } from "next/server";
import { supportIssues } from "@/content/support";

const PRIORITIES = ["critical", "high", "medium", "low"] as const;

/**
 * Solicitudes del centro de soporte (/soporte).
 *
 * Igual que /api/contact: valida y registra en el log del servidor. Para
 * crear tickets reales, conecta aquí la mesa de ayuda o el envío de correo
 * (ver el TODO de app/api/contact/route.ts).
 */
export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const category = String(data.category ?? "");
  const priority = String(data.priority ?? "");
  const description = String(data.description ?? "").trim();
  const consent = data.consent === true || data.consent === "on";

  const valid =
    name.length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    supportIssues.some((issue) => issue.key === category) &&
    (PRIORITIES as readonly string[]).includes(priority) &&
    description.length > 0 &&
    consent;

  if (!valid) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 422 },
    );
  }

  // TODO: crear el ticket en la mesa de ayuda o notificar por correo.
  console.info("[support] Nueva solicitud:", {
    name,
    email,
    company: data.company,
    phone: data.phone,
    category,
    priority,
    affected: data.affected,
  });

  return NextResponse.json({ ok: true });
}
