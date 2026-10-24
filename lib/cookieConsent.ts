/**
 * Consentimiento de cookies.
 *
 * La decisión se guarda en el navegador (localStorage) con la fecha y la
 * versión de la política. Si la política cambia de forma importante, sube
 * `CONSENT_VERSION` y el aviso vuelve a mostrarse.
 *
 * Cualquier script opcional (analítica, píxeles de marketing) debe
 * consultar `hasConsent("analytics")` / `hasConsent("marketing")` antes de
 * cargarse, y escuchar `CONSENT_EVENT` para reaccionar a cambios.
 */

export const CONSENT_VERSION = 1;
const STORAGE_KEY = "engynex-cookie-consent";
export const CONSENT_EVENT = "engynex-consent-change";
/** Evento para abrir la configuración desde cualquier parte (footer). */
export const OPEN_SETTINGS_EVENT = "engynex-open-cookie-settings";

export type OptionalCategory = "preferences" | "analytics" | "marketing";
export const optionalCategories: OptionalCategory[] = [
  "preferences",
  "analytics",
  "marketing",
];

export interface ConsentState {
  version: number;
  /** Fecha ISO de la decisión. */
  date: string;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function readConsentRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseConsent(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as ConsentState;
    return value.version === CONSENT_VERSION ? value : null;
  } catch {
    return null;
  }
}

export function saveConsent(choices: Record<OptionalCategory, boolean>) {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    date: new Date().toISOString(),
    ...choices,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sin almacenamiento: la decisión vale solo para esta página.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
}

export function hasConsent(category: OptionalCategory): boolean {
  return parseConsent(readConsentRaw())?.[category] ?? false;
}

export function subscribeConsent(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}
