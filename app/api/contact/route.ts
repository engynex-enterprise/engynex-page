import { NextResponse } from "next/server";

/**
 * Endpoint de contacto.
 *
 * Actualmente valida los datos y responde OK (registra en el log del servidor).
 * Para enviar correos reales, integra un proveedor como Resend, SendGrid o
 * Nodemailer aquí abajo donde está el comentario TODO.
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
  const message = String(data.message ?? "").trim();

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !emailOk || !message) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 422 },
    );
  }

  // TODO: integrar envío de correo real, por ejemplo con Resend:
  //   import { Resend } from "resend";
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({ from, to: "hola@engynex.com", subject, html });
  console.info("[contact] Nuevo mensaje recibido:", {
    name,
    email,
    company: data.company,
    phone: data.phone,
    service: data.service,
  });

  return NextResponse.json({ ok: true });
}
