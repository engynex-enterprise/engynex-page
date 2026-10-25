import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Configuración de integraciones guardada desde el portal (Integraciones).
 * Los secretos vienen descifrados de Supabase Vault; por eso solo se leen en
 * el servidor y con la clave secreta. Si algo no está en la base de datos,
 * se usa la variable de entorno equivalente (compatibilidad).
 */
export type IntegrationKey =
  | "gtm_id"
  | "ga4_id"
  | "google_ads_id"
  | "google_ads_lead_label"
  | "google_ads_booking_label"
  | "meta_pixel_id"
  | "clarity_id"
  | "linkedin_partner_id"
  | "tiktok_pixel_id"
  | "gsc_verification"
  | "bing_verification"
  | "whatsapp_phone_number_id"
  | "whatsapp_business_account_id"
  | "whatsapp_graph_version"
  | "whatsapp_access_token"
  | "whatsapp_app_secret"
  | "whatsapp_verify_token"
  | "meta_page_id"
  | "meta_page_token"
  | "instagram_account_id"
  | "ads_feed_user"
  | "ads_feed_password"
  | "ads_conversion_qualified"
  | "ads_conversion_meeting"
  | "ads_conversion_won"
  | "cron_secret"
  | "resend_api_key"
  | "resend_webhook_secret"
  | "email_from"
  | "notify_emails"
  | "anthropic_api_key"
  | "ai_lead_insights"
  | "followup_sequence"
  | "abandoned_recovery"
  | "weekly_report"
  | "slack_webhook_url"
  | "teams_webhook_url"
  | "google_chat_webhook_url"
  | "hostinger_api_token"
  | "domain_usd_cop"
  | "domain_margin_pct"
  | "domain_tlds"
  | "domain_auto_register"
  | "wompi_public_key"
  | "wompi_integrity_secret"
  | "wompi_events_secret"
  | "wompi_private_key"
  | "domain_test_safe";

const ENV_FALLBACK: Record<IntegrationKey, string> = {
  gtm_id: "NEXT_PUBLIC_GTM_ID",
  ga4_id: "NEXT_PUBLIC_GA4_ID",
  google_ads_id: "NEXT_PUBLIC_GOOGLE_ADS_ID",
  google_ads_lead_label: "NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL",
  google_ads_booking_label: "NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL",
  meta_pixel_id: "NEXT_PUBLIC_META_PIXEL_ID",
  clarity_id: "NEXT_PUBLIC_CLARITY_ID",
  linkedin_partner_id: "NEXT_PUBLIC_LINKEDIN_PARTNER_ID",
  tiktok_pixel_id: "NEXT_PUBLIC_TIKTOK_PIXEL_ID",
  gsc_verification: "GOOGLE_SITE_VERIFICATION",
  bing_verification: "BING_SITE_VERIFICATION",
  whatsapp_phone_number_id: "WHATSAPP_PHONE_NUMBER_ID",
  whatsapp_business_account_id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
  whatsapp_graph_version: "WHATSAPP_GRAPH_VERSION",
  whatsapp_access_token: "WHATSAPP_ACCESS_TOKEN",
  whatsapp_app_secret: "WHATSAPP_APP_SECRET",
  whatsapp_verify_token: "WHATSAPP_VERIFY_TOKEN",
  meta_page_id: "META_PAGE_ID",
  meta_page_token: "META_PAGE_TOKEN",
  instagram_account_id: "INSTAGRAM_ACCOUNT_ID",
  ads_feed_user: "ADS_FEED_USER",
  ads_feed_password: "ADS_FEED_PASSWORD",
  ads_conversion_qualified: "ADS_CONVERSION_QUALIFIED",
  ads_conversion_meeting: "ADS_CONVERSION_MEETING",
  ads_conversion_won: "ADS_CONVERSION_WON",
  cron_secret: "CRON_SECRET",
  resend_api_key: "RESEND_API_KEY",
  resend_webhook_secret: "RESEND_WEBHOOK_SECRET",
  email_from: "EMAIL_FROM",
  notify_emails: "NOTIFY_EMAILS",
  anthropic_api_key: "ANTHROPIC_API_KEY",
  ai_lead_insights: "AI_LEAD_INSIGHTS",
  followup_sequence: "FOLLOWUP_SEQUENCE",
  abandoned_recovery: "ABANDONED_RECOVERY",
  weekly_report: "WEEKLY_REPORT",
  slack_webhook_url: "SLACK_WEBHOOK_URL",
  teams_webhook_url: "TEAMS_WEBHOOK_URL",
  google_chat_webhook_url: "GOOGLE_CHAT_WEBHOOK_URL",
  hostinger_api_token: "HOSTINGER_API_TOKEN",
  domain_usd_cop: "DOMAIN_USD_COP",
  domain_margin_pct: "DOMAIN_MARGIN_PCT",
  domain_tlds: "DOMAIN_TLDS",
  domain_auto_register: "DOMAIN_AUTO_REGISTER",
  wompi_public_key: "WOMPI_PUBLIC_KEY",
  wompi_integrity_secret: "WOMPI_INTEGRITY_SECRET",
  wompi_events_secret: "WOMPI_EVENTS_SECRET",
  wompi_private_key: "WOMPI_PRIVATE_KEY",
  domain_test_safe: "DOMAIN_TEST_SAFE",
};

/** Interruptores: sin valor guardado cuentan como activos ("on"). */
export const isOn = (c: IntegrationConfig, key: IntegrationKey) => (c[key] ?? "on") !== "off";

/** Nombres por defecto de las conversiones offline en Google Ads. */
export const defaultConversionNames = {
  qualified: "Lead calificado",
  meeting: "Reunion agendada",
  won: "Venta",
};

/** Claves que vienen de una variable de entorno (para avisar en el portal). */
export const envOnlyKeys = (stored: Partial<Record<IntegrationKey, unknown>>) =>
  (Object.keys(ENV_FALLBACK) as IntegrationKey[]).filter((k) => !stored[k] && !!process.env[ENV_FALLBACK[k]]);

export type IntegrationConfig = Partial<Record<IntegrationKey, string>>;

export const hasSecretKey = () => !!process.env.SUPABASE_SECRET_KEY;

/** Toda la configuración (con secretos). Una lectura por petición. */
export const getIntegrations = cache(async (): Promise<IntegrationConfig> => {
  let stored: IntegrationConfig = {};
  if (hasSecretKey()) {
    const { data, error } = await createAdminClient().rpc("integration_config");
    if (!error && data) stored = data as IntegrationConfig;
  }
  const merged: IntegrationConfig = {};
  for (const key of Object.keys(ENV_FALLBACK) as IntegrationKey[]) {
    const value = stored[key] || process.env[ENV_FALLBACK[key]];
    if (value) merged[key] = value;
  }
  return merged;
});

/**
 * Qué está configurado, sin leer secretos: para pantallas del portal. Usa la
 * sesión del empleado (no requiere la clave secreta).
 */
export async function integrationStatus(
  supabase: { rpc: (fn: "integration_status") => PromiseLike<{ data: unknown }> },
): Promise<Partial<Record<IntegrationKey, boolean>>> {
  const { data } = await supabase.rpc("integration_status");
  const stored = (data ?? {}) as Partial<Record<IntegrationKey, boolean>>;
  const status: Partial<Record<IntegrationKey, boolean>> = {};
  for (const key of Object.keys(ENV_FALLBACK) as IntegrationKey[]) {
    if (stored[key] || process.env[ENV_FALLBACK[key]]) status[key] = true;
  }
  return status;
}
