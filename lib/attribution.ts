/**
 * Origen del visitante para atribuir cada lead (de dónde llegó la persona
 * que llena el formulario).
 *
 * Se guarda el PRIMER contacto de la visita en sessionStorage: UTM, gclid de
 * Google Ads, página de entrada y referente. Solo sale del navegador si la
 * persona envía el formulario voluntariamente.
 */

const KEY = "engynex-attribution";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

export interface Attribution {
  landing: string;
  referrer: string | null;
  utm: Record<string, string> | null;
  gclid: string | null;
}

export function captureAttribution() {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) utm[key] = value.slice(0, 200);
    }
    // El referente solo cuenta si viene de otro sitio.
    const referrer =
      document.referrer && !document.referrer.startsWith(window.location.origin)
        ? document.referrer
        : null;
    const data: Attribution = {
      landing: window.location.pathname + window.location.search,
      referrer,
      utm: Object.keys(utm).length ? utm : null,
      gclid: params.get("gclid"),
    };
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Sin almacenamiento: el lead se guarda sin origen.
  }
}

export function readAttribution(): Attribution | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}
