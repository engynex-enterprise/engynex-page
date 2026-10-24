import "server-only";

/**
 * Envío de correo con Resend (https://resend.com). La clave y el remitente se
 * configuran en Integraciones. RESEND_API_BASE solo sirve para pruebas.
 */
export type OutgoingEmail = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Enlace de baja: Gmail y Outlook muestran el botón "Cancelar suscripción". */
  unsubscribeUrl?: string;
};

export async function sendEmail(apiKey: string, email: OutgoingEmail): Promise<string> {
  const base = process.env.RESEND_API_BASE ?? "https://api.resend.com";
  const res = await fetch(`${base}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: email.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...(email.replyTo && { reply_to: email.replyTo }),
      ...(email.unsubscribeUrl && {
        headers: {
          "List-Unsubscribe": `<${email.unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
  if (!res.ok || !data.id) throw new Error(data.message ?? data.name ?? `HTTP ${res.status}`);
  return data.id;
}
