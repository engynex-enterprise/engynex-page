import "server-only";
import { leadFormCopy, resourcesByProblem, type ProblemKey } from "@/content/leadForm";
import { siteConfig } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import { abandonedTexts, defaultFollowupConfig, stepTexts, type FollowupConfig } from "@/content/followupDefaults";

/**
 * Plantillas de correo. HTML sencillo con tablas y estilos en línea (lo que
 * mejor se ve en Gmail, Outlook y Apple Mail) y versión de texto.
 */

export type Rendered = { subject: string; html: string; text: string; unsubscribeUrl?: string };

export type TemplateLead = {
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

/** Reemplaza las variables de un texto plano (sin HTML). */
function fillPlain(text: string, vars: Record<string, string>) {
  const out = text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m)).replace(/^\s*,\s*/, "").trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/**
 * Cuerpo en HTML: párrafos separados por línea en blanco; {recursos} solo en
 * su párrafo se vuelve una lista; {portafolio} y {cotizar}, enlaces.
 */
function bodyHtml(text: string, plain: Record<string, string>, html: Record<string, string>) {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (block === "{recursos}") return html.recursos ?? "";
      const escaped = esc(block).replace(/\{(\w+)\}/g, (m, k: string) => html[k] ?? (k in plain ? esc(plain[k]) : m));
      return p(escaped.replace(/\n/g, "<br>"));
    })
    .join("");
}

const link = (url: string, label: string) => `<a href="${esc(url)}" style="color:${NAVY};font-weight:600">${esc(label)}</a>`;

/** Secuencia de seguimiento (hasta 5 correos; textos editables en el portal). */
export function followup(step: number, lead: TemplateLead, config: FollowupConfig = defaultFollowupConfig): Rendered {
  const l = loc(lead.locale);
  const es = l === "es";
  const unsub = unsubscribe(l, lead.email_token);
  const texts = stepTexts(config, step - 1, l);
  const labels = leadFormCopy[l].results.resourceLabels;
  const resources = (resourcesByProblem[lead.problem_category as ProblemKey] ?? resourcesByProblem.other).map((path) =>
    link(`${siteConfig.url}/${l}/${path}`, labels[path] ?? path),
  );
  const plain = { nombre: first(lead.name), empresa: lead.company ?? "" };
  const html = {
    recursos: list(resources),
    portafolio: link(`${siteConfig.url}/${l}/portafolio`, es ? "nuestro portafolio" : "our portfolio"),
    cotizar: link(quoteUrl(l), es ? "agenda aquí" : "book here"),
  };
  const plainLinks = { ...plain, recursos: resources.map((r) => r.replace(/<[^>]+>/g, "")).join(", "), portafolio: `${siteConfig.url}/${l}/portafolio`, cotizar: quoteUrl(l) };
  const subject = fillPlain(texts.subject, plain);
  const title = fillPlain(texts.title, plain);
  const cta = { label: fillPlain(texts.cta, plain), url: quoteUrl(l) };
  const body = bodyHtml(texts.body, plain, html);
  return {
    subject,
    html: layout({ preheader: subject, title, body, cta, footer: leadFooter(l, unsub) }),
    text: `${title}\n\n${fillPlain(texts.body, plainLinks)}\n\n${cta.label}: ${cta.url}\n\n${es ? "Dejar de recibir correos" : "Unsubscribe"}: ${unsub}`,
    unsubscribeUrl: oneClick(l, lead.email_token),
  };
}

const CHANNELS = {
  es: { meet: "videollamada (te enviamos el enlace)", call: "llamada telefónica", whatsapp: "WhatsApp", in_person: "reunión presencial" },
  en: { meet: "video call (we'll send the link)", call: "phone call", whatsapp: "WhatsApp", in_person: "in-person meeting" },
} as Record<Locale, Record<string, string>>;

export function bookingConfirmation(lead: TemplateLead): Rendered | null {
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

export function abandoned(
  draft: { name: string | null; token: string; locale: string | null },
  config: FollowupConfig = defaultFollowupConfig,
): Rendered {
  const l = loc(draft.locale);
  const texts = abandonedTexts(config, l);
  const url = `${siteConfig.url}/${l}/cotizar?retomar=${draft.token}`;
  const plain = { nombre: draft.name ? first(draft.name) : "", empresa: "" };
  const subject = fillPlain(texts.subject, plain);
  const title = fillPlain(texts.title, plain);
  const body = bodyHtml(texts.body, plain, {
    portafolio: link(`${siteConfig.url}/${l}/portafolio`, l === "es" ? "nuestro portafolio" : "our portfolio"),
    cotizar: link(url, l === "es" ? "termínala aquí" : "finish it here"),
  });
  return {
    subject,
    html: layout({ preheader: subject, title, body, cta: { label: fillPlain(texts.cta, plain), url }, footer: `Engynex · ${siteConfig.url.replace("https://", "")}` }),
    text: `${subject}\n\n${fillPlain(texts.body, { ...plain, cotizar: url, portafolio: `${siteConfig.url}/${l}/portafolio` })}\n\n${url}`,
  };
}

/** Aviso interno: llegó un lead verde. */
export function newLeadAlert(lead: TemplateLead): Rendered {
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

/**
 * Formato ligero sobre texto ya escapado: **negrita**, *negrita*, _cursiva_ y
 * enlaces (https://…) que se vuelven clicables.
 */
const inline = (html: string) =>
  html
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, "$1<strong>$2</strong>")
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>")
    .replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)]/g, (url) => `<a href="${url}" style="color:${NAVY};font-weight:600">${url}</a>`);

/** Correo escrito en una automatización o campaña (texto con saltos de línea). */
export function customEmail(payload: {
  subject?: string;
  preheader?: string | null;
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
    .map((block) => p(inline(esc(block)).replace(/\n/g, "<br>")))
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
    html: layout({ preheader: payload.preheader?.trim() || subject, title: subject, body: paragraphs, cta, footer }),
    text: `${payload.body ?? ""}${cta ? `\n\n${cta.label}: ${cta.url}` : ""}${unsub ? `\n\n${l === "es" ? "Dejar de recibir correos" : "Unsubscribe"}: ${unsub}` : ""}`,
    unsubscribeUrl: payload.email_token ? oneClick(l, payload.email_token) : undefined,
  };
}
