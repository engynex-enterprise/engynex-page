import type { CampaignChannel } from "@/lib/supabase/types";

/**
 * Destinatario de una campaña con los mismos campos para los dos canales.
 * `status` es el estado "más avanzado": replied/read/delivered/sent en
 * WhatsApp; clicked/opened/delivered/sent/bounced en correo; o queued,
 * sending, failed, cancelled.
 */
export type RecipientRow = {
  id: string | number;
  lead_id: string | null;
  name: string | null;
  contact: string;
  status: string;
  error: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  /** WhatsApp: leído · Correo: abierto. */
  engaged_at: string | null;
  /** WhatsApp: respondió · Correo: clic. */
  acted_at: string | null;
  /** Veces que abrió el correo. */
  count?: number;
};

type WaRow = {
  id: number;
  lead_id: string | null;
  name: string | null;
  phone: string;
  status: string;
  error: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  replied_at: string | null;
};
type EmailRow = {
  id: number;
  lead_id: string | null;
  to_email: string | null;
  status: string;
  error: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  open_count: number | null;
  leads?: { name: string | null } | null;
};

/** Filas de wa_messages o de email_queue (con leads(name)) → RecipientRow. */
export function toRecipientRows(channel: CampaignChannel, rows: unknown[]): RecipientRow[] {
  if (channel === "whatsapp") {
    return (rows as WaRow[]).map((m) => ({
      id: m.id,
      lead_id: m.lead_id,
      name: m.name,
      contact: `+${m.phone}`,
      status: m.status === "failed" && m.error === "cancelled" ? "cancelled" : m.replied_at ? "replied" : m.status,
      error: m.error === "cancelled" ? null : m.error,
      sent_at: m.sent_at,
      delivered_at: m.delivered_at,
      engaged_at: m.read_at,
      acted_at: m.replied_at,
    }));
  }
  return (rows as EmailRow[]).map((q) => ({
    id: q.id,
    lead_id: q.lead_id,
    name: q.leads?.name ?? null,
    contact: q.to_email ?? "—",
    status: q.bounced_at
      ? "bounced"
      : q.status === "sent"
        ? q.clicked_at
          ? "clicked"
          : q.opened_at
            ? "opened"
            : q.delivered_at
              ? "delivered"
              : "sent"
        : q.status,
    error: q.bounced_at ? "bounced" : q.status === "cancelled" ? null : q.error,
    sent_at: q.sent_at,
    delivered_at: q.delivered_at,
    engaged_at: q.opened_at,
    acted_at: q.clicked_at,
    count: q.open_count ?? 0,
  }));
}
