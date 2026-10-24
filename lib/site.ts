import type { Locale } from "@/i18n/config";

export const siteConfig = {
  name: "Engynex",
  domain: "engynex.com",
  url: "https://engynex.com",
  email: "contacto@engynex.com",
  phone: "+57 315 437 7743",
  phoneDisplay: "315 437 7743",
  // Número para el enlace de WhatsApp (solo dígitos, con código de país).
  whatsapp: "573154377743",
  /**
   * Horario de atención en formato estructurado (hora de Colombia), para
   * mostrar "en línea" / "fuera de horario". Debe coincidir con `hours`.
   * Clave = día de la semana (0 domingo … 6 sábado), valor = [abre, cierra].
   */
  businessHours: {
    timeZone: "America/Bogota",
    days: {
      1: [7, 17],
      2: [7, 17],
      3: [7, 17],
      4: [7, 17],
      5: [7, 17],
      6: [8, 16],
    } as Record<number, [number, number]>,
  },
  hours: {
    es: "Lun–Vie 7:00 a.m. – 5:00 p.m. · Sáb 8:00 a.m. – 4:00 p.m.",
    en: "Mon–Fri 7:00 a.m. – 5:00 p.m. · Sat 8:00 a.m. – 4:00 p.m.",
  },
  social: {
    instagram: "https://instagram.com/engynex",
    facebook: "https://facebook.com/engynex",
    tiktok: "https://tiktok.com/@engynex",
  },
};

/** Construye una ruta con el prefijo de idioma. */
export function localizedHref(locale: Locale, path = ""): string {
  const clean = path.replace(/^\//, "");
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}

export const navRoutes = [
  { key: "home", path: "" },
  { key: "services", path: "servicios" },
  { key: "products", path: "productos" },
  { key: "portfolio", path: "portafolio" },
  { key: "about", path: "nosotros" },
  { key: "contact", path: "contacto" },
] as const;

export type NavKey = (typeof navRoutes)[number]["key"];
