import "server-only";
import { services } from "@/content/services";
import { formatCOP, servicePlans } from "@/content/pricing";
import { extraServiceFaqs } from "@/content/faqs";
import { siteConfig } from "@/lib/site";

/**
 * Base de conocimiento del asistente del chat: lo que el sitio ya publica
 * (servicios, planes con precio "desde", preguntas frecuentes, horario y
 * enlaces). Es lo ÚNICO que la IA puede afirmar sobre Engynex.
 */

type Hours = Record<string, [string, string]>;
type BotFaq = { keywords?: string[]; answer?: string; answer_en?: string };

const DAYS = { es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"], en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] };

function hoursText(hours: Hours | undefined, en: boolean) {
  if (!hours || !Object.keys(hours).length) return en ? "Not published." : "No publicado.";
  return Object.entries(hours)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([d, [from, to]]) => `${DAYS[en ? "en" : "es"][Number(d) % 7]} ${from}–${to}`)
    .join(", ");
}

function serviceBlock(slug: string, en: boolean, detailed: boolean) {
  const s = services.find((x) => x.slug === slug);
  if (!s) return "";
  const c = s[en ? "en" : "es"];
  const plans = (servicePlans[slug] ?? [])
    .map((p) => {
      const pc = p[en ? "en" : "es"];
      const price = p.price === null ? (en ? "custom quote" : "cotización a la medida") : `${en ? "from" : "desde"} ${formatCOP(p.price)}${p.billing === "monthly" ? (en ? "/month" : "/mes") : ""}`;
      return `  · ${pc.name}: ${price}${pc.note ? ` (${pc.note})` : ""}`;
    })
    .join("\n");
  const lines = [`- ${c.title} (${siteConfig.url}/${en ? "en" : "es"}/servicios/${slug}): ${c.tagline}. ${c.description}`];
  if (plans) lines.push(plans);
  if (detailed) {
    const faqs = [...c.faqs, ...(extraServiceFaqs[slug]?.[en ? "en" : "es"] ?? [])];
    for (const f of faqs.slice(0, 8)) lines.push(`  P: ${f.q}\n  R: ${f.a}`);
  }
  return lines.join("\n");
}

/** Texto de la base de conocimiento. `page` da prioridad al servicio de esa página. */
export function chatKnowledge({ locale, page, hours, botFaqs }: { locale: string | null; page: string | null; hours?: Hours; botFaqs?: BotFaq[] }) {
  const en = locale === "en";
  const pageSlug = page?.match(/\/servicios\/([a-z0-9-]+)/)?.[1] ?? null;
  const base = `${siteConfig.url}/${en ? "en" : "es"}`;
  const faqs = (botFaqs ?? [])
    .map((f) => (en ? f.answer_en || f.answer : f.answer))
    .filter(Boolean)
    .map((a) => `- ${a}`)
    .join("\n");
  return [
    `Empresa: Engynex (Colombia). Correo ${siteConfig.email} · Teléfono y WhatsApp ${siteConfig.phone} (https://wa.me/${siteConfig.whatsapp}).`,
    `Horario de atención (hora de Colombia): ${hoursText(hours, en)}.`,
    `Enlaces: planes ${base}/planes · cotizar ${base}/cotizar · agendar reunión ${base}/agendar · contacto ${base}/contacto.`,
    pageSlug ? `\nEl visitante escribe desde la página del servicio «${pageSlug}». Detalle de ese servicio:\n${serviceBlock(pageSlug, en, true)}` : "",
    `\nServicios y planes publicados (precios en COP, valores "desde"):\n${services.map((s) => serviceBlock(s.slug, en, false)).join("\n")}`,
    faqs ? `\nRespuestas aprobadas por el equipo:\n${faqs}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
