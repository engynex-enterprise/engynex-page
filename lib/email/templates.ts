import "server-only";
import { leadFormCopy, resourcesByProblem, type ProblemKey } from "@/content/leadForm";
import { siteConfig } from "@/lib/site";
import type { Locale } from "@/i18n/config";

/**
 * Plantillas de correo. HTML sencillo con tablas y estilos en línea (lo que
 * mejor se ve en Gmail, Outlook y Apple Mail) y versión de texto.
 */

export type Rendered = { subject: string; html: string; text: string; unsubscribeUrl?: string };

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  locale: string | null;
  tier: string;
  score: number;
  problem_category: string;
  problem_text: string | null;
  booking_token: string;
  email_token: string;
  appointment: { starts_at: string; channel: string } | null;
};

const NAVY = "#1F2A46";
const GREEN = "#9FDB4F";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;
const loc = (l: string | null | undefined): Locale => (l === "en" ? "en" : "es");

function layout(opts: { preheader: string; title: string; body: string; cta?: { label: string; url: string }; footer: string }) {
  const button = opts.cta
    ? `<tr><td style="padding:8px 0 24px"><a href="${esc(opts.cta.url)}" style="display:inline-block;background:${GREEN};color:${NAVY};font-weight:700;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:15px">${esc(opts.cta.label)}</a></td></tr>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#f1f4f9;font-family:Figtree,Segoe UI,Helvetica,Arial,sans-serif;color:#1c2333">
<span style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f4f9;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden">
<tr><td style="background:${NAVY};padding:22px 32px"><span style="color:#fff;font-weight:800;font-size:20px;letter-spacing:.5px">ENGYNEX</span></td></tr>
<tr><td style="padding:32px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-size:22px;font-weight:800;color:${NAVY};padding-bottom:16px">${esc(opts.title)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#3a4459;padding-bottom:20px">${opts.body}</td></tr>
${button}
</table></td></tr>
<tr><td style="padding:20px 32px;background:#f7f9fc;font-size:12px;line-height:1.5;color:#6b7489">${opts.footer}</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (s: string) => `<p style="margin:0 0 14px">${s}</p>`;
const list = (items: string[]) =>
  `<ul style="margin:0 0 14px;padding-left:20px">${items.map((i) => `<li style="margin:0 0 6px">${i}</li>`).join("")}</ul>`;

function leadFooter(locale: Locale, unsubscribeUrl: string) {
  const company = `Engynex · ${siteConfig.url.replace("https://", "")}`;
  return locale === "en"
    ? `${company}<br>You're receiving this because you asked us about a project. <a href="${unsubscribeUrl}" style="color:#6b7489">Unsubscribe</a>.`
    : `${company}<br>Recibes este correo porque nos escribiste sobre un proyecto. <a href="${unsubscribeUrl}" style="color:#6b7489">Dejar de recibir correos</a>.`;
}

const unsubscribe = (locale: Locale, token: string) => `${siteConfig.url}/${locale}/baja?t=${token}`;
/** Para el encabezado List-Unsubscribe (acepta POST de un clic). */
const oneClick = (locale: Locale, token: string) => `${siteConfig.url}/api/email/baja?t=${token}&l=${locale}`;
const quoteUrl = (locale: Locale) => `${siteConfig.url}/${locale}/cotizar`;

/** Secuencia para leads amarillos (3 correos). */
export function followup(step: 1 | 2 | 3, lead: Lead): Rendered {
  const l = loc(lead.locale);
  // Sin escapar: los títulos los escapa layout().
  const name = first(lead.name);
  const unsub = unsubscribe(l, lead.email_token);
  const labels = leadFormCopy[l].results.resourceLabels;
  const resources = (resourcesByProblem[lead.problem_category as ProblemKey] ?? resourcesByProblem.other).map(
    (path) => `<a href="${siteConfig.url}/${l}/${path}" style="color:${NAVY};font-weight:600">${esc(labels[path] ?? path)}</a>`,
  );
  const es = l === "es";

  const content = {
    1: {
      subject: es ? `${first(lead.name)}, esto te puede servir para tu proyecto` : `${first(lead.name)}, this may help with your project`,
      title: es ? `Hola, ${name}` : `Hi ${name}`,
      body:
        p(es ? "Gracias por contarnos lo que necesitas. Mientras preparamos ideas para tu caso, te dejamos esto:" : "Thanks for telling us what you need. While we prepare ideas for your case, here's something useful:") +
        list(resources) +
        p(es ? "Si prefieres hablarlo de una vez, agenda 20 minutos con un asesor:" : "If you'd rather talk it through now, book 20 minutes with an advisor:"),
      cta: { label: es ? "Agendar una llamada" : "Book a call", url: quoteUrl(l) },
    },
    2: {
      subject: es ? "¿Revisamos tu idea en 20 minutos?" : "Shall we review your idea in 20 minutes?",
      title: es ? `${name}, ¿lo vemos juntos?` : `${name}, shall we look at it together?`,
      body:
        p(es ? "En una llamada corta te decimos qué haríamos, cuánto tomaría y en qué rango de inversión estaría. Sin compromiso." : "In a short call we'll tell you what we'd do, how long it would take and the investment range. No commitment.") +
        p(es ? `También puedes ver <a href="${siteConfig.url}/${l}/portafolio" style="color:${NAVY};font-weight:600">proyectos parecidos</a> que ya hicimos.` : `You can also see <a href="${siteConfig.url}/${l}/portafolio" style="color:${NAVY};font-weight:600">similar projects</a> we've done.`),
      cta: { label: es ? "Elegir horario" : "Pick a time", url: quoteUrl(l) },
    },
    3: {
      subject: es ? "¿Seguimos o lo dejamos para más adelante?" : "Keep going or leave it for later?",
      title: es ? `${name}, una última pregunta` : `${name}, one last question`,
      body:
        p(es ? "No queremos llenarte el correo. ¿Tu proyecto sigue en pie? Responde este correo con un «sí» y te escribimos, o con un «más adelante» y te dejamos tranquilo." : "We don't want to flood your inbox. Is your project still on? Reply \"yes\" and we'll reach out, or \"later\" and we'll leave you be.") +
        p(es ? "Este es el último correo de esta serie." : "This is the last email in this series."),
      cta: { label: es ? "Agendar ahora" : "Book now", url: quoteUrl(l) },
    },
  }[step];

  const html = layout({ preheader: content.subject, title: content.title, body: content.body, cta: content.cta, footer: leadFooter(l, unsub) });
  const text = `${content.title}\n\n${content.body.replace(/<[^>]+>/g, "").replace(/\s+\n/g, "\n")}\n\n${content.cta.label}: ${content.cta.url}\n\n${es ? "Dejar de recibir correos" : "Unsubscribe"}: ${unsub}`;
  return { subject: content.subject, html, text, unsubscribeUrl: oneClick(l, lead.email_token) };
}

const CHANNELS = {
  es: { meet: "videollamada (te enviamos el enlace)", call: "llamada telefónica", whatsapp: "WhatsApp", in_person: "reunión presencial" },
  en: { meet: "video call (we'll send the link)", call: "phone call", whatsapp: "WhatsApp", in_person: "in-person meeting" },
} as Record<Locale, Record<string, string>>;

export function bookingConfirmation(lead: Lead): Rendered | null {
  if (!lead.appointment) return null;
  const l = loc(lead.locale);
  const es = l === "es";
  const when = new Intl.DateTimeFormat(es ? "es-CO" : "en-US", {
    weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota", timeZoneName: "short",
  }).format(new Date(lead.appointment.starts_at));
  const channel = CHANNELS[l][lead.appointment.channel] ?? lead.appointment.channel;
  const unsub = unsubscribe(l, lead.email_token);
  const subject = es ? `Reunión confirmada: ${when}` : `Meeting confirmed: ${when}`;
  const body =
    p(es ? `Hola ${esc(first(lead.name))}, quedó agendada tu reunión con Engynex:` : `Hi ${esc(first(lead.name))}, your meeting with Engynex is booked:`) +
    p(`<strong style="color:${NAVY};font-size:17px">${esc(when)}</strong><br>${esc(channel)}`) +
    p(es ? "Si necesitas cambiarla, responde este correo o escríbenos por WhatsApp." : "If you need to change it, reply to this email or message us on WhatsApp.");
  return {
    subject,
    html: layout({ preheader: subject, title: es ? "¡Nos vemos pronto!" : "See you soon!", body, footer: leadFooter(l, unsub) }),
    text: `${subject}\n${channel}\n\n${es ? "Si necesitas cambiarla, responde este correo." : "If you need to change it, reply to this email."}`,
    unsubscribeUrl: oneClick(l, lead.email_token),
  };
}

export function abandoned(draft: { name: string | null; token: string; locale: string | null }): Rendered {
  const l = loc(draft.locale);
  const es = l === "es";
  const name = draft.name ? first(draft.name) : "";
  const url = `${siteConfig.url}/${l}/cotizar?retomar=${draft.token}`;
  const subject = es ? `${name ? `${name}, ` : ""}tu cotización quedó a medio camino` : `${name ? `${name}, ` : ""}your quote is halfway done`;
  const body =
    p(es ? "Guardamos lo que alcanzaste a contarnos. Termínala en un minuto y, si tu proyecto encaja, eliges de una vez el horario para hablar." : "We saved what you told us. Finish it in a minute and, if your project fits, pick a time to talk right away.") +
    p(es ? "Nos escribes esto porque marcaste que podíamos ayudarte si no terminabas. No te enviaremos más recordatorios." : "You're getting this because you said we could help if you didn't finish. We won't send more reminders.");
  return {
    subject,
    html: layout({ preheader: subject, title: es ? "¿Terminamos tu cotización?" : "Shall we finish your quote?", body, cta: { label: es ? "Continuar donde quedé" : "Continue where I left off", url }, footer: `Engynex · ${siteConfig.url.replace("https://", "")}` }),
    text: `${subject}\n\n${url}`,
  };
}

/** Aviso interno: llegó un lead verde. */
export function newLeadAlert(lead: Lead): Rendered {
  const url = `${siteConfig.url}/es/portal/crm/${lead.id}`;
  const subject = `🟢 Lead verde: ${lead.name} (${lead.score}/100)`;
  const body =
    p(`<strong>${esc(lead.name)}</strong>${lead.company ? ` · ${esc(lead.company)}` : ""}<br>${esc(lead.email)} · ${esc(lead.phone)}`) +
    (lead.problem_text ? p(`<em>“${esc(lead.problem_text.slice(0, 600))}”</em>`) : "") +
    p("Contáctalo lo antes posible: los leads verdes se enfrían rápido.");
  return {
    subject,
    html: layout({ preheader: subject, title: "Nuevo lead verde", body, cta: { label: "Abrir en el CRM", url }, footer: "Aviso interno de Engynex · Puedes cambiar los destinatarios en Integraciones." }),
    text: `${subject}\n${lead.email} · ${lead.phone}\n${url}`,
  };
}

/** Informe semanal interno. */
export function weeklyReport(report: { week_start: string; data: Record<string, unknown> }): Rendered {
  const d = report.data as Record<string, number | null | Record<string, number> | { source: string; leads: number }[]>;
  const n = (v: unknown) => (typeof v === "number" ? v.toLocaleString("es-CO") : "—");
  const byTier = (d.by_tier ?? {}) as Record<string, number>;
  const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(d.won_value ?? 0));
  const prev = Number(d.leads_prev ?? 0);
  const delta = prev ? Math.round(((Number(d.leads ?? 0) - prev) / prev) * 100) : null;
  const rows: [string, string][] = [
    ["Visitantes medidos", n(d.visitors)],
    ["Leads", `${n(d.leads)}${delta !== null ? ` (${delta >= 0 ? "+" : ""}${delta}% vs. semana anterior)` : ""}`],
    ["Verdes / amarillos / rojos", `${byTier.green ?? 0} / ${byTier.yellow ?? 0} / ${byTier.red ?? 0}`],
    ["Reuniones agendadas", n(d.meetings)],
    ["Ventas ganadas", `${n(d.won)} · ${money}`],
    ["Oportunidades abiertas", n(d.pipeline_open)],
    ["Chats (respondidos)", `${n(d.chats)} (${d.chats_answered_pct ?? "—"}%)`],
    ["Satisfacción del chat", d.chat_rating != null ? `${d.chat_rating} / 5` : "—"],
    ["Solicitudes de soporte", `${n(d.tickets_opened)} nuevas · ${n(d.tickets_resolved)} resueltas · ${n(d.tickets_open)} abiertas`],
    ["WhatsApp (enviados / leídos / respondieron)", `${n(d.wa_sent)} / ${n(d.wa_read)} / ${n(d.wa_replied)}`],
    ["Correos automáticos enviados", n(d.emails_sent)],
  ];
  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e6eaf2;color:#6b7489">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #e6eaf2;text-align:right;font-weight:700;color:${NAVY}">${esc(v)}</td></tr>`)
    .join("")}</table>`;
  const sources = ((d.sources ?? []) as { source: string; leads: number }[]).map((s) => `${esc(s.source)}: ${s.leads}`);
  const week = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long" }).format(new Date(`${report.week_start}T12:00:00`));
  const subject = `Informe semanal Engynex · semana del ${week}`;
  const body = table + (sources.length ? `<p style="margin:18px 0 0"><strong>Fuentes de leads:</strong> ${sources.join(" · ")}</p>` : "");
  return {
    subject,
    html: layout({ preheader: subject, title: `Semana del ${week}`, body, cta: { label: "Ver en el portal", url: `${siteConfig.url}/es/portal/reportes` }, footer: "Informe automático de Engynex · Cada lunes a las 8 a.m." }),
    text: `${subject}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}`,
  };
}

/** Correo escrito en una automatización (texto con saltos de línea). */
export function customEmail(payload: {
  subject?: string;
  body?: string;
  cta_label?: string | null;
  cta_url?: string | null;
  locale?: string | null;
  email_token?: string | null;
  internal?: boolean;
}): Rendered {
  const l = loc(payload.locale);
  const subject = payload.subject?.trim() || "Engynex";
  const paragraphs = (payload.body ?? "")
    .split(/\n{2,}/)
    .map((block) => p(esc(block).replace(/\n/g, "<br>")))
    .join("");
  const cta = payload.cta_label && payload.cta_url ? { label: payload.cta_label, url: payload.cta_url } : undefined;
  const unsub = payload.email_token ? unsubscribe(l, payload.email_token) : null;
  const footer = payload.internal
    ? "Aviso interno de Engynex · Automatizaciones"
    : unsub
      ? leadFooter(l, unsub)
      : `Engynex · ${siteConfig.url.replace("https://", "")}`;
  return {
    subject,
    html: layout({ preheader: subject, title: subject, body: paragraphs, cta, footer }),
    text: `${payload.body ?? ""}${cta ? `\n\n${cta.label}: ${cta.url}` : ""}${unsub ? `\n\n${l === "es" ? "Dejar de recibir correos" : "Unsubscribe"}: ${unsub}` : ""}`,
    unsubscribeUrl: payload.email_token ? oneClick(l, payload.email_token) : undefined,
  };
}
