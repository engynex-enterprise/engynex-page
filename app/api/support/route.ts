import { NextResponse } from "next/server";
import { supportIssues } from "@/content/support";
import { createClient } from "@/lib/supabase/server";

const PRIORITIES = ["critical", "high", "medium", "low"] as const;

/**
 * Solicitudes del centro de soporte (/soporte).
 *
 * Valida y crea el ticket en la base de datos (submit_ticket). Si la persona
 * inició sesión en el portal, el ticket queda en su cuenta y lo sigue desde
 * "Mis solicitudes". Devuelve el número del ticket.
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

  const supabase = await createClient();
  const { data: ticket, error } = await supabase.rpc("submit_ticket", {
    p: {
      name,
      email,
      company: String(data.company ?? ""),
      phone: String(data.phone ?? ""),
      category,
      priority,
      affected: String(data.affected ?? ""),
      description,
    },
  });
  if (error) {
    const limited = error.message.includes("rate_limited");
    return NextResponse.json({ error: limited ? "rate_limited" : "failed" }, { status: limited ? 429 : 500 });
  }

  return NextResponse.json({ ok: true, number: (ticket as { number: number }).number });
}
