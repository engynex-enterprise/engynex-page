import type { Locale } from "@/i18n/config";

/**
 * Guías de cada integración (por slug de lib/integrationCatalog.ts):
 * una parte para cualquier persona y otra técnica. En los textos,
 * {site} se reemplaza por la URL del sitio (p. ej. https://engynex.com).
 */
export type IntegrationGuide = {
  /** Una frase: qué hace por el negocio. */
  summary: string;
  /** Para qué sirve, en palabras simples (2-4 viñetas). */
  benefits: string[];
  /** Qué cuesta y de qué depende. */
  cost: string;
  /** Lo que hay que tener antes de empezar. */
  before: string[];
  /** Paso a paso sin tecnicismos. */
  steps: { title: string; body: string }[];
  /** Cómo saber que quedó funcionando. */
  verify: string[];
  technical: {
    /** Cómo funciona por dentro (2-4 párrafos cortos). */
    how: string[];
    /** Cada clave: de dónde sale y su formato. */
    fields?: { key: string; where: string; format: string }[];
    /** URLs que hay que pegar en el tercero (webhooks, feeds). */
    endpoints?: { label: string; method: string; url: string; note?: string }[];
    /** Permisos o eventos que hay que activar. */
    permissions?: string[];
    /** Ejemplo de código o de carga (JSON, curl). */
    examples?: { title: string; lang: "json" | "bash" | "js" | "html" | "text"; code: string }[];
    security: string[];
    limits?: string[];
  };
  /** Problemas comunes y su solución. */
  troubleshooting: { problem: string; fix: string }[];
};

export type IntegrationGuides = Record<string, IntegrationGuide>;

// ---------------------------------------------------------------------------
// Fragmentos técnicos compartidos (iguales en ambos idiomas)
// ---------------------------------------------------------------------------

const WEBHOOK_PAYLOAD = `{
  "id": 1842,
  "event": "lead_created",
  "created_at": "2026-10-24T15:04:05.123Z",
  "data": {
    "entity": "lead",
    "id": "3f7c9a2e-…",
    "lead_id": "3f7c9a2e-…",
    "nombre": "Ana Gómez",
    "empresa": "Tienda Ana SAS",
    "correo": "ana@tiendaana.co",
    "telefono": "3001234567",
    "puntaje": 82,
    "color": "green",
    "status": "new",
    "fuente": "web",
    "enlace": "https://engynex.com/es/portal/crm/3f7c9a2e-…"
  }
}`;

const WEBHOOK_VERIFY_JS = `// Node.js (Express): usa el cuerpo CRUDO, no el JSON ya parseado.
import crypto from "node:crypto";
import express from "express";

const app = express();
const SECRET = process.env.ENGYNEX_WEBHOOK_SECRET; // whsec_…

app.post("/engynex", express.raw({ type: "application/json" }), (req, res) => {
  const received = String(req.get("X-Engynex-Signature") || "").replace("sha256=", "");
  const expected = crypto.createHmac("sha256", SECRET).update(req.body).digest("hex");
  const ok =
    received.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
  if (!ok) return res.status(401).send("bad signature");

  const event = JSON.parse(req.body.toString("utf8"));
  // Idempotencia: guarda event.id (X-Engynex-Delivery) y descarta repetidos.
  console.log(event.event, event.data);
  res.sendStatus(200); // responde rápido (menos de 8 s)
});`;

const API_CURL_CREATE_LEAD = `curl -X POST "{site}/api/v1/leads" \\
  -H "Authorization: Bearer egx_tu_clave" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Ana Gómez",
    "email": "ana@tiendaana.co",
    "phone": "3001234567",
    "company": "Tienda Ana SAS",
    "problem_category": "web",
    "problem_text": "Necesitamos una tienda en línea",
    "budget": "5to15",
    "decision": "self",
    "timeline": "month",
    "consent": true,
    "source": "zapier"
  }'`;

const API_CURL_LIST = `# Leads creados desde una fecha (máx. 50 por página)
curl "{site}/api/v1/leads?since=2026-10-01T00:00:00Z&limit=50" \\
  -H "Authorization: Bearer egx_tu_clave"

# Reuniones de un rango
curl "{site}/api/v1/appointments?from=2026-10-01&to=2026-10-31" \\
  -H "Authorization: Bearer egx_tu_clave"`;

const API_CURL_TICKET = `curl -X POST "{site}/api/v1/tickets" \\
  -H "Authorization: Bearer egx_tu_clave" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Carlos Ruiz",
    "email": "carlos@empresa.co",
    "category": "web",
    "priority": "high",
    "subject": "El formulario de contacto no envía",
    "description": "Desde ayer el botón Enviar no responde en el celular."
  }'`;

const API_ERRORS = `HTTP 401 {"error":"invalid_key"}     clave inexistente o revocada
HTTP 403 {"error":"missing_scope"}   la clave no tiene ese permiso
HTTP 422 {"error":"invalid"}         faltan campos o un valor no es válido
HTTP 429 {"error":"rate_limited"}    más de 600 peticiones por hora`;

const GADS_FEED = `Parameters:TimeZone=America/Bogota
Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency
Cj0KCQjw…,Lead calificado,2026-10-20 09:14:02,,
Cj0KCQjw…,Reunion agendada,2026-10-21 15:30:00,,
Cj0KCQjw…,Venta,2026-10-24 11:02:45,12000000,COP`;

const TEAM_CHAT_SLACK = `curl -X POST "https://hooks.slack.com/services/T000/B000/XXXX" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"🟢 Nuevo lead verde: *Ana Gómez* (Tienda Ana SAS)\\n<https://engynex.com/es/portal/crm/…|Abrir en el portal>"}'`;

const ZAP_STEPS_JSON = `// Lo que recibe Zapier, Make o n8n en cada evento (cuerpo JSON):
${WEBHOOK_PAYLOAD}`;

const ICS_SAMPLE = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Engynex//Portal//ES
BEGIN:VEVENT
UID:appointment-…@engynex.com
DTSTART:20261028T150000Z
DTEND:20261028T153000Z
SUMMARY:Reunión con Ana Gómez (Tienda Ana SAS)
URL:https://engynex.com/es/portal/crm/…
END:VEVENT
END:VCALENDAR`;

// ---------------------------------------------------------------------------
// Español
// ---------------------------------------------------------------------------

const es: IntegrationGuides = {
  "google-tag-manager": {
    summary: "Un solo lugar para manejar todas las etiquetas de medición y anuncios de tu sitio, sin pedirle cambios al programador.",
    benefits: [
      "Agregas o cambias etiquetas (Analytics, Google Ads, Hotjar, LinkedIn…) desde el panel de Google, sin tocar el código.",
      "El sitio ya envía los eventos importantes: lead enviado (generate_lead), reunión agendada (book_appointment) y contacto por WhatsApp o teléfono (contact).",
      "Respeta las cookies: nada se carga hasta que el visitante acepta.",
    ],
    cost: "Gratis. Solo pagas los anuncios que configures dentro (por ejemplo, Google Ads).",
    before: [
      "Una cuenta de Google (ideal la de la empresa, no una personal).",
      "Decidir si vas a usar Tag Manager o los campos directos de GA4 y Google Ads de este portal: usa uno solo.",
    ],
    steps: [
      { title: "Crea la cuenta y el contenedor", body: "Entra a Tag Manager, crea una cuenta con el nombre de tu empresa y un contenedor de tipo «Web» con la dirección de tu sitio." },
      { title: "Copia el ID", body: "Arriba a la derecha verás un código como GTM-ABC1234. Cópialo (no hace falta el código de instalación: el sitio ya lo tiene)." },
      { title: "Pégalo aquí", body: "En esta integración pega el ID en «ID de Google Tag Manager» y guarda. Aplica de inmediato." },
      { title: "Deja vacíos GA4 y Google Ads", body: "Si usas Tag Manager, configura GA4 y Google Ads dentro de GTM y borra esos IDs de este portal; si no, cada visita se contaría dos veces." },
      { title: "Crea las etiquetas en GTM", body: "Por ejemplo: «Etiqueta de Google» con tu ID de GA4, y una etiqueta de conversión de Google Ads que se active con el evento personalizado generate_lead." },
      { title: "Publica", body: "En GTM pulsa «Enviar» y luego «Publicar». Hasta que publiques, los cambios no salen al sitio." },
    ],
    verify: [
      "En GTM usa «Vista previa», abre tu sitio, acepta las cookies y revisa que aparezcan los eventos page_view y, al enviar el formulario, generate_lead.",
      "En esta página la integración aparece como «Conectado».",
    ],
    technical: {
      how: [
        "El ID se guarda en integration_settings (público) y el navegador lo lee con la función public_tag_config() al cargar la página (lib/tracking.ts).",
        "Con GTM configurado, el sitio solo hace dataLayer.push: page_view (con page_path), generate_lead (lead_tier, lead_category, lead_qualified), book_appointment y contact (contact_channel). No carga gtag.js por su cuenta.",
        "Consent Mode v2 en modo básico: el script de GTM no se inyecta hasta que el visitante acepta analítica o marketing; si retira el permiso se borran las cookies.",
      ],
      fields: [{ key: "gtm_id", where: "Tag Manager → arriba a la derecha del contenedor", format: "GTM-XXXXXXX (4 a 12 letras o números)" }],
      examples: [
        {
          title: "Eventos que empuja el sitio al dataLayer",
          lang: "js",
          code: `dataLayer.push({ event: "page_view", page_path: "/es/servicios" });
dataLayer.push({ event: "generate_lead", lead_tier: "green", lead_category: "web", lead_qualified: true });
dataLayer.push({ event: "book_appointment" });
dataLayer.push({ event: "contact", contact_channel: "whatsapp" });`,
        },
      ],
      security: [
        "Cualquiera con permiso de publicar en GTM puede inyectar scripts en tu sitio: da acceso de publicación solo a personas de confianza y activa la verificación en dos pasos.",
        "No pongas datos personales (correo, teléfono) en etiquetas de terceros.",
      ],
    },
    troubleshooting: [
      { problem: "Las visitas o conversiones salen dobles en Analytics.", fix: "Tienes GA4 configurado dos veces: dentro de GTM y en el campo GA4 de este portal. Borra el ID de GA4 de aquí." },
      { problem: "En «Vista previa» no aparece nada.", fix: "Acepta las cookies del sitio: sin consentimiento no se carga GTM. Revisa también que el contenedor esté publicado." },
      { problem: "El evento generate_lead no activa la conversión.", fix: "En GTM el activador debe ser «Evento personalizado» con el nombre exacto generate_lead (en minúsculas)." },
      { problem: "Cambié algo en GTM y no se ve en el sitio.", fix: "Falta pulsar «Publicar» en GTM, o el navegador tiene la versión anterior en caché: recarga con Ctrl+Shift+R." },
    ],
  },

  "google-analytics": {
    summary: "Mide cuántas personas visitan tu sitio, de dónde vienen y cuáles terminan pidiendo información.",
    benefits: [
      "Ves qué canales (Google, redes, correo) traen visitas que se convierten en leads.",
      "Recibe los eventos de lead enviado y reunión agendada para medir conversiones.",
      "Complementa la Analítica propia del portal con datos de Google (demografía, búsquedas).",
    ],
    cost: "Gratis (la versión estándar de GA4).",
    before: ["Una cuenta de Google de la empresa.", "Si ya usas Google Tag Manager, configura GA4 dentro de GTM y deja este campo vacío."],
    steps: [
      { title: "Crea la propiedad", body: "En Analytics ve a Administrar → Crear → Propiedad. Elige zona horaria Colombia y moneda peso colombiano." },
      { title: "Crea un flujo de datos web", body: "Dentro de la propiedad: Flujos de datos → Web → escribe la dirección de tu sitio." },
      { title: "Copia el ID de medición", body: "En el flujo verás «ID de medición» con forma G-XXXXXXXXXX. Cópialo." },
      { title: "Pégalo aquí", body: "Pégalo en «ID de medición de GA4» y guarda." },
      { title: "Marca las conversiones", body: "En Analytics → Administrar → Eventos, cuando aparezcan generate_lead y book_appointment, márcalos como «evento clave»." },
    ],
    verify: [
      "Abre tu sitio, acepta las cookies y mira en Analytics → Informes → Tiempo real: deberías aparecer en menos de un minuto.",
      "Envía un formulario de prueba y revisa que llegue el evento generate_lead.",
    ],
    technical: {
      how: [
        "Sin GTM, el sitio carga gtag.js con el ID de GA4 solo después del consentimiento de analítica y envía page_view en cada cambio de página.",
        "Eventos: gtag('event', 'generate_lead', { lead_tier, lead_category }) y gtag('event', 'book_appointment').",
        "Consent Mode v2 básico: no hay pings sin consentimiento (no hay modelado de conversiones para quien rechaza).",
      ],
      fields: [{ key: "ga4_id", where: "Analytics → Administrar → Flujos de datos → tu flujo web", format: "G- seguido de 4 a 16 letras o números" }],
      security: ["No envíes datos personales a GA4 (lo prohíben sus términos). El sitio solo envía categoría y color del lead, nunca nombre ni correo."],
      limits: ["Los informes estándar tardan hasta 24-48 horas; usa «Tiempo real» para comprobar."],
    },
    troubleshooting: [
      { problem: "No aparezco en Tiempo real.", fix: "Acepta las cookies de analítica, desactiva bloqueadores de anuncios y revisa que el ID empiece por G- (no por UA-)." },
      { problem: "Las visitas salen duplicadas.", fix: "Tienes GA4 también dentro de GTM. Deja el ID solo en un lugar." },
      { problem: "Los números no coinciden con la Analítica del portal.", fix: "Es normal: GA4 solo cuenta a quien acepta cookies y algunos navegadores bloquean Google. La analítica del portal es propia y sin cookies de terceros." },
    ],
  },

  "search-console": {
    summary: "Te dice cómo te encuentra la gente en Google: qué búsquedas te muestran, cuántos clics recibes y si hay páginas con errores.",
    benefits: [
      "Ves las palabras con las que te encuentran y en qué posición apareces.",
      "Te avisa si Google no puede leer alguna página o si el sitio tiene problemas en celular.",
      "Puedes pedirle a Google que revise una página nueva al instante.",
    ],
    cost: "Gratis.",
    before: ["Una cuenta de Google de la empresa."],
    steps: [
      { title: "Agrega la propiedad", body: "Entra a Search Console → Agregar propiedad → «Prefijo de la URL» y escribe la dirección exacta del sitio (con https://)." },
      { title: "Elige «Etiqueta HTML»", body: "En los métodos de verificación abre «Etiqueta HTML». Verás algo como <meta name=\"google-site-verification\" content=\"AbC123…\" />." },
      { title: "Copia solo el código", body: "Copia únicamente lo que está entre comillas después de content= (sin el resto de la etiqueta)." },
      { title: "Pégalo aquí y guarda", body: "Pégalo en «Verificación de Google Search Console» y guarda." },
      { title: "Verifica", body: "Vuelve a Search Console y pulsa «Verificar». Si falla, espera un par de minutos y repite." },
      { title: "Envía el mapa del sitio", body: "En Search Console → Sitemaps escribe sitemap.xml y envíalo." },
    ],
    verify: ["Search Console muestra «Propiedad verificada».", "En unos días empiezan a llenarse los informes de Rendimiento."],
    technical: {
      how: [
        "El código se guarda como valor público y el sitio lo imprime en el <head> de todas las páginas como <meta name=\"google-site-verification\" content=\"…\">.",
        "No depende de cookies ni del consentimiento: es solo una etiqueta meta.",
      ],
      fields: [{ key: "gsc_verification", where: "Search Console → Verificación → Etiqueta HTML → valor de content", format: "20 a 80 letras, números, guion o guion bajo" }],
      endpoints: [{ label: "Mapa del sitio para enviar", method: "GET", url: "{site}/sitemap.xml" }],
      security: ["No borres el código después de verificar: Google revisa periódicamente y podrías perder el acceso."],
    },
    troubleshooting: [
      { problem: "«No se encontró la etiqueta meta».", fix: "Pegaste la etiqueta completa en vez del código. Deja solo el valor de content. También confirma que verificas la misma dirección (con o sin www)." },
      { problem: "Tengo el dominio verificado por DNS y no quiero la etiqueta.", fix: "Puedes dejar este campo vacío: la verificación por DNS también sirve." },
      { problem: "Las páginas «Descubiertas: actualmente sin indexar».", fix: "Es normal en sitios nuevos. Usa «Inspección de URLs → Solicitar indexación» en las páginas importantes." },
    ],
  },

  "bing-webmaster": {
    summary: "Lo mismo que Search Console pero para Bing (y los asistentes que usan su índice, como Copilot).",
    benefits: [
      "Apareces mejor en Bing, Yahoo, DuckDuckGo y Copilot.",
      "Te muestra errores de rastreo y palabras clave.",
      "Puedes importar tu configuración de Google Search Console en dos clics.",
    ],
    cost: "Gratis.",
    before: ["Una cuenta de Microsoft (o inicia sesión con Google)."],
    steps: [
      { title: "Agrega el sitio", body: "Entra a Bing Webmaster Tools → Agregar sitio. Si ya tienes Search Console, puedes usar «Importar» y no necesitas este campo." },
      { title: "Elige «Etiqueta meta HTML»", body: "Verás <meta name=\"msvalidate.01\" content=\"…\" />." },
      { title: "Copia el código", body: "Copia solo el valor de content (32 caracteres, letras A-F y números)." },
      { title: "Pégalo y guarda", body: "Pégalo en «Verificación de Bing» y guarda; luego pulsa «Verificar» en Bing." },
      { title: "Envía el mapa del sitio", body: "En Sitemaps agrega {site}/sitemap.xml." },
    ],
    verify: ["Bing muestra el sitio como verificado.", "En unos días aparecen datos en «Rendimiento de búsqueda»."],
    technical: {
      how: ["Se imprime en el <head> como <meta name=\"msvalidate.01\" content=\"…\">. No usa cookies."],
      fields: [{ key: "bing_verification", where: "Bing Webmaster → Verificar → Etiqueta meta HTML", format: "32 caracteres hexadecimales" }],
      endpoints: [{ label: "Mapa del sitio", method: "GET", url: "{site}/sitemap.xml" }],
      security: ["Mantén el código mientras uses Bing Webmaster."],
    },
    troubleshooting: [
      { problem: "«Formato no válido» al guardar.", fix: "Pegaste la etiqueta completa. El código tiene exactamente 32 caracteres (0-9 y A-F)." },
      { problem: "La verificación falla.", fix: "Comprueba que el sitio agregado en Bing sea exactamente la dirección publicada (https y www iguales)." },
    ],
  },

  "microsoft-clarity": {
    summary: "Grabaciones anónimas de cómo navegan las personas y mapas de calor de dónde hacen clic.",
    benefits: [
      "Ves en video (sin datos personales) dónde se traban los visitantes, por ejemplo en el formulario.",
      "Mapas de calor: qué secciones miran y cuáles ignoran.",
      "Detecta «clics de rabia» y errores de JavaScript.",
    ],
    cost: "Gratis, sin límite de tráfico.",
    before: ["Una cuenta de Microsoft, Google o Facebook para entrar a Clarity."],
    steps: [
      { title: "Crea el proyecto", body: "Entra a Clarity → Nuevo proyecto → nombre y dirección del sitio." },
      { title: "Copia el ID del proyecto", body: "En Configuración → Información general verás «ID del proyecto» (unas 10 letras y números en minúscula)." },
      { title: "Pégalo aquí", body: "Pégalo en «ID de Microsoft Clarity» y guarda. No instales el código que te propone Clarity: el sitio ya lo carga." },
      { title: "Activa el enmascaramiento", body: "En Clarity → Configuración → Enmascaramiento deja el modo «Equilibrado» o «Estricto» para que no se vean textos escritos." },
    ],
    verify: ["Navega el sitio aceptando las cookies; en 30 minutos a 2 horas aparecen las primeras grabaciones en Clarity."],
    technical: {
      how: [
        "El ID es público y se lee con public_tag_config(). El script de Clarity se inyecta solo si el visitante aceptó cookies de analítica.",
        "Clarity enmascara por defecto campos de formulario; las grabaciones no incluyen contraseñas ni datos de tarjeta.",
      ],
      fields: [{ key: "clarity_id", where: "Clarity → Configuración → Información general → ID del proyecto", format: "6 a 20 letras minúsculas o números" }],
      security: ["Revisa que el enmascaramiento esté activo, sobre todo en el portal y en formularios.", "Menciona Clarity en tu política de cookies (analítica)."],
    },
    troubleshooting: [
      { problem: "No llegan grabaciones.", fix: "Clarity tarda hasta 2 horas. Acepta las cookies de analítica y desactiva bloqueadores." },
      { problem: "Se ven textos que no deberían.", fix: "Cambia el enmascaramiento a «Estricto» en la configuración del proyecto." },
    ],
  },

  "google-ads": {
    summary: "Mide qué anuncios traen leads, reuniones y ventas reales, y se lo cuenta a Google para que tus campañas busquen más clientes así.",
    benefits: [
      "Conversión al instante cuando llega un lead verde o amarillo y cuando alguien agenda.",
      "Conversiones offline: cuando en el CRM el lead pasa a calificado, reunión o venta (con su valor), Google Ads se entera cada día.",
      "Tus campañas aprenden a buscar clientes que compran, no solo personas que llenan formularios.",
    ],
    cost: "Configurar la medición es gratis; pagas los clics de tus anuncios según tu presupuesto.",
    before: [
      "Una cuenta de Google Ads con facturación activa.",
      "Activar el etiquetado automático (auto-tagging) en Google Ads → Configuración de la cuenta, para que llegue el gclid.",
      "Si usas Tag Manager, crea las conversiones dentro de GTM y deja vacíos el ID y las etiquetas de aquí.",
    ],
    steps: [
      { title: "Copia el ID de la cuenta", body: "En Google Ads → Objetivos → Conversiones → Configuración → «Etiqueta de Google» verás un ID como AW-123456789. Pégalo en «ID de Google Ads»." },
      { title: "Crea la conversión de lead", body: "Objetivos → Conversiones → Nueva → Sitio web → configuración manual, categoría «Enviar formulario de clientes potenciales». En «Instalar la etiqueta» copia la «etiqueta de conversión» (lo que va después de la barra en send_to) y pégala en «Etiqueta: conversión de lead»." },
      { title: "Crea la conversión de reunión", body: "Repite con la categoría «Reservar cita» y pega su etiqueta en «Etiqueta: conversión de reunión agendada»." },
      { title: "Crea las tres conversiones offline", body: "Nueva → Importar → «Conversiones de clics» (otras fuentes). Créalas con estos nombres exactos (o los que pongas aquí): Lead calificado, Reunion agendada y Venta." },
      { title: "Genera usuario y contraseña del feed", body: "En la sección de conversiones offline escribe un usuario y pulsa «Generar» para la contraseña. Guarda." },
      { title: "Programa la carga", body: "En Google Ads → Objetivos → Conversiones → Cargas → Programaciones → HTTPS: pega la URL del feed, el usuario y la contraseña, frecuencia diaria." },
    ],
    verify: [
      "Las conversiones web pasan de «Sin conversiones recientes» a «Registrando conversiones» en 24-48 h.",
      "En Cargas → historial verás cada descarga del feed con sus filas aceptadas.",
      "La tabla «Próximo envío» de esta página muestra lo que Google descargará.",
    ],
    technical: {
      how: [
        "Conversiones web: sin GTM, el sitio carga gtag.js (tras consentimiento de marketing) y envía gtag('event', 'conversion', { send_to: 'AW-ID/etiqueta' }) solo con leads verdes y amarillos, y al agendar.",
        "El gclid se guarda en el lead al llegar desde un anuncio. La función ads_offline_conversions(90 días) arma las conversiones a partir del CRM: calificado, reunión y venta ganada (con su valor en COP).",
        "El feed es un CSV en el formato de la plantilla «Conversiones de clics» de Google, con zona horaria America/Bogota, protegido con autenticación básica (comparación en tiempo constante).",
      ],
      fields: [
        { key: "google_ads_id", where: "Google Ads → Etiqueta de Google", format: "AW- y 6 a 14 dígitos" },
        { key: "google_ads_lead_label", where: "Conversión de lead → Instalar la etiqueta → send_to después de la barra", format: "4 a 64 letras, números, - o _" },
        { key: "google_ads_booking_label", where: "Conversión de reunión → send_to después de la barra", format: "4 a 64 letras, números, - o _" },
        { key: "ads_feed_user", where: "Lo defines tú", format: "3 a 64 caracteres (letras, números, . _ -)" },
        { key: "ads_feed_password", where: "Botón «Generar»", format: "Mínimo 12 caracteres, se guarda cifrada" },
        { key: "ads_conversion_qualified / meeting / won", where: "Nombres exactos de las acciones de importación en Google Ads", format: "2 a 100 caracteres" },
      ],
      endpoints: [{ label: "Feed de conversiones offline (CSV)", method: "GET", url: "{site}/api/ads/conversions", note: "Autenticación básica HTTP con el usuario y la contraseña de esta sección." }],
      examples: [
        { title: "Ejemplo de lo que descarga Google", lang: "text", code: GADS_FEED },
        { title: "Probar el feed desde la terminal", lang: "bash", code: `curl -u "usuario:contraseña" "{site}/api/ads/conversions"` },
      ],
      security: [
        "La contraseña del feed se guarda cifrada en Supabase Vault y solo se ve su final.",
        "El feed no incluye nombres, correos ni teléfonos: solo gclid, nombre de conversión, fecha y valor.",
      ],
      limits: ["Google solo acepta conversiones de clics de los últimos 90 días y con gclid de la misma cuenta.", "El feed necesita SUPABASE_SECRET_KEY en el servidor (si no, responde 503)."],
    },
    troubleshooting: [
      { problem: "La carga programada falla con 401.", fix: "Usuario o contraseña distintos a los guardados aquí. Vuelve a generar la contraseña, guarda y actualízala en Google Ads." },
      { problem: "Google dice «Nombre de conversión no encontrado».", fix: "Los nombres de aquí deben ser idénticos (mayúsculas y tildes incluidas) a las acciones de importación creadas en Google Ads." },
      { problem: "El feed está vacío.", fix: "Solo aparecen leads que llegaron con gclid (desde un anuncio, con auto-tagging activo) y que avanzaron en el CRM." },
      { problem: "Las conversiones web salen dobles.", fix: "Están configuradas en GTM y aquí al mismo tiempo. Deja solo una." },
      { problem: "«El clic es demasiado antiguo».", fix: "Google rechaza conversiones de clics de hace más de 90 días; es normal en ventas largas." },
    ],
  },

  "meta-pixel": {
    summary: "Cuenta a Facebook e Instagram quién visita tu sitio y quién se convierte, para que tus anuncios lleguen a personas parecidas.",
    benefits: [
      "Eventos automáticos: PageView, Lead (formulario), Schedule (reunión) y Contact (WhatsApp o teléfono).",
      "Puedes crear públicos de remarketing y públicos similares.",
      "Mides el costo por lead real de tus campañas de Meta.",
    ],
    cost: "El píxel es gratis; pagas los anuncios.",
    before: ["Una cuenta de Meta Business (business.facebook.com) con tu página.", "Tu dominio verificado en Meta Business → Configuración → Dominios (recomendado)."],
    steps: [
      { title: "Crea el conjunto de datos", body: "En el Administrador de eventos → Conectar orígenes de datos → Web → ponle nombre." },
      { title: "Copia el ID", body: "Verás un ID numérico de unos 15 dígitos. Cópialo." },
      { title: "Pégalo aquí", body: "Pégalo en «ID del píxel» y guarda. No instales el código que te sugiere Meta: el sitio ya lo carga." },
      { title: "Prioriza eventos", body: "En el Administrador de eventos marca Lead y Schedule como eventos de conversión para tus campañas." },
    ],
    verify: ["Con la extensión Meta Pixel Helper o en «Probar eventos» del Administrador de eventos, navega el sitio aceptando cookies de marketing: debe aparecer PageView, y Lead al enviar el formulario."],
    technical: {
      how: [
        "fbevents.js se carga solo con consentimiento de marketing. Eventos: fbq('track','PageView') en cada página, fbq('track','Lead',{content_category, lead_tier}), fbq('track','Schedule') y fbq('track','Contact',{channel}).",
        "No se envían datos personales (ni correo ni teléfono) al píxel.",
      ],
      fields: [{ key: "meta_pixel_id", where: "Administrador de eventos → tu conjunto de datos", format: "6 a 20 dígitos" }],
      security: ["Da acceso al Administrador de eventos solo a quien maneja anuncios.", "Menciona el píxel en tu política de cookies (marketing)."],
    },
    troubleshooting: [
      { problem: "Pixel Helper no encuentra el píxel.", fix: "Acepta las cookies de marketing (el píxel no carga sin ellas) y desactiva bloqueadores." },
      { problem: "Meta pide la API de conversiones.", fix: "Es opcional. Con el píxel y los eventos actuales puedes optimizar a Lead; la API de conversiones mejora la medición en iOS." },
      { problem: "Eventos duplicados.", fix: "Revisa que no tengas también el píxel en GTM." },
    ],
  },

  "linkedin-insight": {
    summary: "Mide las visitas que llegan desde LinkedIn y te deja mostrar anuncios a empresas y cargos que ya te visitaron.",
    benefits: [
      "Ves qué empresas, sectores y cargos visitan tu sitio (datos agregados).",
      "Remarketing B2B en LinkedIn.",
      "Mides conversiones de tus campañas de LinkedIn.",
    ],
    cost: "La etiqueta es gratis; los anuncios de LinkedIn se pagan aparte (suelen ser más costosos por clic).",
    before: ["Una cuenta de LinkedIn Campaign Manager asociada a tu página de empresa."],
    steps: [
      { title: "Abre Campaign Manager", body: "Entra a Campaign Manager → elige la cuenta → Recursos de la cuenta (Analizar) → Insight Tag." },
      { title: "Copia el Partner ID", body: "Elige «Instalar yo mismo la etiqueta». En el código verás _linkedin_partner_id = \"1234567\": copia solo el número." },
      { title: "Pégalo aquí", body: "Pégalo en «Partner ID de LinkedIn» y guarda." },
      { title: "Crea las conversiones", body: "En Campaign Manager → Conversiones, crea conversiones por URL (por ejemplo, la página de gracias) o usa el evento de la etiqueta." },
    ],
    verify: ["En Campaign Manager → Insight Tag el estado cambia a «Activa» después de visitas con cookies aceptadas (puede tardar 24 h)."],
    technical: {
      how: ["El script insight.min.js se inyecta tras el consentimiento de marketing con el partner ID público."],
      fields: [{ key: "linkedin_partner_id", where: "Campaign Manager → Insight Tag → _linkedin_partner_id", format: "4 a 12 dígitos" }],
      security: ["Menciona LinkedIn en tu política de cookies (marketing)."],
      limits: ["LinkedIn solo muestra datos demográficos cuando hay al menos unas 300 visitas por segmento."],
    },
    troubleshooting: [
      { problem: "La etiqueta figura como «No verificada».", fix: "Espera 24 h con tráfico real y cookies de marketing aceptadas." },
      { problem: "No veo datos de empresas.", fix: "LinkedIn necesita volumen mínimo; con poco tráfico los informes quedan vacíos." },
    ],
  },

  "tiktok-pixel": {
    summary: "Mide las visitas y conversiones que vienen de tus anuncios de TikTok.",
    benefits: ["Optimiza campañas de TikTok hacia formularios enviados.", "Crea públicos de remarketing de quienes visitaron tu sitio."],
    cost: "El píxel es gratis; los anuncios se pagan aparte.",
    before: ["Una cuenta de TikTok Ads Manager (o TikTok for Business)."],
    steps: [
      { title: "Crea el píxel", body: "En Ads Manager → Herramientas → Eventos → Web → Crear píxel → instalación manual." },
      { title: "Copia el ID", body: "Verás un ID de unos 20 caracteres en mayúsculas y números (por ejemplo C1A2B3…)." },
      { title: "Pégalo aquí y guarda", body: "Pégalo en «ID del píxel de TikTok». No instales el código que te dan: el sitio lo carga." },
      { title: "Define eventos", body: "En el administrador de eventos crea eventos basados en URL o usa los estándar." },
    ],
    verify: ["Con la extensión TikTok Pixel Helper, navega el sitio con cookies de marketing aceptadas y revisa que el píxel dispare PageView."],
    technical: {
      how: ["El script events.js de TikTok se carga solo con consentimiento de marketing, usando el ID público."],
      fields: [{ key: "tiktok_pixel_id", where: "Ads Manager → Eventos → Web → tu píxel", format: "10 a 30 letras mayúsculas o números" }],
      security: ["Inclúyelo en tu política de cookies (marketing)."],
    },
    troubleshooting: [
      { problem: "«Formato no válido».", fix: "El ID de TikTok va en mayúsculas sin espacios; no pegues el código completo." },
      { problem: "El píxel no dispara.", fix: "Acepta las cookies de marketing y desactiva bloqueadores de anuncios." },
    ],
  },

  whatsapp: {
    summary: "Envía campañas y responde los WhatsApp de tus clientes desde el chat del portal, con tu número de empresa.",
    benefits: [
      "Todos los mensajes de WhatsApp llegan a la bandeja del chat y los responde quien esté de turno.",
      "Campañas con plantillas aprobadas, con estados de entregado, leído y respondido.",
      "Las automatizaciones pueden enviar WhatsApp (recordatorios, seguimientos).",
    ],
    cost: "Meta cobra por mensaje o conversación según la categoría (marketing, utilidad, autenticación). Responder dentro de las 24 horas a un cliente que te escribió suele ser gratis. Consulta la página de precios de Meta para Colombia: cambian con frecuencia.",
    before: [
      "Una cuenta de Meta Business verificada (recomendado) y una app de Meta de tipo «Business» con el producto WhatsApp.",
      "Un número de teléfono que no esté usando la app de WhatsApp normal (o migrarlo).",
      "Un método de pago en WhatsApp Manager.",
    ],
    steps: [
      { title: "Crea la app", body: "En developers.facebook.com → Mis apps → Crear app → tipo «Business» → agrega el producto WhatsApp y conecta tu cuenta de WhatsApp Business." },
      { title: "Agrega tu número", body: "En WhatsApp → Configuración de la API agrega y verifica el número de la empresa. Copia el «Identificador del número de teléfono» y el «Identificador de la cuenta de WhatsApp Business» y pégalos aquí." },
      { title: "Crea un token permanente", body: "En Meta Business → Configuración → Usuarios del sistema crea un usuario administrador, asígnale la app y la cuenta de WhatsApp, y genera un token con los permisos whatsapp_business_messaging y whatsapp_business_management. Pégalo en «Token de acceso permanente»." },
      { title: "Copia la clave secreta de la app", body: "En la app → Configuración → Básica → «Clave secreta de la app». Pégala aquí (sirve para comprobar que los mensajes vienen de Meta)." },
      { title: "Conecta el webhook", body: "Pulsa «Generar» en «Token de verificación» y guarda. En la app → WhatsApp → Configuración → Webhook, pega la URL que muestra esta página y ese mismo token; suscríbete al campo messages." },
      { title: "Prueba", body: "Pulsa «Probar conexión» aquí. Luego escribe desde tu celular al número de la empresa: el mensaje debe aparecer en el chat del portal." },
      { title: "Sincroniza plantillas", body: "Crea plantillas en WhatsApp Manager; cuando Meta las apruebe, sincronízalas desde Campañas para usarlas." },
    ],
    verify: ["«Probar conexión» muestra el nombre verificado y el número.", "Un mensaje enviado al número llega al chat del portal en segundos.", "Una campaña de prueba muestra «entregado» y «leído»."],
    technical: {
      how: [
        "Envío: Graph API (https://graph.facebook.com/{versión}/{phone_number_id}/messages) con el token como Bearer. La versión por defecto es v23.0 si no defines otra.",
        "Recepción: Meta llama a /api/whatsapp/webhook. El GET responde el reto (hub.challenge) si hub.verify_token coincide; el POST se valida con la cabecera X-Hub-Signature-256 (HMAC-SHA256 del cuerpo con la clave secreta de la app).",
        "Las campañas se encolan en la base de datos y se envían por lotes desde las tareas programadas (cada 5 min) o al despachar.",
      ],
      fields: [
        { key: "whatsapp_phone_number_id", where: "App de Meta → WhatsApp → Configuración de la API", format: "6 a 30 dígitos" },
        { key: "whatsapp_business_account_id", where: "WhatsApp Manager o Configuración de la API", format: "6 a 30 dígitos" },
        { key: "whatsapp_access_token", where: "Usuario del sistema → Generar token", format: "Texto largo sin espacios (EAA…), cifrado" },
        { key: "whatsapp_app_secret", where: "App → Configuración → Básica", format: "16 a 64 letras o números, cifrado" },
        { key: "whatsapp_verify_token", where: "Lo generas aquí y lo pegas en Meta", format: "Mínimo 8 caracteres, cifrado" },
        { key: "whatsapp_graph_version", where: "Opcional", format: "vNN.N (por ejemplo v23.0)" },
      ],
      endpoints: [{ label: "Webhook de WhatsApp", method: "GET/POST", url: "{site}/api/whatsapp/webhook", note: "Suscribe el campo messages." }],
      permissions: ["whatsapp_business_messaging", "whatsapp_business_management"],
      security: [
        "Usa un usuario del sistema: los tokens de usuario normal caducan en horas o días.",
        "Los tokens y la clave secreta se guardan cifrados en Supabase Vault; el portal solo muestra los últimos 4 caracteres.",
        "Cada petición del webhook se rechaza si la firma X-Hub-Signature-256 no coincide.",
      ],
      limits: [
        "Fuera de la ventana de 24 horas desde el último mensaje del cliente solo puedes enviar plantillas aprobadas.",
        "Meta asigna un límite de conversaciones nuevas por día que sube con la calidad del número.",
      ],
    },
    troubleshooting: [
      { problem: "«Error validating access token: Session has expired».", fix: "Usaste un token temporal. Crea un token de usuario del sistema (no caduca) y reemplázalo." },
      { problem: "Meta no acepta la URL del webhook.", fix: "El sitio debe estar publicado con https (no funciona en localhost) y el token de verificación debe ser idéntico al guardado aquí." },
      { problem: "Llegan mensajes en Meta pero no al portal.", fix: "Revisa que estés suscrito al campo messages y que la clave secreta de la app sea la correcta (si no, la firma falla y se rechazan)." },
      { problem: "Error 131047 «Re-engagement message».", fix: "Pasaron más de 24 h desde el último mensaje del cliente: usa una plantilla aprobada." },
      { problem: "Una plantilla no aparece en Campañas.", fix: "Solo se muestran plantillas «Aprobadas». Sincroniza de nuevo después de que Meta la apruebe." },
      { problem: "Error 131030 «Recipient not in allowed list».", fix: "Estás con el número de prueba de Meta: agrega el destinatario a la lista o usa tu número real." },
    ],
  },

  "messenger-instagram": {
    summary: "Los mensajes de tu página de Facebook y de tu Instagram profesional llegan al chat del portal y los respondes desde ahí.",
    benefits: ["Una sola bandeja para web, WhatsApp, Messenger e Instagram.", "Respuestas, asignación y etiquetas igual que en el chat del sitio.", "Historial unido al lead."],
    cost: "Gratis (API de Messenger e Instagram de Meta).",
    before: [
      "Una página de Facebook de la empresa y una cuenta profesional de Instagram vinculada a ella.",
      "La misma app de Meta que usas para WhatsApp (o una nueva de tipo Business).",
    ],
    steps: [
      { title: "Agrega los productos", body: "En tu app de Meta agrega Messenger e Instagram, y conecta tu página de Facebook (y el Instagram vinculado)." },
      { title: "Genera el token de la página", body: "En Messenger → Configuración → Tokens de acceso (o con un usuario del sistema) genera el token con los permisos pages_messaging, pages_manage_metadata, instagram_basic e instagram_manage_messages. Pégalo aquí." },
      { title: "Copia los identificadores", body: "Pega el identificador de la página (Página → Información → Transparencia) y, si usas Instagram, el de la cuenta de Instagram." },
      { title: "Conecta el webhook", body: "En Messenger → Configuración y en Instagram → Webhooks pega la URL de esta página con el mismo token de verificación de WhatsApp. Suscríbete a messages, message_deliveries y message_reads." },
      { title: "Permite el acceso a mensajes en Instagram", body: "En la app de Instagram → Configuración → Privacidad → Mensajes, activa «Permitir el acceso a los mensajes» para herramientas conectadas." },
    ],
    verify: ["Escribe a tu página y a tu Instagram desde otra cuenta: los mensajes aparecen en el chat del portal con su canal."],
    technical: {
      how: [
        "Meta llama a /api/meta/webhook. El GET verifica hub.verify_token (mismo token que WhatsApp) y el POST valida X-Hub-Signature-256 con la clave secreta de la app.",
        "Las respuestas salen por la Send API de la Graph API con el token de la página (/api/meta/reply).",
      ],
      fields: [
        { key: "meta_page_id", where: "Página → Información → Transparencia, o Business Suite → Configuración", format: "5 a 30 dígitos" },
        { key: "meta_page_token", where: "App → Messenger → Tokens de acceso, o usuario del sistema", format: "Texto largo sin espacios, cifrado" },
        { key: "instagram_account_id", where: "Opcional: cuenta profesional vinculada", format: "5 a 30 dígitos (suele empezar por 1784…)" },
      ],
      endpoints: [{ label: "Webhook de Messenger e Instagram", method: "GET/POST", url: "{site}/api/meta/webhook" }],
      permissions: ["pages_messaging", "pages_manage_metadata", "instagram_basic", "instagram_manage_messages", "Eventos: messages, message_deliveries, message_reads"],
      security: ["Para usarlo con clientes reales la app debe estar en modo «En vivo» y con revisión de Meta aprobada para esos permisos."],
      limits: ["Solo puedes responder dentro de 24 horas desde el último mensaje del cliente (7 días con la etiqueta HUMAN_AGENT)."],
    },
    troubleshooting: [
      { problem: "Solo llegan mensajes de los administradores de la app.", fix: "La app está en modo desarrollo. Pasa la app a «En vivo» y solicita la revisión de los permisos." },
      { problem: "Instagram no envía nada.", fix: "Activa «Permitir el acceso a los mensajes» en la app de Instagram y confirma que la cuenta sea profesional y esté vinculada a la página." },
      { problem: "Error de firma en el webhook.", fix: "La clave secreta de la app guardada aquí debe ser la de la misma app donde configuraste el webhook." },
    ],
  },

  resend: {
    summary: "Envía todos los correos del sistema desde tu dominio: seguimientos, confirmaciones, avisos al equipo, campañas e informes.",
    benefits: [
      "Correos con tu dominio (hola@tuempresa.com) que llegan a la bandeja de entrada.",
      "Mide entregas, aperturas, clics y rebotes en Seguimiento y Campañas.",
      "Los rebotes y quejas detienen los envíos a esa persona automáticamente.",
    ],
    cost: "Plan gratis con 3.000 correos al mes y 100 por día; los planes pagos amplían el volumen. Consulta la página de precios de Resend.",
    before: ["Acceso a la configuración DNS de tu dominio (donde lo compraste o en Cloudflare)."],
    steps: [
      { title: "Crea la cuenta", body: "Regístrate en resend.com con el correo de la empresa." },
      { title: "Verifica tu dominio", body: "En Domains → Add Domain escribe tu dominio. Resend te da registros DNS (SPF, DKIM y opcionalmente DMARC): cópialos en tu proveedor de DNS y espera a que queden «Verified»." },
      { title: "Crea la clave", body: "En API Keys → Create API Key, permiso «Sending access». Copia la clave (empieza por re_) y pégala aquí." },
      { title: "Define el remitente y el equipo", body: "En «Remitente» escribe, por ejemplo, Engynex <hola@tudominio.com> (del dominio verificado). En «Correos del equipo» los que reciben avisos e informes, separados por coma." },
      { title: "Activa el seguimiento", body: "En Domains → tu dominio activa Open tracking y Click tracking." },
      { title: "Conecta el webhook", body: "En Webhooks → Add endpoint pega la URL de esta página, elige los eventos email.delivered, email.opened, email.clicked, email.bounced y email.complained, y copia el Signing secret (whsec_…) en «Secreto del webhook»." },
    ],
    verify: ["Envía una prueba desde Seguimiento: llega a tu bandeja y no a spam.", "En Seguimiento el correo cambia a «Entregado» y luego «Abierto» cuando lo abres."],
    technical: {
      how: [
        "Los correos se encolan en email_queue y se envían desde las tareas programadas (cada 5 min) con POST https://api.resend.com/emails usando la clave como Bearer.",
        "El webhook /api/email/webhook valida la firma de Svix (cabeceras svix-id, svix-timestamp y svix-signature con el secreto whsec_) y registra el evento con email_event().",
        "Rebotes y quejas marcan al destinatario para no volver a escribirle; cada correo de marketing incluye enlace de baja ({site}/api/email/baja).",
      ],
      fields: [
        { key: "resend_api_key", where: "Resend → API Keys", format: "re_ seguido de 10 o más caracteres, cifrada" },
        { key: "resend_webhook_secret", where: "Resend → Webhooks → endpoint → Signing secret", format: "whsec_…, cifrado" },
        { key: "email_from", where: "Lo defines tú, con el dominio verificado", format: "Nombre <correo@dominio>" },
        { key: "notify_emails", where: "Correos del equipo", format: "correo@dominio, otro@dominio" },
      ],
      endpoints: [{ label: "Webhook de Resend", method: "POST", url: "{site}/api/email/webhook", note: "Eventos: email.delivered, email.opened, email.clicked, email.bounced, email.complained." }],
      security: ["Usa una clave con permiso solo de envío.", "SPF, DKIM y DMARC correctos evitan que suplanten tu dominio y mejoran la entrega."],
      limits: ["Plan gratis: 100 correos por día y 3.000 al mes; si se supera, los correos quedan en cola hasta el día siguiente o fallan."],
    },
    troubleshooting: [
      { problem: "Error «The domain is not verified».", fix: "El remitente usa un dominio que no está verificado en Resend. Termina la verificación DNS o cambia el remitente." },
      { problem: "Los correos llegan a spam.", fix: "Revisa SPF y DKIM (Verified), agrega un registro DMARC y evita enviar campañas grandes desde un dominio recién creado." },
      { problem: "El webhook responde 400 o 401.", fix: "El secreto whsec_ guardado aquí no es el del endpoint. Cópialo de nuevo desde Resend → Webhooks." },
      { problem: "No se registran aperturas.", fix: "Activa Open tracking en el dominio. Algunos clientes (Apple Mail) abren automáticamente y otros bloquean imágenes: tómalo como estimación." },
      { problem: "Error 429.", fix: "Superaste el límite de envíos del plan; espera o sube de plan." },
    ],
  },

  claude: {
    summary: "La IA lee lo que escribió cada lead y le deja al asesor un resumen, la urgencia, servicios sugeridos y un mensaje para abrir la conversación.",
    benefits: [
      "El asesor entiende al lead en segundos antes de llamar.",
      "Preguntas sugeridas y un mensaje de apertura listos para copiar.",
      "Ayuda en el chat a redactar respuestas.",
    ],
    cost: "Pago por uso (por tokens procesados). Un análisis de lead cuesta centavos de dólar. Define un límite de gasto mensual en la consola. Consulta la página de precios.",
    before: ["Una cuenta en la consola de Anthropic con método de pago."],
    steps: [
      { title: "Crea la cuenta", body: "Entra a console.anthropic.com con el correo de la empresa." },
      { title: "Agrega créditos y un límite", body: "En Billing agrega un método de pago y créditos; en Limits define un tope mensual para no tener sorpresas." },
      { title: "Crea la clave", body: "En API Keys → Create Key, ponle un nombre como «Portal Engynex». Copia la clave (empieza por sk-ant-) y pégala aquí." },
      { title: "Activa el análisis automático", body: "Deja encendido «Analizar automáticamente cada lead nuevo». También puedes analizar a mano desde la ficha del lead." },
    ],
    verify: ["Crea un lead de prueba: en la ficha aparece la tarjeta de IA con el resumen en menos de un minuto."],
    technical: {
      how: [
        "lib/ai.ts llama a la API de Mensajes de Anthropic con el modelo claude-opus-5-5 desde el servidor (/api/ai/lead y /api/ai/chat). La clave nunca llega al navegador.",
        "El análisis se guarda en leads.ai_insights; no cambia el puntaje ni el color del lead.",
        "Con el interruptor encendido, las tareas programadas analizan los leads nuevos pendientes.",
      ],
      fields: [
        { key: "anthropic_api_key", where: "Consola de Anthropic → API Keys", format: "sk-ant- seguido de 20 o más caracteres, cifrada" },
        { key: "ai_lead_insights", where: "Interruptor de esta página", format: "on / off" },
      ],
      security: ["Se envía a Anthropic solo lo que el lead escribió y sus respuestas del formulario.", "Rota la clave si sospechas que se filtró; aquí solo se ven los últimos 4 caracteres."],
      limits: ["Los límites de peticiones por minuto dependen del nivel de tu cuenta en Anthropic."],
    },
    troubleshooting: [
      { problem: "Error 401 «invalid x-api-key».", fix: "La clave está mal copiada o fue revocada. Crea otra y pégala de nuevo." },
      { problem: "Error «credit balance is too low».", fix: "Agrega créditos en Billing." },
      { problem: "Error 429 o 529.", fix: "Límite de tu nivel o servicio saturado. Se reintenta en la siguiente ejecución; revisa status.anthropic.com." },
      { problem: "La tarjeta de IA no aparece.", fix: "Revisa que el interruptor esté encendido y que las tareas programadas estén activas (o pulsa «Analizar» en el lead)." },
    ],
  },

  "hostinger-domains": {
    summary: "Vende dominios en autoservicio: el cliente busca, crea su cuenta, paga y el dominio se registra a su nombre; luego lo administra y lo renueva desde su portal.",
    benefits: [
      "Un ingreso adicional por cada cliente que necesita dominio.",
      "Disponibilidad y precios reales, consultados al registrador en cada búsqueda.",
      "Registro automático a nombre del cliente al aprobarse el pago, sin entrar a hPanel.",
      "Portal del cliente: DNS, nameservers, privacidad, bloqueo, código de transferencia, compras y comprobantes.",
      "Renovación segura: el cliente paga antes del vencimiento y solo entonces se renueva (la renovación automática de Hostinger queda apagada).",
    ],
    cost: "Hostinger cobra cada dominio al método de pago de tu cuenta (precio del catálogo, normalmente en USD). Tú defines el margen y la TRM; la diferencia es tu ganancia. Consulta los precios vigentes en Hostinger.",
    before: [
      "Una cuenta de Hostinger con un método de pago guardado.",
      "Nada más: el perfil WHOIS de cada cliente se crea solo con los datos que llena al comprar.",
      "Wompi conectado para cobrarle al cliente (ver «Pagos en línea (Wompi)»).",
    ],
    steps: [
      { title: "Crea el token", body: "En hPanel entra a tu perfil → API y genera un token. Cópialo." },
      { title: "Pégalo aquí", body: "En Configuración pega el token en «Token de la API de Hostinger» y guarda." },
      { title: "Define tus precios", body: "Escribe la TRM (COP por USD) y tu margen. Ejemplo: un .com de 10 USD con TRM 4.200 y 30 % de margen se vende en $55.000 COP." },
      { title: "Elige las extensiones", body: "Escribe las que quieres ofrecer, por ejemplo: com, co, com.co, net, store, online." },
      { title: "Decide si registra solo", body: "Con «Registrar automáticamente» encendido, el dominio se compra en Hostinger apenas Wompi aprueba el pago. Apagado, lo registras tú desde Portal → Dominios." },
      { title: "Prueba", body: "Busca un nombre en Servicios → Desarrollo web → Dominios: deben salir precios en pesos y disponibilidad real." },
    ],
    verify: [
      "En el buscador los resultados ya no dicen «Verificación aproximada».",
      "Los pedidos pagados pasan a «Registrado» en Portal → Dominios y aparecen en hPanel → Dominios.",
    ],
    technical: {
      how: [
        "Búsqueda: POST /api/domains/v1/availability (varias extensiones a la vez y alternativas con with_alternatives). Precios: GET /api/billing/v1/catalog?category=DOMAIN, guardado 1 hora; se usa el precio del primer año y se muestra la renovación.",
        "Compra: el sitio crea un pedido (domain_orders) y envía al cliente al checkout de Wompi. El webhook de Wompi confirma el pago y llama a POST /api/domains/v1/portfolio con el item_id del catálogo.",
        "Sin token, el buscador funciona con RDAP (registros oficiales vía IANA) y DNS sobre HTTPS como verificación aproximada, con precios de referencia; no permite pagar hasta que Wompi esté conectado.",
      ],
      fields: [
        { key: "hostinger_api_token", where: "hPanel → Perfil → API", format: "Token Bearer (secreto)" },
        { key: "domain_usd_cop", where: "Lo defines tú", format: "Número, ej. 4200" },
        { key: "domain_margin_pct", where: "Lo defines tú", format: "Porcentaje entero, ej. 30" },
        { key: "domain_tlds", where: "Lo defines tú", format: "com, co, com.co, net…" },
      ],
      endpoints: [
        { label: "Buscar (público)", method: "GET", url: "{site}/api/domains/search?q=miempresa" },
        { label: "Crear pedido (público)", method: "POST", url: "{site}/api/domains/checkout" },
        { label: "Estado del pedido", method: "GET", url: "{site}/es/dominios/pedido/<referencia>" },
      ],
      security: [
        "El token se guarda cifrado y solo lo lee el servidor.",
        "El precio se recalcula en el servidor antes de cobrar; el webhook verifica que el monto pagado coincida con el pedido.",
        "Límite de 20 búsquedas por minuto por visitante.",
      ],
      limits: ["Hostinger limita la consulta de disponibilidad a 90 peticiones por minuto.", "Algunas extensiones exigen datos adicionales del titular (additional_details); esas se registran a mano."],
    },
    troubleshooting: [
      { problem: "El registro falla con un error de contacto WHOIS.", fix: "Crea los contactos por defecto en hPanel → Dominios para esa extensión y usa «Registrar en Hostinger» en Portal → Dominios." },
      { problem: "Hostinger responde 202 (pago en proceso).", fix: "El pedido queda en «Registrando». Cuando Hostinger confirme el cobro, termina el registro desde hPanel y márcalo como registrado." },
      { problem: "Los precios se ven muy altos o bajos.", fix: "Revisa la TRM y el margen; el catálogo viene en la moneda de tu cuenta de Hostinger." },
      { problem: "Una extensión no aparece.", fix: "Verifica que esté en «Extensiones que se muestran» y que Hostinger la venda (catálogo DOMAIN)." },
    ],
  },
  wompi: {
    summary: "Cobra en línea en pesos colombianos con PSE, tarjetas, Nequi y más. Lo usamos para vender dominios desde el sitio.",
    benefits: ["Medios de pago locales: PSE, tarjetas, Nequi, Bancolombia y efectivo.", "El dinero llega a tu cuenta bancaria.", "Confirmación automática del pago (sin revisar a mano)."],
    cost: "Wompi cobra una comisión por transacción aprobada; no tiene mensualidad. Consulta las tarifas vigentes en su página.",
    before: ["Una cuenta de comercio en Wompi aprobada (persona natural o empresa).", "Acceso al panel de comercios (comercios.wompi.co)."],
    steps: [
      { title: "Copia las llaves", body: "En Wompi → Desarrolladores copia la llave pública (pub_prod_…), el secreto de integridad y el secreto de eventos." },
      { title: "Pégalas aquí", body: "En Configuración pega los tres valores y guarda. Para probar sin cobrar, usa las llaves de pruebas (pub_test_…)." },
      { title: "Configura la URL de eventos", body: "En Wompi → Desarrolladores → URL de eventos pega la dirección que aparece en Configuración (…/api/payments/wompi)." },
      { title: "Haz una compra de prueba", body: "Con las llaves de pruebas compra un dominio: Wompi te muestra tarjetas y datos de prueba." },
      { title: "Pasa a producción", body: "Cambia a las llaves de producción. Desde ahí cada pago es real." },
    ],
    verify: ["Al comprar un dominio se abre el checkout de Wompi con el monto correcto.", "Tras pagar, el pedido pasa a «Pagado» y luego a «Registrado» en Portal → Dominios."],
    technical: {
      how: [
        "Checkout web: GET https://checkout.wompi.co/p/ con public-key, currency=COP, amount-in-cents, reference, redirect-url y signature:integrity = SHA256(reference + amount-in-cents + COP + secreto de integridad).",
        "Eventos: Wompi envía transaction.updated a {site}/api/payments/wompi. El checksum es SHA256 de los valores de signature.properties + timestamp + secreto de eventos; si no coincide, se rechaza (401).",
        "Solo el estado APPROVED dispara el registro del dominio; DECLINED, VOIDED y ERROR marcan el pedido como rechazado.",
      ],
      fields: [
        { key: "wompi_public_key", where: "Wompi → Desarrolladores → Llaves del API", format: "pub_test_… o pub_prod_…" },
        { key: "wompi_integrity_secret", where: "Wompi → Desarrolladores → Secretos → Integridad", format: "test_integrity_… o prod_integrity_…" },
        { key: "wompi_events_secret", where: "Wompi → Desarrolladores → Secretos → Eventos", format: "test_events_… o prod_events_…" },
      ],
      endpoints: [{ label: "URL de eventos", method: "POST", url: "{site}/api/payments/wompi" }],
      security: ["Los secretos se guardan cifrados y nunca llegan al navegador.", "La redirección de Wompi no confirma pagos: solo el evento verificado.", "Se valida que el monto pagado sea el del pedido."],
      limits: ["Solo COP.", "Wompi reintenta un evento hasta 3 veces en 24 horas si no recibe 200."],
    },
    troubleshooting: [
      { problem: "El checkout muestra «firma inválida».", fix: "El secreto de integridad no corresponde a la llave pública (pruebas vs. producción). Usa los dos del mismo ambiente." },
      { problem: "Pagué y el pedido sigue en «Esperando el pago».", fix: "Revisa que la URL de eventos esté configurada en Wompi y que el secreto de eventos sea el correcto." },
      { problem: "No veo el botón de pagar, solo «Recibimos tu pedido».", fix: "Faltan la llave pública o el secreto de integridad: sin ellos el pedido queda para cobro manual." },
    ],
  },
  slack: {
    summary: "Recibe en un canal de Slack los avisos importantes: leads verdes, solicitudes críticas y ventas ganadas.",
    benefits: ["Todo el equipo se entera al instante sin entrar al portal.", "Cada mensaje trae el enlace directo al lead o a la solicitud.", "Tú decides qué se publica desde Automatizaciones."],
    cost: "Gratis: los incoming webhooks funcionan en el plan gratuito de Slack.",
    before: ["Un espacio de trabajo de Slack y permiso para instalar apps (o pedírselo al administrador)."],
    steps: [
      { title: "Crea una app", body: "Entra a api.slack.com/apps → Create New App → From scratch → nombre «Engynex» y tu espacio de trabajo." },
      { title: "Activa Incoming Webhooks", body: "En el menú de la app → Incoming Webhooks → actívalo." },
      { title: "Elige el canal", body: "Pulsa «Add New Webhook to Workspace», elige el canal (por ejemplo #ventas) y autoriza." },
      { title: "Copia la URL", body: "Copia la URL que empieza por https://hooks.slack.com/services/… y pégala aquí. Guarda." },
      { title: "Prueba", body: "Pulsa «Enviar prueba»: debe llegar un mensaje al canal." },
      { title: "Elige qué avisar", body: "En Automatizaciones ya hay reglas listas (lead verde, solicitud crítica, venta ganada). Puedes crear más con la acción «Avisar en Slack / Teams / Google Chat»." },
    ],
    verify: ["El mensaje de prueba llega al canal.", "Al crear un lead verde de prueba llega el aviso con el enlace."],
    technical: {
      how: [
        "La base de datos publica con pg_net (POST JSON {\"text\": …}) a la URL del webhook desde la función team_alert(), llamada por la acción de automatización team_chat.",
        "El texto admite el formato mrkdwn de Slack (*negrita*, saltos de línea) y se agrega <enlace|Abrir en el portal> al final.",
      ],
      fields: [{ key: "slack_webhook_url", where: "api.slack.com/apps → tu app → Incoming Webhooks", format: "https://hooks.slack.com/…, cifrada" }],
      examples: [{ title: "Lo que envía el portal", lang: "bash", code: TEAM_CHAT_SLACK }],
      security: ["La URL funciona como contraseña: quien la tenga puede publicar en el canal. Se guarda cifrada.", "Si se filtra, elimina el webhook en Slack y crea otro."],
      limits: ["Slack admite cerca de 1 mensaje por segundo por webhook."],
    },
    troubleshooting: [
      { problem: "La prueba no llega y Slack responde 404 «no_service» o «invalid_token».", fix: "El webhook fue eliminado o la app desinstalada. Crea uno nuevo y reemplaza la URL." },
      { problem: "Error «channel_is_archived».", fix: "El canal fue archivado: crea el webhook para otro canal." },
      { problem: "«action_prohibited».", fix: "El administrador de Slack restringió las apps: pídele que apruebe la app." },
    ],
  },

  "microsoft-teams": {
    summary: "Publica los avisos importantes del portal en un canal de Microsoft Teams.",
    benefits: ["Avisos al instante de leads verdes, solicitudes críticas y ventas.", "Enlace directo al portal en cada mensaje.", "Configurable desde Automatizaciones."],
    cost: "Incluido en Microsoft 365 (Teams). Workflows (Power Automate) estándar no tiene costo extra para este uso.",
    before: ["Un equipo y un canal de Teams donde puedas agregar flujos de trabajo."],
    steps: [
      { title: "Abre Workflows en el canal", body: "En Teams, en el canal elegido pulsa los tres puntos (…) → Flujos de trabajo (Workflows)." },
      { title: "Elige la plantilla", body: "Busca «Publicar en un canal cuando se recibe una solicitud de webhook» (Post to a channel when a webhook request is received)." },
      { title: "Configura", body: "Ponle nombre «Engynex», confirma el equipo y el canal y pulsa «Agregar flujo de trabajo»." },
      { title: "Copia la URL", body: "Teams te muestra una URL larga (https://…logic.azure.com… o …powerplatform.com…). Cópiala y pégala aquí; guarda." },
      { title: "Prueba", body: "Pulsa «Enviar prueba» y revisa el canal." },
    ],
    verify: ["Llega el mensaje de prueba al canal (lo publica el flujo «Engynex» a nombre de Workflows)."],
    technical: {
      how: [
        "team_alert() envía POST JSON {\"text\": \"…\"} con pg_net. Se agrega [Abrir en el portal](enlace) en formato Markdown.",
        "Los antiguos conectores «Incoming Webhook» de Office 365 se están retirando; usa Workflows.",
      ],
      fields: [{ key: "teams_webhook_url", where: "Teams → canal → Workflows → URL del desencadenador HTTP", format: "https://…, cifrada" }],
      security: ["La URL permite publicar en el canal: guárdala como un secreto (aquí queda cifrada)."],
      limits: ["Si el flujo espera una tarjeta adaptable y no texto, edítalo para publicar el campo text del cuerpo."],
    },
    troubleshooting: [
      { problem: "El flujo se ejecuta pero el mensaje sale vacío.", fix: "Edita el flujo en Power Automate y en la acción «Publicar mensaje» usa el contenido dinámico text del cuerpo recibido." },
      { problem: "Error 401 o 403.", fix: "El flujo fue desactivado o su dueño perdió acceso. Vuelve a crearlo y reemplaza la URL." },
      { problem: "La plantilla no aparece.", fix: "Tu organización puede tener bloqueado Power Automate; pídeselo al administrador de Microsoft 365." },
    ],
  },

  "google-chat": {
    summary: "Publica los avisos importantes del portal en un espacio de Google Chat.",
    benefits: ["Avisos al instante para el equipo que trabaja en Google Workspace.", "Enlace directo al lead o la solicitud.", "Lo controlas desde Automatizaciones."],
    cost: "Requiere Google Workspace (plan de pago de Google para empresas). Los webhooks no tienen costo adicional.",
    before: ["Una cuenta de Google Workspace y un espacio de Chat donde puedas administrar integraciones."],
    steps: [
      { title: "Abre el espacio", body: "En Google Chat abre el espacio (por ejemplo «Ventas»)." },
      { title: "Agrega un webhook", body: "Haz clic en el nombre del espacio → Apps e integraciones → Webhooks → Agregar webhook. Nombre: «Engynex»." },
      { title: "Copia la URL", body: "Copia la URL que empieza por https://chat.googleapis.com/v1/spaces/… y pégala aquí. Guarda." },
      { title: "Prueba", body: "Pulsa «Enviar prueba»." },
    ],
    verify: ["El mensaje de prueba aparece en el espacio."],
    technical: {
      how: ["team_alert() envía POST JSON {\"text\": …} (Content-Type application/json; charset=UTF-8). El texto acepta *negrita* y enlaces <url|texto>."],
      fields: [{ key: "google_chat_webhook_url", where: "Espacio → Apps e integraciones → Webhooks", format: "https://chat.googleapis.com/…, cifrada" }],
      security: ["La URL incluye una clave y un token: no la compartas. Aquí queda cifrada."],
      limits: ["Google Chat limita a unas 60 peticiones por minuto por espacio."],
    },
    troubleshooting: [
      { problem: "No aparece la opción Webhooks.", fix: "Los webhooks no están disponibles en cuentas personales de Gmail ni si el administrador los desactivó." },
      { problem: "Error 404 o 400.", fix: "El webhook fue eliminado o la URL quedó incompleta (debe incluir key= y token=)." },
    ],
  },

  calendar: {
    summary: "Ve tus reuniones y tareas del portal en Google Calendar, Outlook o el calendario de tu celular.",
    benefits: ["Tus reuniones agendadas y las tareas con fecha aparecen solas en tu calendario.", "Sin instalar nada y sin dar acceso a tu cuenta de Google o Microsoft.", "Cada persona del equipo tiene su enlace privado."],
    cost: "Gratis.",
    before: ["Un calendario que permita «suscribirse por URL» (Google Calendar, Outlook, Apple Calendar)."],
    steps: [
      { title: "Copia tu enlace", body: "En esta página copia tu enlace personal del calendario (termina en .ics). Es solo tuyo." },
      { title: "Google Calendar", body: "En calendar.google.com (desde computador) → «Otros calendarios» → + → «Desde URL» → pega el enlace → Agregar calendario." },
      { title: "Outlook", body: "En Outlook web → Calendario → Agregar calendario → Suscribirse desde la web → pega el enlace y ponle nombre." },
      { title: "iPhone o Mac", body: "Calendario → Archivo → Nueva suscripción a calendario (en iPhone: Ajustes → Calendario → Cuentas → Agregar cuenta → Otro → Calendario suscrito)." },
      { title: "Si alguien conoce tu enlace", body: "Pulsa «Generar un enlace nuevo»: el anterior deja de funcionar." },
    ],
    verify: ["Después de agregarlo verás un calendario nuevo con tus próximas reuniones. Google puede tardar unas horas en la primera carga."],
    technical: {
      how: [
        "Cada empleado tiene un token en calendar_feeds (función calendar_feed_token). El servidor arma el ICS con calendar_feed_events(token) usando la clave secreta.",
        "Incluye reuniones (no canceladas) donde eres anfitrión o de leads asignados a ti, desde 60 días atrás, y tareas con fecha de vencimiento de los últimos 30 días en adelante.",
        "Es de solo lectura: los cambios se hacen en el portal.",
      ],
      endpoints: [{ label: "Tu calendario", method: "GET", url: "{site}/api/calendar/<token>.ics", note: "Formato iCalendar (RFC 5545)." }],
      examples: [{ title: "Ejemplo de evento", lang: "text", code: ICS_SAMPLE }],
      security: ["El enlace funciona sin iniciar sesión: trátalo como una contraseña. Si se comparte, genera uno nuevo.", "Si tu cuenta se desactiva, el enlace deja de devolver eventos."],
      limits: ["La frecuencia de actualización la decide tu aplicación: Google suele refrescar cada 8 a 24 horas; Outlook y Apple pueden configurarse más seguido."],
    },
    troubleshooting: [
      { problem: "Google no muestra cambios recientes.", fix: "Google actualiza los calendarios suscritos cada varias horas y no se puede forzar. Para lo urgente, revisa la Agenda del portal." },
      { problem: "«No se pudo agregar el calendario».", fix: "El sitio debe estar publicado en internet (no funciona con localhost) y el enlace completo debe terminar en .ics." },
      { problem: "Veo reuniones que no son mías.", fix: "Aparecen las reuniones de leads asignados a ti aunque otra persona sea la anfitriona; reasigna el lead si no corresponde." },
    ],
  },

  webhooks: {
    summary: "Avisa a otros sistemas (tu ERP, Zapier, Make, n8n) cada vez que pasa algo en el portal: lead nuevo, reunión, solicitud, venta…",
    benefits: [
      "Conecta el portal con cualquier herramienta sin esperar a que exista una integración.",
      "Eventos en tiempo real con todos los datos del lead, la solicitud o la reunión.",
      "Mensajes firmados para que tu sistema compruebe que vienen del portal, y registro de cada entrega con reintento.",
    ],
    cost: "Gratis.",
    before: ["Una URL https que reciba peticiones POST (la da Zapier, Make, n8n o tu programador)."],
    steps: [
      { title: "Crea un destino", body: "En Webhooks pulsa «Nuevo destino», ponle nombre y pega la URL https que te dio la otra herramienta." },
      { title: "Elige los eventos", body: "Marca los eventos que quieres enviar (por ejemplo «Llega un lead nuevo» y «Se gana una venta»), o «Todos»." },
      { title: "Guarda el secreto", body: "Copia el secreto de firma (whsec_…) y dáselo a quien programe el receptor para que verifique los mensajes." },
      { title: "Envía una prueba", body: "Pulsa «Enviar prueba» y revisa en el registro que la respuesta sea 200." },
    ],
    verify: ["En el registro de entregas cada envío aparece como «OK» con código 2xx.", "Tu herramienta muestra el evento recibido."],
    technical: {
      how: [
        "Cada vez que ocurre un evento instantáneo de automatizaciones (lead_created, lead_status_changed, lead_won, lead_lost, lead_assigned, email_clicked, email_bounced, appointment_booked, appointment_cancelled, appointment_done, appointment_no_show, ticket_created, ticket_staff_reply, ticket_customer_reply, ticket_resolved, ticket_reopened, ticket_rated, ticket_assigned, chat_started, chat_closed, chat_rated, task_completed, deal_created, deal_stage_changed, account_created, document_uploaded) se llama a webhook_emit().",
        "La base de datos envía un POST JSON con pg_net (tiempo máximo 8 s). Cabeceras: Content-Type: application/json, User-Agent: Engynex-Webhooks/1.0, X-Engynex-Event (nombre del evento), X-Engynex-Delivery (id de la entrega) y X-Engynex-Signature: sha256=<HMAC-SHA256 en hexadecimal del cuerpo con el secreto>.",
        "Cada minuto webhook_sync() lee las respuestas: 2xx = OK; otro código, error o sin respuesta en 10 minutos = fallida. Tras 20 fallos seguidos el destino se pausa solo. El registro se guarda 30 días.",
        "El evento test se envía con «Enviar prueba». «Reenviar» vuelve a mandar el mismo contenido con un id de entrega nuevo.",
      ],
      examples: [
        { title: "Cuerpo de un evento", lang: "json", code: WEBHOOK_PAYLOAD },
        { title: "Verificar la firma (Node.js)", lang: "js", code: WEBHOOK_VERIFY_JS },
      ],
      security: [
        "Verifica siempre la firma con el cuerpo crudo y una comparación de tiempo constante; rechaza lo que no coincida.",
        "Solo se aceptan URLs https. Rota el secreto si se filtra (el anterior deja de servir de inmediato).",
        "Los datos incluyen información personal del cliente (nombre, correo, teléfono): envíalos solo a sistemas de confianza y menciónalos en tu política de datos.",
      ],
      limits: ["Responde en menos de 8 segundos; procesa en segundo plano si tu lógica es lenta.", "No hay reintento automático: usa «Reenviar» desde el registro y diseña tu receptor idempotente (usa el id)."],
    },
    troubleshooting: [
      { problem: "La firma nunca coincide.", fix: "Estás firmando el JSON después de parsearlo y volverlo a serializar (cambia espacios u orden). Calcula el HMAC sobre los bytes exactos recibidos." },
      { problem: "Las entregas salen «sin respuesta».", fix: "Tu servidor tarda más de 8 s o no es accesible desde internet. Responde 200 de inmediato y procesa después." },
      { problem: "El destino se pausó solo.", fix: "Acumuló 20 fallos seguidos. Corrige el receptor, vuelve a activarlo y reenvía las entregas que necesites." },
      { problem: "No llegan eventos de cosas que pasan por tiempo (p. ej. lead sin contactar).", fix: "Los webhooks salen con los eventos instantáneos. Para los de tiempo crea una automatización con la acción «Enviar a otra app (webhook)»." },
    ],
  },

  api: {
    summary: "Deja que otros sistemas creen y consulten leads, solicitudes y reuniones del portal de forma segura.",
    benefits: [
      "Crea leads desde otras páginas, formularios o herramientas (Zapier, Make, n8n) y entran al CRM con su puntaje.",
      "Lleva tus leads o solicitudes a un ERP, hoja de cálculo o tablero.",
      "Cada clave tiene solo los permisos que le des y puedes revocarla cuando quieras.",
    ],
    cost: "Gratis.",
    before: ["Saber qué necesitas: solo leer, solo crear, o ambos."],
    steps: [
      { title: "Crea una clave", body: "En API pulsa «Nueva clave», ponle el nombre de quien la usará (por ejemplo «Zapier») y marca solo los permisos necesarios." },
      { title: "Cópiala ahora", body: "La clave completa (egx_…) se muestra una sola vez. Guárdala en un gestor de contraseñas o en la herramienta que la usará." },
      { title: "Úsala", body: "Dásela a tu programador o pégala en Zapier/Make/n8n como cabecera Authorization: Bearer egx_…" },
      { title: "Revoca lo que no uses", body: "Si una clave se filtra o ya no se usa, pulsa «Revocar»: deja de funcionar al instante." },
    ],
    verify: ["En la lista de claves verás «Último uso» y el número de peticiones.", "Un lead creado por la API aparece en el CRM con la fuente que indicaste."],
    technical: {
      how: [
        "Base: {site}/api/v1. Autenticación: cabecera Authorization: Bearer egx_<48 hex>. La clave se guarda solo como hash SHA-256; el servidor la valida con api_key_check(clave, permiso).",
        "Permisos: leads:read, leads:write, tickets:read, tickets:write, appointments:read.",
        "POST /leads usa la misma lógica del formulario del sitio (validaciones, puntaje y color, automatizaciones y webhooks). Requiere consent: true (confirmas que la persona aceptó ser contactada).",
        "POST /tickets crea la solicitud como el centro de soporte público (con SLA, número y correo de confirmación si está activo).",
        "Respuestas en JSON. Límite: 600 peticiones por hora por clave.",
      ],
      endpoints: [
        { label: "Listar leads", method: "GET", url: "{site}/api/v1/leads?since=ISO&limit=50", note: "Permiso leads:read. since filtra por fecha de creación; limit máximo 50." },
        { label: "Crear lead", method: "POST", url: "{site}/api/v1/leads", note: "Permiso leads:write. Obligatorios: name, email, phone, problem_category, consent." },
        { label: "Listar solicitudes", method: "GET", url: "{site}/api/v1/tickets", note: "Permiso tickets:read." },
        { label: "Crear solicitud", method: "POST", url: "{site}/api/v1/tickets", note: "Permiso tickets:write. Obligatorios: name, email, category, subject, description." },
        { label: "Listar reuniones", method: "GET", url: "{site}/api/v1/appointments?from=AAAA-MM-DD&to=AAAA-MM-DD", note: "Permiso appointments:read." },
      ],
      permissions: [
        "problem_category: sales | web | automation | system | support | other | none",
        "budget: lt2 | 2to5 | 5to15 | 15to40 | gt40 | monthly | unknown (por defecto unknown)",
        "decision: self | shared | other — timeline: week | month | browsing",
        "priority (solicitudes): critical | high | medium | low",
      ],
      examples: [
        { title: "Crear un lead", lang: "bash", code: API_CURL_CREATE_LEAD },
        { title: "Consultar leads y reuniones", lang: "bash", code: API_CURL_LIST },
        { title: "Crear una solicitud de soporte", lang: "bash", code: API_CURL_TICKET },
        { title: "Errores", lang: "text", code: API_ERRORS },
      ],
      security: [
        "Nunca pongas la clave en código que corre en el navegador ni en repositorios públicos.",
        "Da a cada herramienta su propia clave con el mínimo de permisos y revócala si deja de usarse.",
        "Las claves revocadas no se pueden reactivar: crea una nueva.",
      ],
      limits: ["600 peticiones por hora por clave (HTTP 429 al superarlo).", "Paginación: usa since con la fecha del último lead recibido."],
    },
    troubleshooting: [
      { problem: "401 invalid_key.", fix: "La clave está mal copiada (debe incluir egx_), falta la palabra Bearer, o fue revocada." },
      { problem: "403 missing_scope.", fix: "La clave no tiene el permiso de ese endpoint. Crea una nueva con el permiso correcto." },
      { problem: "422 invalid.", fix: "Falta un campo obligatorio, el correo o el teléfono no son válidos, un valor no está en la lista permitida o falta consent: true." },
      { problem: "429 rate_limited.", fix: "Más de 600 peticiones en una hora. Espacia las consultas o usa webhooks para recibir cambios en vez de consultar seguido." },
    ],
  },

  zapier: {
    summary: "Conecta el portal con más de 7.000 aplicaciones (Google Sheets, HubSpot, Gmail, Trello…) sin programar.",
    benefits: [
      "Copia cada lead nuevo a una hoja de Google o a otro CRM.",
      "Crea leads en el portal desde Facebook Lead Ads, Typeform o Calendly.",
      "Avisos por SMS, correo o cualquier app cuando pase algo en el portal.",
    ],
    cost: "Plan gratis con pocas tareas al mes y zaps de dos pasos; los webhooks («Webhooks by Zapier») requieren un plan pago. Consulta precios.",
    before: ["Una cuenta de Zapier.", "En el portal: un destino de Webhooks (para recibir eventos) o una clave de API (para crear o leer datos)."],
    steps: [
      { title: "Del portal a otra app: crea el disparador", body: "En Zapier crea un Zap → disparador «Webhooks by Zapier» → «Catch Hook». Copia la URL que te da." },
      { title: "Crea el destino en el portal", body: "En Integraciones → Webhooks → Nuevo destino: pega esa URL y elige eventos (p. ej. «Llega un lead nuevo»). Pulsa «Enviar prueba»." },
      { title: "Termina el Zap", body: "En Zapier pulsa «Test trigger»: verás los datos (data.nombre, data.correo…). Agrega la acción, por ejemplo Google Sheets → Create row, y asigna los campos." },
      { title: "De otra app al portal", body: "Usa la acción «Webhooks by Zapier» → POST a {site}/api/v1/leads con la cabecera Authorization: Bearer egx_… (clave con leads:write) y el cuerpo JSON del lead." },
      { title: "Activa el Zap", body: "Publica el Zap y revisa el historial de Zapier y el registro de entregas del portal." },
    ],
    verify: ["En Zapier → Zap history las ejecuciones salen «Success».", "En el portal el registro de entregas muestra 200."],
    technical: {
      how: [
        "Zapier no necesita una app propia: usa Webhooks by Zapier para recibir (Catch Hook) y para enviar (POST) contra la API REST.",
        "Los datos del evento llegan en el objeto data; usa data.enlace para volver al portal.",
      ],
      examples: [
        { title: "Lo que recibe Zapier", lang: "json", code: ZAP_STEPS_JSON },
        { title: "Crear un lead desde Zapier (equivalente en curl)", lang: "bash", code: API_CURL_CREATE_LEAD },
      ],
      security: ["La URL de Catch Hook es pública: quien la tenga puede enviar datos a tu Zap. No la compartas.", "Usa una clave de API exclusiva para Zapier con el mínimo de permisos."],
      limits: ["Cada evento consume una tarea de tu plan de Zapier."],
    },
    troubleshooting: [
      { problem: "Zapier no recibe nada.", fix: "Revisa que el destino esté activo y suscrito al evento correcto; usa «Enviar prueba» y mira el registro de entregas." },
      { problem: "El POST a la API devuelve 422.", fix: "Revisa los campos obligatorios y los valores permitidos (problem_category, budget…) y que consent sea true (booleano, no texto)." },
      { problem: "Leads duplicados.", fix: "Zapier puede reintentar. Agrega un filtro o usa «Find or create» en el destino." },
    ],
  },

  make: {
    summary: "Automatizaciones visuales avanzadas (antes Integromat) conectadas al portal.",
    benefits: ["Flujos con condiciones, rutas y transformaciones de datos.", "Conecta el portal con cientos de apps.", "Suele salir más económico que Zapier para muchos pasos."],
    cost: "Plan gratis con operaciones limitadas al mes; planes pagos por volumen. Consulta precios.",
    before: ["Una cuenta de Make.", "Un destino de Webhooks o una clave de API del portal."],
    steps: [
      { title: "Recibir eventos", body: "Crea un escenario → módulo «Webhooks → Custom webhook» → Add → copia la URL." },
      { title: "Crea el destino en el portal", body: "En Webhooks crea un destino con esa URL y los eventos que quieras; pulsa «Enviar prueba» para que Make detecte la estructura." },
      { title: "Agrega acciones", body: "Conecta los módulos que quieras (Google Sheets, Gmail, tu ERP) usando los campos de data." },
      { title: "Enviar datos al portal", body: "Usa el módulo «HTTP → Make a request»: método POST, URL {site}/api/v1/leads, cabecera Authorization: Bearer egx_…, cuerpo JSON." },
      { title: "Activa el escenario", body: "Activa la programación «Immediately» para que procese al llegar." },
    ],
    verify: ["El historial del escenario muestra ejecuciones correctas y el registro de entregas del portal muestra 200."],
    technical: {
      how: ["Make recibe el JSON firmado; puedes verificar la firma en Make con la función sha256/HMAC si lo necesitas, o confiar en que la URL es secreta."],
      examples: [{ title: "Lo que recibe Make", lang: "json", code: WEBHOOK_PAYLOAD }],
      security: ["Mantén la URL del webhook privada y usa una clave de API propia para Make."],
      limits: ["Cada módulo ejecutado consume operaciones de tu plan."],
    },
    troubleshooting: [
      { problem: "Make dice «Determine data structure».", fix: "Con el escenario en «Run once», pulsa «Enviar prueba» en el portal para que Make aprenda la estructura." },
      { problem: "El módulo HTTP devuelve 401.", fix: "La cabecera debe ser exactamente Authorization con el valor Bearer egx_… (con espacio)." },
    ],
  },

  n8n: {
    summary: "Automatizaciones de código abierto: en la nube de n8n o instaladas en tu propio servidor.",
    benefits: ["Control total y datos en tu servidor si lo instalas tú.", "Nodos de código para lógica a la medida.", "Sin límite por tarea si lo alojas tú."],
    cost: "Gratis si lo instalas en tu servidor (pagas el servidor); n8n Cloud tiene planes pagos. Consulta precios.",
    before: ["Una instancia de n8n accesible por internet con https.", "Un destino de Webhooks o una clave de API del portal."],
    steps: [
      { title: "Recibir eventos", body: "Crea un flujo con el nodo «Webhook», método POST. Copia la «Production URL»." },
      { title: "Crea el destino en el portal", body: "En Webhooks crea un destino con esa URL y los eventos; activa el flujo en n8n y pulsa «Enviar prueba»." },
      { title: "Verifica la firma (opcional)", body: "Agrega un nodo «Code» que calcule el HMAC con el secreto del destino y compare con X-Engynex-Signature." },
      { title: "Enviar datos al portal", body: "Usa el nodo «HTTP Request»: POST a {site}/api/v1/leads con Authorization: Bearer egx_… y cuerpo JSON." },
    ],
    verify: ["En n8n → Executions ves las ejecuciones y en el portal el registro muestra 200."],
    technical: {
      how: ["En el nodo Webhook activa «Raw Body» si vas a verificar la firma: el HMAC se calcula sobre el cuerpo exacto."],
      examples: [{ title: "Verificación HMAC (nodo Code, JavaScript)", lang: "js", code: WEBHOOK_VERIFY_JS }],
      security: ["Usa la Production URL (no la de prueba) y protege tu instancia con usuario y contraseña."],
      limits: ["La URL de prueba (Test URL) solo funciona mientras el editor está escuchando."],
    },
    troubleshooting: [
      { problem: "Funciona en pruebas pero no en producción.", fix: "Usaste la Test URL. Cambia el destino a la Production URL y activa el flujo." },
      { problem: "La firma no coincide.", fix: "Activa Raw Body en el nodo Webhook y calcula el HMAC sobre esos bytes, no sobre el JSON reconstruido." },
    ],
  },

  supabase: {
    summary: "La base de datos, los archivos y las tareas automáticas del portal viven en Supabase.",
    benefits: ["Copias de seguridad diarias de toda la información.", "Archivos privados (documentos, adjuntos) con permisos por usuario.", "Secretos de las integraciones cifrados en Vault."],
    cost: "Plan gratis con límites; el plan Pro (de pago mensual) agrega copias diarias con más retención y más capacidad. Consulta precios.",
    before: ["Acceso de administrador al proyecto en el panel de Supabase."],
    steps: [
      { title: "Entra al proyecto", body: "Abre el enlace «Proyecto en Supabase» de esta página con la cuenta dueña del proyecto." },
      { title: "Revisa la clave secreta del servidor", body: "En Settings → API keys → Secret keys está la clave que va en la variable SUPABASE_SECRET_KEY del hosting. Es la única que no se guarda en el portal." },
      { title: "Revisa las copias de seguridad", body: "En Database → Backups confirma que haya copias recientes." },
      { title: "Activa la verificación en dos pasos", body: "En tu cuenta de Supabase → Account → Security activa 2FA." },
      { title: "Rota claves si hace falta", body: "Si una clave se filtró, crea una nueva secret key, actualízala en el hosting y elimina la anterior." },
    ],
    verify: ["En esta página aparece «Clave secreta de Supabase · Conectado».", "Database → Backups muestra copias recientes."],
    technical: {
      how: [
        "Postgres con Row Level Security en todas las tablas; las funciones sensibles son security definer y verifican el rol.",
        "Los secretos de integraciones se guardan en Supabase Vault; solo el servidor los lee con integration_config() usando SUPABASE_SECRET_KEY.",
        "pg_cron ejecuta las automatizaciones, el SLA de soporte, campañas y la sincronización de webhooks; pg_net hace las llamadas HTTP salientes.",
      ],
      fields: [{ key: "SUPABASE_SECRET_KEY", where: "Supabase → Settings → API keys → Secret keys", format: "sb_secret_… (variable de entorno del servidor, nunca NEXT_PUBLIC)" }],
      security: [
        "Nunca expongas la secret key en el navegador ni en el repositorio.",
        "Rota la contraseña de la base de datos y la secret key si las compartiste por chat o correo.",
        "Limita quién es miembro del proyecto en Supabase.",
      ],
      limits: ["El plan gratis pausa proyectos inactivos y tiene límites de almacenamiento y ancho de banda."],
    },
    troubleshooting: [
      { problem: "La página dice que falta la clave secreta.", fix: "Agrega SUPABASE_SECRET_KEY en .env.local (local) y en las variables de entorno del hosting, y vuelve a desplegar." },
      { problem: "Las tareas programadas no corren.", fix: "Revisa Integrations → Cron en Supabase: los trabajos deben estar activos y sin errores recientes." },
      { problem: "Errores «permission denied» en el portal.", fix: "Puede faltar un permiso de rol para ese usuario; revisa su rol en Usuarios y roles." },
    ],
  },

  "scheduled-jobs": {
    summary: "Los procesos automáticos del portal: correos de seguimiento, campañas, análisis con IA, recordatorios e informes.",
    benefits: ["Funcionan solos cada 5 minutos, aunque nadie tenga el portal abierto.", "Puedes encender o apagar cada proceso.", "Ves cuándo corrieron y su resultado."],
    cost: "Incluido.",
    before: ["El sitio publicado en internet con https (no funciona desde localhost).", "La clave secreta de Supabase configurada en el servidor."],
    steps: [
      { title: "Genera la clave de tareas", body: "En «Clave de tareas programadas» pulsa «Generar» y guarda." },
      { title: "Activa la ejecución automática", body: "Pulsa «Activar»: la base de datos llamará a la URL de tareas cada 5 minutos con esa clave." },
      { title: "Elige qué procesos corren", body: "Enciende o apaga: secuencia de seguimiento de leads amarillos, recordatorio de formularios sin terminar e informe semanal." },
      { title: "Prueba", body: "Pulsa «Ejecutar ahora» y revisa el resultado en «Últimas ejecuciones»." },
    ],
    verify: ["«Últimas ejecuciones» muestra corridas cada 5 minutos con resultado correcto."],
    technical: {
      how: [
        "La URL /api/jobs/run (GET o POST) ejecuta runJobs(): cola de correos (Resend), lotes de WhatsApp, análisis de IA pendientes, informes y otros procesos, con un presupuesto de unos 50 s por corrida.",
        "Autorización: cabecera Authorization: Bearer <cron_secret> (desde pg_cron) o una sesión de administrador (botón «Ejecutar ahora»).",
        "Las automatizaciones, el SLA de soporte y los webhooks corren directamente en la base de datos con pg_cron, sin pasar por esta URL.",
      ],
      fields: [
        { key: "cron_secret", where: "Botón «Generar»", format: "24 o más caracteres, cifrada" },
        { key: "followup_sequence / abandoned_recovery / weekly_report", where: "Interruptores", format: "on / off (sin valor = encendido)" },
      ],
      endpoints: [{ label: "Tareas programadas", method: "GET/POST", url: "{site}/api/jobs/run", note: "Authorization: Bearer <clave de tareas>" }],
      examples: [{ title: "Ejecutar a mano", lang: "bash", code: `curl -X POST "{site}/api/jobs/run" -H "Authorization: Bearer TU_CLAVE_DE_TAREAS"` }],
      security: ["La clave se guarda cifrada. Si se filtra, genera otra: la tarea programada usará la nueva al reactivarla."],
      limits: ["Cada corrida dura como máximo 60 s; lo que no alcance queda para la siguiente."],
    },
    troubleshooting: [
      { problem: "«La ejecución automática necesita el sitio publicado».", fix: "pg_cron no puede llamar a localhost. Actívala cuando el sitio esté en su dominio con https." },
      { problem: "Error 503 «missing SUPABASE_SECRET_KEY».", fix: "Agrega la variable en el hosting y vuelve a desplegar." },
      { problem: "Error 403.", fix: "La clave de tareas cambió y la programación usa la anterior: desactiva y vuelve a activar la ejecución automática." },
    ],
  },
};

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------

const en: IntegrationGuides = {
  "google-tag-manager": {
    summary: "One place to manage every measurement and ad tag on your site, without asking a developer for changes.",
    benefits: [
      "Add or change tags (Analytics, Google Ads, Hotjar, LinkedIn…) from Google's dashboard, without touching code.",
      "The site already sends the key events: lead submitted (generate_lead), meeting booked (book_appointment) and contact via WhatsApp or phone (contact).",
      "Respects cookies: nothing loads until the visitor accepts.",
    ],
    cost: "Free. You only pay for the ads you set up inside it (e.g. Google Ads).",
    before: ["A Google account (ideally the company's, not a personal one).", "Decide whether to use Tag Manager or this portal's GA4 and Google Ads fields: use only one."],
    steps: [
      { title: "Create the account and container", body: "Open Tag Manager, create an account with your company name and a «Web» container with your site address." },
      { title: "Copy the ID", body: "Top right you'll see a code like GTM-ABC1234. Copy it (you don't need the install snippet: the site already has it)." },
      { title: "Paste it here", body: "Paste the ID into «Google Tag Manager ID» and save. It applies right away." },
      { title: "Leave GA4 and Google Ads empty", body: "If you use Tag Manager, set up GA4 and Google Ads inside GTM and remove those IDs from this portal; otherwise every visit is counted twice." },
      { title: "Create the tags in GTM", body: "For example: a «Google Tag» with your GA4 ID, and a Google Ads conversion tag fired by the custom event generate_lead." },
      { title: "Publish", body: "In GTM click «Submit» and then «Publish». Until you publish, changes don't reach the site." },
    ],
    verify: ["Use «Preview» in GTM, open your site, accept cookies and check that page_view appears, and generate_lead when you submit the form.", "This page shows the integration as «Connected»."],
    technical: {
      how: [
        "The ID is stored in integration_settings (public) and the browser reads it via public_tag_config() on page load (lib/tracking.ts).",
        "With GTM configured, the site only calls dataLayer.push: page_view (with page_path), generate_lead (lead_tier, lead_category, lead_qualified), book_appointment and contact (contact_channel). It doesn't load gtag.js itself.",
        "Consent Mode v2 basic: the GTM script isn't injected until the visitor accepts analytics or marketing; withdrawing consent deletes the cookies.",
      ],
      fields: [{ key: "gtm_id", where: "Tag Manager → top right of the container", format: "GTM-XXXXXXX (4 to 12 letters or digits)" }],
      examples: [
        {
          title: "Events the site pushes to the dataLayer",
          lang: "js",
          code: `dataLayer.push({ event: "page_view", page_path: "/en/services" });
dataLayer.push({ event: "generate_lead", lead_tier: "green", lead_category: "web", lead_qualified: true });
dataLayer.push({ event: "book_appointment" });
dataLayer.push({ event: "contact", contact_channel: "whatsapp" });`,
        },
      ],
      security: ["Anyone who can publish in GTM can inject scripts into your site: grant publish access only to trusted people and enable two-step verification.", "Don't put personal data (email, phone) in third-party tags."],
    },
    troubleshooting: [
      { problem: "Visits or conversions are doubled in Analytics.", fix: "GA4 is configured twice: inside GTM and in this portal's GA4 field. Remove the GA4 ID from here." },
      { problem: "Nothing shows in «Preview».", fix: "Accept the site's cookies: GTM doesn't load without consent. Also check the container is published." },
      { problem: "generate_lead doesn't fire the conversion.", fix: "In GTM the trigger must be a «Custom event» named exactly generate_lead (lowercase)." },
      { problem: "I changed something in GTM and it's not on the site.", fix: "You haven't clicked «Publish», or the browser cached the old version: reload with Ctrl+Shift+R." },
    ],
  },

  "google-analytics": {
    summary: "Measures how many people visit your site, where they come from and which ones end up asking for information.",
    benefits: ["See which channels (Google, social, email) bring visits that turn into leads.", "Receives lead and booking events to measure conversions.", "Complements the portal's own Analytics with Google data (demographics, searches)."],
    cost: "Free (standard GA4).",
    before: ["A company Google account.", "If you already use Google Tag Manager, set up GA4 inside GTM and leave this field empty."],
    steps: [
      { title: "Create the property", body: "In Analytics go to Admin → Create → Property. Choose the Colombia time zone and Colombian peso currency." },
      { title: "Create a web data stream", body: "Inside the property: Data streams → Web → enter your site address." },
      { title: "Copy the measurement ID", body: "In the stream you'll see «Measurement ID» like G-XXXXXXXXXX. Copy it." },
      { title: "Paste it here", body: "Paste it into «GA4 measurement ID» and save." },
      { title: "Mark conversions", body: "In Analytics → Admin → Events, once generate_lead and book_appointment show up, mark them as «key events»." },
    ],
    verify: ["Open your site, accept cookies and check Analytics → Reports → Realtime: you should appear within a minute.", "Submit a test form and check that generate_lead arrives."],
    technical: {
      how: [
        "Without GTM, the site loads gtag.js with the GA4 ID only after analytics consent and sends page_view on each page change.",
        "Events: gtag('event', 'generate_lead', { lead_tier, lead_category }) and gtag('event', 'book_appointment').",
        "Consent Mode v2 basic: no pings without consent (no conversion modeling for people who decline).",
      ],
      fields: [{ key: "ga4_id", where: "Analytics → Admin → Data streams → your web stream", format: "G- followed by 4 to 16 letters or digits" }],
      security: ["Don't send personal data to GA4 (its terms forbid it). The site only sends the lead's category and color, never name or email."],
      limits: ["Standard reports take up to 24-48 hours; use «Realtime» to check."],
    },
    troubleshooting: [
      { problem: "I don't show up in Realtime.", fix: "Accept analytics cookies, disable ad blockers and check the ID starts with G- (not UA-)." },
      { problem: "Visits are duplicated.", fix: "GA4 is also inside GTM. Keep the ID in one place only." },
      { problem: "Numbers don't match the portal's Analytics.", fix: "That's normal: GA4 only counts people who accept cookies and some browsers block Google. The portal's analytics is first-party and cookieless." },
    ],
  },

  "search-console": {
    summary: "Shows how people find you on Google: which searches show you, how many clicks you get and whether pages have errors.",
    benefits: ["See the keywords people use to find you and your position.", "Alerts you if Google can't read a page or the site has mobile issues.", "Ask Google to review a new page instantly."],
    cost: "Free.",
    before: ["A company Google account."],
    steps: [
      { title: "Add the property", body: "Open Search Console → Add property → «URL prefix» and type the exact site address (with https://)." },
      { title: "Choose «HTML tag»", body: "Among the verification methods open «HTML tag». You'll see something like <meta name=\"google-site-verification\" content=\"AbC123…\" />." },
      { title: "Copy only the code", body: "Copy only what's inside the quotes after content= (not the whole tag)." },
      { title: "Paste it here and save", body: "Paste it into «Google Search Console verification» and save." },
      { title: "Verify", body: "Go back to Search Console and click «Verify». If it fails, wait a couple of minutes and retry." },
      { title: "Submit the sitemap", body: "In Search Console → Sitemaps type sitemap.xml and submit it." },
    ],
    verify: ["Search Console shows «Ownership verified».", "Within days the Performance reports start filling."],
    technical: {
      how: ["The code is stored as a public value and the site prints it in every page's <head> as <meta name=\"google-site-verification\" content=\"…\">.", "It doesn't depend on cookies or consent: it's just a meta tag."],
      fields: [{ key: "gsc_verification", where: "Search Console → Verification → HTML tag → content value", format: "20 to 80 letters, digits, hyphen or underscore" }],
      endpoints: [{ label: "Sitemap to submit", method: "GET", url: "{site}/sitemap.xml" }],
      security: ["Don't remove the code after verifying: Google re-checks periodically and you could lose access."],
    },
    troubleshooting: [
      { problem: "«Meta tag not found».", fix: "You pasted the whole tag instead of the code. Keep only the content value. Also confirm you're verifying the same address (with or without www)." },
      { problem: "My domain is verified via DNS and I don't want the tag.", fix: "Leave this field empty: DNS verification works too." },
      { problem: "Pages «Discovered – currently not indexed».", fix: "Normal for new sites. Use «URL inspection → Request indexing» on key pages." },
    ],
  },

  "bing-webmaster": {
    summary: "Like Search Console but for Bing (and assistants that use its index, such as Copilot).",
    benefits: ["Better presence on Bing, Yahoo, DuckDuckGo and Copilot.", "Shows crawl errors and keywords.", "You can import your Google Search Console setup in two clicks."],
    cost: "Free.",
    before: ["A Microsoft account (or sign in with Google)."],
    steps: [
      { title: "Add the site", body: "Open Bing Webmaster Tools → Add site. If you already have Search Console you can use «Import» and skip this field." },
      { title: "Choose «HTML meta tag»", body: "You'll see <meta name=\"msvalidate.01\" content=\"…\" />." },
      { title: "Copy the code", body: "Copy only the content value (32 characters, letters A-F and digits)." },
      { title: "Paste and save", body: "Paste it into «Bing verification» and save; then click «Verify» in Bing." },
      { title: "Submit the sitemap", body: "In Sitemaps add {site}/sitemap.xml." },
    ],
    verify: ["Bing shows the site as verified.", "Within days «Search performance» shows data."],
    technical: {
      how: ["Printed in the <head> as <meta name=\"msvalidate.01\" content=\"…\">. No cookies."],
      fields: [{ key: "bing_verification", where: "Bing Webmaster → Verify → HTML meta tag", format: "32 hex characters" }],
      endpoints: [{ label: "Sitemap", method: "GET", url: "{site}/sitemap.xml" }],
      security: ["Keep the code while you use Bing Webmaster."],
    },
    troubleshooting: [
      { problem: "«Invalid format» when saving.", fix: "You pasted the whole tag. The code is exactly 32 characters (0-9 and A-F)." },
      { problem: "Verification fails.", fix: "Check the site added in Bing is exactly the published address (same https and www)." },
    ],
  },

  "microsoft-clarity": {
    summary: "Anonymous recordings of how people browse and heatmaps of where they click.",
    benefits: ["Watch (without personal data) where visitors get stuck, e.g. in the form.", "Heatmaps: which sections they look at and which they skip.", "Detects «rage clicks» and JavaScript errors."],
    cost: "Free, no traffic limit.",
    before: ["A Microsoft, Google or Facebook account to sign in to Clarity."],
    steps: [
      { title: "Create the project", body: "Open Clarity → New project → name and site address." },
      { title: "Copy the project ID", body: "In Settings → Overview you'll see «Project ID» (about 10 lowercase letters and digits)." },
      { title: "Paste it here", body: "Paste it into «Microsoft Clarity ID» and save. Don't install Clarity's snippet: the site loads it." },
      { title: "Enable masking", body: "In Clarity → Settings → Masking keep «Balanced» or «Strict» mode so typed text isn't visible." },
    ],
    verify: ["Browse the site accepting cookies; first recordings appear in Clarity within 30 minutes to 2 hours."],
    technical: {
      how: ["The ID is public and read with public_tag_config(). Clarity's script is injected only if the visitor accepted analytics cookies.", "Clarity masks form fields by default; recordings don't include passwords or card data."],
      fields: [{ key: "clarity_id", where: "Clarity → Settings → Overview → Project ID", format: "6 to 20 lowercase letters or digits" }],
      security: ["Make sure masking is on, especially in the portal and forms.", "Mention Clarity in your cookie policy (analytics)."],
    },
    troubleshooting: [
      { problem: "No recordings arrive.", fix: "Clarity takes up to 2 hours. Accept analytics cookies and disable blockers." },
      { problem: "Text that shouldn't be visible shows up.", fix: "Switch masking to «Strict» in the project settings." },
    ],
  },

  "google-ads": {
    summary: "Measures which ads bring real leads, meetings and sales, and tells Google so your campaigns find more customers like them.",
    benefits: [
      "Instant conversion when a green or yellow lead arrives and when someone books.",
      "Offline conversions: when a lead becomes qualified, meeting or sale (with value) in the CRM, Google Ads learns about it daily.",
      "Your campaigns learn to find customers who buy, not just people who fill forms.",
    ],
    cost: "Setting up measurement is free; you pay for ad clicks according to your budget.",
    before: [
      "A Google Ads account with active billing.",
      "Auto-tagging enabled in Google Ads → Account settings, so the gclid arrives.",
      "If you use Tag Manager, create conversions inside GTM and leave the ID and labels here empty.",
    ],
    steps: [
      { title: "Copy the account ID", body: "In Google Ads → Goals → Conversions → Settings → «Google tag» you'll see an ID like AW-123456789. Paste it into «Google Ads ID»." },
      { title: "Create the lead conversion", body: "Goals → Conversions → New → Website → manual setup, category «Submit lead form». In «Install the tag» copy the «conversion label» (what comes after the slash in send_to) and paste it into «Label: lead conversion»." },
      { title: "Create the meeting conversion", body: "Repeat with category «Book appointment» and paste its label into «Label: meeting booked conversion»." },
      { title: "Create the three offline conversions", body: "New → Import → «Click conversions» (other sources). Create them with these exact names (or the ones you set here): Lead calificado, Reunion agendada and Venta." },
      { title: "Generate feed user and password", body: "In the offline conversions section type a user and click «Generate» for the password. Save." },
      { title: "Schedule the upload", body: "In Google Ads → Goals → Conversions → Uploads → Schedules → HTTPS: paste the feed URL, user and password, daily frequency." },
    ],
    verify: ["Web conversions move from «No recent conversions» to «Recording conversions» within 24-48 h.", "Uploads → history shows each feed fetch with accepted rows.", "The «Next upload» table on this page shows what Google will fetch."],
    technical: {
      how: [
        "Web conversions: without GTM, the site loads gtag.js (after marketing consent) and sends gtag('event', 'conversion', { send_to: 'AW-ID/label' }) only for green and yellow leads, and on booking.",
        "The gclid is stored on the lead when it arrives from an ad. ads_offline_conversions(90 days) builds conversions from the CRM: qualified, meeting and won sale (with its COP value).",
        "The feed is a CSV in Google's «Click conversions» template format, America/Bogota time zone, protected by HTTP Basic auth (constant-time comparison).",
      ],
      fields: [
        { key: "google_ads_id", where: "Google Ads → Google tag", format: "AW- and 6 to 14 digits" },
        { key: "google_ads_lead_label", where: "Lead conversion → Install the tag → send_to after the slash", format: "4 to 64 letters, digits, - or _" },
        { key: "google_ads_booking_label", where: "Meeting conversion → send_to after the slash", format: "4 to 64 letters, digits, - or _" },
        { key: "ads_feed_user", where: "You choose it", format: "3 to 64 characters (letters, digits, . _ -)" },
        { key: "ads_feed_password", where: "«Generate» button", format: "At least 12 characters, stored encrypted" },
        { key: "ads_conversion_qualified / meeting / won", where: "Exact names of the import actions in Google Ads", format: "2 to 100 characters" },
      ],
      endpoints: [{ label: "Offline conversions feed (CSV)", method: "GET", url: "{site}/api/ads/conversions", note: "HTTP Basic auth with this section's user and password." }],
      examples: [
        { title: "Example of what Google downloads", lang: "text", code: GADS_FEED },
        { title: "Test the feed from a terminal", lang: "bash", code: `curl -u "user:password" "{site}/api/ads/conversions"` },
      ],
      security: ["The feed password is stored encrypted in Supabase Vault; only its last characters are shown.", "The feed has no names, emails or phones: only gclid, conversion name, time and value."],
      limits: ["Google only accepts click conversions from the last 90 days with a gclid from the same account.", "The feed needs SUPABASE_SECRET_KEY on the server (otherwise it returns 503)."],
    },
    troubleshooting: [
      { problem: "The scheduled upload fails with 401.", fix: "User or password differ from those saved here. Regenerate the password, save and update it in Google Ads." },
      { problem: "Google says «Conversion name not found».", fix: "Names here must match the import actions in Google Ads exactly (case and accents included)." },
      { problem: "The feed is empty.", fix: "Only leads that arrived with a gclid (from an ad, auto-tagging on) and moved forward in the CRM appear." },
      { problem: "Web conversions are doubled.", fix: "They're set up in GTM and here at the same time. Keep only one." },
      { problem: "«Click is too old».", fix: "Google rejects conversions for clicks older than 90 days; normal for long sales cycles." },
    ],
  },

  "meta-pixel": {
    summary: "Tells Facebook and Instagram who visits your site and who converts, so your ads reach similar people.",
    benefits: ["Automatic events: PageView, Lead (form), Schedule (meeting) and Contact (WhatsApp or phone).", "Build remarketing and lookalike audiences.", "Measure the real cost per lead of your Meta campaigns."],
    cost: "The pixel is free; you pay for ads.",
    before: ["A Meta Business account (business.facebook.com) with your page.", "Your domain verified in Meta Business → Settings → Domains (recommended)."],
    steps: [
      { title: "Create the dataset", body: "In Events Manager → Connect data sources → Web → name it." },
      { title: "Copy the ID", body: "You'll see a numeric ID of about 15 digits. Copy it." },
      { title: "Paste it here", body: "Paste it into «Pixel ID» and save. Don't install Meta's snippet: the site loads it." },
      { title: "Prioritize events", body: "In Events Manager mark Lead and Schedule as conversion events for your campaigns." },
    ],
    verify: ["With the Meta Pixel Helper extension or «Test events» in Events Manager, browse the site accepting marketing cookies: PageView should appear, and Lead when you submit the form."],
    technical: {
      how: ["fbevents.js loads only with marketing consent. Events: fbq('track','PageView') on each page, fbq('track','Lead',{content_category, lead_tier}), fbq('track','Schedule') and fbq('track','Contact',{channel}).", "No personal data (email or phone) is sent to the pixel."],
      fields: [{ key: "meta_pixel_id", where: "Events Manager → your dataset", format: "6 to 20 digits" }],
      security: ["Give Events Manager access only to people running ads.", "Mention the pixel in your cookie policy (marketing)."],
    },
    troubleshooting: [
      { problem: "Pixel Helper doesn't find the pixel.", fix: "Accept marketing cookies (the pixel doesn't load without them) and disable blockers." },
      { problem: "Meta asks for the Conversions API.", fix: "It's optional. With the pixel and current events you can optimize for Lead; the Conversions API improves iOS measurement." },
      { problem: "Duplicate events.", fix: "Make sure the pixel isn't also in GTM." },
    ],
  },

  "linkedin-insight": {
    summary: "Measures visits coming from LinkedIn and lets you show ads to companies and job titles that already visited you.",
    benefits: ["See which companies, industries and titles visit your site (aggregated).", "B2B remarketing on LinkedIn.", "Measure conversions from your LinkedIn campaigns."],
    cost: "The tag is free; LinkedIn ads are paid separately (usually higher cost per click).",
    before: ["A LinkedIn Campaign Manager account linked to your company page."],
    steps: [
      { title: "Open Campaign Manager", body: "Go to Campaign Manager → pick the account → Account assets (Analyze) → Insight Tag." },
      { title: "Copy the Partner ID", body: "Choose «I will install the tag myself». In the code you'll see _linkedin_partner_id = \"1234567\": copy only the number." },
      { title: "Paste it here", body: "Paste it into «LinkedIn Partner ID» and save." },
      { title: "Create conversions", body: "In Campaign Manager → Conversions, create URL-based conversions (e.g. the thank-you page) or use the tag event." },
    ],
    verify: ["In Campaign Manager → Insight Tag the status turns «Active» after visits with accepted cookies (can take 24 h)."],
    technical: {
      how: ["The insight.min.js script is injected after marketing consent with the public partner ID."],
      fields: [{ key: "linkedin_partner_id", where: "Campaign Manager → Insight Tag → _linkedin_partner_id", format: "4 to 12 digits" }],
      security: ["Mention LinkedIn in your cookie policy (marketing)."],
      limits: ["LinkedIn only shows demographics with at least about 300 visits per segment."],
    },
    troubleshooting: [
      { problem: "The tag shows «Unverified».", fix: "Wait 24 h with real traffic and marketing cookies accepted." },
      { problem: "No company data.", fix: "LinkedIn needs a minimum volume; with little traffic the reports stay empty." },
    ],
  },

  "tiktok-pixel": {
    summary: "Measures visits and conversions coming from your TikTok ads.",
    benefits: ["Optimize TikTok campaigns toward submitted forms.", "Build remarketing audiences of site visitors."],
    cost: "The pixel is free; ads are paid separately.",
    before: ["A TikTok Ads Manager (TikTok for Business) account."],
    steps: [
      { title: "Create the pixel", body: "In Ads Manager → Tools → Events → Web → Create pixel → manual setup." },
      { title: "Copy the ID", body: "You'll see an ID of about 20 uppercase letters and digits (e.g. C1A2B3…)." },
      { title: "Paste it here and save", body: "Paste it into «TikTok pixel ID». Don't install their snippet: the site loads it." },
      { title: "Define events", body: "In the events manager create URL-based events or use the standard ones." },
    ],
    verify: ["With the TikTok Pixel Helper extension, browse the site with marketing cookies accepted and check the pixel fires PageView."],
    technical: {
      how: ["TikTok's events.js loads only with marketing consent, using the public ID."],
      fields: [{ key: "tiktok_pixel_id", where: "Ads Manager → Events → Web → your pixel", format: "10 to 30 uppercase letters or digits" }],
      security: ["Include it in your cookie policy (marketing)."],
    },
    troubleshooting: [
      { problem: "«Invalid format».", fix: "TikTok's ID is uppercase with no spaces; don't paste the whole snippet." },
      { problem: "The pixel doesn't fire.", fix: "Accept marketing cookies and disable ad blockers." },
    ],
  },

  whatsapp: {
    summary: "Send campaigns and answer your customers' WhatsApp messages from the portal chat, with your business number.",
    benefits: ["Every WhatsApp message lands in the chat inbox and whoever is on duty answers.", "Campaigns with approved templates, with delivered, read and replied statuses.", "Automations can send WhatsApp (reminders, follow-ups)."],
    cost: "Meta charges per message or conversation by category (marketing, utility, authentication). Replying within 24 hours to a customer who wrote you is usually free. Check Meta's pricing page for Colombia: it changes often.",
    before: ["A Meta Business account (verified recommended) and a «Business» Meta app with the WhatsApp product.", "A phone number not in use by the regular WhatsApp app (or migrate it).", "A payment method in WhatsApp Manager."],
    steps: [
      { title: "Create the app", body: "At developers.facebook.com → My apps → Create app → «Business» type → add WhatsApp and connect your WhatsApp Business account." },
      { title: "Add your number", body: "In WhatsApp → API Setup add and verify the business number. Copy the «Phone number ID» and «WhatsApp Business Account ID» and paste them here." },
      { title: "Create a permanent token", body: "In Meta Business → Settings → System users create an admin user, assign the app and WhatsApp account, and generate a token with whatsapp_business_messaging and whatsapp_business_management. Paste it into «Permanent access token»." },
      { title: "Copy the app secret", body: "In the app → Settings → Basic → «App secret». Paste it here (it proves messages come from Meta)." },
      { title: "Connect the webhook", body: "Click «Generate» for «Verify token» and save. In the app → WhatsApp → Configuration → Webhook, paste the URL shown on this page and that same token; subscribe to the messages field." },
      { title: "Test", body: "Click «Test connection» here. Then message the business number from your phone: it should appear in the portal chat." },
      { title: "Sync templates", body: "Create templates in WhatsApp Manager; once Meta approves them, sync them from Campaigns to use them." },
    ],
    verify: ["«Test connection» shows the verified name and number.", "A message sent to the number reaches the portal chat within seconds.", "A test campaign shows «delivered» and «read»."],
    technical: {
      how: [
        "Sending: Graph API (https://graph.facebook.com/{version}/{phone_number_id}/messages) with the token as Bearer. Default version is v23.0 unless you set another.",
        "Receiving: Meta calls /api/whatsapp/webhook. GET answers the challenge (hub.challenge) if hub.verify_token matches; POST is validated with X-Hub-Signature-256 (HMAC-SHA256 of the body with the app secret).",
        "Campaigns are queued in the database and sent in batches by scheduled jobs (every 5 min) or on dispatch.",
      ],
      fields: [
        { key: "whatsapp_phone_number_id", where: "Meta app → WhatsApp → API Setup", format: "6 to 30 digits" },
        { key: "whatsapp_business_account_id", where: "WhatsApp Manager or API Setup", format: "6 to 30 digits" },
        { key: "whatsapp_access_token", where: "System user → Generate token", format: "Long text without spaces (EAA…), encrypted" },
        { key: "whatsapp_app_secret", where: "App → Settings → Basic", format: "16 to 64 letters or digits, encrypted" },
        { key: "whatsapp_verify_token", where: "Generated here and pasted in Meta", format: "At least 8 characters, encrypted" },
        { key: "whatsapp_graph_version", where: "Optional", format: "vNN.N (e.g. v23.0)" },
      ],
      endpoints: [{ label: "WhatsApp webhook", method: "GET/POST", url: "{site}/api/whatsapp/webhook", note: "Subscribe to the messages field." }],
      permissions: ["whatsapp_business_messaging", "whatsapp_business_management"],
      security: ["Use a system user: regular user tokens expire within hours or days.", "Tokens and the app secret are stored encrypted in Supabase Vault; the portal only shows the last 4 characters.", "Every webhook request is rejected if the X-Hub-Signature-256 signature doesn't match."],
      limits: ["Outside the 24-hour window since the customer's last message you can only send approved templates.", "Meta sets a daily limit of new conversations that grows with number quality."],
    },
    troubleshooting: [
      { problem: "«Error validating access token: Session has expired».", fix: "You used a temporary token. Create a system user token (it doesn't expire) and replace it." },
      { problem: "Meta doesn't accept the webhook URL.", fix: "The site must be published over https (localhost won't work) and the verify token must match the one saved here." },
      { problem: "Messages arrive in Meta but not in the portal.", fix: "Check you're subscribed to messages and the app secret is correct (otherwise the signature fails and they're rejected)." },
      { problem: "Error 131047 «Re-engagement message».", fix: "More than 24 h passed since the customer's last message: use an approved template." },
      { problem: "A template doesn't show in Campaigns.", fix: "Only «Approved» templates are shown. Sync again after Meta approves it." },
      { problem: "Error 131030 «Recipient not in allowed list».", fix: "You're on Meta's test number: add the recipient to the list or use your real number." },
    ],
  },

  "messenger-instagram": {
    summary: "Messages to your Facebook page and Instagram professional account land in the portal chat and you reply from there.",
    benefits: ["One inbox for web, WhatsApp, Messenger and Instagram.", "Replies, assignment and tags just like the site chat.", "History linked to the lead."],
    cost: "Free (Meta's Messenger and Instagram API).",
    before: ["A company Facebook page and an Instagram professional account linked to it.", "The same Meta app you use for WhatsApp (or a new Business app)."],
    steps: [
      { title: "Add the products", body: "In your Meta app add Messenger and Instagram, and connect your Facebook page (and the linked Instagram)." },
      { title: "Generate the page token", body: "In Messenger → Settings → Access tokens (or with a system user) generate the token with pages_messaging, pages_manage_metadata, instagram_basic and instagram_manage_messages. Paste it here." },
      { title: "Copy the IDs", body: "Paste the page ID (Page → About → Page transparency) and, if you use Instagram, the Instagram account ID." },
      { title: "Connect the webhook", body: "In Messenger → Settings and Instagram → Webhooks paste this page's URL with the same verify token as WhatsApp. Subscribe to messages, message_deliveries and message_reads." },
      { title: "Allow message access on Instagram", body: "In the Instagram app → Settings → Privacy → Messages, turn on «Allow access to messages» for connected tools." },
    ],
    verify: ["Message your page and your Instagram from another account: messages show up in the portal chat with their channel."],
    technical: {
      how: ["Meta calls /api/meta/webhook. GET checks hub.verify_token (same token as WhatsApp) and POST validates X-Hub-Signature-256 with the app secret.", "Replies go out through the Graph API Send API with the page token (/api/meta/reply)."],
      fields: [
        { key: "meta_page_id", where: "Page → About → Transparency, or Business Suite → Settings", format: "5 to 30 digits" },
        { key: "meta_page_token", where: "App → Messenger → Access tokens, or a system user", format: "Long text without spaces, encrypted" },
        { key: "instagram_account_id", where: "Optional: linked professional account", format: "5 to 30 digits (often starts with 1784…)" },
      ],
      endpoints: [{ label: "Messenger and Instagram webhook", method: "GET/POST", url: "{site}/api/meta/webhook" }],
      permissions: ["pages_messaging", "pages_manage_metadata", "instagram_basic", "instagram_manage_messages", "Events: messages, message_deliveries, message_reads"],
      security: ["To use it with real customers the app must be «Live» and Meta's review approved for those permissions."],
      limits: ["You can only reply within 24 hours of the customer's last message (7 days with the HUMAN_AGENT tag)."],
    },
    troubleshooting: [
      { problem: "Only messages from app admins arrive.", fix: "The app is in development mode. Switch it to «Live» and request permission review." },
      { problem: "Instagram sends nothing.", fix: "Turn on «Allow access to messages» in the Instagram app and confirm the account is professional and linked to the page." },
      { problem: "Webhook signature error.", fix: "The app secret saved here must belong to the same app where you set up the webhook." },
    ],
  },

  resend: {
    summary: "Sends every system email from your domain: follow-ups, confirmations, team alerts, campaigns and reports.",
    benefits: ["Emails from your domain (hello@yourcompany.com) that land in the inbox.", "Tracks deliveries, opens, clicks and bounces in Follow-ups and Campaigns.", "Bounces and complaints stop sending to that person automatically."],
    cost: "Free plan with 3,000 emails per month and 100 per day; paid plans increase volume. Check Resend's pricing page.",
    before: ["Access to your domain's DNS settings (registrar or Cloudflare)."],
    steps: [
      { title: "Create the account", body: "Sign up at resend.com with the company email." },
      { title: "Verify your domain", body: "In Domains → Add Domain type your domain. Resend gives you DNS records (SPF, DKIM and optionally DMARC): add them at your DNS provider and wait until they're «Verified»." },
      { title: "Create the key", body: "In API Keys → Create API Key, «Sending access». Copy the key (starts with re_) and paste it here." },
      { title: "Set sender and team", body: "In «Sender» type e.g. Engynex <hello@yourdomain.com> (verified domain). In «Team emails», the addresses that get alerts and reports, comma separated." },
      { title: "Enable tracking", body: "In Domains → your domain turn on Open tracking and Click tracking." },
      { title: "Connect the webhook", body: "In Webhooks → Add endpoint paste this page's URL, pick email.delivered, email.opened, email.clicked, email.bounced and email.complained, and copy the Signing secret (whsec_…) into «Webhook secret»." },
    ],
    verify: ["Send a test from Follow-ups: it reaches your inbox, not spam.", "In Follow-ups the email changes to «Delivered» and then «Opened» when you open it."],
    technical: {
      how: [
        "Emails are queued in email_queue and sent by scheduled jobs (every 5 min) via POST https://api.resend.com/emails with the key as Bearer.",
        "The /api/email/webhook endpoint validates the Svix signature (svix-id, svix-timestamp and svix-signature headers with the whsec_ secret) and records the event with email_event().",
        "Bounces and complaints flag the recipient so they're not emailed again; every marketing email includes an unsubscribe link ({site}/api/email/baja).",
      ],
      fields: [
        { key: "resend_api_key", where: "Resend → API Keys", format: "re_ followed by 10+ characters, encrypted" },
        { key: "resend_webhook_secret", where: "Resend → Webhooks → endpoint → Signing secret", format: "whsec_…, encrypted" },
        { key: "email_from", where: "You choose it, with the verified domain", format: "Name <email@domain>" },
        { key: "notify_emails", where: "Team emails", format: "email@domain, other@domain" },
      ],
      endpoints: [{ label: "Resend webhook", method: "POST", url: "{site}/api/email/webhook", note: "Events: email.delivered, email.opened, email.clicked, email.bounced, email.complained." }],
      security: ["Use a sending-only key.", "Correct SPF, DKIM and DMARC prevent spoofing and improve deliverability."],
      limits: ["Free plan: 100 emails per day and 3,000 per month; beyond that emails wait until the next day or fail."],
    },
    troubleshooting: [
      { problem: "Error «The domain is not verified».", fix: "The sender uses a domain not verified in Resend. Finish DNS verification or change the sender." },
      { problem: "Emails go to spam.", fix: "Check SPF and DKIM (Verified), add a DMARC record and avoid large campaigns from a brand-new domain." },
      { problem: "The webhook returns 400 or 401.", fix: "The whsec_ secret saved here isn't the endpoint's. Copy it again from Resend → Webhooks." },
      { problem: "Opens aren't recorded.", fix: "Turn on Open tracking for the domain. Some clients (Apple Mail) auto-open and others block images: treat it as an estimate." },
      { problem: "Error 429.", fix: "You exceeded your plan's sending limit; wait or upgrade." },
    ],
  },

  claude: {
    summary: "The AI reads what each lead wrote and leaves the advisor a summary, urgency, suggested services and an opening message.",
    benefits: ["The advisor understands the lead in seconds before calling.", "Suggested questions and an opening message ready to copy.", "Helps draft replies in the chat."],
    cost: "Pay per use (tokens processed). A lead analysis costs a few cents of a dollar. Set a monthly spend limit in the console. Check the pricing page.",
    before: ["An Anthropic console account with a payment method."],
    steps: [
      { title: "Create the account", body: "Sign in at console.anthropic.com with the company email." },
      { title: "Add credits and a limit", body: "In Billing add a payment method and credits; in Limits set a monthly cap to avoid surprises." },
      { title: "Create the key", body: "In API Keys → Create Key, name it e.g. «Engynex Portal». Copy the key (starts with sk-ant-) and paste it here." },
      { title: "Enable automatic analysis", body: "Keep «Automatically analyze each new lead» on. You can also analyze manually from the lead page." },
    ],
    verify: ["Create a test lead: the AI card with the summary appears on the lead page within a minute."],
    technical: {
      how: [
        "lib/ai.ts calls Anthropic's Messages API with the claude-opus-5-5 model from the server (/api/ai/lead and /api/ai/chat). The key never reaches the browser.",
        "The analysis is stored in leads.ai_insights; it doesn't change the lead's score or color.",
        "With the switch on, scheduled jobs analyze pending new leads.",
      ],
      fields: [
        { key: "anthropic_api_key", where: "Anthropic console → API Keys", format: "sk-ant- followed by 20+ characters, encrypted" },
        { key: "ai_lead_insights", where: "Switch on this page", format: "on / off" },
      ],
      security: ["Only what the lead wrote and their form answers are sent to Anthropic.", "Rotate the key if you suspect a leak; only the last 4 characters are shown here."],
      limits: ["Requests-per-minute limits depend on your Anthropic account tier."],
    },
    troubleshooting: [
      { problem: "Error 401 «invalid x-api-key».", fix: "The key was copied wrong or revoked. Create another and paste it again." },
      { problem: "Error «credit balance is too low».", fix: "Add credits in Billing." },
      { problem: "Error 429 or 529.", fix: "Tier limit or service overloaded. It retries on the next run; check status.anthropic.com." },
      { problem: "The AI card doesn't appear.", fix: "Check the switch is on and scheduled jobs are active (or click «Analyze» on the lead)." },
    ],
  },

  "hostinger-domains": {
    summary: "Sell domains self-service: the customer searches, creates an account, pays and the domain is registered in their name; then they manage and renew it from their portal.",
    benefits: ["Extra revenue from every client who needs a domain.", "Real availability and prices, checked with the registrar on each search.", "Automatic registration once payment is approved, without opening hPanel."],
    cost: "Hostinger charges each domain to your account's payment method (catalog price, usually USD). You set the margin and exchange rate; the difference is your profit. Check current prices on Hostinger.",
    before: ["A Hostinger account with a saved payment method.", "Nothing else: each customer's WHOIS profile is created from the details they fill in at checkout.", "Wompi connected to charge the customer (see “Online payments (Wompi)”)."],
    steps: [
      { title: "Create the token", body: "In hPanel go to your profile → API and generate a token. Copy it." },
      { title: "Paste it here", body: "In Settings paste it into “Hostinger API token” and save." },
      { title: "Set your prices", body: "Enter the exchange rate (COP per USD) and your margin. Example: a 10 USD .com at 4,200 with a 30% margin sells for COP 55,000." },
      { title: "Choose extensions", body: "List the ones you want to offer, e.g. com, co, com.co, net, store, online." },
      { title: "Decide on auto-registration", body: "With “Register automatically” on, the domain is bought at Hostinger as soon as Wompi approves the payment. Off, you register it from Portal → Domains." },
      { title: "Test", body: "Search a name in Services → Web development → Domains: you should see COP prices and real availability." },
    ],
    verify: ["Results no longer say “Approximate check”.", "Paid orders move to “Registered” in Portal → Domains and show up in hPanel → Domains."],
    technical: {
      how: [
        "Search: POST /api/domains/v1/availability (several extensions at once, alternatives with with_alternatives). Prices: GET /api/billing/v1/catalog?category=DOMAIN, cached 1 hour; first-year price is used and renewal is shown.",
        "Purchase: the site creates an order (domain_orders) and sends the customer to Wompi checkout. Wompi's webhook confirms payment and calls POST /api/domains/v1/portfolio with the catalog item_id.",
        "Without a token, search works with RDAP (official registries via IANA) and DNS over HTTPS as an approximate check, with reference prices; payment is disabled until Wompi is connected.",
      ],
      fields: [
        { key: "hostinger_api_token", where: "hPanel → Profile → API", format: "Bearer token (secret)" },
        { key: "domain_usd_cop", where: "You set it", format: "Number, e.g. 4200" },
        { key: "domain_margin_pct", where: "You set it", format: "Whole percentage, e.g. 30" },
        { key: "domain_tlds", where: "You set it", format: "com, co, com.co, net…" },
      ],
      endpoints: [
        { label: "Search (public)", method: "GET", url: "{site}/api/domains/search?q=mycompany" },
        { label: "Create order (public)", method: "POST", url: "{site}/api/domains/checkout" },
        { label: "Order status", method: "GET", url: "{site}/en/dominios/pedido/<reference>" },
      ],
      security: ["The token is stored encrypted and only the server reads it.", "Price is recalculated on the server before charging; the webhook checks the paid amount matches the order.", "Limit of 20 searches per minute per visitor."],
      limits: ["Hostinger limits availability checks to 90 requests per minute.", "Some extensions require extra registrant data (additional_details); register those manually."],
    },
    troubleshooting: [
      { problem: "Registration fails with a WHOIS contact error.", fix: "Create default contacts in hPanel → Domains for that extension and use “Register at Hostinger” in Portal → Domains." },
      { problem: "Hostinger responds 202 (payment processing).", fix: "The order stays in “Registering”. Once Hostinger confirms the charge, finish registration in hPanel and mark it registered." },
      { problem: "Prices look too high or low.", fix: "Check the exchange rate and margin; the catalog comes in your Hostinger account currency." },
      { problem: "An extension doesn't show.", fix: "Make sure it's in “Extensions shown” and that Hostinger sells it (DOMAIN catalog)." },
    ],
  },
  wompi: {
    summary: "Collect online payments in COP with PSE, cards, Nequi and more. We use it to sell domains from the site.",
    benefits: ["Local payment methods: PSE, cards, Nequi, Bancolombia and cash.", "Money lands in your bank account.", "Automatic payment confirmation (no manual checks)."],
    cost: "Wompi charges a fee per approved transaction; no monthly fee. Check current rates on their site.",
    before: ["An approved Wompi merchant account (individual or company).", "Access to the merchant dashboard (comercios.wompi.co)."],
    steps: [
      { title: "Copy the keys", body: "In Wompi → Developers copy the public key (pub_prod_…), the integrity secret and the events secret." },
      { title: "Paste them here", body: "In Settings paste the three values and save. To test without charging, use the test keys (pub_test_…)." },
      { title: "Set the events URL", body: "In Wompi → Developers → Events URL paste the address shown in Settings (…/api/payments/wompi)." },
      { title: "Make a test purchase", body: "With test keys buy a domain: Wompi shows test cards and data." },
      { title: "Go live", body: "Switch to production keys. From then on every payment is real." },
    ],
    verify: ["Buying a domain opens Wompi checkout with the right amount.", "After paying, the order moves to “Paid” and then “Registered” in Portal → Domains."],
    technical: {
      how: [
        "Web checkout: GET https://checkout.wompi.co/p/ with public-key, currency=COP, amount-in-cents, reference, redirect-url and signature:integrity = SHA256(reference + amount-in-cents + COP + integrity secret).",
        "Events: Wompi sends transaction.updated to {site}/api/payments/wompi. The checksum is SHA256 of the signature.properties values + timestamp + events secret; mismatches are rejected (401).",
        "Only APPROVED triggers domain registration; DECLINED, VOIDED and ERROR mark the order as declined.",
      ],
      fields: [
        { key: "wompi_public_key", where: "Wompi → Developers → API keys", format: "pub_test_… or pub_prod_…" },
        { key: "wompi_integrity_secret", where: "Wompi → Developers → Secrets → Integrity", format: "test_integrity_… or prod_integrity_…" },
        { key: "wompi_events_secret", where: "Wompi → Developers → Secrets → Events", format: "test_events_… or prod_events_…" },
      ],
      endpoints: [{ label: "Events URL", method: "POST", url: "{site}/api/payments/wompi" }],
      security: ["Secrets are stored encrypted and never reach the browser.", "Wompi's redirect doesn't confirm payments: only the verified event does.", "The paid amount is checked against the order."],
      limits: ["COP only.", "Wompi retries an event up to 3 times in 24 hours if it doesn't get a 200."],
    },
    troubleshooting: [
      { problem: "Checkout shows “invalid signature”.", fix: "The integrity secret doesn't match the public key (test vs production). Use both from the same environment." },
      { problem: "I paid and the order still says “Waiting for payment”.", fix: "Check the events URL is set in Wompi and the events secret is correct." },
      { problem: "There's no pay button, only “We got your order”.", fix: "The public key or integrity secret is missing: without them the order is left for manual collection." },
    ],
  },
  slack: {
    summary: "Get the important alerts in a Slack channel: green leads, critical requests and won deals.",
    benefits: ["The whole team knows instantly without opening the portal.", "Each message includes a direct link to the lead or request.", "You choose what gets posted from Automations."],
    cost: "Free: incoming webhooks work on Slack's free plan.",
    before: ["A Slack workspace and permission to install apps (or ask the admin)."],
    steps: [
      { title: "Create an app", body: "Go to api.slack.com/apps → Create New App → From scratch → name «Engynex» and your workspace." },
      { title: "Enable Incoming Webhooks", body: "In the app menu → Incoming Webhooks → turn it on." },
      { title: "Pick the channel", body: "Click «Add New Webhook to Workspace», choose the channel (e.g. #sales) and authorize." },
      { title: "Copy the URL", body: "Copy the URL starting with https://hooks.slack.com/services/… and paste it here. Save." },
      { title: "Test", body: "Click «Send test»: a message should reach the channel." },
      { title: "Choose what to post", body: "Automations already has ready rules (green lead, critical request, won deal). Create more with the «Notify in Slack / Teams / Google Chat» action." },
    ],
    verify: ["The test message reaches the channel.", "A test green lead posts an alert with the link."],
    technical: {
      how: ["The database posts with pg_net (POST JSON {\"text\": …}) to the webhook URL from team_alert(), called by the team_chat automation action.", "The text supports Slack mrkdwn (*bold*, line breaks) and <link|Open in portal> is appended."],
      fields: [{ key: "slack_webhook_url", where: "api.slack.com/apps → your app → Incoming Webhooks", format: "https://hooks.slack.com/…, encrypted" }],
      examples: [{ title: "What the portal sends", lang: "bash", code: TEAM_CHAT_SLACK }],
      security: ["The URL works like a password: anyone with it can post to the channel. It's stored encrypted.", "If it leaks, delete the webhook in Slack and create a new one."],
      limits: ["Slack allows about 1 message per second per webhook."],
    },
    troubleshooting: [
      { problem: "The test doesn't arrive and Slack returns 404 «no_service» or «invalid_token».", fix: "The webhook was deleted or the app uninstalled. Create a new one and replace the URL." },
      { problem: "Error «channel_is_archived».", fix: "The channel was archived: create the webhook for another channel." },
      { problem: "«action_prohibited».", fix: "The Slack admin restricted apps: ask them to approve the app." },
    ],
  },

  "microsoft-teams": {
    summary: "Posts the portal's important alerts to a Microsoft Teams channel.",
    benefits: ["Instant alerts for green leads, critical requests and sales.", "Direct portal link in each message.", "Configurable from Automations."],
    cost: "Included in Microsoft 365 (Teams). Standard Workflows (Power Automate) has no extra cost for this use.",
    before: ["A Teams team and channel where you can add workflows."],
    steps: [
      { title: "Open Workflows in the channel", body: "In Teams, on the channel click the three dots (…) → Workflows." },
      { title: "Pick the template", body: "Search «Post to a channel when a webhook request is received»." },
      { title: "Configure", body: "Name it «Engynex», confirm team and channel and click «Add workflow»." },
      { title: "Copy the URL", body: "Teams shows a long URL (https://…logic.azure.com… or …powerplatform.com…). Copy it and paste it here; save." },
      { title: "Test", body: "Click «Send test» and check the channel." },
    ],
    verify: ["The test message reaches the channel (posted by the «Engynex» flow on behalf of Workflows)."],
    technical: {
      how: ["team_alert() sends POST JSON {\"text\": \"…\"} with pg_net. [Open in portal](link) is appended in Markdown.", "The old Office 365 «Incoming Webhook» connectors are being retired; use Workflows."],
      fields: [{ key: "teams_webhook_url", where: "Teams → channel → Workflows → HTTP trigger URL", format: "https://…, encrypted" }],
      security: ["The URL lets anyone post to the channel: treat it as a secret (it's encrypted here)."],
      limits: ["If the flow expects an adaptive card instead of text, edit it to post the body's text field."],
    },
    troubleshooting: [
      { problem: "The flow runs but the message is empty.", fix: "Edit the flow in Power Automate and in «Post message» use the dynamic content text from the received body." },
      { problem: "Error 401 or 403.", fix: "The flow was turned off or its owner lost access. Recreate it and replace the URL." },
      { problem: "The template doesn't show.", fix: "Your organization may block Power Automate; ask your Microsoft 365 admin." },
    ],
  },

  "google-chat": {
    summary: "Posts the portal's important alerts to a Google Chat space.",
    benefits: ["Instant alerts for teams working in Google Workspace.", "Direct link to the lead or request.", "Controlled from Automations."],
    cost: "Requires Google Workspace (Google's paid business plan). Webhooks have no extra cost.",
    before: ["A Google Workspace account and a Chat space where you can manage integrations."],
    steps: [
      { title: "Open the space", body: "In Google Chat open the space (e.g. «Sales»)." },
      { title: "Add a webhook", body: "Click the space name → Apps & integrations → Webhooks → Add webhook. Name: «Engynex»." },
      { title: "Copy the URL", body: "Copy the URL starting with https://chat.googleapis.com/v1/spaces/… and paste it here. Save." },
      { title: "Test", body: "Click «Send test»." },
    ],
    verify: ["The test message appears in the space."],
    technical: {
      how: ["team_alert() sends POST JSON {\"text\": …} (Content-Type application/json; charset=UTF-8). Text supports *bold* and <url|text> links."],
      fields: [{ key: "google_chat_webhook_url", where: "Space → Apps & integrations → Webhooks", format: "https://chat.googleapis.com/…, encrypted" }],
      security: ["The URL includes a key and token: don't share it. It's encrypted here."],
      limits: ["Google Chat limits to about 60 requests per minute per space."],
    },
    troubleshooting: [
      { problem: "The Webhooks option isn't there.", fix: "Webhooks aren't available on personal Gmail accounts or if your admin disabled them." },
      { problem: "Error 404 or 400.", fix: "The webhook was deleted or the URL is incomplete (it must include key= and token=)." },
    ],
  },

  calendar: {
    summary: "See your portal meetings and tasks in Google Calendar, Outlook or your phone's calendar.",
    benefits: ["Your booked meetings and dated tasks appear automatically in your calendar.", "Nothing to install and no access to your Google or Microsoft account.", "Each team member has a private link."],
    cost: "Free.",
    before: ["A calendar that supports «subscribe by URL» (Google Calendar, Outlook, Apple Calendar)."],
    steps: [
      { title: "Copy your link", body: "On this page copy your personal calendar link (ends in .ics). It's yours only." },
      { title: "Google Calendar", body: "At calendar.google.com (desktop) → «Other calendars» → + → «From URL» → paste the link → Add calendar." },
      { title: "Outlook", body: "In Outlook web → Calendar → Add calendar → Subscribe from web → paste the link and name it." },
      { title: "iPhone or Mac", body: "Calendar → File → New Calendar Subscription (on iPhone: Settings → Calendar → Accounts → Add Account → Other → Subscribed Calendar)." },
      { title: "If someone knows your link", body: "Click «Generate a new link»: the old one stops working." },
    ],
    verify: ["After adding it you'll see a new calendar with your upcoming meetings. Google may take a few hours for the first load."],
    technical: {
      how: [
        "Each employee has a token in calendar_feeds (calendar_feed_token function). The server builds the ICS with calendar_feed_events(token) using the secret key.",
        "Includes non-cancelled meetings where you're host or for leads assigned to you, from 60 days ago, and tasks with due dates from the last 30 days on.",
        "Read-only: make changes in the portal.",
      ],
      endpoints: [{ label: "Your calendar", method: "GET", url: "{site}/api/calendar/<token>.ics", note: "iCalendar format (RFC 5545)." }],
      examples: [{ title: "Sample event", lang: "text", code: ICS_SAMPLE }],
      security: ["The link works without signing in: treat it as a password. If shared, generate a new one.", "If your account is deactivated, the link stops returning events."],
      limits: ["Refresh frequency depends on your app: Google usually refreshes every 8 to 24 hours; Outlook and Apple can be set more often."],
    },
    troubleshooting: [
      { problem: "Google doesn't show recent changes.", fix: "Google refreshes subscribed calendars every several hours and it can't be forced. For urgent things, check the portal Agenda." },
      { problem: "«Couldn't add the calendar».", fix: "The site must be published online (localhost won't work) and the full link must end in .ics." },
      { problem: "I see meetings that aren't mine.", fix: "Meetings of leads assigned to you appear even if someone else hosts them; reassign the lead if needed." },
    ],
  },

  webhooks: {
    summary: "Notifies other systems (your ERP, Zapier, Make, n8n) whenever something happens in the portal: new lead, meeting, request, sale…",
    benefits: ["Connect the portal to any tool without waiting for an integration.", "Real-time events with all the lead, request or meeting data.", "Signed messages so your system can verify they come from the portal, plus a delivery log with resend."],
    cost: "Free.",
    before: ["An https URL that accepts POST requests (provided by Zapier, Make, n8n or your developer)."],
    steps: [
      { title: "Create a destination", body: "In Webhooks click «New destination», name it and paste the https URL from the other tool." },
      { title: "Pick events", body: "Check the events to send (e.g. «A new lead arrives» and «A deal is won»), or «All»." },
      { title: "Save the secret", body: "Copy the signing secret (whsec_…) and give it to whoever builds the receiver so they verify messages." },
      { title: "Send a test", body: "Click «Send test» and check the log shows a 200 response." },
    ],
    verify: ["In the delivery log each send shows «OK» with a 2xx code.", "Your tool shows the received event."],
    technical: {
      how: [
        "Every instant automation event (lead_created, lead_status_changed, lead_won, lead_lost, lead_assigned, email_clicked, email_bounced, appointment_booked, appointment_cancelled, appointment_done, appointment_no_show, ticket_created, ticket_staff_reply, ticket_customer_reply, ticket_resolved, ticket_reopened, ticket_rated, ticket_assigned, chat_started, chat_closed, chat_rated, task_completed, deal_created, deal_stage_changed, account_created, document_uploaded) calls webhook_emit().",
        "The database sends a JSON POST with pg_net (8 s timeout). Headers: Content-Type: application/json, User-Agent: Engynex-Webhooks/1.0, X-Engynex-Event (event name), X-Engynex-Delivery (delivery id) and X-Engynex-Signature: sha256=<hex HMAC-SHA256 of the body with the secret>.",
        "Every minute webhook_sync() reads responses: 2xx = OK; any other code, error or no response within 10 minutes = failed. After 20 consecutive failures the destination pauses itself. The log is kept 30 days.",
        "The test event is sent with «Send test». «Resend» sends the same content again with a new delivery id.",
      ],
      examples: [
        { title: "Event body", lang: "json", code: WEBHOOK_PAYLOAD },
        { title: "Verify the signature (Node.js)", lang: "js", code: WEBHOOK_VERIFY_JS },
      ],
      security: [
        "Always verify the signature over the raw body with a constant-time comparison; reject anything that doesn't match.",
        "Only https URLs are accepted. Rotate the secret if leaked (the old one stops working immediately).",
        "Data includes customers' personal information (name, email, phone): send it only to trusted systems and mention it in your data policy.",
      ],
      limits: ["Respond within 8 seconds; process in the background if your logic is slow.", "No automatic retry: use «Resend» from the log and make your receiver idempotent (use the id)."],
    },
    troubleshooting: [
      { problem: "The signature never matches.", fix: "You're signing the JSON after parsing and re-serializing it (whitespace or key order changes). Compute the HMAC over the exact bytes received." },
      { problem: "Deliveries show «no response».", fix: "Your server takes over 8 s or isn't reachable from the internet. Return 200 immediately and process later." },
      { problem: "The destination paused itself.", fix: "It hit 20 consecutive failures. Fix the receiver, re-enable it and resend the deliveries you need." },
      { problem: "Time-based events (e.g. lead not contacted) don't arrive.", fix: "Webhooks carry instant events. For time-based ones create an automation with the «Send to another app (webhook)» action." },
    ],
  },

  api: {
    summary: "Lets other systems create and read portal leads, requests and meetings securely.",
    benefits: ["Create leads from other pages, forms or tools (Zapier, Make, n8n) and they enter the CRM with their score.", "Take your leads or requests to an ERP, spreadsheet or dashboard.", "Each key only has the permissions you give it and can be revoked anytime."],
    cost: "Free.",
    before: ["Know what you need: read only, create only, or both."],
    steps: [
      { title: "Create a key", body: "In API click «New key», name it after who will use it (e.g. «Zapier») and check only the needed permissions." },
      { title: "Copy it now", body: "The full key (egx_…) is shown only once. Store it in a password manager or in the tool that will use it." },
      { title: "Use it", body: "Give it to your developer or paste it in Zapier/Make/n8n as the header Authorization: Bearer egx_…" },
      { title: "Revoke what you don't use", body: "If a key leaks or is no longer used, click «Revoke»: it stops working instantly." },
    ],
    verify: ["The key list shows «Last used» and request count.", "A lead created via the API appears in the CRM with the source you set."],
    technical: {
      how: [
        "Base: {site}/api/v1. Auth: header Authorization: Bearer egx_<48 hex>. Keys are stored only as SHA-256 hashes; the server validates with api_key_check(key, scope).",
        "Scopes: leads:read, leads:write, tickets:read, tickets:write, appointments:read.",
        "POST /leads uses the same logic as the site form (validation, score and color, automations and webhooks). Requires consent: true (you confirm the person agreed to be contacted).",
        "POST /tickets creates the request like the public support center (with SLA, number and confirmation email if enabled).",
        "JSON responses. Limit: 600 requests per hour per key.",
      ],
      endpoints: [
        { label: "List leads", method: "GET", url: "{site}/api/v1/leads?since=ISO&limit=50", note: "Scope leads:read. since filters by creation date; limit max 50." },
        { label: "Create lead", method: "POST", url: "{site}/api/v1/leads", note: "Scope leads:write. Required: name, email, phone, problem_category, consent." },
        { label: "List requests", method: "GET", url: "{site}/api/v1/tickets", note: "Scope tickets:read." },
        { label: "Create request", method: "POST", url: "{site}/api/v1/tickets", note: "Scope tickets:write. Required: name, email, category, subject, description." },
        { label: "List meetings", method: "GET", url: "{site}/api/v1/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD", note: "Scope appointments:read." },
      ],
      permissions: [
        "problem_category: sales | web | automation | system | support | other | none",
        "budget: lt2 | 2to5 | 5to15 | 15to40 | gt40 | monthly | unknown (default unknown)",
        "decision: self | shared | other — timeline: week | month | browsing",
        "priority (requests): critical | high | medium | low",
      ],
      examples: [
        { title: "Create a lead", lang: "bash", code: API_CURL_CREATE_LEAD },
        { title: "Read leads and meetings", lang: "bash", code: API_CURL_LIST },
        { title: "Create a support request", lang: "bash", code: API_CURL_TICKET },
        { title: "Errors", lang: "text", code: API_ERRORS },
      ],
      security: ["Never put the key in browser code or public repositories.", "Give each tool its own key with minimal permissions and revoke it when unused.", "Revoked keys can't be reactivated: create a new one."],
      limits: ["600 requests per hour per key (HTTP 429 when exceeded).", "Pagination: use since with the date of the last lead received."],
    },
    troubleshooting: [
      { problem: "401 invalid_key.", fix: "The key is miscopied (must include egx_), the word Bearer is missing, or it was revoked." },
      { problem: "403 missing_scope.", fix: "The key lacks that endpoint's permission. Create a new one with the right scope." },
      { problem: "422 invalid.", fix: "A required field is missing, email or phone invalid, a value isn't in the allowed list, or consent: true is missing." },
      { problem: "429 rate_limited.", fix: "More than 600 requests in an hour. Space out calls or use webhooks to receive changes instead of polling." },
    ],
  },

  zapier: {
    summary: "Connects the portal with 7,000+ apps (Google Sheets, HubSpot, Gmail, Trello…) without code.",
    benefits: ["Copy each new lead to a Google Sheet or another CRM.", "Create portal leads from Facebook Lead Ads, Typeform or Calendly.", "SMS, email or any-app alerts when something happens in the portal."],
    cost: "Free plan with few tasks per month and two-step zaps; webhooks («Webhooks by Zapier») need a paid plan. Check pricing.",
    before: ["A Zapier account.", "In the portal: a Webhooks destination (to receive events) or an API key (to create or read data)."],
    steps: [
      { title: "Portal to another app: create the trigger", body: "In Zapier create a Zap → trigger «Webhooks by Zapier» → «Catch Hook». Copy the URL it gives you." },
      { title: "Create the destination in the portal", body: "In Integrations → Webhooks → New destination: paste that URL and pick events (e.g. «A new lead arrives»). Click «Send test»." },
      { title: "Finish the Zap", body: "In Zapier click «Test trigger»: you'll see the data (data.nombre, data.correo…). Add the action, e.g. Google Sheets → Create row, and map the fields." },
      { title: "Another app to the portal", body: "Use the «Webhooks by Zapier» action → POST to {site}/api/v1/leads with header Authorization: Bearer egx_… (leads:write key) and the lead JSON body." },
      { title: "Turn on the Zap", body: "Publish the Zap and check Zapier history and the portal delivery log." },
    ],
    verify: ["In Zapier → Zap history runs show «Success».", "In the portal the delivery log shows 200."],
    technical: {
      how: ["Zapier doesn't need a dedicated app: use Webhooks by Zapier to receive (Catch Hook) and send (POST) against the REST API.", "Event data arrives in the data object; use data.enlace to link back to the portal."],
      examples: [
        { title: "What Zapier receives", lang: "json", code: ZAP_STEPS_JSON },
        { title: "Create a lead from Zapier (curl equivalent)", lang: "bash", code: API_CURL_CREATE_LEAD },
      ],
      security: ["The Catch Hook URL is public: anyone with it can send data to your Zap. Don't share it.", "Use an API key exclusive to Zapier with minimal permissions."],
      limits: ["Each event consumes a task of your Zapier plan."],
    },
    troubleshooting: [
      { problem: "Zapier receives nothing.", fix: "Check the destination is active and subscribed to the right event; use «Send test» and look at the delivery log." },
      { problem: "The POST to the API returns 422.", fix: "Check required fields and allowed values (problem_category, budget…) and that consent is true (boolean, not text)." },
      { problem: "Duplicate leads.", fix: "Zapier may retry. Add a filter or use «Find or create» in the destination app." },
    ],
  },

  make: {
    summary: "Advanced visual automations (formerly Integromat) connected to the portal.",
    benefits: ["Flows with conditions, routers and data transformations.", "Connect the portal with hundreds of apps.", "Often cheaper than Zapier for many steps."],
    cost: "Free plan with limited monthly operations; paid plans by volume. Check pricing.",
    before: ["A Make account.", "A Webhooks destination or a portal API key."],
    steps: [
      { title: "Receive events", body: "Create a scenario → «Webhooks → Custom webhook» module → Add → copy the URL." },
      { title: "Create the destination in the portal", body: "In Webhooks create a destination with that URL and the events you want; click «Send test» so Make learns the structure." },
      { title: "Add actions", body: "Connect the modules you need (Google Sheets, Gmail, your ERP) using the data fields." },
      { title: "Send data to the portal", body: "Use «HTTP → Make a request»: POST, URL {site}/api/v1/leads, header Authorization: Bearer egx_…, JSON body." },
      { title: "Turn on the scenario", body: "Set scheduling to «Immediately» so it processes on arrival." },
    ],
    verify: ["The scenario history shows successful runs and the portal delivery log shows 200."],
    technical: {
      how: ["Make receives the signed JSON; you can verify the signature in Make with the sha256/HMAC function if needed, or rely on the URL being secret."],
      examples: [{ title: "What Make receives", lang: "json", code: WEBHOOK_PAYLOAD }],
      security: ["Keep the webhook URL private and use a dedicated API key for Make."],
      limits: ["Each executed module consumes operations from your plan."],
    },
    troubleshooting: [
      { problem: "Make says «Determine data structure».", fix: "With the scenario on «Run once», click «Send test» in the portal so Make learns the structure." },
      { problem: "The HTTP module returns 401.", fix: "The header must be exactly Authorization with value Bearer egx_… (with a space)." },
    ],
  },

  n8n: {
    summary: "Open-source automations: on n8n cloud or installed on your own server.",
    benefits: ["Full control and data on your server if self-hosted.", "Code nodes for custom logic.", "No per-task limit when self-hosted."],
    cost: "Free if self-hosted (you pay for the server); n8n Cloud has paid plans. Check pricing.",
    before: ["An n8n instance reachable over https.", "A Webhooks destination or a portal API key."],
    steps: [
      { title: "Receive events", body: "Create a workflow with the «Webhook» node, POST method. Copy the «Production URL»." },
      { title: "Create the destination in the portal", body: "In Webhooks create a destination with that URL and events; activate the workflow in n8n and click «Send test»." },
      { title: "Verify the signature (optional)", body: "Add a «Code» node that computes the HMAC with the destination secret and compares it to X-Engynex-Signature." },
      { title: "Send data to the portal", body: "Use the «HTTP Request» node: POST to {site}/api/v1/leads with Authorization: Bearer egx_… and a JSON body." },
    ],
    verify: ["In n8n → Executions you see runs and the portal log shows 200."],
    technical: {
      how: ["In the Webhook node enable «Raw Body» if you'll verify the signature: the HMAC is computed over the exact body."],
      examples: [{ title: "HMAC verification (Code node, JavaScript)", lang: "js", code: WEBHOOK_VERIFY_JS }],
      security: ["Use the Production URL (not the test one) and protect your instance with a user and password."],
      limits: ["The Test URL only works while the editor is listening."],
    },
    troubleshooting: [
      { problem: "Works in testing but not in production.", fix: "You used the Test URL. Switch the destination to the Production URL and activate the workflow." },
      { problem: "Signature mismatch.", fix: "Enable Raw Body in the Webhook node and compute the HMAC over those bytes, not the rebuilt JSON." },
    ],
  },

  supabase: {
    summary: "The portal's database, files and automatic jobs live in Supabase.",
    benefits: ["Daily backups of all data.", "Private files (documents, attachments) with per-user permissions.", "Integration secrets encrypted in Vault."],
    cost: "Free plan with limits; the Pro plan (monthly fee) adds daily backups with longer retention and more capacity. Check pricing.",
    before: ["Admin access to the project in the Supabase dashboard."],
    steps: [
      { title: "Open the project", body: "Open the «Supabase project» link on this page with the project owner account." },
      { title: "Check the server secret key", body: "In Settings → API keys → Secret keys is the key that goes in the hosting's SUPABASE_SECRET_KEY variable. It's the only one not stored in the portal." },
      { title: "Check backups", body: "In Database → Backups confirm there are recent backups." },
      { title: "Enable two-step verification", body: "In your Supabase account → Account → Security enable 2FA." },
      { title: "Rotate keys if needed", body: "If a key leaked, create a new secret key, update it in the hosting and delete the old one." },
    ],
    verify: ["This page shows «Supabase secret key · Connected».", "Database → Backups shows recent backups."],
    technical: {
      how: [
        "Postgres with Row Level Security on every table; sensitive functions are security definer and check the role.",
        "Integration secrets are stored in Supabase Vault; only the server reads them with integration_config() using SUPABASE_SECRET_KEY.",
        "pg_cron runs automations, support SLA, campaigns and webhook sync; pg_net makes outbound HTTP calls.",
      ],
      fields: [{ key: "SUPABASE_SECRET_KEY", where: "Supabase → Settings → API keys → Secret keys", format: "sb_secret_… (server environment variable, never NEXT_PUBLIC)" }],
      security: ["Never expose the secret key in the browser or the repository.", "Rotate the database password and secret key if you shared them by chat or email.", "Limit who's a member of the Supabase project."],
      limits: ["The free plan pauses inactive projects and has storage and bandwidth limits."],
    },
    troubleshooting: [
      { problem: "The page says the secret key is missing.", fix: "Add SUPABASE_SECRET_KEY to .env.local (local) and to the hosting's environment variables, then redeploy." },
      { problem: "Scheduled jobs don't run.", fix: "Check Integrations → Cron in Supabase: jobs must be active without recent errors." },
      { problem: "«permission denied» errors in the portal.", fix: "That user may lack a role permission; check their role in Users & roles." },
    ],
  },

  "scheduled-jobs": {
    summary: "The portal's automatic processes: follow-up emails, campaigns, AI analysis, reminders and reports.",
    benefits: ["They run on their own every 5 minutes, even if nobody has the portal open.", "Turn each process on or off.", "See when they ran and the result."],
    cost: "Included.",
    before: ["The site published online with https (doesn't work from localhost).", "The Supabase secret key set on the server."],
    steps: [
      { title: "Generate the jobs key", body: "In «Scheduled jobs key» click «Generate» and save." },
      { title: "Turn on automatic runs", body: "Click «Turn on»: the database will call the jobs URL every 5 minutes with that key." },
      { title: "Choose which processes run", body: "Turn on or off: yellow-lead follow-up sequence, unfinished form reminder and weekly report." },
      { title: "Test", body: "Click «Run now» and check the result under «Latest runs»." },
    ],
    verify: ["«Latest runs» shows runs every 5 minutes with a successful result."],
    technical: {
      how: [
        "The /api/jobs/run URL (GET or POST) runs runJobs(): email queue (Resend), WhatsApp batches, pending AI analyses, reports and other processes, with a budget of about 50 s per run.",
        "Authorization: header Authorization: Bearer <cron_secret> (from pg_cron) or an admin session («Run now» button).",
        "Automations, support SLA and webhooks run directly in the database with pg_cron, not through this URL.",
      ],
      fields: [
        { key: "cron_secret", where: "«Generate» button", format: "24+ characters, encrypted" },
        { key: "followup_sequence / abandoned_recovery / weekly_report", where: "Switches", format: "on / off (no value = on)" },
      ],
      endpoints: [{ label: "Scheduled jobs", method: "GET/POST", url: "{site}/api/jobs/run", note: "Authorization: Bearer <jobs key>" }],
      examples: [{ title: "Run manually", lang: "bash", code: `curl -X POST "{site}/api/jobs/run" -H "Authorization: Bearer YOUR_JOBS_KEY"` }],
      security: ["The key is stored encrypted. If it leaks, generate another: the scheduler uses the new one once re-enabled."],
      limits: ["Each run lasts at most 60 s; whatever doesn't fit waits for the next one."],
    },
    troubleshooting: [
      { problem: "«Automatic runs need the site published».", fix: "pg_cron can't call localhost. Turn it on once the site is on its https domain." },
      { problem: "Error 503 «missing SUPABASE_SECRET_KEY».", fix: "Add the variable in the hosting and redeploy." },
      { problem: "Error 403.", fix: "The jobs key changed and the scheduler uses the old one: turn automatic runs off and on again." },
    ],
  },
};

export const integrationGuides: Record<Locale, IntegrationGuides> = { es, en };
