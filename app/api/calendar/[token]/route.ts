import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/site";

type Feed = {
  user: string;
  appointments: {
    id: string;
    starts_at: string;
    ends_at: string;
    status: string;
    channel: string;
    meeting_url: string | null;
    location: string | null;
    lead: string;
    company: string | null;
    lead_id: string;
    updated_at: string;
  }[];
  tasks: { id: string; title: string; due_at: string; done: boolean; updated_at: string }[];
};

const CHANNELS: Record<string, string> = { meet: "Videollamada", call: "Llamada", whatsapp: "WhatsApp", in_person: "Presencial" };

/** 20261024T153000Z */
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Texto de una propiedad ICS (RFC 5545 §3.3.11). */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Pliega líneas de más de 75 octetos (RFC 5545 §3.1). */
function fold(line: string) {
  const bytes = new TextEncoder();
  if (bytes.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    const limit = out.length ? 74 : 75; // las continuaciones empiezan con un espacio
    if (bytes.encode(current + ch).length > limit) {
      out.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.join("\r\n ");
}

/**
 * Calendario personal (agenda y tareas) para suscribirse desde Google
 * Calendar, Outlook o Apple. La URL lleva un token secreto por persona;
 * se puede cambiar desde Integraciones → Calendario.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const id = token.replace(/\.ics$/i, "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const { data, error } = await createAdminClient().rpc("calendar_feed_events", { p_token: id });
  if (error) return new Response("Error", { status: 500 });
  const feed = data as Feed | null;
  if (!feed) return new Response("Not found", { status: 404 });

  const now = stamp(new Date().toISOString());
  const portal = `${siteConfig.url}/es/portal`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Engynex//Portal//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`Engynex – ${feed.user}`)}`,
    "X-WR-TIMEZONE:America/Bogota",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const a of feed.appointments) {
    const title = `Reunión con ${a.lead}${a.company ? ` (${a.company})` : ""}`;
    const description = [
      `${CHANNELS[a.channel] ?? a.channel}${a.status === "done" ? " · realizada" : a.status === "no_show" ? " · no asistió" : ""}`,
      a.meeting_url ? `Enlace: ${a.meeting_url}` : "",
      `Ficha del lead: ${portal}/crm/${a.lead_id}`,
    ]
      .filter(Boolean)
      .join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:appt-${a.id}@engynex.com`,
      `DTSTAMP:${now}`,
      `LAST-MODIFIED:${stamp(a.updated_at)}`,
      `DTSTART:${stamp(a.starts_at)}`,
      `DTEND:${stamp(a.ends_at)}`,
      `SUMMARY:${esc(title)}`,
      `DESCRIPTION:${esc(description)}`,
      `STATUS:${a.status === "scheduled" ? "CONFIRMED" : "TENTATIVE"}`,
    );
    if (a.location || a.meeting_url) lines.push(`LOCATION:${esc(a.location || a.meeting_url || "")}`);
    if (a.meeting_url) lines.push(`URL:${esc(a.meeting_url)}`);
    if (a.status === "scheduled") lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(title)}`, "TRIGGER:-PT15M", "END:VALARM");
    lines.push("END:VEVENT");
  }

  for (const t of feed.tasks) {
    const start = new Date(t.due_at);
    const end = new Date(start.getTime() + 15 * 60_000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:task-${t.id}@engynex.com`,
      `DTSTAMP:${now}`,
      `LAST-MODIFIED:${stamp(t.updated_at)}`,
      `DTSTART:${stamp(start.toISOString())}`,
      `DTEND:${stamp(end.toISOString())}`,
      `SUMMARY:${esc(`${t.done ? "✔" : "☐"} ${t.title}`)}`,
      `DESCRIPTION:${esc(`Tarea del portal: ${portal}/tareas?t=${t.id}`)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="engynex.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
