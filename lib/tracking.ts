import { hasConsent } from "@/lib/cookieConsent";
import { createClient } from "@/lib/supabase/client";

/**
 * Etiquetas de marketing y medición (Google Tag Manager, GA4, Google Ads y
 * píxel de Meta). Los IDs se configuran en el portal (Integraciones) y se
 * leen al cargar la página, solo si el visitante ya aceptó analítica o
 * marketing. Sin IDs no se carga nada, y con IDs solo lo que el visitante
 * aceptó (Consent Mode v2 en modo básico).
 *
 * - Con NEXT_PUBLIC_GTM_ID, la configuración vive en GTM: aquí solo se
 *   empujan eventos al dataLayer (generate_lead, book_appointment…).
 * - Sin GTM, se carga gtag.js con GA4 y/o Google Ads y se envían los eventos
 *   y conversiones directamente.
 */
// Variables de entorno: solo respaldo si aún no hay nada en el portal.
const tagIds = {
  gtm: process.env.NEXT_PUBLIC_GTM_ID ?? "",
  ga4: process.env.NEXT_PUBLIC_GA4_ID ?? "",
  ads: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "",
  adsLeadLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL ?? "",
  adsBookingLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL ?? "",
  metaPixel: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
};

let configLoad: Promise<void> | null = null;

/** Lee los IDs configurados en el portal (una vez por página). */
function loadTagConfig() {
  configLoad ??= (async () => {
    try {
      const { data } = await createClient().rpc("public_tag_config");
      const c = (data ?? {}) as Record<string, string>;
      tagIds.gtm = c.gtm_id || tagIds.gtm;
      tagIds.ga4 = c.ga4_id || tagIds.ga4;
      tagIds.ads = c.google_ads_id || tagIds.ads;
      tagIds.adsLeadLabel = c.google_ads_lead_label || tagIds.adsLeadLabel;
      tagIds.adsBookingLabel = c.google_ads_booking_label || tagIds.adsBookingLabel;
      tagIds.metaPixel = c.meta_pixel_id || tagIds.metaPixel;
    } catch {
      // Sin conexión: se usan los respaldos.
    }
  })();
  return configLoad;
}

export const anyGoogleTag = () => !!(tagIds.gtm || tagIds.ga4 || tagIds.ads);

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Estado de Consent Mode v2 según las categorías aceptadas. */
export function consentModeState() {
  const analytics = hasConsent("analytics");
  const marketing = hasConsent("marketing");
  const preferences = hasConsent("preferences");
  const v = (on: boolean) => (on ? "granted" : "denied");
  return {
    analytics_storage: v(analytics),
    ad_storage: v(marketing),
    ad_user_data: v(marketing),
    ad_personalization: v(marketing),
    functionality_storage: "granted",
    personalization_storage: v(preferences),
    security_storage: "granted",
  };
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer ?? [];
  // gtag.js necesita el objeto `arguments`, no un arreglo.
  (window.gtag ??= function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  })(...args);
}

function loadScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/** Carga (una vez) lo que permita el consentimiento y actualiza Consent Mode. */
export async function applyTags() {
  const analytics = hasConsent("analytics");
  const marketing = hasConsent("marketing");
  // Sin consentimiento no se consulta nada: solo se limpian cookies previas.
  if (analytics || marketing) await loadTagConfig();

  if (anyGoogleTag() && (analytics || marketing)) {
    if (!window.gtag) {
      // Valores por defecto antes de cualquier etiqueta: todo denegado.
      gtag("consent", "default", {
        ...consentModeState(),
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        wait_for_update: 500,
      });
      gtag("set", "ads_data_redaction", true);
      gtag("set", "url_passthrough", true);
    }
    gtag("consent", "update", consentModeState());

    if (tagIds.gtm) {
      if (!document.getElementById("gtm-script")) {
        window.dataLayer!.push({ "gtm.start": Date.now(), event: "gtm.js" });
        loadScript("gtm-script", `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(tagIds.gtm)}`);
      }
    } else if (!document.getElementById("gtag-script")) {
      const first = tagIds.ga4 || tagIds.ads;
      loadScript("gtag-script", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(first)}`);
      gtag("js", new Date());
      if (tagIds.ga4) gtag("config", tagIds.ga4);
      if (tagIds.ads) gtag("config", tagIds.ads, { allow_enhanced_conversions: true });
    }
  } else if (window.gtag) {
    // Retiró el consentimiento: las etiquetas ya cargadas dejan de usar cookies.
    gtag("consent", "update", consentModeState());
  }

  if (tagIds.metaPixel) {
    if (marketing) {
      if (!window.fbq) {
        const fbq: Fbq = function (...args: unknown[]) {
          // Igual que el código oficial del píxel.
          if (fbq.callMethod) (fbq.callMethod as (...a: unknown[]) => void)(...args);
          else fbq.queue!.push(args);
        };
        fbq.push = fbq;
        fbq.loaded = true;
        fbq.version = "2.0";
        fbq.queue = [];
        window.fbq = window._fbq = fbq;
        loadScript("meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
        fbq("init", tagIds.metaPixel);
        fbq("consent", "grant");
        fbq("track", "PageView");
      } else {
        window.fbq("consent", "grant");
      }
    } else if (window.fbq) {
      window.fbq("consent", "revoke");
    }
  }

  if (!analytics) clearCookies(/^_ga|^_gid$/);
  if (!marketing) clearCookies(/^_gcl_|^_fbp$|^_fbc$/);
}

/** Borra cookies de terceros en este dominio y en el dominio raíz. */
function clearCookies(pattern: RegExp) {
  const host = window.location.hostname;
  const domains = ["", host, `.${host.split(".").slice(-2).join(".")}`];
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (!name || !pattern.test(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

/** Evento para la analítica propia (lo envía AnalyticsTracker si hay consentimiento). */
export const TRACK_EVENT = "engynex-track";
export type TrackDetail = { name: string; label?: string };
export function trackEvent(name: string, label?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<TrackDetail>(TRACK_EVENT, { detail: { name, label } }));
}

/** Vista de página en navegación del lado del cliente. */
export function trackPageView(path: string) {
  if (tagIds.gtm && window.dataLayer) window.dataLayer.push({ event: "page_view", page_path: path });
  if (tagIds.metaPixel && window.fbq && hasConsent("marketing")) window.fbq("track", "PageView");
  // GA4 directo ya mide los cambios de URL (medición mejorada).
}

type LeadEvent = { tier: "green" | "yellow" | "red"; category?: string; email?: string; phone?: string };

/**
 * Conversión de lead. A Google Ads solo se reportan los leads verdes y
 * amarillos (los rojos no son clientes potenciales): así las campañas
 * optimizan hacia leads que sí sirven.
 */
export function trackLead({ tier, category, email, phone }: LeadEvent) {
  trackEvent("form_submit", tier);
  const marketing = hasConsent("marketing");
  const qualified = tier !== "red";

  if (window.dataLayer) {
    window.dataLayer.push({ event: "generate_lead", lead_tier: tier, lead_category: category, lead_qualified: qualified });
  }
  if (window.gtag && !tagIds.gtm) {
    if (tagIds.ga4) gtag("event", "generate_lead", { lead_tier: tier, lead_category: category });
    if (tagIds.ads && tagIds.adsLeadLabel && marketing && qualified) {
      // Conversiones avanzadas: Google cifra (SHA-256) estos datos en el navegador.
      if (email || phone) gtag("set", "user_data", { email, phone_number: phone ? normalizePhone(phone) : undefined });
      gtag("event", "conversion", { send_to: `${tagIds.ads}/${tagIds.adsLeadLabel}` });
    }
  }
  if (window.fbq && marketing) window.fbq("track", "Lead", { content_category: category, lead_tier: tier });
}

export function trackBooking() {
  trackEvent("booking");
  if (window.dataLayer) window.dataLayer.push({ event: "book_appointment" });
  if (window.gtag && !tagIds.gtm) {
    if (tagIds.ga4) gtag("event", "book_appointment");
    if (tagIds.ads && tagIds.adsBookingLabel && hasConsent("marketing")) {
      gtag("event", "conversion", { send_to: `${tagIds.ads}/${tagIds.adsBookingLabel}` });
    }
  }
  if (window.fbq && hasConsent("marketing")) window.fbq("track", "Schedule");
}

/** Contactos secundarios: chat en vivo y clic a WhatsApp. */
export function trackContact(channel: "chat" | "whatsapp") {
  // Los clics a WhatsApp ya los registra AnalyticsTracker (enlace wa.me).
  if (channel === "chat") trackEvent("chat_start");
  if (window.dataLayer) window.dataLayer.push({ event: "contact", contact_channel: channel });
  if (window.gtag && !tagIds.gtm && tagIds.ga4) gtag("event", "contact", { contact_channel: channel });
  if (window.fbq && hasConsent("marketing")) window.fbq("track", "Contact", { channel });
}

/** +57 por defecto para celulares colombianos de 10 dígitos (formato E.164). */
function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `+${digits.length === 10 && digits.startsWith("3") ? `57${digits}` : digits}`;
}
