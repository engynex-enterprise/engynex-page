import type { Locale } from "@/i18n/config";

/**
 * Nombre de cada servicio por slug (igual que content/services.ts), en un
 * archivo liviano para el widget del chat, que carga en todas las páginas.
 */
export const serviceNames: Record<string, Record<Locale, string>> = {
  "desarrollo-web": { es: "Desarrollo Web", en: "Web Development" },
  "plataformas-web": { es: "Plataformas Web", en: "Web Platforms" },
  "apps-moviles": { es: "Apps Móviles", en: "Mobile Apps" },
  ecommerce: { es: "E-commerce", en: "E-commerce" },
  "ux-ui-branding": { es: "Diseño UX/UI & Branding", en: "UX/UI Design & Branding" },
  "marketing-digital": { es: "Marketing Digital", en: "Digital Marketing" },
  "produccion-audiovisual": { es: "Producción Audiovisual", en: "Audiovisual Production" },
  "ia-automatizacion": { es: "IA & Automatización", en: "AI & Automation" },
  "cloud-devops": { es: "Cloud & DevOps", en: "Cloud & DevOps" },
  ciberseguridad: { es: "Ciberseguridad", en: "Cybersecurity" },
  "hosting-mantenimiento": { es: "Hosting & Mantenimiento", en: "Hosting & Maintenance" },
  "consultoria-tech": { es: "Consultoría & Transformación Digital", en: "Consulting & Digital Transformation" },
  "data-analytics": { es: "Data & Analytics", en: "Data & Analytics" },
  "integraciones-apis": { es: "Integraciones & APIs", en: "Integrations & APIs" },
  "soporte-ti": { es: "Soporte TI & Outsourcing", en: "IT Support & Outsourcing" },
  "alquiler-equipos": { es: "Alquiler de Equipos & Servidores", en: "Equipment & Server Rental" },
};

/** Servicio de una ruta /<locale>/servicios/<slug>, o null. */
export function serviceFromPath(pathname: string) {
  const slug = /\/servicios\/([a-z0-9-]+)/.exec(pathname)?.[1];
  return slug && serviceNames[slug] ? slug : null;
}
