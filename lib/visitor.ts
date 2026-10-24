import { hasConsent } from "@/lib/cookieConsent";

/**
 * Identificadores de la analítica propia. Solo existen si el visitante aceptó
 * cookies de analítica; si no, todo devuelve null y no se guarda nada.
 */
const VISITOR_KEY = "engynex-vid";
const SESSION_KEY = "engynex-sid";
/** Una sesión termina tras 30 minutos sin actividad. */
const SESSION_IDLE_MS = 30 * 60 * 1000;

export function analyticsAllowed(): boolean {
  if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return false;
  return hasConsent("analytics");
}

export function getVisitorId(): string | null {
  if (!analyticsAllowed()) return null;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function getSessionId(): string | null {
  if (!analyticsAllowed()) return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const now = Date.now();
    if (raw) {
      const [id, last] = raw.split("|");
      if (now - Number(last) < SESSION_IDLE_MS) {
        sessionStorage.setItem(SESSION_KEY, `${id}|${now}`);
        return id;
      }
    }
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, `${id}|${now}`);
    return id;
  } catch {
    return null;
  }
}

/** Borra los identificadores locales y devuelve el que había (para olvidarlo). */
export function clearVisitor(): string | null {
  try {
    const id = localStorage.getItem(VISITOR_KEY);
    localStorage.removeItem(VISITOR_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    return id;
  } catch {
    return null;
  }
}
