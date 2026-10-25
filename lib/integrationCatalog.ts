import type { IntegrationKey } from "@/lib/integrations";

/**
 * Catálogo de integraciones del portal: qué claves usa cada una, cuánto
 * cuesta y dónde están la cuenta, la documentación, los precios y el estado
 * del servicio del tercero. Las guías paso a paso están en
 * content/integrationGuides.ts (por slug).
 */
export type IntegrationCategory = "analytics" | "ads" | "messaging" | "ecommerce" | "email" | "ai" | "team" | "developers" | "system";

export type Pricing = "free" | "freemium" | "paid" | "included";

export type IntegrationLink = { kind: "account" | "console" | "docs" | "pricing" | "status" | "help"; label: string; url: string };

export type IntegrationDef = {
  slug: string;
  name: string;
  vendor: string;
  category: IntegrationCategory;
  /** Claves del almacén que configura (vacío = funcionalidad propia del portal). */
  keys: IntegrationKey[];
  /** Claves mínimas para considerarla conectada. */
  required: IntegrationKey[];
  pricing: Pricing;
  /** Monograma y color del logo (sin marcas registradas). */
  mono: string;
  color: string;
  links: IntegrationLink[];
  /** Página propia en el portal (webhooks, API, calendario). */
  builtin?: "webhooks" | "api" | "calendar";
  /** Otra integración que la hace funcionar (p. ej. Zapier usa webhooks y API). */
  via?: string[];
};

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = ["analytics", "ads", "messaging", "ecommerce", "email", "ai", "team", "developers", "system"];

const SUPABASE_PROJECT = "fdmmxaaydsqmxfknpaqw";

export const INTEGRATIONS: IntegrationDef[] = [
  // ---------------- Analítica ----------------
  {
    slug: "google-tag-manager",
    name: "Google Tag Manager",
    vendor: "Google",
    category: "analytics",
    keys: ["gtm_id"],
    required: ["gtm_id"],
    pricing: "free",
    mono: "GTM",
    color: "#246FDB",
    links: [
      { kind: "account", label: "Abrir Tag Manager", url: "https://tagmanager.google.com/" },
      { kind: "docs", label: "Documentación", url: "https://developers.google.com/tag-platform/tag-manager" },
      { kind: "help", label: "Centro de ayuda", url: "https://support.google.com/tagmanager/" },
    ],
  },
  {
    slug: "google-analytics",
    name: "Google Analytics 4",
    vendor: "Google",
    category: "analytics",
    keys: ["ga4_id"],
    required: ["ga4_id"],
    pricing: "free",
    mono: "GA4",
    color: "#E37400",
    links: [
      { kind: "account", label: "Abrir Analytics", url: "https://analytics.google.com/" },
      { kind: "docs", label: "Configurar GA4", url: "https://support.google.com/analytics/answer/9304153" },
      { kind: "docs", label: "Modo de consentimiento", url: "https://developers.google.com/tag-platform/security/guides/consent" },
    ],
  },
  {
    slug: "search-console",
    name: "Google Search Console",
    vendor: "Google",
    category: "analytics",
    keys: ["gsc_verification"],
    required: ["gsc_verification"],
    pricing: "free",
    mono: "GSC",
    color: "#458CF5",
    links: [
      { kind: "account", label: "Abrir Search Console", url: "https://search.google.com/search-console" },
      { kind: "docs", label: "Verificar el sitio", url: "https://support.google.com/webmasters/answer/9008080" },
    ],
  },
  {
    slug: "bing-webmaster",
    name: "Bing Webmaster Tools",
    vendor: "Microsoft",
    category: "analytics",
    keys: ["bing_verification"],
    required: ["bing_verification"],
    pricing: "free",
    mono: "B",
    color: "#008373",
    links: [
      { kind: "account", label: "Abrir Bing Webmaster", url: "https://www.bing.com/webmasters" },
      { kind: "docs", label: "Agregar y verificar el sitio", url: "https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b" },
    ],
  },
  {
    slug: "microsoft-clarity",
    name: "Microsoft Clarity",
    vendor: "Microsoft",
    category: "analytics",
    keys: ["clarity_id"],
    required: ["clarity_id"],
    pricing: "free",
    mono: "C",
    color: "#5C2D91",
    links: [
      { kind: "account", label: "Abrir Clarity", url: "https://clarity.microsoft.com/" },
      { kind: "docs", label: "Instalación", url: "https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup" },
      { kind: "docs", label: "Consentimiento", url: "https://learn.microsoft.com/en-us/clarity/setup-and-installation/cookie-consent" },
    ],
  },
  // ---------------- Anuncios ----------------
  {
    slug: "google-ads",
    name: "Google Ads",
    vendor: "Google",
    category: "ads",
    keys: ["google_ads_id", "google_ads_lead_label", "google_ads_booking_label", "ads_feed_user", "ads_feed_password", "ads_conversion_qualified", "ads_conversion_meeting", "ads_conversion_won"],
    required: ["google_ads_id"],
    pricing: "paid",
    mono: "Ads",
    color: "#1A73E8",
    links: [
      { kind: "account", label: "Abrir Google Ads", url: "https://ads.google.com/" },
      { kind: "docs", label: "Seguimiento de conversiones", url: "https://support.google.com/google-ads/answer/1722022" },
      { kind: "docs", label: "Importar conversiones offline", url: "https://support.google.com/google-ads/answer/7014069" },
      { kind: "docs", label: "Cargas programadas (HTTPS)", url: "https://support.google.com/google-ads/answer/7014069#schedule" },
    ],
  },
  {
    slug: "meta-pixel",
    name: "Píxel de Meta",
    vendor: "Meta",
    category: "ads",
    keys: ["meta_pixel_id"],
    required: ["meta_pixel_id"],
    pricing: "free",
    mono: "M",
    color: "#0866FF",
    links: [
      { kind: "account", label: "Administrador de eventos", url: "https://business.facebook.com/events_manager2" },
      { kind: "docs", label: "Documentación del píxel", url: "https://developers.facebook.com/docs/meta-pixel" },
      { kind: "help", label: "Ayuda para empresas", url: "https://www.facebook.com/business/help/952192354843755" },
    ],
  },
  {
    slug: "linkedin-insight",
    name: "LinkedIn Insight Tag",
    vendor: "LinkedIn",
    category: "ads",
    keys: ["linkedin_partner_id"],
    required: ["linkedin_partner_id"],
    pricing: "free",
    mono: "in",
    color: "#0A66C2",
    links: [
      { kind: "account", label: "Campaign Manager", url: "https://www.linkedin.com/campaignmanager/" },
      { kind: "docs", label: "Insight Tag", url: "https://www.linkedin.com/help/lms/answer/a417869" },
    ],
  },
  {
    slug: "tiktok-pixel",
    name: "Píxel de TikTok",
    vendor: "TikTok",
    category: "ads",
    keys: ["tiktok_pixel_id"],
    required: ["tiktok_pixel_id"],
    pricing: "free",
    mono: "TT",
    color: "#111111",
    links: [
      { kind: "account", label: "TikTok Ads Manager", url: "https://ads.tiktok.com/" },
      { kind: "docs", label: "Configurar el píxel", url: "https://ads.tiktok.com/help/article/get-started-pixel" },
    ],
  },
  // ---------------- Mensajería ----------------
  {
    slug: "whatsapp",
    name: "WhatsApp Business (Cloud API)",
    vendor: "Meta",
    category: "messaging",
    keys: ["whatsapp_phone_number_id", "whatsapp_business_account_id", "whatsapp_access_token", "whatsapp_app_secret", "whatsapp_verify_token", "whatsapp_graph_version"],
    required: ["whatsapp_phone_number_id", "whatsapp_business_account_id", "whatsapp_access_token"],
    pricing: "paid",
    mono: "WA",
    color: "#25D366",
    links: [
      { kind: "account", label: "WhatsApp Manager", url: "https://business.facebook.com/wa/manage/home/" },
      { kind: "console", label: "Apps de Meta (developers)", url: "https://developers.facebook.com/apps/" },
      { kind: "docs", label: "Cloud API", url: "https://developers.facebook.com/docs/whatsapp/cloud-api" },
      { kind: "docs", label: "Webhooks", url: "https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks" },
      { kind: "pricing", label: "Precios por conversación", url: "https://developers.facebook.com/docs/whatsapp/pricing" },
      { kind: "status", label: "Estado de la plataforma", url: "https://metastatus.com/" },
    ],
  },
  {
    slug: "messenger-instagram",
    name: "Messenger e Instagram Direct",
    vendor: "Meta",
    category: "messaging",
    keys: ["meta_page_id", "meta_page_token", "instagram_account_id"],
    required: ["meta_page_id", "meta_page_token"],
    pricing: "free",
    mono: "IG",
    color: "#C13584",
    links: [
      { kind: "account", label: "Meta Business Suite", url: "https://business.facebook.com/" },
      { kind: "console", label: "Apps de Meta (developers)", url: "https://developers.facebook.com/apps/" },
      { kind: "docs", label: "Messenger Platform", url: "https://developers.facebook.com/docs/messenger-platform" },
      { kind: "docs", label: "Instagram Messaging", url: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/messaging-api" },
      { kind: "status", label: "Estado de la plataforma", url: "https://metastatus.com/" },
    ],
  },
  // ---------------- Ventas en línea ----------------
  {
    slug: "hostinger-domains",
    name: "Venta de dominios (Hostinger)",
    vendor: "Hostinger",
    category: "ecommerce",
    keys: ["hostinger_api_token", "domain_usd_cop", "domain_margin_pct", "domain_tlds", "domain_auto_register", "domain_test_safe"],
    required: ["hostinger_api_token"],
    pricing: "paid",
    mono: "H",
    color: "#673DE6",
    links: [
      { kind: "account", label: "hPanel de Hostinger", url: "https://hpanel.hostinger.com/" },
      { kind: "console", label: "Tokens de la API", url: "https://hpanel.hostinger.com/profile/api" },
      { kind: "console", label: "Dominios en hPanel", url: "https://hpanel.hostinger.com/domains" },
      { kind: "docs", label: "Documentación de la API", url: "https://developers.hostinger.com/" },
      { kind: "pricing", label: "Precios de dominios", url: "https://www.hostinger.com/domain-name-search" },
      { kind: "status", label: "Estado del servicio", url: "https://statuspage.hostinger.com/" },
    ],
  },
  {
    slug: "wompi",
    name: "Pagos en línea (Wompi)",
    vendor: "Bancolombia",
    category: "ecommerce",
    keys: ["wompi_public_key", "wompi_private_key", "wompi_integrity_secret", "wompi_events_secret"],
    required: ["wompi_public_key", "wompi_integrity_secret", "wompi_events_secret"],
    pricing: "paid",
    mono: "W",
    color: "#2C2A29",
    links: [
      { kind: "account", label: "Panel de comercios", url: "https://comercios.wompi.co/" },
      { kind: "docs", label: "Inicio rápido", url: "https://docs.wompi.co/docs/colombia/inicio-rapido/" },
      { kind: "docs", label: "Checkout web", url: "https://docs.wompi.co/docs/colombia/widget-checkout-web/" },
      { kind: "docs", label: "Eventos (webhooks)", url: "https://docs.wompi.co/docs/colombia/eventos/" },
      { kind: "pricing", label: "Tarifas", url: "https://wompi.com/es/co/tarifas" },
    ],
  },
  // ---------------- Correo ----------------
  {
    slug: "resend",
    name: "Resend (correo)",
    vendor: "Resend",
    category: "email",
    keys: ["resend_api_key", "resend_webhook_secret", "email_from", "notify_emails"],
    required: ["resend_api_key"],
    pricing: "freemium",
    mono: "R",
    color: "#000000",
    links: [
      { kind: "account", label: "Panel de Resend", url: "https://resend.com/overview" },
      { kind: "console", label: "Claves de API", url: "https://resend.com/api-keys" },
      { kind: "console", label: "Dominios", url: "https://resend.com/domains" },
      { kind: "docs", label: "Documentación", url: "https://resend.com/docs" },
      { kind: "docs", label: "Webhooks", url: "https://resend.com/docs/dashboard/webhooks/introduction" },
      { kind: "pricing", label: "Precios", url: "https://resend.com/pricing" },
      { kind: "status", label: "Estado del servicio", url: "https://resend-status.com/" },
    ],
  },
  // ---------------- IA ----------------
  {
    slug: "claude",
    name: "Claude (IA de Anthropic)",
    vendor: "Anthropic",
    category: "ai",
    keys: ["anthropic_api_key", "ai_lead_insights"],
    required: ["anthropic_api_key"],
    pricing: "paid",
    mono: "AI",
    color: "#D97757",
    links: [
      { kind: "account", label: "Consola de Anthropic", url: "https://console.anthropic.com/" },
      { kind: "console", label: "Claves de API", url: "https://console.anthropic.com/settings/keys" },
      { kind: "console", label: "Facturación y límites", url: "https://console.anthropic.com/settings/billing" },
      { kind: "docs", label: "Documentación de la API", url: "https://docs.anthropic.com/en/api/overview" },
      { kind: "pricing", label: "Precios", url: "https://www.anthropic.com/pricing#api" },
      { kind: "status", label: "Estado del servicio", url: "https://status.anthropic.com/" },
    ],
  },
  // ---------------- Equipo ----------------
  {
    slug: "slack",
    name: "Slack",
    vendor: "Slack",
    category: "team",
    keys: ["slack_webhook_url"],
    required: ["slack_webhook_url"],
    pricing: "freemium",
    mono: "S",
    color: "#4A154B",
    links: [
      { kind: "console", label: "Tus apps de Slack", url: "https://api.slack.com/apps" },
      { kind: "docs", label: "Incoming webhooks", url: "https://api.slack.com/messaging/webhooks" },
      { kind: "docs", label: "Formato de mensajes", url: "https://api.slack.com/reference/surfaces/formatting" },
      { kind: "status", label: "Estado de Slack", url: "https://slack-status.com/" },
    ],
  },
  {
    slug: "microsoft-teams",
    name: "Microsoft Teams",
    vendor: "Microsoft",
    category: "team",
    keys: ["teams_webhook_url"],
    required: ["teams_webhook_url"],
    pricing: "included",
    mono: "T",
    color: "#5059C9",
    links: [
      { kind: "account", label: "Abrir Teams", url: "https://teams.microsoft.com/" },
      { kind: "docs", label: "Webhooks con Workflows", url: "https://support.microsoft.com/office/create-incoming-webhooks-with-workflows-for-microsoft-teams-8ae491c7-0394-4861-ba59-055e33f75498" },
      { kind: "docs", label: "Incoming webhooks (developers)", url: "https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook" },
      { kind: "status", label: "Estado de Microsoft 365", url: "https://status.cloud.microsoft/" },
    ],
  },
  {
    slug: "google-chat",
    name: "Google Chat",
    vendor: "Google",
    category: "team",
    keys: ["google_chat_webhook_url"],
    required: ["google_chat_webhook_url"],
    pricing: "included",
    mono: "GC",
    color: "#00AC47",
    links: [
      { kind: "account", label: "Abrir Google Chat", url: "https://chat.google.com/" },
      { kind: "docs", label: "Webhooks entrantes", url: "https://developers.google.com/workspace/chat/quickstart/webhooks" },
      { kind: "status", label: "Estado de Workspace", url: "https://www.google.com/appsstatus/dashboard/" },
    ],
  },
  {
    slug: "calendar",
    name: "Calendario (Google, Outlook, Apple)",
    vendor: "Engynex",
    category: "team",
    keys: [],
    required: [],
    pricing: "free",
    mono: "Cal",
    color: "#1F2A46",
    builtin: "calendar",
    links: [
      { kind: "help", label: "Google Calendar: agregar por URL", url: "https://support.google.com/calendar/answer/37100" },
      { kind: "help", label: "Outlook: suscribirse a un calendario", url: "https://support.microsoft.com/office/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web-cff1429c-5af6-41ec-a5b4-74f2c278e98c" },
      { kind: "help", label: "Apple Calendar: suscribirse", url: "https://support.apple.com/guide/calendar/subscribe-to-calendars-icl1022/mac" },
    ],
  },
  // ---------------- Desarrolladores y automatización externa ----------------
  {
    slug: "webhooks",
    name: "Webhooks salientes",
    vendor: "Engynex",
    category: "developers",
    keys: [],
    required: [],
    pricing: "free",
    mono: "{ }",
    color: "#467316",
    builtin: "webhooks",
    links: [
      { kind: "docs", label: "Qué es un webhook (MDN)", url: "https://developer.mozilla.org/en-US/docs/Glossary/Webhook" },
      { kind: "docs", label: "Verificar firmas HMAC", url: "https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign#hmac" },
    ],
  },
  {
    slug: "api",
    name: "API REST de Engynex",
    vendor: "Engynex",
    category: "developers",
    keys: [],
    required: [],
    pricing: "free",
    mono: "API",
    color: "#1F2A46",
    builtin: "api",
    links: [{ kind: "docs", label: "Códigos de estado HTTP (MDN)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status" }],
  },
  {
    slug: "zapier",
    name: "Zapier",
    vendor: "Zapier",
    category: "developers",
    keys: [],
    required: [],
    pricing: "freemium",
    mono: "Z",
    color: "#FF4F00",
    via: ["webhooks", "api"],
    links: [
      { kind: "account", label: "Panel de Zapier", url: "https://zapier.com/app/home" },
      { kind: "docs", label: "Webhooks by Zapier", url: "https://help.zapier.com/hc/en-us/articles/8496288690317" },
      { kind: "pricing", label: "Precios", url: "https://zapier.com/pricing" },
      { kind: "status", label: "Estado", url: "https://status.zapier.com/" },
    ],
  },
  {
    slug: "make",
    name: "Make",
    vendor: "Make",
    category: "developers",
    keys: [],
    required: [],
    pricing: "freemium",
    mono: "Mk",
    color: "#6D00CC",
    via: ["webhooks", "api"],
    links: [
      { kind: "account", label: "Panel de Make", url: "https://www.make.com/en/login" },
      { kind: "docs", label: "Webhooks en Make", url: "https://www.make.com/en/help/tools/webhooks" },
      { kind: "docs", label: "Módulo HTTP", url: "https://www.make.com/en/help/tools/http" },
      { kind: "pricing", label: "Precios", url: "https://www.make.com/en/pricing" },
    ],
  },
  {
    slug: "n8n",
    name: "n8n",
    vendor: "n8n",
    category: "developers",
    keys: [],
    required: [],
    pricing: "freemium",
    mono: "n8n",
    color: "#EA4B71",
    via: ["webhooks", "api"],
    links: [
      { kind: "account", label: "n8n Cloud", url: "https://app.n8n.cloud/" },
      { kind: "docs", label: "Nodo Webhook", url: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" },
      { kind: "docs", label: "Nodo HTTP Request", url: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/" },
      { kind: "pricing", label: "Precios", url: "https://n8n.io/pricing/" },
    ],
  },
  // ---------------- Sistema ----------------
  {
    slug: "supabase",
    name: "Supabase (base de datos y archivos)",
    vendor: "Supabase",
    category: "system",
    keys: [],
    required: [],
    pricing: "freemium",
    mono: "SB",
    color: "#3ECF8E",
    links: [
      { kind: "account", label: "Proyecto en Supabase", url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT}` },
      { kind: "console", label: "Claves de API", url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/settings/api-keys` },
      { kind: "console", label: "Tareas programadas (Cron)", url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/integrations/cron/jobs` },
      { kind: "console", label: "Copias de seguridad", url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/database/backups/scheduled` },
      { kind: "docs", label: "Documentación", url: "https://supabase.com/docs" },
      { kind: "pricing", label: "Precios", url: "https://supabase.com/pricing" },
      { kind: "status", label: "Estado del servicio", url: "https://status.supabase.com/" },
    ],
  },
  {
    slug: "scheduled-jobs",
    name: "Tareas programadas y procesos automáticos",
    vendor: "Engynex",
    category: "system",
    keys: ["cron_secret", "followup_sequence", "abandoned_recovery", "weekly_report"],
    required: ["cron_secret"],
    pricing: "included",
    mono: "⏱",
    color: "#467316",
    links: [{ kind: "docs", label: "pg_cron en Supabase", url: "https://supabase.com/docs/guides/cron" }],
  },
];

export const integrationBySlug = (slug: string) => INTEGRATIONS.find((i) => i.slug === slug);

/** Conectada / incompleta / sin configurar, según las claves guardadas. */
export function integrationState(def: IntegrationDef, set: Partial<Record<IntegrationKey, boolean>>): "connected" | "partial" | "off" | "builtin" {
  if (def.builtin || def.via || !def.keys.length) return "builtin";
  const req = def.required.filter((k) => set[k]).length;
  if (req === def.required.length) return "connected";
  return def.keys.some((k) => set[k]) ? "partial" : "off";
}
